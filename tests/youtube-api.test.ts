import { describe, expect, it, vi } from 'vitest'
import type { TokenProvider } from '@/services/auth'
import { fetchChannelVideos, listUploadIds } from '@/services/youtube/api'
import { createYouTubeClient, YouTubeError } from '@/services/youtube/client'
import { channelResponse, playlistPage, video } from './fixtures/youtube'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function fakeAuth(tokens = ['t1', 't2', 't3']): TokenProvider & { invalidated: string[] } {
  const queue = [...tokens]
  const invalidated: string[] = []
  return {
    invalidated,
    getToken: vi.fn(async () => queue[0]!),
    invalidate: vi.fn(async (token: string) => {
      invalidated.push(token)
      queue.shift()
    }),
  }
}

/** Route requests by resource name, like a tiny fake YouTube. */
function fakeYouTube(routes: Record<string, (url: URL) => Response>) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const resource = url.pathname.split('/').pop()!
    const route = routes[resource]
    if (!route) throw new Error(`unexpected request ${url}`)
    return route(url)
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>
}

describe('fetchChannelVideos', () => {
  it('walks channel → uploads (paginated) → video details', async () => {
    const fetch = fakeYouTube({
      channels: () => json(channelResponse),
      playlistItems: (url) =>
        url.searchParams.get('pageToken') === 'p2' ? json(playlistPage(['c'])) : json(playlistPage(['a', 'b'], 'p2')),
      videos: (url) => json({ items: url.searchParams.get('id')!.split(',').map((id) => video(id)) }),
    })
    const client = createYouTubeClient({ auth: fakeAuth(), interactive: false, fetch })

    const { channel, videos } = await fetchChannelVideos(client)

    expect(channel.uploadsPlaylistId).toBe('UU_test_channel')
    expect(videos.map((v) => v.id)).toEqual(['a', 'b', 'c'])
    const videosCall = fetch.mock.calls.map(([u]) => new URL(String(u))).find((u) => u.pathname.endsWith('/videos'))!
    expect(videosCall.searchParams.get('part')).toBe('snippet,status,contentDetails')
  })

  it('reports an account with no channel', async () => {
    const client = createYouTubeClient({
      auth: fakeAuth(),
      interactive: false,
      fetch: fakeYouTube({ channels: () => json({ items: [] }) }),
    })
    await expect(fetchChannelVideos(client)).rejects.toMatchObject({ code: 'no_channel' })
  })
})

describe('listUploadIds', () => {
  it('stops at the limit', async () => {
    let page = 0
    const client = createYouTubeClient({
      auth: fakeAuth(),
      interactive: false,
      fetch: fakeYouTube({
        playlistItems: () => {
          page++
          return json(playlistPage([`${page}a`, `${page}b`], 'more'))
        },
      }),
    })
    expect(await listUploadIds(client, 'UU', 3)).toEqual(['1a', '1b', '2a'])
    expect(page).toBe(2)
  })
})

describe('client errors', () => {
  it('retries once with a fresh token after a 401', async () => {
    const auth = fakeAuth()
    const seen: string[] = []
    const fetch = vi.fn(async (_: RequestInfo | URL, init?: RequestInit) => {
      const header = new Headers(init?.headers).get('Authorization')!
      seen.push(header)
      return header === 'Bearer t1' ? json({}, 401) : json({ items: [] })
    }) as unknown as typeof globalThis.fetch
    const client = createYouTubeClient({ auth, interactive: false, fetch })

    await client.get('channels', {})
    expect(seen).toEqual(['Bearer t1', 'Bearer t2'])
    expect(auth.invalidated).toEqual(['t1'])
  })

  it('maps quota errors', async () => {
    const client = createYouTubeClient({
      auth: fakeAuth(),
      interactive: false,
      fetch: fakeYouTube({
        channels: () => json({ error: { code: 403, message: 'quota', errors: [{ reason: 'quotaExceeded' }] } }, 403),
      }),
    })
    await expect(client.get('channels', {})).rejects.toMatchObject({ code: 'quota' })
  })

  it('maps network failures and sign-in failures', async () => {
    const offline = createYouTubeClient({
      auth: fakeAuth(),
      interactive: false,
      fetch: (async () => {
        throw new TypeError('Failed to fetch')
      }) as typeof fetch,
    })
    await expect(offline.get('channels', {})).rejects.toMatchObject({ code: 'network' })

    const signedOut = createYouTubeClient({
      auth: { getToken: async () => Promise.reject(new Error('not signed in')), invalidate: async () => {} },
      interactive: false,
      fetch: fakeYouTube({}),
    })
    await expect(signedOut.get('channels', {})).rejects.toBeInstanceOf(YouTubeError)
  })
})
