import { format } from 'date-fns'
import { ExternalLink, PencilLine } from 'lucide-react'
import { formatDuration } from '@/core/dates'
import { STATUS_LABEL } from '@/core/labels'
import { STATUS_DOT } from '@/lib/colors'
import { useUi } from '@/state/ui'
import { useVideos } from '@/state/videos'
import { Badge } from '../ui/Badge'
import { Dialog } from '../ui/Dialog'
import { Thumbnail } from '../ui/Thumbnail'

const linkClass =
  'inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors'

export function VideoDetailsDialog() {
  const id = useUi((s) => s.selectedVideoId)
  const video = useVideos((s) => (id ? s.videos.find((v) => v.id === id) : undefined))
  const close = () => useUi.getState().selectVideo(null)

  return (
    <Dialog open={video !== undefined} onClose={close} title="Video details">
      {video && (
        <div className="flex flex-col gap-4">
          <Thumbnail src={video.thumbnailUrl} className="w-full rounded-lg" />
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] leading-snug font-semibold text-fg">{video.title}</h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-fg-muted">
              <Badge dot={STATUS_DOT[video.status]}>{STATUS_LABEL[video.status]}</Badge>
              <span>
                {video.status === 'scheduled' ? 'Goes live ' : ''}
                {format(new Date(video.date), "EEE, MMM d, yyyy 'at' p")}
              </span>
              {formatDuration(video.duration) && <span className="tabular-nums">{formatDuration(video.duration)}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            <a href={video.url} target="_blank" rel="noreferrer" className={`${linkClass} bg-accent text-accent-fg hover:bg-accent-hover`}>
              <ExternalLink size={14} /> Watch on YouTube
            </a>
            <a
              href={video.studioUrl}
              target="_blank"
              rel="noreferrer"
              className={`${linkClass} border border-line bg-raised text-fg hover:bg-hover`}
            >
              <PencilLine size={14} /> Open in Studio
            </a>
          </div>
        </div>
      )}
    </Dialog>
  )
}
