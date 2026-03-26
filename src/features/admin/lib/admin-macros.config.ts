import type { AdminDashboardTask } from './admin-dashboard-ui-model'
import { getTaskById } from './admin-dashboard-ui-model'

export type AdminMacroId = 'morning' | 'school' | 'room' | 'evening'

export type AdminMacro = {
  id: AdminMacroId
  label: string
  taskIds: string[]
}

export const ADMIN_MACROS: AdminMacro[] = [
  {
    id: 'morning',
    label: 'Утро закрыто',
    taskIds: ['wake_on_time', 'make_bed', 'teeth_morning', 'breakfast', 'pack_bag', 'school_leave'],
  },
  {
    id: 'school',
    label: 'Школа закрыта',
    taskIds: ['homework_done', 'extra_study'],
  },
  {
    id: 'room',
    label: 'Комната убрана',
    taskIds: ['help_clean', 'take_trash'],
  },
  {
    id: 'evening',
    label: 'Вечер закрыт',
    taskIds: ['dinner', 'sleep_on_time'],
  },
]

export function getMacroTasks(macro: AdminMacro): AdminDashboardTask[] {
  return macro.taskIds.map((id) => getTaskById(id)).filter(Boolean) as AdminDashboardTask[]
}

