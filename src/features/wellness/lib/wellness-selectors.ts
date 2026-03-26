import type {
  AdultWellnessUiModel,
  FamilyBonusPreviewModel,
  TodayChecklistModel,
  WeeklyWellnessModel,
} from './wellness-ui-model'

function clamp01(x: number) {
  if (x < 0) return 0
  if (x > 1) return 1
  return x
}

export function computeTodayChecklist(ui: {
  goals: AdultWellnessUiModel['goals']
  hydration: AdultWellnessUiModel['hydration']
  steps: AdultWellnessUiModel['steps']
  vitamins: AdultWellnessUiModel['vitamins']
  sleep: AdultWellnessUiModel['sleep']
}): TodayChecklistModel {
  const waterOk = ui.goals.idealDayRequires.water ? ui.hydration.todayMl >= ui.hydration.targetMl : true
  const stepsOk = ui.goals.idealDayRequires.steps ? ui.steps.todaySteps >= ui.steps.targetSteps : true
  const vitaminsOk = ui.goals.idealDayRequires.vitamins ? ui.vitamins.takenToday : true
  // Sleep is based on last night; keep threshold mild for UI purposes (not business truth).
  const sleepOk = ui.goals.idealDayRequires.sleep ? ui.sleep.lastNightHours >= 7 && ui.sleep.quality !== 'poor' : true
  const idealDay = waterOk && stepsOk && vitaminsOk && sleepOk
  return { waterOk, stepsOk, vitaminsOk, sleepOk, idealDay }
}

export function computeWeeklyAdherence(week: WeeklyWellnessModel): number {
  if (week.days.length === 0) return 0
  const idealCount = week.days.reduce((acc, d) => acc + (d.idealDay ? 1 : 0), 0)
  return Math.round((idealCount / week.days.length) * 100)
}

export function computeFamilyBonusPreview(input: {
  streakDays: number
  targetDays: number
  isWeekend?: boolean
  hasActiveBonus?: boolean
}): FamilyBonusPreviewModel {
  const { streakDays, targetDays } = input
  const progress = clamp01(targetDays <= 0 ? 0 : streakDays / targetDays)
  const remaining = Math.max(0, targetDays - streakDays)

  if (input.hasActiveBonus) {
    return {
      status: 'active',
      label: 'Family Bonus: Active',
      progress: 1,
      previewText: 'Weekend XP multiplier will be applied by server',
      windowLabel: 'Sat–Sun',
    }
  }

  if (remaining === 0) {
    return {
      status: 'arming',
      label: 'Family Bonus: Armed',
      progress: 1,
      previewText: 'Ready — server can activate weekend XP multiplier',
      windowLabel: 'Sat–Sun',
    }
  }

  return {
    status: 'locked',
    label: 'Family Bonus: Locked',
    progress,
    previewText: `Complete ${remaining} ideal day${remaining === 1 ? '' : 's'} to arm weekend bonus`,
    windowLabel: 'Sat–Sun',
  }
}

