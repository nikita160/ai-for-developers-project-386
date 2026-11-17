# In-memory storage for the first version

**Status:** accepted

Bookings are kept in process memory for the first version. Persistence across restarts is not an acceptance criterion, and an in-memory store keeps the overlap rule simple: the check for overlapping bookings and the insert run synchronously in one Node process, so two simultaneous requests cannot both succeed. The cost is that a restart clears every booking; this limitation must be stated in `README.md` when booking is implemented.

**Considered Options:** SQLite via `node:sqlite` (durable, but experimental and more moving parts) and a JSON file (durable, but overlap checks would need manual locking).

**Consequences:** the store is injectable so tests start from a clean state, and the README must call out the data loss on restart.
