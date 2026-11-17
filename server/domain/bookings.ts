import { randomUUID } from 'node:crypto'

import { findMeetingType, type MeetingType, type MeetingTypeId } from './meeting-types'
import {
  getSlotStarts,
  getWindowDates,
  isDateInWindow,
  type SlotStart,
} from './slots'
import { moscowDateString } from './time'

export type Booking = {
  id: string
  typeId: MeetingTypeId
  start: Date
  end: Date
  name: string
  email: string
  createdAt: Date
}

export type BookingStore = {
  list(): Booking[]
  add(booking: Booking): void
}

export type BookingErrorCode =
  | 'validation_error'
  | 'slot_taken'
  | 'date_out_of_window'

export type BookingError = {
  code: BookingErrorCode
  message: string
  details?: Record<string, string>
}

export type CreateBookingInput = {
  typeId: string
  start: string
  name: string
  email: string
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: BookingError }

export type Slot = SlotStart & {
  available: boolean
}

export type AvailabilityDay = {
  date: string
  freeStarts: number
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return (
    aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime()
  )
}

export function isSlotAvailable(
  start: Date,
  end: Date,
  bookings: Booking[],
): boolean {
  return !bookings.some((booking) =>
    overlaps(start, end, booking.start, booking.end),
  )
}

export function getSlots(
  date: string,
  type: MeetingType,
  bookings: Booking[],
  now: Date,
): Slot[] {
  return getSlotStarts(date, type, now).map((slot) => ({
    ...slot,
    available: isSlotAvailable(slot.start, slot.end, bookings),
  }))
}

export function getAvailability(
  now: Date,
  type: MeetingType,
  bookings: Booking[],
): AvailabilityDay[] {
  return getWindowDates(now).map((date) => ({
    date,
    freeStarts: getSlots(date, type, bookings, now).filter(
      (slot) => slot.available,
    ).length,
  }))
}

export function createBooking(
  store: BookingStore,
  input: CreateBookingInput,
  now: Date,
): CreateBookingResult {
  const type = findMeetingType(input.typeId)

  if (!type) {
    return fail('validation_error', 'Неизвестный тип встречи', {
      field: 'typeId',
    })
  }

  const name = input.name.trim()

  if (name.length === 0 || name.length > 100) {
    return fail('validation_error', 'Имя должно быть от 1 до 100 символов', {
      field: 'name',
    })
  }

  const email = input.email.trim()

  if (!EMAIL_PATTERN.test(email)) {
    return fail('validation_error', 'Некорректный email', { field: 'email' })
  }

  const start = new Date(input.start)

  if (Number.isNaN(start.getTime())) {
    return fail('validation_error', 'Некорректный старт', { field: 'start' })
  }

  const date = moscowDateString(start)

  if (!isDateInWindow(date, now)) {
    return fail('date_out_of_window', 'Дата вне окна записи')
  }

  const slot = getSlotStarts(date, type, now).find(
    (candidate) => candidate.start.getTime() === start.getTime(),
  )

  if (!slot) {
    return fail('validation_error', 'Старт не совпадает с сеткой слотов', {
      field: 'start',
    })
  }

  if (!isSlotAvailable(slot.start, slot.end, store.list())) {
    return fail('slot_taken', 'Слот уже занят')
  }

  const booking: Booking = {
    id: randomUUID(),
    typeId: type.id,
    start: slot.start,
    end: slot.end,
    name,
    email,
    createdAt: now,
  }

  store.add(booking)

  return { ok: true, booking }
}

function fail(
  code: BookingErrorCode,
  message: string,
  details?: Record<string, string>,
): CreateBookingResult {
  return {
    ok: false,
    error: details ? { code, message, details } : { code, message },
  }
}
