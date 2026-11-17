import { CalendarDays } from 'lucide-react'

import { cn } from '@/lib/utils'

type AppHeaderProps = {
  active: 'booking' | 'events' | null
  onHome: () => void
  onBook: () => void
  onEvents: () => void
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg px-3 py-2 text-sm transition-colors',
        active
          ? 'bg-secondary font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function AppHeader({ active, onHome, onBook, onEvents }: AppHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="flex items-center gap-2 text-foreground"
        >
          <CalendarDays className="size-5 text-primary" />
          <span className="text-lg font-semibold tracking-tight">Calendar</span>
        </button>

        <nav className="flex items-center gap-1">
          <NavButton active={active === 'booking'} onClick={onBook}>
            Записаться
          </NavButton>
          <NavButton active={active === 'events'} onClick={onEvents}>
            Предстоящие события
          </NavButton>
        </nav>
      </div>
    </header>
  )
}
