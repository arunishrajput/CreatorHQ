import type { Channel, PublishedVideo } from '@/core/types'
import { YouTubeError, type YouTubeClient } from './client'
import { mapChannel, mapVideo } from './mappers'
import type { ApiChannel, ApiListResponse, ApiPlaylistItem, ApiVideo } from './types'

/** The API's page-size ceiling for both playlistItems and videos. */
const PAGE_SIZE = 50

/**
 * Upper bound on uploads fetched per sync. Each page of 50 costs 1 quota unit for the
 * IDs and 1 for the details, so 1,000 videos ≈ 40 units of the 10,000/day default.
 */
export const MAX_UPLOADS = 1000

export async function getMyChannel(client: YouTubeClient): Promise<Channel> {
  const res = await client.get<ApiListResponse<ApiChannel>>('channels', {
    part: 'snippet,contentDetails',
    mine: 'true',
  })
  const channel = res.items?.[0] && mapChannel(res.items[0])
  if (!channel) {
    throw new YouTubeError('no_channel', 'This Google account has no YouTube channel. Pick the account that owns it.')
  }
  return channel
}

/** Video IDs in the channel's uploads playlist, newest first. Includes private and scheduled videos for the owner. */
export async function listUploadIds(
  client: YouTubeClient,
  playlistId: string,
  limit: number = MAX_UPLOADS,
): Promise<string[]> {
  const ids: string[] = []
  let pageToken: string | undefined

  do {
    const res = await client.get<ApiListResponse<ApiPlaylistItem>>('playlistItems', {
      part: 'contentDetails',
      playlistId,
      maxResults: String(PAGE_SIZE),
      ...(pageToken ? { pageToken } : {}),
    })
    for (const item of res.items ?? []) {
      const id = item.contentDetails?.videoId
      if (id) ids.push(id)
    }
    pageToken = res.nextPageToken
  } while (pageToken && ids.length < limit)

  return ids.slice(0, limit)
}

/** Full details (title, thumbnail, status, schedule) for a list of IDs, in batches of 50. */
export async function getVideos(client: YouTubeClient, ids: string[], now: Date = new Date()): Promise<PublishedVideo[]> {
  const videos: PublishedVideo[] = []
  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const res = await client.get<ApiListResponse<ApiVideo>>('videos', {
      part: 'snippet,status,contentDetails',
      id: ids.slice(i, i + PAGE_SIZE).join(','),
      maxResults: String(PAGE_SIZE),
    })
    for (const item of res.items ?? []) {
      const video = mapVideo(item, now)
      if (video) videos.push(video)
    }
  }
  return videos
}

export async function fetchChannelVideos(client: YouTubeClient) {
  const channel = await getMyChannel(client)
  const ids = await listUploadIds(client, channel.uploadsPlaylistId)
  const videos = await getVideos(client, ids)
  return { channel, videos }
}
