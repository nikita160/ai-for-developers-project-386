import type { Slot } from '@/lib/api'
import { formatSlotRange } from '@/lib/booking'
import { cn } from '@/lib/utils'

type SlotListProps = {
  slots: Slot[]
  selectedStart: string | null
  onSelect: (slot: Slot) => void
}

export function SlotList({ slots, selectedStart, onSelect }: SlotListProps) {
  return (
    <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const isSelected = selectedStart === slot.start

        return (
          <button
            key={slot.start}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-transparent px-4 py-2.5 text-sm transition-colors',
              slot.available
                ? 'bg-secondary hover:bg-muted'
                : 'cursor-not-allowed bg-secondary/60 text-muted-foreground',
              isSelected && 'border-primary bg-primary/10 text-primary',
            )}
          >
            <span className={cn(!slot.available && 'line-through')}>
              {formatSlotRange(slot.start, slot.end)}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                isSelected
                  ? 'text-primary'
                  : slot.available
                    ? 'text-foreground/80'
                    : 'text-muted-foreground',
              )}
            >
              {slot.available ? 'Свободно' : 'Занято'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
