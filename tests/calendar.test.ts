import { describe, expect, it } from 'vitest'
import { groupByDay, itemsInRange } from '@/core/calendar'
import type { PlannedVideo, PublishedVideo } from '@/core/types'

const published = (id: string, date: string): PublishedVideo => ({
  kind: 'published',
  id,
  title: id,
  thumbnailUrl: null,
  url: '',
  studioUrl: '',
  date,
  status: 'public',
  duration: null,
})

const planned = (id: string, date: string, title = id): PlannedVideo => ({
  kind: 'planned',
  id,
  title,
  date,
  stage: 'idea',
  notes: '',
  createdAt: '',
  updatedAt: '',
})

// Build ISO strings from local times so the test holds in any timezone.
const local = (y: number, m: number, d: number, h: number) => new Date(y, m - 1, d, h).toISOString()

describe('groupByDay', () => {
  it('buckets by local day and orders published (by time) before planned (by title)', () => {
    const items = [
      planned('p-b', '2026-10-14', 'Zebra'),
      published('late', local(2026, 10, 14, 18)),
      planned('p-a', '2026-10-14', 'Alpha'),
      published('early', local(2026, 10, 14, 9)),
      planned('other', '2026-10-15'),
    ]
    const groups = groupByDay(items)
    expect(groups.get('2026-10-14')!.map((i) => i.id)).toEqual(['early', 'late', 'p-a', 'p-b'])
    expect(groups.get('2026-10-15')!.map((i) => i.id)).toEqual(['other'])
  })

  it('filters to an inclusive range', () => {
    const items = [planned('a', '2026-10-01'), planned('b', '2026-10-10'), planned('c', '2026-10-11')]
    expect(itemsInRange(items, '2026-10-01', '2026-10-10').map((i) => i.id)).toEqual(['a', 'b'])
  })
})
