import { startOfDay } from 'date-fns'
import { create } from 'zustand'
import { shiftAnchor } from '@/core/dates'
import type { CalendarView, DayKey, WeekStart } from '@/core/types'
import { getRepos, type Settings } from '@/services/storage'

export type Editor = { mode: 'create'; date: DayKey } | { mode: 'edit'; id: string } | null

interface UiState {
  view: CalendarView
  weekStartsOn: WeekStart
  /** Any date inside the visible month/week. */
  anchor: Date
  editor: Editor
  /** Published video whose details are open. */
  selectedVideoId: string | null

  applySettings(settings: Settings): void
  setView(view: CalendarView): void
  setWeekStart(weekStartsOn: WeekStart): void
  step(direction: 1 | -1): void
  goToday(): void
  openEditor(editor: Editor): void
  selectVideo(id: string | null): void
}

export const useUi = create<UiState>()((set, get) => ({
  view: 'month',
  weekStartsOn: 1,
  anchor: startOfDay(new Date()),
  editor: null,
  selectedVideoId: null,

  applySettings({ view, weekStartsOn }) {
    set({ view, weekStartsOn })
  },
  setView(view) {
    set({ view })
    void getRepos().settings.update({ view })
  },
  setWeekStart(weekStartsOn) {
    set({ weekStartsOn })
    void getRepos().settings.update({ weekStartsOn })
  },
  step(direction) {
    set({ anchor: shiftAnchor(get().view, get().anchor, direction) })
  },
  goToday() {
    set({ anchor: startOfDay(new Date()) })
  },
  openEditor(editor) {
    set({ editor, selectedVideoId: null })
  },
  selectVideo(id) {
    set({ selectedVideoId: id, editor: null })
  },
}))
