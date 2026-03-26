export type WellnessMetricId = 'water' | 'steps' | 'vitamins' | 'sleep' | 'mood' | 'energy'

export type WellnessHistoryKind =
  | 'water'
  | 'steps'
  | 'vitamin'
  | 'sleep'
  | 'day_closed'
  | 'streak'
  | 'family_bonus'

export interface WellnessGoalModel {
  waterMlTarget: number
  stepsTarget: number
  idealDayRequires: {
    water: boolean
    steps: boolean
    vitamins: boolean
    sleep: boolean
    mood?: boolean
    energy?: boolean
  }
  idealStreakTargetDays: number
}

export interface HydrationModel {
  todayMl: number
  targetMl: number
  lastLogAt?: number
}

export interface StepsModel {
  todaySteps: number
  targetSteps: number
  lastLogAt?: number
}

export interface VitaminsModel {
  takenToday: boolean
  lastLogAt?: number
}

export interface SleepModel {
  lastNightHours: number
  quality: 'poor' | 'ok' | 'good'
  lastLogAt?: number
}

export interface OptionalWellnessSignalsModel {
  mood?: 1 | 2 | 3 | 4 | 5
  energy?: 1 | 2 | 3 | 4 | 5
}

export interface TodayChecklistModel {
  waterOk: boolean
  stepsOk: boolean
  vitaminsOk: boolean
  sleepOk: boolean
  idealDay: boolean
}

export interface FamilyBonusPreviewModel {
  /** UI-only preview. Not a business source of truth. */
  status: 'locked' | 'arming' | 'active' | 'cooldown'
  label: string
  /** 0..1 */
  progress: number
  /** Example: "Weekend XP Multiplier x1.25" */
  previewText: string
  /** Optional next window label: "Sat–Sun" */
  windowLabel?: string
}

export interface StreakModel {
  currentDays: number
  targetDays: number
  remainingToTarget: number
  familyBonus: FamilyBonusPreviewModel
}

export interface WeeklyDayWellnessModel {
  dateKey: string // YYYY-MM-DD
  label: string // short e.g. Mon
  idealDay: boolean
  waterOk: boolean
  stepsOk: boolean
  vitaminsOk: boolean
  sleepOk: boolean
}

export interface WeeklyWellnessModel {
  days: WeeklyDayWellnessModel[]
  adherencePct: number // 0..100
}

export interface WellnessHistoryItemModel {
  id: string
  at: number
  kind: WellnessHistoryKind
  title: string
  detail?: string
  deltaLabel?: string
}

export interface AdultWellnessUiModel {
  goals: WellnessGoalModel
  hydration: HydrationModel
  steps: StepsModel
  vitamins: VitaminsModel
  sleep: SleepModel
  signals: OptionalWellnessSignalsModel
  checklist: TodayChecklistModel
  streak: StreakModel
  weekly: WeeklyWellnessModel
  historyPreview: WellnessHistoryItemModel[]
}

export interface WellnessActionHandlers {
  logWater: (payload: { amountMl: number }) => Promise<void>
  logSteps: (payload: { steps: number }) => Promise<void>
  markVitaminTaken: () => Promise<void>
  logSleep: (payload: { hours: number; quality: SleepModel['quality'] }) => Promise<void>
  closeWellnessDay: () => Promise<void>
  fetchWellnessSummary: () => Promise<void>
  fetchWeeklyWellness: () => Promise<void>
}

