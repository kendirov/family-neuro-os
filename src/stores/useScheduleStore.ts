/**
 * Store расписания — единый источник истины.
 * Загружает из localStorage, сохраняет при изменениях.
 */
import { create } from 'zustand'
import type { WeeklySchedule } from '@/types/schedule'
import { loadSchedule, saveSchedule, toLegacyFormat } from '@/lib/scheduleUtils'

interface ScheduleState {
  schedule: WeeklySchedule
  /** Обновить расписание (вызывается из AdminScheduleEditor) */
  setSchedule: (schedule: WeeklySchedule | ((prev: WeeklySchedule) => WeeklySchedule)) => void
  /** Перезагрузить из localStorage */
  reload: () => void
  /** Legacy-формат для потребителей (SmartSchedule, WallSchedule, SchoolSchedule) */
  getLegacySchedule: () => Record<string, { roma: { start: string; end: string; name: string }[]; kirill: { start: string; end: string; name: string }[] }>
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  schedule: loadSchedule(),

  setSchedule: (updater) => {
    set((state) => {
      const next = typeof updater === 'function' ? updater(state.schedule) : updater
      saveSchedule(next)
      return { schedule: next }
    })
  },

  reload: () => set({ schedule: loadSchedule() }),

  getLegacySchedule: () => toLegacyFormat(get().schedule),
}))
