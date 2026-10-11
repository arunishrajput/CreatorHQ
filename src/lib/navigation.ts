export const CALENDAR_PATH = 'src/pages/app/index.html'

/** Focus the calendar tab if one is open, otherwise open one. */
export async function openCalendarTab(): Promise<void> {
  const url = chrome.runtime.getURL(CALENDAR_PATH)
  // getContexts needs no "tabs" permission, unlike tabs.query({ url }).
  const [existing] = await chrome.runtime.getContexts({ contextTypes: ['TAB'], documentUrls: [url] })
  if (existing && existing.tabId >= 0) {
    await chrome.tabs.update(existing.tabId, { active: true })
    await chrome.windows.update(existing.windowId, { focused: true })
    return
  }
  await chrome.tabs.create({ url })
}

/**
 * chrome.sidePanel.open only works inside a user gesture, and awaiting anything first
 * (even windows.getCurrent) loses the gesture. So pages look up their window once at
 * startup and open the panel synchronously on click.
 */
let currentWindowId: number | undefined

export async function primeWindowId(): Promise<void> {
  currentWindowId = (await chrome.windows.getCurrent()).id
}

export function openSidePanel(windowId: number | undefined = currentWindowId): Promise<void> {
  if (windowId === undefined) return Promise.resolve()
  return chrome.sidePanel.open({ windowId })
}
