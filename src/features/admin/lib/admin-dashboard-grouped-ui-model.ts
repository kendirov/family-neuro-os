import { getTaskById, type AdminDashboardTask } from './admin-dashboard-ui-model'

export type PilotId = 'roma' | 'kirill'

export type DailyGroupId = 'morning' | 'day' | 'evening' | 'school' | 'extra_help'

export type BonusAttachmentModel = {
  /** Resolved task id (real or virtual). */
  id: string
  /** Where this bonus chip should render. */
  attachTo: { kind: 'coreTask'; coreTaskId: string } | { kind: 'group' }
  /** Task payload used by optimistic completion. */
  task: AdminDashboardTask
}

export type DailyGroupSectionModel = {
  id: DailyGroupId
  title: string
  coreTasks: AdminDashboardTask[]
  bonusAttachments: BonusAttachmentModel[]
}

function asCoreTask(taskId: string): AdminDashboardTask {
  const t = getTaskById(taskId)
  if (!t) {
    return {
      id: taskId,
      label: taskId,
      emoji: '•',
      base_reward: 0,
      bonus_reward: 0,
      reason_template: taskId,
    }
  }
  return {
    ...t,
    // core rows should not implicitly include "bonus_reward"
    bonus_reward: 0,
  }
}

function asBonusChipFromTask(taskId: string, opts?: { label?: string; emoji?: string }): AdminDashboardTask {
  const t = getTaskById(taskId)
  if (!t) {
    return {
      id: `${taskId}__bonus`,
      label: opts?.label ?? `${taskId} бонус`,
      emoji: opts?.emoji ?? '✨',
      base_reward: 0,
      bonus_reward: 0,
      reason_template: `${taskId} — бонус`,
    }
  }
  const bonus = t.bonus_reward ?? 0
  const baseReason = t.reason_template ?? t.label
  return {
    id: `${t.id}__bonus`,
    label: opts?.label ?? `${t.label} — бонус`,
    emoji: opts?.emoji ?? '✨',
    base_reward: 0,
    bonus_reward: bonus,
    reason_template: `${baseReason} — бонус`,
    // keep sort_order close to the original for stable ordering
    sort_order: (t.sort_order ?? 0) + 1,
    time_block: t.time_block,
  }
}

function asExistingTask(taskId: string): AdminDashboardTask | null {
  const t = getTaskById(taskId)
  return t ?? null
}

export function getAdminDashboardDailyGroups(): DailyGroupSectionModel[] {
  const extraStudy = asExistingTask('extra_study')
  const helpClean = asExistingTask('help_clean')
  const takeTrash = asExistingTask('take_trash')

  return [
    {
      id: 'morning',
      title: 'Утро',
      coreTasks: [
        asCoreTask('wake_on_time'),
        asCoreTask('make_bed'),
        asCoreTask('teeth_morning'),
        asCoreTask('breakfast'),
      ],
      bonusAttachments: [
        {
          id: 'breakfast__bonus',
          attachTo: { kind: 'coreTask', coreTaskId: 'breakfast' },
          task: asBonusChipFromTask('breakfast', { label: 'Хорошо поел', emoji: '✨' }),
        },
      ],
    },
    {
      id: 'day',
      title: 'День',
      coreTasks: [asCoreTask('lunch'), asCoreTask('snack')],
      bonusAttachments: [
        {
          id: 'lunch__bonus',
          attachTo: { kind: 'coreTask', coreTaskId: 'lunch' },
          task: asBonusChipFromTask('lunch', { label: 'Хорошо поел', emoji: '✨' }),
        },
      ],
    },
    {
      id: 'evening',
      title: 'Вечер',
      coreTasks: [asCoreTask('dinner'), asCoreTask('sleep_on_time')],
      bonusAttachments: [
        {
          id: 'dinner__bonus',
          attachTo: { kind: 'coreTask', coreTaskId: 'dinner' },
          task: asBonusChipFromTask('dinner', { label: 'Хорошо поел', emoji: '✨' }),
        },
      ],
    },
    {
      id: 'school',
      title: 'Школа',
      coreTasks: [asCoreTask('pack_bag'), asCoreTask('school_leave'), asCoreTask('homework_done')],
      bonusAttachments: [
        ...(extraStudy
          ? [
              {
                id: extraStudy.id,
                attachTo: { kind: 'coreTask', coreTaskId: 'homework_done' as const },
                task: extraStudy,
              },
            ]
          : []),
        // Support-ready slots (not rendered until real task definitions exist):
        // - "Собрался сам +5" (attachTo pack_bag)
        // - "Сделал хорошо +10" (attachTo homework_done)
      ],
    },
    {
      id: 'extra_help',
      title: 'Доп. помощь',
      coreTasks: [
        ...(helpClean ? [asCoreTask(helpClean.id)] : []),
        ...(takeTrash ? [asCoreTask(takeTrash.id)] : []),
      ],
      bonusAttachments: [
        // Support-ready slot for future helper tasks (not rendered until seeded):
        // - "Сходил в магазин"
      ],
    },
  ]
}

