import type { Channel, PublishedVideo, VideoStatus } from '@/core/types'
import type { ApiChannel, ApiThumbnails, ApiVideo } from './types'

export function pickThumbnail(thumbnails: ApiThumbnails | undefined): string | null {
  return thumbnails?.medium?.url ?? thumbnails?.high?.url ?? thumbnails?.default?.url ?? null
}

export function mapChannel(api: ApiChannel): Channel | null {
  const uploadsPlaylistId = api.contentDetails?.relatedPlaylists?.uploads
  if (!api.id || !uploadsPlaylistId) return null
  return {
    id: api.id,
    title: api.snippet?.title ?? 'Untitled channel',
    thumbnailUrl: pickThumbnail(api.snippet?.thumbnails),
    uploadsPlaylistId,
  }
}

/**
 * One status per video, most specific first. A scheduled video is `private` on the
 * API with a future `publishAt`; once that time passes YouTube flips it to public.
 */
export function deriveStatus(status: ApiVideo['status'], now: Date): VideoStatus {
  const upload = status?.uploadStatus
  if (upload === 'failed' || upload === 'rejected' || upload === 'deleted') return 'failed'
  if (upload === 'uploaded') return 'processing'

  const privacy = status?.privacyStatus
  if (privacy === 'private' && status?.publishAt && new Date(status.publishAt) > now) return 'scheduled'
  if (privacy === 'public') return 'public'
  if (privacy === 'unlisted') return 'unlisted'
  return 'private'
}

export function mapVideo(api: ApiVideo, now: Date = new Date()): PublishedVideo | null {
  const id = api.id
  const publishedAt = api.snippet?.publishedAt
  if (!id || !publishedAt) return null

  const status = deriveStatus(api.status, now)
  const date = status === 'scheduled' && api.status?.publishAt ? api.status.publishAt : publishedAt

  return {
    kind: 'published',
    id,
    title: api.snippet?.title || 'Untitled video',
    thumbnailUrl: pickThumbnail(api.snippet?.thumbnails),
    url: `https://www.youtube.com/watch?v=${id}`,
    studioUrl: `https://studio.youtube.com/video/${id}/edit`,
    date,
    status,
    duration: api.contentDetails?.duration ?? null,
  }
}
