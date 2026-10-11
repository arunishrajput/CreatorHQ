import { useEffect, useState } from 'react'
import { ConnectCallout } from '@/components/auth/ConnectCallout'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { ErrorBanner } from '@/components/ErrorBanner'
import { PlannedVideoDialog } from '@/components/planner/PlannedVideoDialog'
import { VideoDetailsDialog } from '@/components/video/VideoDetailsDialog'
import { dayKey } from '@/core/dates'
import { primeWindowId } from '@/lib/navigation'
import { useShortcuts } from '@/lib/useShortcuts'
import { bootstrap } from '@/state/bootstrap'
import { useUi } from '@/state/ui'
import { useVideos } from '@/state/videos'

export function App() {
  const ready = useBootstrap()
  const view = useUi((s) => s.view)

  useShortcuts({
    t: () => useUi.getState().goToday(),
    ArrowLeft: () => useUi.getState().step(-1),
    ArrowRight: () => useUi.getState().step(1),
    m: () => useUi.getState().setView('month'),
    w: () => useUi.getState().setView('week'),
    n: () => useUi.getState().openEditor({ mode: 'create', date: dayKey(new Date()) }),
  })

  if (!ready) return null

  return (
    <div className="flex h-full min-w-[960px] flex-col">
      <CalendarHeader />
      <div className="flex flex-col gap-2 px-4 pt-3 empty:hidden">
        <ConnectCallout />
        <ErrorBanner />
      </div>
      <main className="m-4 mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-surface">
        {view === 'month' ? <MonthView /> : <WeekView />}
      </main>
      <PlannedVideoDialog />
      <VideoDetailsDialog />
    </div>
  )
}

/** Load from storage, then refresh from YouTube in the background if the cache is stale. */
function useBootstrap(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
    void primeWindowId()
    void bootstrap().then((unsub) => {
      if (cancelled) return unsub()
      unsubscribe = unsub
      setReady(true)
      void useVideos.getState().refresh()
    })
    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [])
  return ready
}
