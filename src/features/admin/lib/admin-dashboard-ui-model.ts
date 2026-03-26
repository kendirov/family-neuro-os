import taskDefinitions from '@/data/taskDefinitionsSeed.json'

export type AdminDashboardTask = {
  id: string
  label: string
  emoji?: string
  base_reward?: number
  bonus_reward?: number
  sort_order?: number
  time_block?: string
  reason_template?: string
}

export const DASHBOARD_TASKS: AdminDashboardTask[] = (taskDefinitions as AdminDashboardTask[]).slice()

const TASK_BY_ID = new Map(DASHBOARD_TASKS.map((t) => [t.id, t]))

export function getTaskById(taskId: string) {
  return TASK_BY_ID.get(taskId)
}

export function getTopDashboardTasks(limit = 12) {
  return DASHBOARD_TASKS
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, limit)
}

export function sortPendingFirst(tasks: AdminDashboardTask[], isDone: (id: string) => boolean) {
  return tasks.slice().sort((a, b) => {
    const aDone = isDone(a.id)
    const bDone = isDone(b.id)
    if (aDone !== bDone) return aDone ? 1 : -1
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })
}
