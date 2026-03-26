import { cn } from '@/lib/utils'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'

type BonusTaskChipsProps = {
  tasks: AdminDashboardTask[]
  isCompleted: (taskId: string) => boolean
  busyTaskIds: Set<string>
  onClick: (task: AdminDashboardTask) => void
  onUndo: (task: AdminDashboardTask) => void
  density?: 'inline' | 'block'
}

export function BonusTaskChips({ tasks, isCompleted, busyTaskIds, onClick, onUndo, density = 'block' }: BonusTaskChipsProps) {
  if (!tasks.length) {
    return <div className="text-xs text-slate-600">Нет бонусов</div>
  }

  return (
    <div className={cn('flex flex-wrap', density === 'inline' ? 'gap-1.5' : 'gap-2')}>
      {tasks.map((task) => {
        const completed = isCompleted(task.id)
        const disabled = busyTaskIds.has(task.id)
        const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
        return (
          <div key={task.id} className="inline-flex items-center">
            <button
              type="button"
              disabled={disabled || completed}
              onClick={() => onClick(task)}
              className={cn(
                'rounded-full border text-left transition',
                density === 'inline' ? 'px-2.5 py-1' : 'px-3 py-1.5',
                'text-xs font-semibold tracking-tight',
                completed
                  ? 'border-white/10 bg-white/[0.02] text-slate-500'
                  : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-white/20',
                (disabled || completed) && 'cursor-default'
              )}
              aria-label={completed ? `${task.label} выполнено` : `${task.label} +${reward} XP`}
            >
              <span className="inline-flex items-center gap-2">
                <span className={cn('text-[12px]', completed && 'opacity-60')} aria-hidden>
                  {task.emoji ?? '✨'}
                </span>
                <span className={cn('max-w-[22ch] truncate', completed && 'line-through decoration-white/20')}>
                  {task.label}
                </span>
                <span className={cn('font-mono text-[10px] tabular-nums', completed ? 'text-slate-600' : 'text-slate-300')}>
                  +{reward}
                </span>
              </span>
            </button>

            {completed ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onUndo(task)}
                className={cn(
                  'ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10',
                  'bg-white/[0.02] text-slate-600 transition hover:bg-white/[0.06] hover:text-slate-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
                aria-label={`Отменить: ${task.label}`}
                title="Отменить"
              >
                ×
              </button>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

