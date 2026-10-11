import { useVideos } from '@/state/videos'
import { Button } from '../ui/Button'
import { Spinner } from '../ui/Spinner'
import { YouTubeIcon } from '../ui/YouTubeIcon'

/** Shown above the calendar until a channel is connected. Planning works either way. */
export function ConnectCallout({ compact = false }: { compact?: boolean }) {
  const connected = useVideos((s) => s.connected)
  const hydrated = useVideos((s) => s.hydrated)
  const syncing = useVideos((s) => s.status === 'syncing')
  if (!hydrated || connected) return null

  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#ff4e45]/10 text-[#ff4e45]">
        <YouTubeIcon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-fg">Connect your channel</p>
        {!compact && (
          <p className="text-[12px] text-fg-subtle">
            See published, scheduled and private uploads alongside your plans. Read-only — CreatorHQ never changes your
            channel.
          </p>
        )}
      </div>
      <Button size="sm" variant="primary" disabled={syncing} onClick={() => void useVideos.getState().connect()}>
        {syncing && <Spinner className="border-white/40 border-t-white" />}
        Connect
      </Button>
    </div>
  )
}
