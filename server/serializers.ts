import type { Booking, Slot } from './domain/bookings'
import type { MeetingType } from './domain/meeting-types'
import { formatMoscowIso } from './domain/time'

export function serializeBooking(booking: Booking) {
  return {
    id: booking.id,
    typeId: booking.typeId,
    start: formatMoscowIso(booking.start),
    end: formatMoscowIso(booking.end),
    name: booking.name,
    email: booking.email,
    createdAt: booking.createdAt.toISOString(),
  }
}

export function serializeMeetingType(type: MeetingType) {
  return {
    id: type.id,
    name: type.name,
    description: type.description,
    durationMinutes: type.durationMinutes,
  }
}

export function serializeSlot(slot: Slot) {
  return {
    start: formatMoscowIso(slot.start),
    end: formatMoscowIso(slot.end),
    available: slot.available,
  }
}
