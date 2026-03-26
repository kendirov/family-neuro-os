import { cn } from '@/lib/utils'
import type { AdminDashboardTask } from '../../lib/admin-dashboard-ui-model'

type CoreTaskRowProps = {
  task: AdminDashboardTask
  completed: boolean
  disabled?: boolean
  onClick: () => void
  onUndo: () => void
  rightChips?: React.ReactNode
}

export function CoreTaskRow({ task, completed, disabled, onClick, onUndo, rightChips }: CoreTaskRowProps) {
  const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
  return (
    <div
      className={cn(
        'group w-full rounded-xl border px-3 py-2 transition',
        'min-h-[40px]',
        completed
          ? 'border-white/10 bg-white/[0.02] text-slate-500'
          : 'border-white/10 bg-slate-950/30 text-slate-200 hover:bg-slate-900/45 hover:border-white/20'
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={disabled || completed}
          onClick={onClick}
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 text-left',
            'touch-manipulation',
            (disabled || completed) && 'cursor-default'
          )}
          aria-label={completed ? `${task.label} выполнено` : `${task.label} +${reward} XP`}
        >
          <span className={cn('text-sm', completed && 'opacity-55')} aria-hidden>
            {task.emoji ?? '•'}
          </span>
          <span className={cn('min-w-0 flex-1 truncate text-sm font-medium', completed && 'line-through decoration-white/20')}>
            {task.label}
          </span>
        </button>

        <span className={cn('shrink-0 font-mono text-[11px] tabular-nums', completed ? 'text-slate-500' : 'text-slate-300')}>
          +{reward}
        </span>

        {rightChips ? (
          <div className="ml-2 shrink-0 flex items-center gap-2">
            {rightChips}
          </div>
        ) : null}

        {completed ? (
          <button
            type="button"
            disabled={disabled}
            onClick={onUndo}
            className={cn(
              'ml-2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10',
              'bg-white/[0.02] text-slate-500 transition hover:bg-white/[0.06] hover:text-slate-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
            )}
            aria-label={`Отменить: ${task.label}`}
            title="Отменить"
          >
            ↺
          </button>
        ) : null}
      </div>
    </div>
  )
}

