import { CalendarDays, LogOut, RefreshCw } from 'lucide-react'
import { useUi } from '@/state/ui'
import { useVideos } from '@/state/videos'
import { Button } from '../ui/Button'
import { Menu, MenuItem, MenuSeparator } from '../ui/Menu'
import { Spinner } from '../ui/Spinner'
import { YouTubeIcon } from '../ui/YouTubeIcon'

export function AccountMenu() {
  const connected = useVideos((s) => s.connected)
  const channel = useVideos((s) => s.channel)
  const status = useVideos((s) => s.status)
  const weekStartsOn = useUi((s) => s.weekStartsOn)

  if (!connected) {
    return (
      <Button variant="secondary" size="sm" onClick={() => void useVideos.getState().connect()} disabled={status === 'syncing'}>
        {status === 'syncing' ? <Spinner /> : <YouTubeIcon className="text-[#ff4e45]" />}
        Connect YouTube
      </Button>
    )
  }

  return (
    <Menu
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="menu"
          title={channel?.title ?? 'Account'}
          className="flex h-7 items-center gap-2 rounded-md pr-2 pl-1 text-[12px] text-fg-muted transition-colors hover:bg-hover hover:text-fg"
        >
          <Avatar src={channel?.thumbnailUrl ?? null} name={channel?.title ?? '?'} />
          <span className="max-w-36 truncate">{channel?.title ?? 'Connected'}</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-2 py-1.5 text-[11px] text-fg-subtle">Signed in as {channel?.title ?? 'your channel'}</div>
          <MenuItem
            onSelect={() => {
              close()
              void useVideos.getState().refresh({ force: true })
            }}
          >
            <RefreshCw size={14} /> Refresh videos
          </MenuItem>
          <MenuItem
            onSelect={() => {
              close()
              useUi.getState().setWeekStart(weekStartsOn === 1 ? 0 : 1)
            }}
          >
            <CalendarDays size={14} /> Week starts on {weekStartsOn === 1 ? 'Sunday' : 'Monday'}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            danger
            onSelect={() => {
              close()
              void useVideos.getState().disconnect()
            }}
          >
            <LogOut size={14} /> Disconnect YouTube
          </MenuItem>
        </>
      )}
    </Menu>
  )
}

export function Avatar({ src, name, size = 20 }: { src: string | null; name: string; size?: number }) {
  return src ? (
    <img src={src} alt="" referrerPolicy="no-referrer" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-hover text-[10px] font-semibold text-fg-muted"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  )
}
