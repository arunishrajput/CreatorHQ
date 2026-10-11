import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import { Agenda } from '@/components/agenda/Agenda'
import { PlannedVideoDialog } from '@/components/planner/PlannedVideoDialog'
import { VideoDetailsDialog } from '@/components/video/VideoDetailsDialog'
import { bootstrap } from '@/state/bootstrap'
import { useVideos } from '@/state/videos'

function SidePanel() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let unsubscribe: (() => void) | undefined
    let cancelled = false
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

  if (!ready) return null
  return (
    <>
      <Agenda />
      <PlannedVideoDialog />
      <VideoDetailsDialog />
    </>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidePanel />
  </StrictMode>,
)
