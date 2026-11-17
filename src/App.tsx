import { useState } from 'react'

import { AppHeader } from '@/components/app-header'
import { BookingPage } from '@/pages/booking-page'
import { EventsPage } from '@/pages/events-page'
import { HomePage } from '@/pages/home-page'

type View = 'home' | 'booking' | 'events'

function App() {
  const [view, setView] = useState<View>('home')

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
        <BookingPage onBack={() => setView('home')} />
      ) : null}
      {view === 'events' ? <EventsPage /> : null}
    </div>
  )
}

export default App
