import { format, isToday } from 'date-fns'
import { Plus } from 'lucide-react'
import { dayKey, weekDays } from '@/core/dates'
import type { CalendarItem } from '@/core/types'
import { cn } from '@/lib/cn'
import { useItemsByDay } from '@/state/selectors'
import { useUi } from '@/state/ui'
import { useDropTarget } from './dnd'
import { ItemCard } from './ItemCard'

export function WeekView() {
  const anchor = useUi((s) => s.anchor)
  const weekStartsOn = useUi((s) => s.weekStartsOn)
  const byDay = useItemsByDay()
  const days = weekDays(anchor, weekStartsOn)

  return (
    <div className="grid h-full min-h-0 grid-cols-7">
      {days.map((day) => (
        <DayColumn key={dayKey(day)} day={day} items={byDay.get(dayKey(day)) ?? []} />
      ))}
    </div>
  )
}

function DayColumn({ day, items }: { day: Date; items: CalendarItem[] }) {
  const key = dayKey(day)
  const today = isToday(day)
  const openEditor = useUi((s) => s.openEditor)
  const { isOver, dropProps } = useDropTarget(key)
  const create = () => openEditor({ mode: 'create', date: key })

  return (
    <section
      {...dropProps}
      onClick={create}
      aria-label={format(day, 'EEEE, MMMM d')}
      className={cn(
        'group flex min-h-0 flex-col border-r border-line last:border-r-0',
        isOver && 'bg-accent/10 ring-1 ring-accent/60 ring-inset',
      )}
    >
      <header className="flex items-baseline gap-2 border-b border-line px-3 py-2.5">
        <span className="text-[11px] font-medium tracking-wide text-fg-subtle uppercase">{format(day, 'EEE')}</span>
        <span
          className={cn(
            'inline-flex size-6 items-center justify-center rounded-full text-[13px] font-medium tabular-nums',
            today ? 'bg-accent text-accent-fg' : 'text-fg',
          )}
        >
          {format(day, 'd')}
        </span>
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
        {items.map((item) => (
          <ItemCard key={`${item.kind}:${item.id}`} item={item} />
        ))}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            create()
          }}
          className="flex h-8 items-center justify-center gap-1.5 rounded-lg border border-dashed border-transparent text-[12px] text-fg-subtle opacity-0 transition-all group-hover:border-line group-hover:opacity-100 hover:text-fg focus-visible:opacity-100"
        >
          <Plus size={13} /> Plan video
        </button>
      </div>
    </section>
  )
}
