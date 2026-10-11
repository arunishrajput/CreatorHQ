import type { PlannedStage, VideoStatus } from '@/core/types'

// Tailwind needs full class names in source to generate them, so these are spelled out.

export const STATUS_DOT: Record<VideoStatus, string> = {
  public: 'bg-status-public',
  scheduled: 'bg-status-scheduled',
  unlisted: 'bg-status-unlisted',
  private: 'bg-status-private',
  processing: 'bg-status-processing',
  failed: 'bg-status-failed',
}

export const STAGE_DOT: Record<PlannedStage, string> = {
  idea: 'bg-stage-idea',
  scripting: 'bg-stage-scripting',
  filming: 'bg-stage-filming',
  editing: 'bg-stage-editing',
  ready: 'bg-stage-ready',
}
