import { AuthError, type TokenProvider } from '../auth'
import type { ApiErrorBody } from './types'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export type YouTubeErrorCode = 'auth' | 'quota' | 'forbidden' | 'no_channel' | 'network' | 'unknown'

export class YouTubeError extends Error {
  constructor(
    readonly code: YouTubeErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'YouTubeError'
  }
}

export interface YouTubeClient {
  get<T>(resource: string, params: Record<string, string>): Promise<T>
}

interface ClientOptions {
  auth: TokenProvider
  /** Ask the user to sign in if needed. Background refreshes pass false. */
  interactive: boolean
  fetch?: typeof fetch
}

/**
 * Thin authenticated GET wrapper. A 401 means Chrome handed us a stale token: drop it
 * and retry exactly once with a fresh one. Everything else becomes a typed YouTubeError
 * so the UI can say something specific ("quota exhausted", not "something went wrong").
 */
export function createYouTubeClient({ auth, interactive, fetch: fetchImpl = fetch }: ClientOptions): YouTubeClient {
  async function token(): Promise<string> {
    try {
      return await auth.getToken(interactive)
    } catch (error) {
      throw new YouTubeError('auth', error instanceof AuthError ? error.message : 'Sign-in failed.')
    }
  }

  async function send(url: string, accessToken: string): Promise<Response> {
    try {
      return await fetchImpl(url, { headers: { Authorization: `Bearer ${accessToken}` } })
    } catch {
      throw new YouTubeError('network', 'Could not reach YouTube. Check your connection.')
    }
  }

  return {
    async get<T>(resource: string, params: Record<string, string>): Promise<T> {
      const url = `${BASE_URL}/${resource}?${new URLSearchParams(params)}`
      let accessToken = await token()
      let response = await send(url, accessToken)

      if (response.status === 401) {
        await auth.invalidate(accessToken)
        accessToken = await token()
        response = await send(url, accessToken)
      }

      if (response.ok) return (await response.json()) as T
      throw await toError(response)
    },
  }
}

async function toError(response: Response): Promise<YouTubeError> {
  const body = (await response.json().catch(() => ({}))) as ApiErrorBody
  const reason = body.error?.errors?.[0]?.reason
  const message = body.error?.message ?? `YouTube returned HTTP ${response.status}.`

  if (response.status === 401) return new YouTubeError('auth', 'Your Google session expired. Reconnect to continue.')
  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded' || reason === 'rateLimitExceeded') {
    return new YouTubeError('quota', 'YouTube API quota is used up for today. Cached videos are still shown.')
  }
  if (response.status === 403) return new YouTubeError('forbidden', message)
  return new YouTubeError('unknown', message)
}
