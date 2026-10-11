import { ChevronLeft, ChevronRight, PanelRight, Plus } from 'lucide-react'
import { dayKey, viewTitle } from '@/core/dates'
import type { CalendarView } from '@/core/types'
import { openSidePanel } from '@/lib/navigation'
import { useUi } from '@/state/ui'
import { AccountMenu } from '../auth/AccountMenu'
import { Logo } from '../Logo'
import { SyncStatus } from '../SyncStatus'
import { Button, IconButton } from '../ui/Button'
import { Kbd } from '../ui/Kbd'
import { Segmented } from '../ui/Segmented'

const VIEWS = [
  { value: 'month', label: 'Month', hint: 'Month view (M)' },
  { value: 'week', label: 'Week', hint: 'Week view (W)' },
] as const satisfies readonly { value: CalendarView; label: string; hint: string }[]

export function CalendarHeader() {
  const view = useUi((s) => s.view)
  const anchor = useUi((s) => s.anchor)
  const weekStartsOn = useUi((s) => s.weekStartsOn)
  const { step, goToday, setView, openEditor } = useUi.getState()

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line px-4">
      <div className="flex items-center gap-2 pr-2">
        <Logo />
        <span className="text-[13px] font-semibold tracking-tight">CreatorHQ</span>
      </div>

      <div className="h-4 w-px bg-line" />

      <div className="flex items-center gap-1">
        <IconButton label="Previous (←)" onClick={() => step(-1)}>
          <ChevronLeft size={16} />
        </IconButton>
        <Button size="sm" variant="ghost" onClick={goToday} title="Today (T)">
          Today
        </Button>
        <IconButton label="Next (→)" onClick={() => step(1)}>
          <ChevronRight size={16} />
        </IconButton>
      </div>

      <h1 className="min-w-0 truncate text-[14px] font-semibold text-fg" aria-live="polite">
        {viewTitle(view, anchor, weekStartsOn)}
      </h1>

      <div className="ml-auto flex items-center gap-2">
        <SyncStatus />
        <Segmented label="Calendar view" value={view} options={VIEWS} onChange={setView} />
        <Button
          size="sm"
          variant="primary"
          onClick={() => openEditor({ mode: 'create', date: dayKey(new Date()) })}
          title="Plan a video (N)"
        >
          <Plus size={14} /> New
          <span className="hidden opacity-70 lg:inline-flex [&_kbd]:border-white/30 [&_kbd]:bg-white/10 [&_kbd]:text-white">
            <Kbd>N</Kbd>
          </span>
        </Button>
        <IconButton label="Open agenda in side panel" onClick={() => void openSidePanel()}>
          <PanelRight size={15} />
        </IconButton>
        <AccountMenu />
      </div>
    </header>
  )
}
