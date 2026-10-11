import { format, isSameMonth, isToday } from 'date-fns'
import { Plus } from 'lucide-react'
import { dayKey, monthGrid } from '@/core/dates'
import type { CalendarItem } from '@/core/types'
import { cn } from '@/lib/cn'
import { useItemsByDay } from '@/state/selectors'
import { useUi } from '@/state/ui'
import { useDropTarget } from './dnd'
import { ItemChip } from './ItemChip'

const MAX_VISIBLE = 3

export function MonthView() {
  const anchor = useUi((s) => s.anchor)
  const weekStartsOn = useUi((s) => s.weekStartsOn)
  const byDay = useItemsByDay()
  const days = monthGrid(anchor, weekStartsOn)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-7 border-b border-line">
        {days.slice(0, 7).map((day) => (
          <div key={day.getDay()} className="px-2.5 py-2 text-[11px] font-medium tracking-wide text-fg-subtle uppercase">
            {format(day, 'EEE')}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => (
          <DayCell
            key={dayKey(day)}
            day={day}
            items={byDay.get(dayKey(day)) ?? []}
            inMonth={isSameMonth(day, anchor)}
          />
        ))}
      </div>
    </div>
  )
}

function DayCell({ day, items, inMonth }: { day: Date; items: CalendarItem[]; inMonth: boolean }) {
  const key = dayKey(day)
  const today = isToday(day)
  const openEditor = useUi((s) => s.openEditor)
  const { isOver, dropProps } = useDropTarget(key)
  const hidden = items.length - MAX_VISIBLE

  const create = () => openEditor({ mode: 'create', date: key })
  const showWeek = () => useUi.setState({ view: 'week', anchor: day })

  return (
    <div
      {...dropProps}
      onClick={create}
      className={cn(
        'group relative flex min-h-0 cursor-default flex-col gap-0.5 overflow-hidden border-r border-b border-line p-1 [&:nth-child(7n)]:border-r-0',
        !inMonth && 'bg-surface/40',
        isOver && 'bg-accent/10 ring-1 ring-accent/60 ring-inset',
      )}
    >
      <div className="flex h-6 items-center justify-between px-1">
        <span
          className={cn(
            'inline-flex size-5.5 items-center justify-center rounded-full text-[12px] tabular-nums',
            today ? 'bg-accent font-semibold text-accent-fg' : inMonth ? 'text-fg-muted' : 'text-fg-subtle/60',
          )}
        >
          {format(day, 'd')}
        </span>
        <button
          type="button"
          aria-label={`Plan a video on ${format(day, 'MMMM d')}`}
          onClick={(e) => {
            e.stopPropagation()
            create()
          }}
          className="rounded p-0.5 text-fg-subtle opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover hover:text-fg focus-visible:opacity-100"
        >
          <Plus size={13} />
        </button>
      </div>
      <div className={cn('flex min-h-0 flex-col gap-0.5', !inMonth && 'opacity-60')}>
        {items.slice(0, MAX_VISIBLE).map((item) => (
          <ItemChip key={`${item.kind}:${item.id}`} item={item} />
        ))}
        {hidden > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              showWeek()
            }}
            className="h-5 rounded px-1.5 text-left text-[11px] font-medium text-fg-subtle hover:bg-hover hover:text-fg"
          >
            +{hidden} more
          </button>
        )}
      </div>
    </div>
  )
}
