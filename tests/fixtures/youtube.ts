import type { ApiChannel, ApiListResponse, ApiPlaylistItem, ApiVideo } from '@/services/youtube/types'

// Shapes follow the YouTube Data API v3 reference; IDs and titles are made up for tests.

export const channelResponse: ApiListResponse<ApiChannel> = {
  items: [
    {
      id: 'UC_test_channel',
      snippet: {
        title: 'Test Channel',
        thumbnails: {
          default: { url: 'https://yt3.ggpht.com/default.jpg', width: 88, height: 88 },
          medium: { url: 'https://yt3.ggpht.com/medium.jpg', width: 240, height: 240 },
        },
      },
      contentDetails: { relatedPlaylists: { uploads: 'UU_test_channel' } },
    },
  ],
}

export function video(id: string, overrides: Partial<ApiVideo> = {}): ApiVideo {
  return {
    id,
    snippet: {
      title: `Video ${id}`,
      publishedAt: '2026-10-01T15:30:00Z',
      thumbnails: {
        default: { url: `https://i.ytimg.com/vi/${id}/default.jpg` },
        medium: { url: `https://i.ytimg.com/vi/${id}/mqdefault.jpg` },
      },
    },
    status: { uploadStatus: 'processed', privacyStatus: 'public' },
    contentDetails: { duration: 'PT8M12S' },
    ...overrides,
  }
}

export function playlistPage(ids: string[], nextPageToken?: string): ApiListResponse<ApiPlaylistItem> {
  return { items: ids.map((videoId) => ({ contentDetails: { videoId } })), ...(nextPageToken ? { nextPageToken } : {}) }
}
