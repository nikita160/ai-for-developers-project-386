import { CalendarDays } from 'lucide-react'

import { useApiHealth } from '@/hooks/use-api-health'
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
  const health = useApiHealth()

  const healthLabel =
    health === 'ok'
      ? 'API отвечает'
      : health === 'error'
        ? 'API недоступен'
        : 'Проверка API'

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

        <div className="flex items-center gap-4">
          <div
            className="hidden items-center gap-1.5 sm:flex"
            title={healthLabel}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                health === 'ok' && 'bg-emerald-500',
                health === 'error' && 'bg-destructive',
                health === 'checking' && 'animate-pulse bg-muted-foreground/40',
              )}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground">API</span>
            <span className="sr-only">{healthLabel}</span>
          </div>

          <nav className="flex items-center gap-1">
            <NavButton active={active === 'booking'} onClick={onBook}>
              Записаться
            </NavButton>
            <NavButton active={active === 'events'} onClick={onEvents}>
              Предстоящие события
            </NavButton>
          </nav>
        </div>
      </div>
    </header>
  )
}
