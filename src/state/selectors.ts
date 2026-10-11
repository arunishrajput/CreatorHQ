import { useMemo } from 'react'
import { groupByDay } from '@/core/calendar'
import type { CalendarItem } from '@/core/types'
import { usePlanned } from './planned'
import { useVideos } from './videos'

/** Published + planned, grouped by local day. Recomputed only when either list changes. */
export function useItemsByDay() {
  const videos = useVideos((s) => s.videos)
  const planned = usePlanned((s) => s.items)
  return useMemo(() => groupByDay([...videos, ...planned] as CalendarItem[]), [videos, planned])
}
