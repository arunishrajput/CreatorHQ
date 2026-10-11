import { create } from 'zustand'
import type { DayKey, PlannedVideo, PlannedVideoInput } from '@/core/types'
import { getRepos } from '@/services/storage'

interface PlannedState {
  items: PlannedVideo[]
  hydrated: boolean
  hydrate(): Promise<void>
  create(input: PlannedVideoInput): Promise<PlannedVideo>
  update(id: string, patch: Partial<PlannedVideoInput>): Promise<void>
  move(id: string, date: DayKey): Promise<void>
  remove(id: string): Promise<void>
}

/**
 * Planned videos. Writes update memory first (so the UI never waits on storage),
 * then persist. Other open pages pick the change up via storageSync.
 */
export const usePlanned = create<PlannedState>()((set, get) => ({
  items: [],
  hydrated: false,

  async hydrate() {
    set({ items: await getRepos().planned.list(), hydrated: true })
  },

  async create(input) {
    const now = new Date().toISOString()
    const video: PlannedVideo = {
      kind: 'planned',
      id: crypto.randomUUID(),
      ...normalize(input),
      createdAt: now,
      updatedAt: now,
    }
    set({ items: [...get().items, video] })
    await getRepos().planned.save(video)
    return video
  },

  async update(id, patch) {
    const current = get().items.find((v) => v.id === id)
    if (!current) return
    const next: PlannedVideo = {
      ...current,
      ...normalize({ ...current, ...patch }),
      updatedAt: new Date().toISOString(),
    }
    set({ items: get().items.map((v) => (v.id === id ? next : v)) })
    await getRepos().planned.save(next)
  },

  async move(id, date) {
    const current = get().items.find((v) => v.id === id)
    if (!current || current.date === date) return
    await get().update(id, { date })
  },

  async remove(id) {
    set({ items: get().items.filter((v) => v.id !== id) })
    await getRepos().planned.remove(id)
  },
}))

function normalize(input: PlannedVideoInput): PlannedVideoInput {
  return {
    title: input.title.trim() || 'Untitled video',
    date: input.date,
    stage: input.stage,
    notes: input.notes.trim(),
  }
}
