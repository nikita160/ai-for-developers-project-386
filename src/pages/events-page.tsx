import { useEffect, useState } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import {
  getMeetingTypes,
  getUpcomingBookings,
  type Booking,
  type MeetingType,
} from '@/lib/api'
import {
  formatCreatedAt,
  formatDateLabel,
  formatSlotRange,
  moscowDateOf,
} from '@/lib/booking'

export function EventsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [types, setTypes] = useState<MeetingType[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getUpcomingBookings(controller.signal),
      getMeetingTypes(controller.signal),
    ])
      .then(([upcoming, meetingTypes]) => {
        setBookings(upcoming)
        setTypes(meetingTypes)
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Не удалось загрузить события',
          )
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Предстоящие события</h1>

      {error ? <p className="mt-6 text-sm text-destructive">{error}</p> : null}

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Загрузка…</p>
      ) : null}

      {!isLoading && !error && bookings.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Пока нет предстоящих событий.
        </p>
      ) : null}

      {bookings.length > 0 ? (
        <div className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="[--card-spacing:--spacing(6)]">
              <CardContent className="flex flex-col gap-1">
                <p className="text-base font-semibold">{booking.name}</p>
                <p className="text-sm text-muted-foreground">{booking.email}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Тип:{' '}
                  {types.find((type) => type.id === booking.typeId)?.name ??
                    booking.typeId}
                </p>
                <p className="text-sm text-muted-foreground">
                  Слот:{' '}
                  {formatDateLabel(moscowDateOf(booking.start))},{' '}
                  {formatSlotRange(booking.start, booking.end)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Создано: {formatCreatedAt(booking.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </main>
  )
}
