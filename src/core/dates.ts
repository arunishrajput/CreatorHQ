import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  format,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { CalendarView, DayKey, WeekStart } from './types'

const DAY_KEY_FORMAT = 'yyyy-MM-dd'

/** Local-time day key for a Date or an ISO timestamp. */
export function dayKey(value: Date | string): DayKey {
  const date = typeof value === 'string' ? new Date(value) : value
  return format(date, DAY_KEY_FORMAT)
}

/** Parse a day key to local midnight. */
export function fromDayKey(key: DayKey): Date {
  return parse(key, DAY_KEY_FORMAT, new Date())
}

export function isDayKey(value: string): value is DayKey {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(fromDayKey(value).getTime())
}

/**
 * Days shown in a month view: always 6 full weeks (42 days), so the grid
 * doesn't jump in height between months.
 */
export function monthGrid(anchor: Date, weekStartsOn: WeekStart): Date[] {
  const first = startOfWeek(startOfMonth(anchor), { weekStartsOn })
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

export function weekDays(anchor: Date, weekStartsOn: WeekStart): Date[] {
  const first = startOfWeek(anchor, { weekStartsOn })
  return Array.from({ length: 7 }, (_, i) => addDays(first, i))
}

/** First and last day key covered by a view, inclusive. */
export function viewRange(view: CalendarView, anchor: Date, weekStartsOn: WeekStart) {
  const days = view === 'month' ? monthGrid(anchor, weekStartsOn) : weekDays(anchor, weekStartsOn)
  return { from: dayKey(days[0]!), to: dayKey(days[days.length - 1]!) }
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  return view === 'month' ? addMonths(startOfMonth(anchor), direction) : addWeeks(anchor, direction)
}

export function viewTitle(view: CalendarView, anchor: Date, weekStartsOn: WeekStart): string {
  if (view === 'month') return format(anchor, 'MMMM yyyy')
  const days = weekDays(anchor, weekStartsOn)
  const first = days[0]!
  const last = days[6]!
  if (first.getMonth() === last.getMonth()) return `${format(first, 'MMM d')} – ${format(last, 'd, yyyy')}`
  if (first.getFullYear() === last.getFullYear())
    return `${format(first, 'MMM d')} – ${format(last, 'MMM d, yyyy')}`
  return `${format(first, 'MMM d, yyyy')} – ${format(last, 'MMM d, yyyy')}`
}

/** "Today", "Tomorrow", "Yesterday", or e.g. "Thu, Oct 16". */
export function relativeDayLabel(key: DayKey, now: Date = new Date()): string {
  const diff = differenceInCalendarDays(fromDayKey(key), now)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  return format(fromDayKey(key), 'EEE, MMM d')
}

/** "just now", "4m ago", "2h ago", "3d ago". */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/**
 * `PT1H2M3S` → `1:02:03`, `PT8M5S` → `8:05`. Returns null for anything unparseable and
 * for zero — YouTube reports `P0D` while a video is still processing.
 */
export function formatDuration(iso: string | null): string | null {
  if (!iso) return null
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso)
  if (!match) return null
  const [, d = '0', h = '0', m = '0', s = '0'] = match
  const hours = Number(d) * 24 + Number(h)
  if (hours === 0 && Number(m) === 0 && Number(s) === 0) return null
  const mm = hours > 0 ? m.padStart(2, '0') : m
  const ss = s.padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}
