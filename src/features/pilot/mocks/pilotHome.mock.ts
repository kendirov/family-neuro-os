import type { PilotHomeUiModel, PilotId, FuelStateModel, DailyMissionsModel, TimerSummary, RaidTeaserModel, InventoryPreviewModel, ProfileSummary } from '../lib/pilot-ui-model'
import type { FuelStateKind } from '../lib/pilot-ui-model'

const XP_PER_LEVEL = 500

function levelFromXp(xpTotal: number) {
  const level = Math.floor(xpTotal / XP_PER_LEVEL) + 1
  const levelStart = (level - 1) * XP_PER_LEVEL
  const levelProgressPct = Math.min(100, Math.max(0, ((xpTotal - levelStart) / XP_PER_LEVEL) * 100))
  const nextLevelXp = level * XP_PER_LEVEL
  return { level, levelProgressPct, nextLevelXp }
}

function makeProfile({
  pilotId,
  name,
  accent,
  xpTotal,
  xpTodayNet,
  coins,
  fuelMultiplier,
}: {
  pilotId: PilotId
  name: string
  accent: 'cyan' | 'purple'
  xpTotal: number
  xpTodayNet: number
  coins: number
  fuelMultiplier: number
}): ProfileSummary {
  const { level, levelProgressPct, nextLevelXp } = levelFromXp(xpTotal)
  const xpTodayDisplayed = Math.max(0, Math.round(xpTodayNet * fuelMultiplier))

  return {
    pilotId,
    name,
    accent,
    level,
    xpTotal,
    xpTodayNet,
    xpTodayDisplayed,
    coins,
    levelProgressPct,
    nextLevelXp,
  }
}

function makeFuel(kind: FuelStateKind): FuelStateModel {
  if (kind === 'empty_low') {
    return {
      kind,
      value: 22,
      max: 1000,
      label: 'EMPTY / LOW',
      description: 'Почти пусто — меньше бонуса дня.',
      xpDayMultiplier: 0.85,
    }
  }
  if (kind === 'normal') {
    return {
      kind,
      value: 260,
      max: 1000,
      label: 'NORMAL FUEL',
      description: 'Ровный прирост XP дня.',
      xpDayMultiplier: 1.0,
    }
  }
  if (kind === 'premium_fuel') {
    return {
      kind,
      value: 720,
      max: 1000,
      label: 'PREMIUM FUEL',
      description: 'Полный заряд. XP дня ускоряется.',
      xpDayMultiplier: 1.25,
    }
  }
  return {
    kind: 'overheat',
    value: 45,
    max: 1000,
    label: 'OVERHEAT',
    description: 'Сладкий перегрев — бонус дня снижен.',
    xpDayMultiplier: 0.7,
  }
}

function makeDailyMissions({
  dayLabel,
  availableIds,
  completedIds,
}: {
  dayLabel: string
  availableIds: string[]
  completedIds: string[]
}): DailyMissionsModel {
  const all = [
    { id: 'breakfast', label: 'Завтрак', emoji: '🍳', timeBlock: 'morning', category: 'food', rewardXp: 15 },
    { id: 'lunch', label: 'Обед', emoji: '🍔', timeBlock: 'afternoon', category: 'food', rewardXp: 15 },
    { id: 'snack', label: 'Полдник', emoji: '🍪', timeBlock: 'anytime', category: 'food', rewardXp: 8 },
    { id: 'dinner', label: 'Ужин', emoji: '🍲', timeBlock: 'evening', category: 'food', rewardXp: 15 },
    { id: 'school_leave', label: 'Ушел вовремя', emoji: '🎒', timeBlock: 'afternoon', category: 'school', rewardXp: 20 },
    { id: 'wake_on_time', label: 'Проснулся вовремя', emoji: '⏰', timeBlock: 'morning', category: 'routine', rewardXp: 5 },
  ]

  const available = all
    .filter((t) => availableIds.includes(t.id))
    .map((t) => ({ ...t, status: 'available' as const }))

  const completed = all
    .filter((t) => completedIds.includes(t.id))
    .map((t) => ({ ...t, status: 'completed' as const }))

  return { dayLabel, available, completed }
}

