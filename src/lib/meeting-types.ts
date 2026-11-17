import type { MeetingType } from '@/lib/api'

export function meetingTypeName(
  types: MeetingType[],
  typeId: string,
): string {
  return types.find((type) => type.id === typeId)?.name ?? typeId
}
