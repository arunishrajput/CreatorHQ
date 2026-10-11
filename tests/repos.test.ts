import { describe, expect, it } from 'vitest'
import type { PlannedVideo } from '@/core/types'
import { createPlannedRepo, createSettingsRepo, createVideoCacheRepo, DEFAULT_SETTINGS } from '@/services/storage/repos'
import { createFakeArea } from './fakeStorage'

const plan = (id: string, overrides: Partial<PlannedVideo> = {}): PlannedVideo => ({
  kind: 'planned',
  id,
  title: `Plan ${id}`,
  date: '2026-10-20',
  stage: 'idea',
  notes: '',
  createdAt: '2026-10-11T10:00:00.000Z',
  updatedAt: '2026-10-11T10:00:00.000Z',
  ...overrides,
})

describe('plannedRepo', () => {
  it('saves, lists and removes, one key per video', async () => {
    const area = createFakeArea()
    const repo = createPlannedRepo(area)
    await repo.save(plan('a'))
    await repo.save(plan('b'))
    expect([...area.data.keys()]).toContain('planned/a')
    expect((await repo.list()).map((p) => p.id).sort()).toEqual(['a', 'b'])

    await repo.remove('a')
    expect((await repo.list()).map((p) => p.id)).toEqual(['b'])
  })

  it('ignores corrupt or foreign entries instead of crashing', async () => {
    const area = createFakeArea({
      'planned/ok': plan('ok'),
      'planned/bad-date': plan('bad-date', { date: 'tomorrow' }),
      'planned/bad-stage': { ...plan('bad-stage'), stage: 'published' },
      'planned/junk': 42,
      settings: {},
    })
    expect((await createPlannedRepo(area).list()).map((p) => p.id)).toEqual(['ok'])
  })
})

describe('settingsRepo', () => {
  it('falls back to defaults and merges updates', async () => {
    const repo = createSettingsRepo(createFakeArea({ settings: { view: 'nonsense' } }))
    expect(await repo.get()).toEqual(DEFAULT_SETTINGS)
    expect(await repo.update({ view: 'week' })).toEqual({ ...DEFAULT_SETTINGS, view: 'week' })
    expect((await repo.get()).view).toBe('week')
  })
})

describe('videoCacheRepo', () => {
  it('returns null for a missing or malformed cache', async () => {
    expect(await createVideoCacheRepo(createFakeArea()).get()).toBeNull()
    expect(await createVideoCacheRepo(createFakeArea({ 'youtube/cache': { videos: 'x' } })).get()).toBeNull()
  })
})
