import type { Booking, BookingStore } from './domain/bookings'
import {
  SEED_MEETING_TYPES,
  type MeetingType,
  type MeetingTypeStore,
} from './domain/meeting-types'

export class InMemoryBookingStore implements BookingStore {
  private bookings: Booking[] = []

  list(): Booking[] {
    return [...this.bookings]
  }

  add(booking: Booking): void {
    this.bookings.push(booking)
  }

  clear(): void {
    this.bookings = []
  }
}

export class InMemoryMeetingTypeStore implements MeetingTypeStore {
  private types: MeetingType[]

  constructor(seed: MeetingType[] = SEED_MEETING_TYPES) {
    this.types = [...seed]
  }

  list(): MeetingType[] {
    return [...this.types]
  }

  add(type: MeetingType): void {
    this.types.push(type)
  }

  /** Возвращает хранилище к стартовым типам; используется в тестах. */
  reset(): void {
    this.types = [...SEED_MEETING_TYPES]
  }
}
