import type { Context } from 'hono'
import { Hono } from 'hono'

import {
  bookingError,
  createBooking,
  getAvailability,
  getSlots,
  type BookingStore,
  type CreateBookingInput,
} from './domain/bookings'
import {
  createMeetingType,
  findMeetingType,
  type CreateMeetingTypeInput,
  type MeetingTypeStore,
} from './domain/meeting-types'
import { isDateInWindow } from './domain/slots'
import {
  serializeBooking,
  serializeMeetingType,
  serializeSlot,
} from './serializers'
import { InMemoryBookingStore, InMemoryMeetingTypeStore } from './store'

export type AppDeps = {
  store?: BookingStore
  meetingTypes?: MeetingTypeStore
  now?: () => Date
}

export function createApp({
  store = new InMemoryBookingStore(),
  meetingTypes = new InMemoryMeetingTypeStore(),
  now = () => new Date(),
}: AppDeps = {}) {
  const app = new Hono()

  app.get('/health', (c) => c.json({ status: 'ok' as const }))

  app.get('/meeting-types', (c) =>
    c.json(meetingTypes.list().map(serializeMeetingType)),
  )

  app.post('/meeting-types', async (c) => {
    const body = await c.req.json().catch(() => null)

    if (!isMeetingTypeRequest(body)) {
      return c.json(
        {
          error: bookingError('validation_error', 'Некорректное тело запроса'),
        },
        400,
      )
    }

    const result = createMeetingType(meetingTypes, body)

    if (!result.ok) {
      return c.json({ error: result.error }, 400)
    }

    return c.json(serializeMeetingType(result.type), 201)
  })

  app.get('/availability', (c) => {
    const type = findMeetingType(meetingTypes.list(), c.req.query('type') ?? '')

    if (!type) {
      return unknownType(c)
    }

    return c.json(getAvailability(now(), type, store.list()))
  })

  app.get('/slots', (c) => {
    const type = findMeetingType(meetingTypes.list(), c.req.query('type') ?? '')

    if (!type) {
      return unknownType(c)
    }

    const date = c.req.query('date')

    if (!date) {
      return c.json(
        {
          error: bookingError('validation_error', 'Укажите дату', {
            field: 'date',
          }),
        },
        400,
      )
    }

    if (!isDateInWindow(date, now())) {
      return c.json(
        {
          error: bookingError('date_out_of_window', 'Дата вне окна записи'),
        },
        400,
      )
    }

    return c.json(
      getSlots(date, type, store.list(), now()).map(serializeSlot),
    )
  })

  app.post('/bookings', async (c) => {
    const body = await c.req.json().catch(() => null)

    if (!isBookingRequest(body)) {
      return c.json(
        {
          error: bookingError('validation_error', 'Некорректное тело запроса'),
        },
        400,
      )
    }

    const result = createBooking(store, body, now(), meetingTypes.list())

    if (!result.ok) {
      const status = result.error.code === 'slot_taken' ? 409 : 400

      return c.json({ error: result.error }, status)
    }

    return c.json(serializeBooking(result.booking), 201)
  })

  app.get('/bookings', (c) => {
    const upcoming = c.req.query('upcoming') !== 'false'
    const current = now().getTime()

    const bookings = store
      .list()
      .filter((booking) => !upcoming || booking.end.getTime() >= current)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    return c.json(bookings.map(serializeBooking))
  })

  return app
}

export const app = createApp()

export type AppType = typeof app

function unknownType(c: Context) {
  return c.json(
    {
      error: bookingError('validation_error', 'Неизвестный тип встречи', {
        field: 'type',
      }),
    },
    400,
  )
}

function isBookingRequest(body: unknown): body is CreateBookingInput {
  if (typeof body !== 'object' || body === null) {
    return false
  }

  const candidate = body as Record<string, unknown>

  return (
    typeof candidate.typeId === 'string' &&
    typeof candidate.start === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string'
  )
}

function isMeetingTypeRequest(body: unknown): body is CreateMeetingTypeInput {
  if (typeof body !== 'object' || body === null) {
    return false
  }

  const candidate = body as Record<string, unknown>

  return (
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.durationMinutes === 'number'
  )
}