import { createPlannedRepo, createSettingsRepo, createVideoCacheRepo } from './repos'
import { localArea } from './storage'

/** App-wide repositories backed by chrome.storage.local. Created lazily so tests never touch `chrome`. */
let repos: ReturnType<typeof build> | undefined

function build() {
  const area = localArea()
  return {
    planned: createPlannedRepo(area),
    videoCache: createVideoCacheRepo(area),
    settings: createSettingsRepo(area),
  }
}

export function getRepos() {
  repos ??= build()
  return repos
}

export { KEYS } from './storage'
export type { Settings, VideoCache } from './repos'
