/**
 * The slice of chrome.storage.StorageArea we use. Typing against this instead of
 * `chrome.storage.local` directly lets tests pass an in-memory fake.
 */
export interface KeyValueArea {
  get(keys: string | string[] | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
  remove(keys: string | string[]): Promise<void>
}

/** Storage keys. Planned videos get one key each, so two open pages never overwrite each other's edits. */
export const KEYS = {
  schemaVersion: 'schemaVersion',
  settings: 'settings',
  videoCache: 'youtube/cache',
  plannedPrefix: 'planned/',
} as const

export const SCHEMA_VERSION = 1

export const plannedKey = (id: string) => `${KEYS.plannedPrefix}${id}`

export function localArea(): KeyValueArea {
  return chrome.storage.local
}
