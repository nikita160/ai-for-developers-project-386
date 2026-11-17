const MOSCOW_OFFSET_MINUTES = 180

const pad = (value: number) => String(value).padStart(2, '0')

/** Calendar date (YYYY-MM-DD) of an instant in Europe/Moscow. */
export function moscowDateString(date: Date): string {
  const shifted = new Date(date.getTime() + MOSCOW_OFFSET_MINUTES * 60_000)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}`
}

/** Instant for a Moscow date at the given number of minutes from midnight. */
export function moscowDateTime(date: string, minutesFromMidnight: number): Date {
  return new Date(
    new Date(`${date}T00:00:00+03:00`).getTime() +
      minutesFromMidnight * 60_000,
  )
}

/** Adds calendar days to a YYYY-MM-DD date without timezone drift. */
export function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const next = new Date(Date.UTC(year, month - 1, day + amount))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

/** ISO 8601 instant with the Moscow offset, e.g. 2026-11-18T09:00:00+03:00. */
export function formatMoscowIso(date: Date): string {
  const shifted = new Date(date.getTime() + MOSCOW_OFFSET_MINUTES * 60_000)
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())}T${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}+03:00`
}
