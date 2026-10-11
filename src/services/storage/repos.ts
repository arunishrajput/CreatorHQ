import { isDayKey } from '@/core/dates'
import {
  PLANNED_STAGES,
  type CalendarView,
  type Channel,
  type PlannedVideo,
  type PublishedVideo,
  type WeekStart,
} from '@/core/types'
import { KEYS, plannedKey, SCHEMA_VERSION, type KeyValueArea } from './storage'

// ---------- planned videos ----------

/** Stored data is user-owned and survives upgrades, so read it defensively. */
export function isPlannedVideo(value: unknown): value is PlannedVideo {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    v.kind === 'planned' &&
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.date === 'string' &&
    isDayKey(v.date) &&
    typeof v.stage === 'string' &&
    (PLANNED_STAGES as readonly string[]).includes(v.stage) &&
    typeof v.notes === 'string' &&
    typeof v.createdAt === 'string' &&
    typeof v.updatedAt === 'string'
  )
}

export function createPlannedRepo(area: KeyValueArea) {
  return {
    async list(): Promise<PlannedVideo[]> {
      const all = await area.get(null)
      return Object.entries(all)
        .filter(([key]) => key.startsWith(KEYS.plannedPrefix))
        .map(([, value]) => value)
        .filter(isPlannedVideo)
    },
    async save(video: PlannedVideo): Promise<void> {
      await area.set({ [plannedKey(video.id)]: video, [KEYS.schemaVersion]: SCHEMA_VERSION })
    },
    async remove(id: string): Promise<void> {
      await area.remove(plannedKey(id))
    },
  }
}

// ---------- YouTube cache ----------

export interface VideoCache {
  channel: Channel
  videos: PublishedVideo[]
  syncedAt: string
}

export function createVideoCacheRepo(area: KeyValueArea) {
  return {
    async get(): Promise<VideoCache | null> {
      const { [KEYS.videoCache]: cache } = await area.get(KEYS.videoCache)
      if (typeof cache !== 'object' || cache === null) return null
      const c = cache as Partial<VideoCache>
      if (!c.channel || !Array.isArray(c.videos) || typeof c.syncedAt !== 'string') return null
      return c as VideoCache
    },
    async set(cache: VideoCache): Promise<void> {
      await area.set({ [KEYS.videoCache]: cache })
    },
    async clear(): Promise<void> {
      await area.remove(KEYS.videoCache)
    },
  }
}

// ---------- settings ----------

export interface Settings {
  view: CalendarView
  weekStartsOn: WeekStart
  /** Set when the user connects, cleared on disconnect. We never request a token unless this is true. */
  youtubeConnected: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  view: 'month',
  weekStartsOn: 1,
  youtubeConnected: false,
}

export function parseSettings(value: unknown): Settings {
  const s = (typeof value === 'object' && value !== null ? value : {}) as Partial<Settings>
  return {
    view: s.view === 'week' ? 'week' : 'month',
    weekStartsOn: s.weekStartsOn === 0 ? 0 : 1,
    youtubeConnected: s.youtubeConnected === true,
  }
}

export function createSettingsRepo(area: KeyValueArea) {
  return {
    async get(): Promise<Settings> {
      const { [KEYS.settings]: settings } = await area.get(KEYS.settings)
      return parseSettings(settings)
    },
    async update(patch: Partial<Settings>): Promise<Settings> {
      const next = { ...(await this.get()), ...patch }
      await area.set({ [KEYS.settings]: next })
      return next
    },
  }
}
