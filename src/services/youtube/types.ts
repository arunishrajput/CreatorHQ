/**
 * The parts of YouTube Data API v3 responses we read. Deliberately partial —
 * every field is optional because the API omits what it doesn't have.
 * Reference: https://developers.google.com/youtube/v3/docs
 */

export interface ApiThumbnail {
  url?: string
  width?: number
  height?: number
}

export type ApiThumbnails = Partial<Record<'default' | 'medium' | 'high' | 'standard' | 'maxres', ApiThumbnail>>

export interface ApiListResponse<T> {
  items?: T[]
  nextPageToken?: string
  pageInfo?: { totalResults?: number; resultsPerPage?: number }
}

export interface ApiChannel {
  id?: string
  snippet?: { title?: string; thumbnails?: ApiThumbnails }
  contentDetails?: { relatedPlaylists?: { uploads?: string } }
}

export interface ApiPlaylistItem {
  contentDetails?: { videoId?: string; videoPublishedAt?: string }
}

export interface ApiVideo {
  id?: string
  snippet?: { title?: string; publishedAt?: string; thumbnails?: ApiThumbnails }
  status?: {
    uploadStatus?: 'deleted' | 'failed' | 'processed' | 'rejected' | 'uploaded'
    privacyStatus?: 'private' | 'public' | 'unlisted'
    publishAt?: string
  }
  contentDetails?: { duration?: string }
}

export interface ApiErrorBody {
  error?: { code?: number; message?: string; errors?: { reason?: string; message?: string }[] }
}
