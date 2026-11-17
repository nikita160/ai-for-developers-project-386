import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateLabel, formatSlot, type Slot } from '@/lib/booking'

type BookingInfoProps = {
  date: Date | null
  slot: Slot | null
  freeCount: number
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-secondary px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  )
}

export function BookingInfo({ date, slot, freeCount }: BookingInfoProps) {
  return (
    <Card className="h-fit [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Информация</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InfoRow
          label="Выбранная дата"
          value={date ? formatDateLabel(date) : 'Дата не выбрана'}
        />
        <InfoRow
          label="Выбранное время"
          value={slot ? formatSlot(slot) : 'Время не выбрано'}
        />
        <InfoRow label="Свободно" value={String(freeCount)} />
        <InfoRow
          label="Длительности в дне"
          value={date ? '30 мин' : 'Нет слотов на этот день'}
        />
      </CardContent>
    </Card>
  )
}
