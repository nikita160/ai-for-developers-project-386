export type Slot = {
  start: string
  end: string
  busy: boolean
}

export type Booking = {
  id: string
  name: string
  email: string
  /** ISO date, e.g. 2026-03-28 */
  date: string
  start: string
  end: string
  createdAt: Date
}

const MONTHS_NOMINATIVE = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
]

const MONTHS_GENITIVE = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

const WEEKDAYS = [
  'воскресенье',
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
]

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const SLOT_DURATION_MINUTES = 30
export const WORKDAY_START_HOUR = 9
export const WORKDAY_END_HOUR = 18

const pad = (value: number) => String(value).padStart(2, '0')

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDateLabel(date: Date) {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS_GENITIVE[date.getMonth()]}`
}

export function formatMonthLabel(date: Date) {
  return `${MONTHS_NOMINATIVE[date.getMonth()]} ${date.getFullYear()} г.`
}

export function formatCreatedAt(date: Date) {
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatSlot(slot: Slot) {
  return `${slot.start} - ${slot.end}`
}

/** Returns every day cell for the month view, weeks starting on Monday. */
export function getMonthMatrix(month: Date) {
  const firstDay = startOfMonth(month)
  const offset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  return Array.from(
    { length: totalCells },
    (_, index) =>
      new Date(month.getFullYear(), month.getMonth(), 1 - offset + index),
  )
}

function daySeed(date: Date) {
  return date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate()
}

export function getSlotsForDate(date: Date, bookings: Booking[] = []): Slot[] {
  const totalSlots =
    ((WORKDAY_END_HOUR - WORKDAY_START_HOUR) * 60) / SLOT_DURATION_MINUTES
  const isoDate = toISODate(date)
  const seed = daySeed(date)

  return Array.from({ length: totalSlots }, (_, index) => {
    const startMinutes = WORKDAY_START_HOUR * 60 + index * SLOT_DURATION_MINUTES
    const endMinutes = startMinutes + SLOT_DURATION_MINUTES
    const start = `${pad(Math.floor(startMinutes / 60))}:${pad(startMinutes % 60)}`
    const end = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`
    const pseudoBusy = (seed * 7 + index * 11) % 23 === 0
    const booked = bookings.some(
      (booking) => booking.date === isoDate && booking.start === start,
    )

    return { start, end, busy: pseudoBusy || booked }
  })
}

export function getFreeSlotsCount(date: Date, bookings: Booking[] = []) {
  return getSlotsForDate(date, bookings).filter((slot) => !slot.busy).length
}
