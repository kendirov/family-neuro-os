export type PilotId = 'roma' | 'kirill'
export type PilotAccent = 'cyan' | 'purple'

export type FuelStateKind = 'empty_low' | 'normal' | 'premium_fuel' | 'overheat'

export interface ProfileSummary {
  pilotId: PilotId
  name: string
  accent: PilotAccent
  level: number
  xpTotal: number
  xpTodayNet: number
  xpTodayDisplayed: number
  coins: number
  levelProgressPct: number
  nextLevelXp: number
}

export interface FuelStateModel {
  kind: FuelStateKind
  value: number
  max: number
  label: string
  description: string
  xpDayMultiplier: number
}

export type MissionTimeBlock = 'morning' | 'afternoon' | 'evening' | 'anytime'
export type MissionCategory = 'routine' | 'food' | 'school' | 'bonus'

export type MissionCardStatus = 'available' | 'completed' | 'future_locked'

export interface DailyMissionCard {
  id: string
  label: string
  emoji: string
  timeBlock: MissionTimeBlock
  category: MissionCategory
  rewardXp: number
  status: MissionCardStatus
}

export interface DailyMissionsModel {
  dayLabel: string
  available: DailyMissionCard[]
  completed: DailyMissionCard[]
}

export interface TimerSummary {
  sessionId: string | null
  status: 'idle' | 'active' | 'paused'
  totalElapsedSeconds: number
  safeTimeRemainingSeconds: number
  multiplier: 1 | 2 | 3
  coinsBurned: number
  isBurning: boolean
}

export interface RaidTeaserModel {
  bossName: string
  progress: number
  target: number
  hpPercent: number
  isWin: boolean
  overflow: number
}

export interface InventoryItemPreview {
  itemId: string
  name: string
  emoji: string
  cost: number
  at: number
}

export interface InventoryPreviewModel {
  capacity: number
  items: InventoryItemPreview[]
}

export type RewardToastVariant = 'success' | 'danger' | 'warning' | 'cyan' | 'purple'

export interface RewardToastEvent {
  id: string
  variant: RewardToastVariant
  title: string
  message?: string
}

export interface PilotHomeUiModel {
  profile: ProfileSummary
  fuel: FuelStateModel
  dailyMissions: DailyMissionsModel
  timer: TimerSummary
  raidTeaser: RaidTeaserModel
  inventory: InventoryPreviewModel
}

// Turbo-Garage Pilot Home UI model types (Stage 2A).

