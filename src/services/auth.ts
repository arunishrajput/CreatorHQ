/**
 * Google sign-in via chrome.identity. Chrome owns the token: it caches it, refreshes it,
 * and ties it to the browser profile's Google account. We only ask for youtube.readonly.
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export interface TokenProvider {
  getToken(interactive: boolean): Promise<string>
  invalidate(token: string): Promise<void>
}

export const chromeTokenProvider: TokenProvider = {
  async getToken(interactive) {
    try {
      const { token } = await chrome.identity.getAuthToken({ interactive })
      if (!token) throw new AuthError('Google did not return a token.')
      return token
    } catch (error) {
      if (error instanceof AuthError) throw error
      // chrome.identity rejects with a plain Error, e.g. "The user did not approve access."
      throw new AuthError(error instanceof Error ? error.message : String(error))
    }
  },
  async invalidate(token) {
    await chrome.identity.removeCachedAuthToken({ token })
  },
}

/**
 * Disconnect: revoke the grant at Google (so the next connect shows the consent screen
 * and can pick another account), then drop every cached token. Best effort — a failed
 * revoke must not leave the UI stuck in a connected state.
 */
export async function signOut(): Promise<void> {
  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: false })
    if (token) {
      await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${encodeURIComponent(token)}`, {
        mode: 'no-cors',
      }).catch(() => undefined)
    }
  } catch {
    // No token to revoke.
  }
  await chrome.identity.clearAllCachedAuthTokens()
}
