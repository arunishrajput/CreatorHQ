import { dayKey } from './dates'
import type { CalendarItem, DayKey } from './types'

/** The local day an item sits on. Planned videos already store a day key. */
export function itemDay(item: CalendarItem): DayKey {
  return item.kind === 'planned' ? item.date : dayKey(item.date)
}

/**
 * Order within one day: published videos by time (they have one), then planned
 * videos by title. Published first because they are fact; plans are intent.
 */
export function compareItems(a: CalendarItem, b: CalendarItem): number {
  if (a.kind !== b.kind) return a.kind === 'published' ? -1 : 1
  if (a.kind === 'published' && b.kind === 'published') return a.date.localeCompare(b.date)
  return a.title.localeCompare(b.title)
}

export function groupByDay(items: readonly CalendarItem[]): Map<DayKey, CalendarItem[]> {
  const groups = new Map<DayKey, CalendarItem[]>()
  for (const item of items) {
    const key = itemDay(item)
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }
  for (const bucket of groups.values()) bucket.sort(compareItems)
  return groups
}

/** Items whose day falls within [from, to], inclusive. Day keys sort lexically. */
export function itemsInRange(items: readonly CalendarItem[], from: DayKey, to: DayKey): CalendarItem[] {
  return items.filter((item) => {
    const key = itemDay(item)
    return key >= from && key <= to
  })
}
