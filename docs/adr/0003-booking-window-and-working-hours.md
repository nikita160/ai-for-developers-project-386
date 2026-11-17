# Booking window and working hours are fixed for the first version

**Status:** accepted

Bookings are limited to a 14-calendar-day window that starts tomorrow and slides daily. The owner works 09:00–18:00 in `Europe/Moscow` (UTC+3, no daylight saving), and available starts follow a 30-minute grid; a slot must fit entirely inside working hours. Starting tomorrow avoids hiding already-elapsed starts on the current day, and a fixed timezone keeps date arithmetic deterministic.

**Considered Options:** starting today (requires filtering past starts), a configurable schedule (not needed yet), and storing local times without a timezone (ambiguous for future integrations).

**Consequences:** availability and slot generation take `now` as an injected clock, and tests freeze it to check window boundaries.
