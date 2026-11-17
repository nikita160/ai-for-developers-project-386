import { useState } from 'react'

import { AppHeader } from '@/components/app-header'
import { BookingPage } from '@/pages/booking-page'
import { EventsPage } from '@/pages/events-page'
import { HomePage } from '@/pages/home-page'
import type { Booking } from '@/lib/booking'

type View = 'home' | 'booking' | 'events'

const DEMO_BOOKING: Booking = {
  id: 'demo-booking',
  name: 'Demo User 1774622445303',
  email: 'demo-1774622445303@example.com',
  date: '2026-11-20',
  start: '09:00',
  end: '09:30',
  createdAt: new Date(2026, 10, 17, 14, 40),
}

function App() {
  const [view, setView] = useState<View>('home')
  const [bookings, setBookings] = useState<Booking[]>([DEMO_BOOKING])

  function handleCreate(booking: Booking) {
    setBookings((current) => [...current, booking])
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader
        active={view === 'home' ? null : view}
        onHome={() => setView('home')}
        onBook={() => setView('booking')}
        onEvents={() => setView('events')}
      />

      {view === 'home' ? (
        <HomePage onStart={() => setView('booking')} />
      ) : null}
      {view === 'booking' ? (
        <BookingPage
          bookings={bookings}
          onCreate={handleCreate}
          onBack={() => setView('home')}
        />
      ) : null}
      {view === 'events' ? <EventsPage bookings={bookings} /> : null}
    </div>
  )
}

export default App
