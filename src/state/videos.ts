import { create } from 'zustand'
import type { Channel, PublishedVideo } from '@/core/types'
import { chromeTokenProvider, signOut } from '@/services/auth'
import { getRepos } from '@/services/storage'
import { createYouTubeClient, fetchChannelVideos, YouTubeError } from '@/services/youtube'

/** How old the cache can get before opening the calendar triggers a background refresh. */
const STALE_AFTER_MS = 15 * 60 * 1000

type SyncStatus = 'idle' | 'syncing'

interface VideosState {
  connected: boolean
  channel: Channel | null
  videos: PublishedVideo[]
  syncedAt: string | null
  status: SyncStatus
  error: string | null
  hydrated: boolean

  /** Load cache + connection flag from storage. Cheap; no network. */
  hydrate(): Promise<void>
  /** Refresh from YouTube if connected and the cache is stale (or `force`). */
  refresh(options?: { force?: boolean }): Promise<void>
  /** Interactive sign-in, then a full sync. */
  connect(): Promise<void>
  disconnect(): Promise<void>
  dismissError(): void
}

export const useVideos = create<VideosState>()((set, get) => ({
  connected: false,
  channel: null,
  videos: [],
  syncedAt: null,
  status: 'idle',
  error: null,
  hydrated: false,

  async hydrate() {
    const { settings, videoCache } = getRepos()
    const [{ youtubeConnected }, cache] = await Promise.all([settings.get(), videoCache.get()])
    set({
      connected: youtubeConnected,
      channel: cache?.channel ?? null,
      videos: cache?.videos ?? [],
      syncedAt: cache?.syncedAt ?? null,
      hydrated: true,
    })
  },

  async refresh({ force = false } = {}) {
    const { connected, syncedAt, status } = get()
    if (!connected || status === 'syncing') return
    const fresh = syncedAt && Date.now() - new Date(syncedAt).getTime() < STALE_AFTER_MS
    if (fresh && !force) return
    await sync(set, false)
  },

  async connect() {
    if (get().status === 'syncing') return
    const ok = await sync(set, true)
    if (ok) {
      await getRepos().settings.update({ youtubeConnected: true })
      set({ connected: true })
    }
  },

  async disconnect() {
    await signOut()
    await Promise.all([getRepos().settings.update({ youtubeConnected: false }), getRepos().videoCache.clear()])
    set({ connected: false, channel: null, videos: [], syncedAt: null, error: null })
  },

  dismissError() {
    set({ error: null })
  },
}))

type Set = (partial: Partial<VideosState>) => void

/** Fetch everything and replace the cache. Returns false (and records why) on failure; never throws. */
async function sync(set: Set, interactive: boolean): Promise<boolean> {
  set({ status: 'syncing', error: null })
  try {
    const client = createYouTubeClient({ auth: chromeTokenProvider, interactive })
    const { channel, videos } = await fetchChannelVideos(client)
    const syncedAt = new Date().toISOString()
    await getRepos().videoCache.set({ channel, videos, syncedAt })
    set({ channel, videos, syncedAt, status: 'idle' })
    return true
  } catch (error) {
    set({ status: 'idle', error: describe(error) })
    return false
  }
}

function describe(error: unknown): string {
  if (error instanceof YouTubeError) {
    if (error.code === 'auth') return `Couldn't sign in to Google: ${error.message}`
    return error.message
  }
  return error instanceof Error ? error.message : 'Something went wrong while syncing.'
}
