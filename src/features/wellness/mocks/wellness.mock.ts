import type { AdultWellnessUiModel, WeeklyDayWellnessModel, WellnessHistoryItemModel } from '../lib/wellness-ui-model'
import { computeFamilyBonusPreview, computeTodayChecklist, computeWeeklyAdherence } from '../lib/wellness-selectors'

function dateKeyFromOffset(daysOffset: number) {
  const d = new Date()
  d.setDate(d.getDate() + daysOffset)
  return d.toISOString().slice(0, 10)
}

function weekdayLabel(dateKey: string) {
  const d = new Date(`${dateKey}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'short' })
}

function mkHistory(): WellnessHistoryItemModel[] {
  const now = Date.now()
  return [
    {
      id: 'h-1',
      at: now - 30 * 60 * 1000,
      kind: 'water',
      title: 'Hydration',
      detail: 'Logged water',
      deltaLabel: '+250 ml',
    },
    {
      id: 'h-2',
      at: now - 3 * 60 * 60 * 1000,
      kind: 'vitamin',
      title: 'Vitamins',
      detail: 'Marked as taken',
    },
    {
      id: 'h-3',
      at: now - 20 * 60 * 60 * 1000,
      kind: 'sleep',
      title: 'Sleep',
      detail: 'Last night',
      deltaLabel: '7h 25m · good',
    },
  ]
}

function mkWeek(): WeeklyDayWellnessModel[] {
  // last 7 days including today (oldest -> newest)
  const offsets = [-6, -5, -4, -3, -2, -1, 0]
  return offsets.map((off, idx) => {
    const key = dateKeyFromOffset(off)
    const idealDay = idx >= 2 && idx <= 4 // a 3-day ideal streak in the middle
    return {
      dateKey: key,
      label: weekdayLabel(key),
      idealDay,
      waterOk: idealDay || idx === 6,
      stepsOk: idealDay || idx === 6,
      vitaminsOk: idealDay || idx === 5 || idx === 6,
      sleepOk: idealDay || idx === 6,
    }
  })
}

export function makeWellnessMock(): AdultWellnessUiModel {
  const goals: AdultWellnessUiModel['goals'] = {
    waterMlTarget: 2000,
    stepsTarget: 8000,
    idealDayRequires: { water: true, steps: true, vitamins: true, sleep: true },
    idealStreakTargetDays: 5,
  }

  const hydration: AdultWellnessUiModel['hydration'] = {
    todayMl: 750,
    targetMl: goals.waterMlTarget,
    lastLogAt: Date.now() - 30 * 60 * 1000,
  }

  const steps: AdultWellnessUiModel['steps'] = {
    todaySteps: 4200,
    targetSteps: goals.stepsTarget,
    lastLogAt: Date.now() - 2 * 60 * 60 * 1000,
  }

  const vitamins: AdultWellnessUiModel['vitamins'] = {
    takenToday: true,
    lastLogAt: Date.now() - 3 * 60 * 60 * 1000,
  }

  const sleep: AdultWellnessUiModel['sleep'] = {
    lastNightHours: 7.4,
    quality: 'good',
    lastLogAt: Date.now() - 20 * 60 * 60 * 1000,
  }

  const weekly = { days: mkWeek(), adherencePct: 0 }
  weekly.adherencePct = computeWeeklyAdherence(weekly)

  const checklist = computeTodayChecklist({ goals, hydration, steps, vitamins, sleep })

  const currentStreakDays = 3
  const familyBonus = computeFamilyBonusPreview({
    streakDays: currentStreakDays,
    targetDays: goals.idealStreakTargetDays,
    hasActiveBonus: false,
  })

  const streak: AdultWellnessUiModel['streak'] = {
    currentDays: currentStreakDays,
    targetDays: goals.idealStreakTargetDays,
    remainingToTarget: Math.max(0, goals.idealStreakTargetDays - currentStreakDays),
    familyBonus,
  }

  const historyPreview = mkHistory()

  return {
    goals,
    hydration,
    steps,
    vitamins,
    sleep,
    signals: { mood: 4, energy: 3 },
    checklist,
    streak,
    weekly,
    historyPreview,
  }
}

