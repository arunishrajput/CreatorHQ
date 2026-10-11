import { openCalendarTab, openSidePanel } from '@/lib/navigation'

const MENU_OPEN_SIDE_PANEL = 'open-side-panel'
const MENU_OPEN_CALENDAR = 'open-calendar'

chrome.runtime.onInstalled.addListener(() => {
  // Icon click opens the calendar tab; the side panel is reached from the icon's right-click menu.
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false })
  chrome.contextMenus.create({ id: MENU_OPEN_CALENDAR, title: 'Open calendar', contexts: ['action'] })
  chrome.contextMenus.create({ id: MENU_OPEN_SIDE_PANEL, title: 'Open agenda in side panel', contexts: ['action'] })
})

chrome.action.onClicked.addListener(() => {
  void openCalendarTab()
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_OPEN_CALENDAR) void openCalendarTab()
  // sidePanel.open must run synchronously inside the user gesture — no awaits before it.
  if (info.menuItemId === MENU_OPEN_SIDE_PANEL && tab) void openSidePanel(tab.windowId)
})
