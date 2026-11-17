import { describe, expect, it } from 'vitest'

import { InMemoryBookingStore } from '../store'
import {
  createBooking,
  getAvailability,
  getSlots,
  isSlotAvailable,
  overlaps,
  type Booking,
} from './bookings'
import { findMeetingType } from './meeting-types'

const NOW = new Date('2026-11-17T10:00:00+03:00')
const call = findMeetingType('call')!
const consultation = findMeetingType('consultation')!

function at(date: string, time: string) {
  return new Date(`${date}T${time}:00+03:00`)
}

function makeBooking(
  typeId: string,
  date: string,
  time: string,
  durationMinutes: number,
): Booking {
  const start = at(date, time)
  return {
    id: crypto.randomUUID(),
    typeId: typeId as Booking['typeId'],
    start,
    end: new Date(start.getTime() + durationMinutes * 60_000),
    name: 'Гость',
    email: 'guest@example.com',
    createdAt: NOW,
  }
}

function storeWith(bookings: Booking[]) {
  const store = new InMemoryBookingStore()
  bookings.forEach((booking) => store.add(booking))
  return store
}

describe('overlaps', () => {
  it('allows back-to-back intervals', () => {
    expect(
      overlaps(at('2026-11-18', '09:00'), at('2026-11-18', '09:30'), at('2026-11-18', '09:30'), at('2026-11-18', '10:00')),
    ).toBe(false)
  })

  it('detects partial overlap', () => {
    expect(
      overlaps(at('2026-11-18', '09:00'), at('2026-11-18', '09:30'), at('2026-11-18', '09:15'), at('2026-11-18', '09:45')),
    ).toBe(true)
  })
})

describe('availability', () => {
  it('counts every start when nothing is booked', () => {
    const days = getAvailability(NOW, call, [])
    const consultationDays = getAvailability(NOW, consultation, [])

    expect(days).toHaveLength(14)
    expect(days[0]).toEqual({ date: '2026-11-18', freeStarts: 18 })
    expect(consultationDays[0]).toEqual({
      date: '2026-11-18',
      freeStarts: 17,
    })
  })

  it('removes starts blocked by bookings of any type', () => {
    const bookings = [makeBooking('call', '2026-11-18', '09:00', 30)]

    expect(getAvailability(NOW, call, bookings)[0].freeStarts).toBe(17)
    expect(getAvailability(NOW, consultation, bookings)[0].freeStarts).toBe(16)
  })
})

describe('slots', () => {
  it('marks busy and free starts for the selected type', () => {
    const bookings = [makeBooking('call', '2026-11-18', '09:00', 30)]
    const slots = getSlots('2026-11-18', call, bookings, NOW)

    expect(slots).toHaveLength(18)
    expect(slots[0]).toEqual({
      start: at('2026-11-18', '09:00'),
      end: at('2026-11-18', '09:30'),
      available: false,
    })
    expect(slots[1].available).toBe(true)
  })

  it('blocks a consultation that would overlap a call', () => {
    const bookings = [makeBooking('call', '2026-11-18', '09:00', 30)]
    const slots = getSlots('2026-11-18', consultation, bookings, NOW)

    expect(slots[0].available).toBe(false)
    expect(slots[1].available).toBe(true)
    expect(slots[2].available).toBe(true)
  })

  it('reports availability through the overlap rule', () => {
    const bookings = [makeBooking('call', '2026-11-18', '09:00', 30)]

    expect(isSlotAvailable(at('2026-11-18', '09:30'), at('2026-11-18', '10:00'), bookings)).toBe(true)
    expect(isSlotAvailable(at('2026-11-18', '09:00'), at('2026-11-18', '09:30'), bookings)).toBe(false)
  })
})

describe('createBooking', () => {
  it('creates a booking for a free slot', () => {
    const store = new InMemoryBookingStore()

    const result = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-11-18T09:00:00+03:00',
        name: '  Иван  ',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.booking.name).toBe('Иван')
      expect(result.booking.start).toEqual(at('2026-11-18', '09:00'))
      expect(result.booking.end).toEqual(at('2026-11-18', '09:30'))
    }
    expect(store.list()).toHaveLength(1)
  })

  it('rejects a slot that is already booked', () => {
    const store = storeWith([makeBooking('call', '2026-11-18', '09:00', 30)])

    const result = createBooking(
      store,
      {
        typeId: 'consultation',
        start: '2026-11-18T09:00:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'slot_taken' }),
    })
    expect(store.list()).toHaveLength(1)
  })

  it('allows a booking that starts when another ends', () => {
    const store = storeWith([makeBooking('call', '2026-11-18', '09:00', 30)])

    const result = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-11-18T09:30:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(result.ok).toBe(true)
    expect(store.list()).toHaveLength(2)
  })

  it('rejects invalid contact details', () => {
    const store = new InMemoryBookingStore()

    const emptyName = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-11-18T09:00:00+03:00',
        name: '   ',
        email: 'ivan@example.com',
      },
      NOW,
    )
    const badEmail = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-11-18T09:00:00+03:00',
        name: 'Иван',
        email: 'not-an-email',
      },
      NOW,
    )

    expect(emptyName).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'validation_error' }),
    })
    expect(badEmail).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'validation_error' }),
    })
    expect(store.list()).toHaveLength(0)
  })

  it('rejects unknown meeting types', () => {
    const result = createBooking(
      new InMemoryBookingStore(),
      {
        typeId: 'webinar',
        start: '2026-11-18T09:00:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'validation_error' }),
    })
  })

  it('rejects starts outside the booking window', () => {
    const store = new InMemoryBookingStore()

    const today = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-11-17T09:00:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )
    const tooFar = createBooking(
      store,
      {
        typeId: 'call',
        start: '2026-12-02T09:00:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(today).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'date_out_of_window' }),
    })
    expect(tooFar).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'date_out_of_window' }),
    })
  })

  it('rejects starts that are not on the 30-minute grid', () => {
    const result = createBooking(
      new InMemoryBookingStore(),
      {
        typeId: 'call',
        start: '2026-11-18T09:15:00+03:00',
        name: 'Иван',
        email: 'ivan@example.com',
      },
      NOW,
    )

    expect(result).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'validation_error' }),
    })
  })

  it('lets only one of two sequential attempts win the same slot', () => {
    const store = new InMemoryBookingStore()
    const input = {
      typeId: 'call',
      start: '2026-11-18T09:00:00+03:00',
      name: 'Иван',
      email: 'ivan@example.com',
    }

    const first = createBooking(store, input, NOW)
    const second = createBooking(store, input, NOW)

    expect(first.ok).toBe(true)
    expect(second).toEqual({
      ok: false,
      error: expect.objectContaining({ code: 'slot_taken' }),
    })
    expect(store.list()).toHaveLength(1)
  })
})
