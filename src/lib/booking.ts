export const MOSCOW_TIME_ZONE = 'Europe/Moscow'

export const WEEKDAY_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export type Month = {
  year: number
  month: number
}

export type MonthDay = {
  iso: string
  day: number
  inMonth: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')

export function monthOfDate(isoDate: string): Month {
  const [year, month] = isoDate.split('-').map(Number)
  return { year, month: month - 1 }
}

export function addMonths({ year, month }: Month, amount: number): Month {
  const date = new Date(Date.UTC(year, month + amount, 1))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() }
}

export function formatMonthLabel({ year, month }: Month): string {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month, 1)))
}

export function getMonthDays({ year, month }: Month): MonthDay[] {
  const first = new Date(Date.UTC(year, month, 1))
  const offset = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7

  return Array.from({ length: totalCells }, (_, index) => {
    const date = new Date(Date.UTC(year, month, 1 - offset + index))
    return {
      iso: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month,
    }
  })
}

export function formatDateLabel(isoDate: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(new Date(`${isoDate}T12:00:00+03:00`))
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(new Date(iso))
}

export function formatSlotRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`
}

export function formatCreatedAt(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(new Date(iso))
}

export function moscowDateOf(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: MOSCOW_TIME_ZONE,
  }).format(new Date(iso))
}
