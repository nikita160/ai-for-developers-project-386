import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  addMonths,
  formatDateLabel,
  formatMonthLabel,
  getMonthDays,
  WEEKDAY_SHORT,
  type Month,
} from '@/lib/booking'
import { cn } from '@/lib/utils'

type MonthCalendarProps = {
  month: Month
  selectedDate: string | null
  availability: Record<string, number>
  onMonthChange: (month: Month) => void
  onSelect: (date: string) => void
}

export function MonthCalendar({
  month,
  selectedDate,
  availability,
  onMonthChange,
  onSelect,
}: MonthCalendarProps) {
  const days = getMonthDays(month)

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
          const freeStarts = availability[day.iso]
          const hasAvailability = freeStarts !== undefined
          const isAvailable = hasAvailability && freeStarts > 0
          const isSelected = selectedDate === day.iso

          return (
            <button
              key={day.iso}
              type="button"
              data-date={day.iso}
              aria-label={
                hasAvailability
                  ? `${formatDateLabel(day.iso)}, свободно: ${freeStarts}`
                  : formatDateLabel(day.iso)
              }
              disabled={!isAvailable}
              onClick={() => onSelect(day.iso)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-lg border border-transparent bg-secondary text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-secondary',
                !day.inMonth && 'text-muted-foreground/50',
                isSelected &&
                  'border-primary bg-card text-primary hover:bg-card',
              )}
            >
              <span>{day.day}</span>
              <span
                className={cn(
                  'text-[10px] leading-tight font-normal text-muted-foreground',
                  isSelected && 'text-primary/80',
                )}
              >
                {hasAvailability ? `${freeStarts} св.` : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
