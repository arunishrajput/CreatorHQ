import { format } from 'date-fns'
import { formatDuration } from '@/core/dates'
import { STAGE_LABEL, STATUS_LABEL } from '@/core/labels'
import type { CalendarItem } from '@/core/types'
import { STAGE_DOT, STATUS_DOT } from '@/lib/colors'
import { useUi } from '@/state/ui'
import { Badge } from '../ui/Badge'
import { Thumbnail } from '../ui/Thumbnail'
import { plannedDragProps } from './dnd'

/** Larger card for the week view and the side-panel agenda. */
export function ItemCard({ item, layout = 'stacked' }: { item: CalendarItem; layout?: 'stacked' | 'row' }) {
  const openEditor = useUi((s) => s.openEditor)
  const selectVideo = useUi((s) => s.selectVideo)

  if (item.kind === 'published') {
    const duration = formatDuration(item.duration)
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          selectVideo(item.id)
        }}
        className={
          layout === 'row'
            ? 'flex w-full gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-hover'
            : 'flex w-full flex-col gap-2 rounded-lg border border-line bg-surface p-1.5 text-left transition-colors hover:border-line-strong hover:bg-raised'
        }
      >
        <div className={layout === 'row' ? 'relative w-28 shrink-0' : 'relative'}>
          <Thumbnail src={item.thumbnailUrl} className="w-full rounded-md" />
          {duration && (
            <span className="absolute right-1 bottom-1 rounded bg-black/80 px-1 text-[10px] font-medium text-white tabular-nums">
              {duration}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5 px-0.5 pb-0.5">
          <span className="line-clamp-2 text-[12px] leading-snug font-medium text-fg">{item.title}</span>
          <div className="flex items-center gap-2">
            <Badge dot={STATUS_DOT[item.status]}>{STATUS_LABEL[item.status]}</Badge>
            <span className="text-[11px] text-fg-subtle tabular-nums">{format(new Date(item.date), 'p')}</span>
          </div>
        </div>
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
      className="flex w-full cursor-grab flex-col items-start gap-1.5 rounded-lg border border-dashed border-line-strong p-2.5 text-left transition-colors hover:border-fg-subtle hover:bg-hover active:cursor-grabbing"
    >
      <span className="line-clamp-2 text-[12px] leading-snug font-medium text-fg">{item.title}</span>
      {item.notes && <span className="line-clamp-2 text-[11px] leading-snug text-fg-subtle">{item.notes}</span>}
      <Badge dot={STAGE_DOT[item.stage]}>{STAGE_LABEL[item.stage]}</Badge>
    </button>
  )
}
