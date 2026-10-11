import { addDays, startOfDay } from 'date-fns'
import { ExternalLink, Plus } from 'lucide-react'
import { dayKey, relativeDayLabel } from '@/core/dates'
import { cn } from '@/lib/cn'
import { openCalendarTab } from '@/lib/navigation'
import { useItemsByDay } from '@/state/selectors'
import { useUi } from '@/state/ui'
import { ConnectCallout } from '../auth/ConnectCallout'
import { useDropTarget } from '../calendar/dnd'
import { ItemCard } from '../calendar/ItemCard'
import { ErrorBanner } from '../ErrorBanner'
import { Logo } from '../Logo'
import { SyncStatus } from '../SyncStatus'
import { Button, IconButton } from '../ui/Button'

const DAYS_AHEAD = 14

/** Side-panel view: the next two weeks as a list, today first. */
export function Agenda() {
  const byDay = useItemsByDay()
  const start = startOfDay(new Date())
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => dayKey(addDays(start, i)))
  const upcoming = days.reduce((n, d) => n + (byDay.get(d)?.length ?? 0), 0)

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-line px-3">
        <Logo size={18} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">Next 14 days</p>
        </div>
        <SyncStatus />
        <IconButton label="Open full calendar" onClick={() => void openCalendarTab()}>
          <ExternalLink size={14} />
        </IconButton>
        <Button
          size="sm"
          variant="primary"
          onClick={() => useUi.getState().openEditor({ mode: 'create', date: dayKey(new Date()) })}
        >
          <Plus size={14} /> New
        </Button>
      </header>

      <div className="flex flex-col gap-2 p-3 pb-0 empty:hidden">
        <ConnectCallout compact />
        <ErrorBanner />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {days.map((key) => (
          <AgendaDay key={key} day={key} />
        ))}
        {upcoming === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-fg-subtle">
            Nothing in the next two weeks. Plan something with <span className="text-fg-muted">New</span>.
          </p>
        )}
      </div>
    </div>
  )
}

function AgendaDay({ day }: { day: string }) {
  const items = useItemsByDay().get(day) ?? []
  const { isOver, dropProps } = useDropTarget(day)
  const isToday = day === dayKey(new Date())
  // Empty days collapse to a thin drop line so you can still drag a plan onto them.
  return (
    <section
      {...dropProps}
      className={cn('rounded-lg px-1 transition-colors', isOver && 'bg-accent/10 ring-1 ring-accent/60')}
    >
      <h2
        className={cn(
          'sticky top-0 z-10 flex items-center gap-2 bg-canvas py-1.5 text-[11px] font-medium tracking-wide uppercase',
          isToday ? 'text-accent' : items.length ? 'text-fg-muted' : 'text-fg-subtle/70',
        )}
      >
        {relativeDayLabel(day)}
        {items.length > 0 && <span className="text-fg-subtle tabular-nums">{items.length}</span>}
      </h2>
      {items.length > 0 && (
        <div className="flex flex-col gap-1.5 pb-3">
          {items.map((item) => (
            <ItemCard key={`${item.kind}:${item.id}`} item={item} layout="row" />
          ))}
        </div>
      )}
    </section>
  )
}
