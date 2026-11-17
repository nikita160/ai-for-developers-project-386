import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MeetingType, Slot } from '@/lib/api'
import { formatDateLabel, formatSlotRange } from '@/lib/booking'

type BookingInfoProps = {
  type: MeetingType | null
  date: string | null
  slot: Slot | null
  freeCount: number | null
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

export function BookingInfo({ type, date, slot, freeCount }: BookingInfoProps) {
  return (
    <Card className="h-fit [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Информация</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InfoRow
          label="Тип встречи"
          value={type ? `${type.name} · ${type.durationMinutes} мин` : 'Не выбран'}
        />
        <InfoRow
          label="Выбранная дата"
          value={date ? formatDateLabel(date) : 'Дата не выбрана'}
        />
        <InfoRow
          label="Выбранное время"
          value={slot ? formatSlotRange(slot.start, slot.end) : 'Время не выбрано'}
        />
        <InfoRow label="Свободно" value={String(freeCount ?? 0)} />
      </CardContent>
    </Card>
  )
}
