# Half-open intervals decide whether two bookings overlap

**Status:** accepted

Bookings occupy half-open intervals `[start, end)`. A meeting may start exactly when another ends, while any overlap of positive length is forbidden, including between different meeting types. Booking checks every existing interval and inserts only when none overlaps; in a single Node process that check and insert are synchronous, so they are atomic with respect to concurrent requests.

**Considered Options:** closed intervals (would forbid back-to-back meetings) and per-type calendars (would let a 60-minute consultation and a 30-minute call overlap).

**Consequences:** availability counts and booking creation share the same rule, and the concurrency test asserts exactly one success for two simultaneous requests.
