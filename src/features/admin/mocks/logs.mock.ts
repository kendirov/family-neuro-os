import type { AdminLogRecord } from '../lib/admin-logs-ui-model'

function ts(minutesAgo: number) {
  return Date.now() - minutesAgo * 60_000
}

export const LOGS_MOCK: AdminLogRecord[] = [
  {
    id: 'log_1',
    at: ts(5),
    actor: 'parent',
    actionType: 'task',
    direction: 'positive',
    title: 'Папа завершил миссию "Уроки"',
    valueLabel: '+20 XP',
    pilotId: 'kirill',
    raw: { reason: 'homework_done' },
  },
  {
    id: 'log_2',
    at: ts(18),
    actor: 'system',
    actionType: 'timer',
    direction: 'negative',
    title: 'Система списала 15 мин (сессия игр)',
    valueLabel: '−15 XP',
    pilotId: 'roma',
    raw: { sessionId: 'sess_x' },
  },
  {
    id: 'log_3',
    at: ts(40),
    actor: 'parent',
    actionType: 'points',
    direction: 'negative',
    title: 'Мама применил штраф (ручное)',
    valueLabel: '−10 XP',
    pilotId: 'kirill',
    raw: { reason: 'manual_fine' },
  },
  {
    id: 'log_4',
    at: ts(55),
    actor: 'kid',
    actionType: 'reward',
    direction: 'neutral',
    title: 'Рома открыл награду "Small surprise"',
    valueLabel: '—',
    pilotId: 'roma',
    raw: { rewardId: 'rw_wheel_small_prize' },
  },
]

