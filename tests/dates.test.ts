import { describe, expect, it } from 'vitest'
import {
  dayKey,
  formatDuration,
  fromDayKey,
  isDayKey,
  monthGrid,
  relativeDayLabel,
  shiftAnchor,
  timeAgo,
  viewRange,
  viewTitle,
  weekDays,
} from '@/core/dates'

describe('dayKey', () => {
  it('formats in local time and round-trips', () => {
    const date = new Date(2026, 9, 11, 23, 30)
    expect(dayKey(date)).toBe('2026-10-11')
    expect(dayKey(fromDayKey('2026-10-11'))).toBe('2026-10-11')
  })

  it('validates keys', () => {
    expect(isDayKey('2026-10-11')).toBe(true)
    expect(isDayKey('2026-13-01')).toBe(false)
    expect(isDayKey('11/10/2026')).toBe(false)
  })
})

describe('monthGrid', () => {
  it('always returns 42 days starting on the chosen weekday', () => {
    const monday = monthGrid(new Date(2026, 9, 15), 1)
    expect(monday).toHaveLength(42)
    expect(monday[0]!.getDay()).toBe(1)
    expect(dayKey(monday[0]!)).toBe('2026-09-28')

    const sunday = monthGrid(new Date(2026, 9, 15), 0)
    expect(sunday[0]!.getDay()).toBe(0)
    expect(dayKey(sunday[0]!)).toBe('2026-09-27')
  })

  it('contains every day of the month', () => {
    const keys = monthGrid(new Date(2027, 1, 10), 1).map(dayKey)
    expect(keys).toContain('2027-02-01')
    expect(keys).toContain('2027-02-28')
  })
})

describe('weekDays / viewRange', () => {
  it('returns seven consecutive days', () => {
    const days = weekDays(new Date(2026, 9, 15), 1).map(dayKey)
    expect(days).toEqual([
      '2026-10-12',
      '2026-10-13',
      '2026-10-14',
      '2026-10-15',
      '2026-10-16',
      '2026-10-17',
      '2026-10-18',
    ])
  })

  it('reports the inclusive range of a view', () => {
    expect(viewRange('week', new Date(2026, 9, 15), 1)).toEqual({ from: '2026-10-12', to: '2026-10-18' })
    expect(viewRange('month', new Date(2026, 9, 15), 1)).toEqual({ from: '2026-09-28', to: '2026-11-08' })
  })
})

describe('shiftAnchor / viewTitle', () => {
  it('moves by a month from the first of the month (no Jan 31 → Mar 3 skip)', () => {
    expect(dayKey(shiftAnchor('month', new Date(2027, 0, 31), 1))).toBe('2027-02-01')
  })

  it('moves by a week', () => {
    expect(dayKey(shiftAnchor('week', new Date(2026, 9, 15), -1))).toBe('2026-10-08')
  })

  it('titles views', () => {
    expect(viewTitle('month', new Date(2026, 9, 15), 1)).toBe('October 2026')
    expect(viewTitle('week', new Date(2026, 9, 15), 1)).toBe('Oct 12 – 18, 2026')
    expect(viewTitle('week', new Date(2026, 9, 1), 1)).toBe('Sep 28 – Oct 4, 2026')
  })
})

describe('labels', () => {
  const now = new Date(2026, 9, 11, 12)

  it('relative day labels', () => {
    expect(relativeDayLabel('2026-10-11', now)).toBe('Today')
    expect(relativeDayLabel('2026-10-12', now)).toBe('Tomorrow')
    expect(relativeDayLabel('2026-10-10', now)).toBe('Yesterday')
    expect(relativeDayLabel('2026-10-16', now)).toBe('Fri, Oct 16')
  })

  it('time ago', () => {
    expect(timeAgo(new Date(now.getTime() - 10_000).toISOString(), now)).toBe('just now')
    expect(timeAgo(new Date(now.getTime() - 4 * 60_000).toISOString(), now)).toBe('4m ago')
    expect(timeAgo(new Date(now.getTime() - 3 * 3_600_000).toISOString(), now)).toBe('3h ago')
  })

  it('durations', () => {
    expect(formatDuration('PT8M5S')).toBe('8:05')
    expect(formatDuration('PT1H2M3S')).toBe('1:02:03')
    expect(formatDuration('PT45S')).toBe('0:45')
    expect(formatDuration('P0D')).toBeNull()
    expect(formatDuration('garbage')).toBeNull()
    expect(formatDuration(null)).toBeNull()
  })
})
