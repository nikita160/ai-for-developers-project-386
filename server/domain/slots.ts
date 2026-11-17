import type { MeetingType } from './meeting-types'
import { addDays, moscowDateString, moscowDateTime } from './time'

export const WINDOW_DAYS = 14
export const START_STEP_MINUTES = 30
export const WORKDAY_START_MINUTES = 9 * 60
export const WORKDAY_END_MINUTES = 18 * 60

export type SlotStart = {
  start: Date
  end: Date
}

/** The 14 calendar days of the booking window, starting tomorrow in Moscow. */
export function getWindowDates(now: Date): string[] {
  const start = addDays(moscowDateString(now), 1)
  return Array.from({ length: WINDOW_DAYS }, (_, index) =>
    addDays(start, index),
  )
}

export function isDateInWindow(date: string, now: Date): boolean {
  return getWindowDates(now).includes(date)
}

/** Starts of the slot grid for a meeting type on a date inside the window. */
export function getSlotStarts(
  date: string,
  type: MeetingType,
  now: Date,
): SlotStart[] {
  if (!isDateInWindow(date, now)) {
    return []
  }

  const lastStart = WORKDAY_END_MINUTES - type.durationMinutes
  const starts: SlotStart[] = []

  for (
    let minutes = WORKDAY_START_MINUTES;
    minutes <= lastStart;
    minutes += START_STEP_MINUTES
  ) {
    const start = moscowDateTime(date, minutes)
    starts.push({
      start,
      end: new Date(start.getTime() + type.durationMinutes * 60_000),
    })
  }

  return starts
}
