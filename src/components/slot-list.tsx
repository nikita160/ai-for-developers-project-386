import { formatSlot, type Slot } from '@/lib/booking'
import { cn } from '@/lib/utils'

type SlotListProps = {
  slots: Slot[]
  selected: Slot | null
  onSelect: (slot: Slot) => void
}

export function SlotList({ slots, selected, onSelect }: SlotListProps) {
  return (
    <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
      {slots.map((slot) => {
        const isSelected = selected?.start === slot.start

        return (
          <button
            key={slot.start}
            type="button"
            disabled={slot.busy}
            onClick={() => onSelect(slot)}
            className={cn(
              'flex w-full items-center justify-between rounded-lg border border-transparent px-4 py-2.5 text-sm transition-colors',
              slot.busy
                ? 'cursor-not-allowed bg-secondary/60 text-muted-foreground'
                : 'bg-secondary hover:bg-muted',
              isSelected && 'border-primary bg-primary/10 text-primary',
            )}
          >
            <span className={cn(slot.busy && 'line-through')}>
              {formatSlot(slot)}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                isSelected
                  ? 'text-primary'
                  : slot.busy
                    ? 'text-muted-foreground'
                    : 'text-foreground/80',
              )}
            >
              {slot.busy ? 'Занято' : 'Свободно'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
