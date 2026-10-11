/**
 * Domain types. Everything the UI renders is a CalendarItem: either a video that
 * exists on YouTube (read-only, from the API) or one the creator is planning (local, editable).
 */

/** Local calendar day, `yyyy-MM-dd`. Never a UTC date — a 23:30 upload belongs to the day the creator saw it. */
export type DayKey = string

export const VIDEO_STATUSES = [
  'public',
  'scheduled',
  'unlisted',
  'private',
  'processing',
  'failed',
] as const
export type VideoStatus = (typeof VIDEO_STATUSES)[number]

export const PLANNED_STAGES = ['idea', 'scripting', 'filming', 'editing', 'ready'] as const
export type PlannedStage = (typeof PLANNED_STAGES)[number]

export interface PublishedVideo {
  kind: 'published'
  id: string
  title: string
  thumbnailUrl: string | null
  url: string
  studioUrl: string
  /** ISO timestamp the video lands on the calendar: `publishAt` when scheduled, else `publishedAt`. */
  date: string
  status: VideoStatus
  /** ISO-8601 duration, e.g. `PT8M12S`. */
  duration: string | null
}

export interface PlannedVideo {
  kind: 'planned'
  id: string
  title: string
  date: DayKey
  stage: PlannedStage
  notes: string
  createdAt: string
  updatedAt: string
}

export type CalendarItem = PublishedVideo | PlannedVideo

/** Fields a user can edit on a planned video. */
export type PlannedVideoInput = Pick<PlannedVideo, 'title' | 'date' | 'stage' | 'notes'>

export interface Channel {
  id: string
  title: string
  thumbnailUrl: string | null
  uploadsPlaylistId: string
}

export type CalendarView = 'month' | 'week'
export type WeekStart = 0 | 1
