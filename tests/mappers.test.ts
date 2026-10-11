import { describe, expect, it } from 'vitest'
import { deriveStatus, mapChannel, mapVideo } from '@/services/youtube/mappers'
import { channelResponse, video } from './fixtures/youtube'

const NOW = new Date('2026-10-11T12:00:00Z')

describe('mapChannel', () => {
  it('maps the uploads playlist and thumbnail', () => {
    expect(mapChannel(channelResponse.items![0]!)).toEqual({
      id: 'UC_test_channel',
      title: 'Test Channel',
      thumbnailUrl: 'https://yt3.ggpht.com/medium.jpg',
      uploadsPlaylistId: 'UU_test_channel',
    })
  })

  it('rejects a channel without an uploads playlist', () => {
    expect(mapChannel({ id: 'x' })).toBeNull()
  })
})

describe('deriveStatus', () => {
  it.each([
    [{ uploadStatus: 'processed', privacyStatus: 'public' }, 'public'],
    [{ uploadStatus: 'processed', privacyStatus: 'unlisted' }, 'unlisted'],
    [{ uploadStatus: 'processed', privacyStatus: 'private' }, 'private'],
    [{ uploadStatus: 'processed', privacyStatus: 'private', publishAt: '2026-10-20T15:00:00Z' }, 'scheduled'],
    // publishAt in the past but still private: YouTube hasn't flipped it yet — not "scheduled".
    [{ uploadStatus: 'processed', privacyStatus: 'private', publishAt: '2026-10-01T15:00:00Z' }, 'private'],
    [{ uploadStatus: 'uploaded', privacyStatus: 'public' }, 'processing'],
    [{ uploadStatus: 'rejected', privacyStatus: 'public' }, 'failed'],
    [{ uploadStatus: 'failed', privacyStatus: 'private' }, 'failed'],
  ] as const)('%o → %s', (status, expected) => {
    expect(deriveStatus(status, NOW)).toBe(expected)
  })
})

describe('mapVideo', () => {
  it('maps a public video', () => {
    expect(mapVideo(video('abc'), NOW)).toEqual({
      kind: 'published',
      id: 'abc',
      title: 'Video abc',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc/mqdefault.jpg',
      url: 'https://www.youtube.com/watch?v=abc',
      studioUrl: 'https://studio.youtube.com/video/abc/edit',
      date: '2026-10-01T15:30:00Z',
      status: 'public',
      duration: 'PT8M12S',
    })
  })

  it('places a scheduled video on its publishAt date, not its upload date', () => {
    const v = mapVideo(
      video('sch', { status: { uploadStatus: 'processed', privacyStatus: 'private', publishAt: '2026-10-20T15:00:00Z' } }),
      NOW,
    )
    expect(v?.status).toBe('scheduled')
    expect(v?.date).toBe('2026-10-20T15:00:00Z')
  })

  it('drops items without an id or date, and tolerates missing thumbnails', () => {
    expect(mapVideo({ snippet: { publishedAt: '2026-10-01T00:00:00Z' } }, NOW)).toBeNull()
    expect(mapVideo({ id: 'x' }, NOW)).toBeNull()
    expect(mapVideo({ id: 'x', snippet: { publishedAt: '2026-10-01T00:00:00Z' } }, NOW)?.thumbnailUrl).toBeNull()
  })
})
