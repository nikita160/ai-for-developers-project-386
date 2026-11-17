import { Card, CardContent } from '@/components/ui/card'
import { formatCreatedAt, type Booking } from '@/lib/booking'

type EventsPageProps = {
  bookings: Booking[]
}

export function EventsPage({ bookings }: EventsPageProps) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">Предстоящие события</h1>

      {bookings.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Пока нет предстоящих событий.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="[--card-spacing:--spacing(6)]">
              <CardContent className="flex flex-col gap-1">
                <p className="text-base font-semibold">{booking.name}</p>
                <p className="text-sm text-muted-foreground">{booking.email}</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Слот: {booking.date}-{booking.start}
                </p>
                <p className="text-sm text-muted-foreground">
                  Создано: {formatCreatedAt(booking.createdAt)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
