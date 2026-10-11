import { describe, expect, it } from 'vitest'
import { describeAuthFailure } from '@/services/auth'

const ID = 'abcdefghijklmnopabcdefghijklmnop'

describe('describeAuthFailure', () => {
  it('explains "bad client id" and names the extension ID to register', () => {
    const raw =
      "OAuth2 request failed: Service responded with error: 'bad client id: 123-abc.apps.googleusercontent.com'"
    const message = describeAuthFailure(raw, ID)
    expect(message).toContain('Chrome Extension')
    expect(message).toContain(ID)
    expect(message).not.toContain('Service responded')
  })

  it('treats a dismissed consent screen as a cancel, not an error', () => {
    expect(describeAuthFailure('The user did not approve access.', ID)).toMatch(/cancelled/)
  })

  it('passes anything else through', () => {
    expect(describeAuthFailure('Network down', ID)).toBe("Couldn't sign in to Google: Network down")
  })
})
