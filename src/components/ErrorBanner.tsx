import { AlertTriangle, X } from 'lucide-react'
import { useVideos } from '@/state/videos'
import { IconButton } from './ui/Button'

/** Quiet, dismissible error line. Cached data stays on screen underneath. */
export function ErrorBanner() {
  const error = useVideos((s) => s.error)
  if (!error) return null
  return (
    <div
      role="alert"
      className="flex animate-fade-in items-center gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-[12px] text-fg-muted"
    >
      <AlertTriangle size={14} className="shrink-0 text-danger" />
      <span className="min-w-0 flex-1">{error}</span>
      <IconButton label="Dismiss" onClick={() => useVideos.getState().dismissError()} className="size-6">
        <X size={13} />
      </IconButton>
    </div>
  )
}
