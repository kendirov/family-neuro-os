import { PilotTaskRow } from './PilotTaskRow'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'

type PilotTaskChecklistProps = {
  tasks: AdminDashboardTask[]
  isCompleted: (taskId: string) => boolean
  busyTaskIds: Set<string>
  onCompleteTask: (task: AdminDashboardTask) => void
}

export function PilotTaskChecklist({
  tasks,
  isCompleted,
  busyTaskIds,
  onCompleteTask,
}: PilotTaskChecklistProps) {
  return (
    <div className="min-h-0 overflow-y-auto pr-1 space-y-1.5">
      {tasks.map((task) => (
        <PilotTaskRow
          key={task.id}
          task={task}
          completed={isCompleted(task.id)}
          disabled={busyTaskIds.has(task.id)}
          onClick={onCompleteTask}
        />
      ))}
    </div>
  )
}
