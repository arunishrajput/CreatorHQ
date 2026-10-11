import type { PlannedStage, VideoStatus } from './types'

export const STATUS_LABEL: Record<VideoStatus, string> = {
  public: 'Public',
  scheduled: 'Scheduled',
  unlisted: 'Unlisted',
  private: 'Private',
  processing: 'Processing',
  failed: 'Failed',
}

export const STAGE_LABEL: Record<PlannedStage, string> = {
  idea: 'Idea',
  scripting: 'Scripting',
  filming: 'Filming',
  editing: 'Editing',
  ready: 'Ready',
}
