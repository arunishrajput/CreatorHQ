import { getRepos, KEYS } from '@/services/storage'
import { parseSettings } from '@/services/storage/repos'
import { usePlanned } from './planned'
import { useUi } from './ui'
import { useVideos } from './videos'

/**
 * Load everything a page needs from storage, then keep it live: any write from another
 * page (calendar tab ↔ side panel) arrives via chrome.storage.onChanged and re-hydrates
 * the affected store. Returns an unsubscribe function.
 */
export async function bootstrap(): Promise<() => void> {
  const settings = await getRepos().settings.get()
  useUi.getState().applySettings(settings)
  await Promise.all([usePlanned.getState().hydrate(), useVideos.getState().hydrate()])

  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return
    const keys = Object.keys(changes)
    if (keys.some((k) => k.startsWith(KEYS.plannedPrefix))) void usePlanned.getState().hydrate()
    if (keys.includes(KEYS.videoCache) || keys.includes(KEYS.settings)) void useVideos.getState().hydrate()
    if (keys.includes(KEYS.settings)) useUi.getState().applySettings(parseSettings(changes[KEYS.settings]?.newValue))
  }
  chrome.storage.onChanged.addListener(onChanged)
  return () => chrome.storage.onChanged.removeListener(onChanged)
}