function makeTimer(summary: 'active_safe' | 'idle' | 'active_burning'): TimerSummary {
  if (summary === 'idle') {
    return {
      sessionId: null,
      status: 'idle',
      totalElapsedSeconds: 0,
      safeTimeRemainingSeconds: 0,
      multiplier: 1,
      coinsBurned: 0,
      isBurning: false,
    }
  }

  if (summary === 'active_burning') {
    return {
      sessionId: 'mock_session_burn',
      status: 'active',
      totalElapsedSeconds: 3600,
      safeTimeRemainingSeconds: 0,
      multiplier: 2,
      coinsBurned: 88.5,
      isBurning: true,
    }
  }

  return {
    sessionId: 'mock_session_safe',
    status: 'active',
    totalElapsedSeconds: 1900,
    safeTimeRemainingSeconds: 900,
    multiplier: 1,
    coinsBurned: 0,
    isBurning: false,
  }
}

function makeRaid(progress: number): RaidTeaserModel {
  const target = 1500
  const currentHP = Math.max(0, target - progress)
  const hpPercent = Math.min(100, Math.max(0, (currentHP / target) * 100))
  const isWin = progress >= target
  const overflow = Math.max(0, progress - target)
  return {
    bossName: '🍣 БОСС ДНЯ',
    progress,
    target,
    hpPercent,
    isWin,
    overflow,
  }
}

function makeInventory(items: Array<{ itemId: string; name: string; emoji: string; cost: number; at: number }>): InventoryPreviewModel {
  return { capacity: 12, items }
}

const now = Date.now()

const romaFuel = makeFuel('premium_fuel')
const kirillFuel = makeFuel('normal')

export const PILOT_HOME_MOCKS: Record<PilotId, PilotHomeUiModel> = {
  roma: {
    profile: makeProfile({
      pilotId: 'roma',
      name: 'Рома',
      accent: 'cyan',
      xpTotal: 2100,
      xpTodayNet: 140,
      coins: 2100,
      fuelMultiplier: romaFuel.xpDayMultiplier,
    }),
    fuel: romaFuel,
    dailyMissions: makeDailyMissions({
      dayLabel: 'Контракты дня',
      availableIds: ['lunch', 'wake_on_time', 'dinner'],
      completedIds: ['breakfast'],
    }),
    timer: makeTimer('active_safe'),
    raidTeaser: makeRaid(640),
    inventory: makeInventory([
      { itemId: 'sweet_treat', name: 'Конфета', emoji: '🍬', cost: 50, at: now - 1000 * 60 * 30 },
      { itemId: 'small_toy', name: 'Игрушка/Лего', emoji: '🧸', cost: 500, at: now - 1000 * 60 * 60 * 2 },
    ]),
  },
  kirill: {
    profile: makeProfile({
      pilotId: 'kirill',
      name: 'Кирилл',
      accent: 'purple',
      xpTotal: 980,
      xpTodayNet: 95,
      coins: 980,
      fuelMultiplier: kirillFuel.xpDayMultiplier,
    }),
    fuel: kirillFuel,
    dailyMissions: makeDailyMissions({
      dayLabel: 'Контракты дня',
      availableIds: ['snack', 'school_leave', 'lunch'],
      completedIds: ['wake_on_time'],
    }),
    timer: makeTimer('idle'),
    raidTeaser: makeRaid(240),
    inventory: makeInventory([
      { itemId: 'cartoons_30', name: '30 мин мультиков', emoji: '📺', cost: 30, at: now - 1000 * 60 * 60 },
    ]),
  },
}

// Turbo-Garage mock UI for Pilot Home (Stage 2A).

