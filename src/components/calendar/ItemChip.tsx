import { format } from 'date-fns'
import type { CalendarItem } from '@/core/types'
import { STAGE_LABEL, STATUS_LABEL } from '@/core/labels'
import { cn } from '@/lib/cn'
import { STAGE_DOT, STATUS_DOT } from '@/lib/colors'
import { useUi } from '@/state/ui'
import { Dot } from '../ui/Badge'
import { Thumbnail } from '../ui/Thumbnail'
import { plannedDragProps } from './dnd'

/** Compact one-line item for the month grid. */
export function ItemChip({ item }: { item: CalendarItem }) {
  const openEditor = useUi((s) => s.openEditor)
  const selectVideo = useUi((s) => s.selectVideo)

  if (item.kind === 'published') {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          selectVideo(item.id)
        }}
        title={`${item.title} · ${STATUS_LABEL[item.status]} · ${format(new Date(item.date), 'p')}`}
        className="group flex h-6 w-full items-center gap-1.5 rounded px-1 text-left transition-colors hover:bg-hover"
      >
        <Thumbnail src={item.thumbnailUrl} className="h-4 rounded-[3px]" />
        <span className="min-w-0 flex-1 truncate text-[12px] text-fg">{item.title}</span>
        <Dot className={STATUS_DOT[item.status]} />
      </button>
    )
  }

  return (
    <button
      type="button"
      {...plannedDragProps(item)}
      onClick={(e) => {
        e.stopPropagation()
        openEditor({ mode: 'edit', id: item.id })
      }}
      title={`${item.title} · Planned · ${STAGE_LABEL[item.stage]}`}
      className={cn(
        'flex h-6 w-full cursor-grab items-center gap-1.5 rounded border border-dashed border-line-strong px-1.5 text-left',
        'transition-colors hover:border-fg-subtle hover:bg-hover active:cursor-grabbing',
      )}
    >
      <Dot className={STAGE_DOT[item.stage]} />
      <span className="min-w-0 flex-1 truncate text-[12px] text-fg-muted">{item.title}</span>
    </button>
  )
}
