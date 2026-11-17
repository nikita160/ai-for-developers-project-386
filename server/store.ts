import type { Booking, BookingStore } from './domain/bookings'

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
