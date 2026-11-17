import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  addMonths,
  formatMonthLabel,
  getFreeSlotsCount,
  getMonthMatrix,
  isSameDay,
  WEEKDAY_SHORT,
  type Booking,
} from '@/lib/booking'
import { cn } from '@/lib/utils'

type MonthCalendarProps = {
  month: Date
  selected: Date | null
  bookings: Booking[]
  onMonthChange: (month: Date) => void
  onSelect: (date: Date) => void
}

export function MonthCalendar({
  month,
  selected,
  bookings,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const days = getMonthMatrix(month)

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Календарь</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Предыдущий месяц"
            onClick={() => onMonthChange(addMonths(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            aria-label="Следующий месяц"
            onClick={() => onMonthChange(addMonths(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium">{formatMonthLabel(month)}</p>

      <div className="mt-3 grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {WEEKDAY_SHORT.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const isCurrentMonth = day.getMonth() === month.getMonth()
          const isSelected = selected ? isSameDay(day, selected) : false
          const freeCount = getFreeSlotsCount(day, bookings)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-lg border border-transparent bg-secondary text-sm font-medium transition-colors hover:bg-muted',
                !isCurrentMonth && 'text-muted-foreground/50',
                isSelected &&
                  'border-primary bg-card text-primary hover:bg-card',
              )}
            >
              <span>{day.getDate()}</span>
              <span
                className={cn(
                  'text-[10px] leading-tight font-normal text-muted-foreground',
                  isSelected && 'text-primary/80',
                )}
              >
                {freeCount} св.
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
