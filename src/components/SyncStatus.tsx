import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { timeAgo } from '@/core/dates'
import { cn } from '@/lib/cn'
import { useVideos } from '@/state/videos'

/** "Synced 4m ago" + refresh. Re-renders every 30s so the label stays honest. */
export function SyncStatus() {
  const connected = useVideos((s) => s.connected)
  const syncedAt = useVideos((s) => s.syncedAt)
  const syncing = useVideos((s) => s.status === 'syncing')
  const [, tick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  if (!connected) return null

  return (
    <button
      type="button"
      onClick={() => void useVideos.getState().refresh({ force: true })}
      disabled={syncing}
      title="Refresh videos from YouTube"
      className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-fg-subtle transition-colors hover:bg-hover hover:text-fg-muted disabled:hover:bg-transparent"
    >
      <RefreshCw size={12} className={cn(syncing && 'animate-spin')} />
      {syncing ? 'Syncing…' : syncedAt ? `Synced ${timeAgo(syncedAt)}` : 'Not synced'}
    </button>
  )
}
