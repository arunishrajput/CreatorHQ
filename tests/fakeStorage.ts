import type { KeyValueArea } from '@/services/storage/storage'

/** In-memory stand-in for chrome.storage.local, with the same structured-clone semantics. */
export function createFakeArea(initial: Record<string, unknown> = {}): KeyValueArea & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(structuredClone(initial)))
  return {
    data,
    async get(keys) {
      const wanted = keys === null ? [...data.keys()] : Array.isArray(keys) ? keys : [keys]
      const out: Record<string, unknown> = {}
      for (const key of wanted) if (data.has(key)) out[key] = structuredClone(data.get(key))
      return out
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) data.set(key, structuredClone(value))
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) data.delete(key)
    },
  }
}
