import { cn } from '@/lib/utils'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'

type PilotTaskRowProps = {
  task: AdminDashboardTask
  completed: boolean
  disabled?: boolean
  onClick: (task: AdminDashboardTask) => void
}

export function PilotTaskRow({ task, completed, disabled, onClick }: PilotTaskRowProps) {
  const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
  return (
    <button
      type="button"
      disabled={disabled || completed}
      onClick={() => onClick(task)}
      className={cn(
        'w-full rounded-xl border px-3 py-2 text-left transition',
        'min-h-[42px] touch-manipulation',
        completed
          ? 'border-white/10 bg-white/[0.02] text-slate-500'
          : 'border-white/10 bg-slate-950/30 text-slate-200 hover:bg-slate-900/45 hover:border-white/20',
        (disabled || completed) && 'cursor-default'
      )}
      aria-label={completed ? `${task.label} выполнено` : `${task.label} +${reward} XP`}
    >
      <div className="flex items-center gap-2">
        <span className={cn('text-sm', completed && 'opacity-55')} aria-hidden>
          {task.emoji ?? '•'}
        </span>
        <span className={cn('flex-1 truncate text-sm font-medium', completed && 'line-through decoration-white/20')}>
          {task.label}
        </span>
        <span className={cn('shrink-0 font-mono text-[11px] tabular-nums', completed ? 'text-slate-500' : 'text-slate-300')}>
          +{reward}
        </span>
      </div>
    </button>
  )
}
