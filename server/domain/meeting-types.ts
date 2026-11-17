export type MeetingTypeId = 'call' | 'consultation'

export type MeetingType = {
  id: MeetingTypeId
  name: string
  durationMinutes: number
}

export const MEETING_TYPES: MeetingType[] = [
  { id: 'call', name: 'Звонок', durationMinutes: 30 },
  { id: 'consultation', name: 'Консультация', durationMinutes: 60 },
]

export function findMeetingType(id: string): MeetingType | undefined {
  return MEETING_TYPES.find((type) => type.id === id)
}
