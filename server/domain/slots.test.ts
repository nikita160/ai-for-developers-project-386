import { describe, expect, it } from 'vitest'

import { findMeetingType, SEED_MEETING_TYPES } from './meeting-types'
import { getSlotStarts, getWindowDates } from './slots'

const NOW = new Date('2026-11-17T10:00:00+03:00')

describe('meeting types', () => {
  it('exposes the call and consultation durations', () => {
    expect(SEED_MEETING_TYPES).toEqual([
      {
        id: 'call',
        name: 'Звонок',
        description: 'Короткий звонок, чтобы быстро разобрать один вопрос.',
        durationMinutes: 30,
      },
      {
        id: 'consultation',
        name: 'Консультация',
        description: 'Развёрнутая консультация с погружением в задачу.',
        durationMinutes: 60,
      },
    ])
    expect(
      findMeetingType(SEED_MEETING_TYPES, 'consultation')?.durationMinutes,
    ).toBe(60)
    expect(findMeetingType(SEED_MEETING_TYPES, 'unknown')).toBeUndefined()
  })
})

describe('booking window', () => {
  it('starts tomorrow and spans 14 calendar days', () => {
    const dates = getWindowDates(NOW)

    expect(dates).toHaveLength(14)
    expect(dates[0]).toBe('2026-11-18')
    expect(dates[13]).toBe('2026-12-01')
  })
})

describe('slot starts', () => {
  it('generates 30-minute starts for a call inside working hours', () => {
    const starts = getSlotStarts(
      '2026-11-18',
      findMeetingType(SEED_MEETING_TYPES, 'call')!,
      NOW,
    )

    expect(starts).toHaveLength(18)
    expect(starts[0]).toEqual({
      start: new Date('2026-11-18T09:00:00+03:00'),
      end: new Date('2026-11-18T09:30:00+03:00'),
    })
    expect(starts.at(-1)?.start).toEqual(
      new Date('2026-11-18T17:30:00+03:00'),
    )
  })

  it('fits a consultation entirely inside working hours', () => {
    const starts = getSlotStarts(
      '2026-11-18',
      findMeetingType(SEED_MEETING_TYPES, 'consultation')!,
      NOW,
    )

    expect(starts).toHaveLength(17)
    expect(starts.at(-1)).toEqual({
      start: new Date('2026-11-18T17:00:00+03:00'),
      end: new Date('2026-11-18T18:00:00+03:00'),
    })
  })

  it('returns no starts outside the booking window', () => {
    const call = findMeetingType(SEED_MEETING_TYPES, 'call')!

    expect(getSlotStarts('2026-11-17', call, NOW)).toEqual([])
    expect(getSlotStarts('2026-12-02', call, NOW)).toEqual([])
  })
})
