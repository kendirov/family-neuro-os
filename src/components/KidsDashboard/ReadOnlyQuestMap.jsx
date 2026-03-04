/**
 * ReadOnlyQuestMap — карта миссий для Kids Dashboard.
 * Клон логики Admin: taskDefinitions, isDailyBaseComplete.
 * Строго read-only: клики не выполняют действий.
 *
 * Visual (Completionist Hook):
 * - Completed: bright cyan, bg-cyan-950/40, green checkmark
 * - Pending: greyed-out, opacity-60, bg-slate-900/30, text-slate-500
 */
import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { cn } from '@/lib/utils'

const BLOCK_HEADERS = {
  morning: 'УТРЕННИЙ ПРОТОКОЛ',
  afternoon: 'ДЕНЬ / ШКОЛА',
  evening: 'ВЕЧЕРНИЙ ПРОТОКОЛ',
}

/** Группировка по time_block как в Admin */
function groupTasksByBlock(tasks) {
  const byBlock = {}
  tasks.forEach((t) => {
    const block = t.time_block === 'anytime' ? 'afternoon' : t.time_block
    if (!byBlock[block]) byBlock[block] = []
    byBlock[block].push(t)
  })
  ;['morning', 'afternoon', 'evening'].forEach((b) => {
    if (byBlock[b]) {
      byBlock[b].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
  })
  return byBlock
}

function QuestItem({ task, isDone }) {
  const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)

  return (
    <li
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-xl font-mono text-sm transition-colors',
        'cursor-default pointer-events-none select-none',
        isDone
          ? 'bg-cyan-950/40 border border-cyan-500/30 text-cyan-200'
          : 'opacity-60 bg-slate-900/30 border border-white/5 text-slate-500'
      )}
      role="listitem"
      aria-label={isDone ? `Выполнено: ${task.label}` : `Ожидает: ${task.label}`}
    >
      {isDone ? (
        <Check
          className="w-4 h-4 shrink-0 text-emerald-400"
          strokeWidth={2.5}
          aria-hidden
        />
      ) : (
        <span className="shrink-0 text-slate-500">{task.emoji}</span>
      )}
      <span className="flex-1 min-w-0 truncate">{task.label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          isDone ? 'text-cyan-300' : 'text-slate-500'
        )}
      >
        +{reward} ⚡
      </span>
    </li>
  )
}

export function ReadOnlyQuestMap({ childId }) {
  const transactions = useAppStore((s) => s.transactions ?? [])
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const isTaskCompleteFromTransactions = useAppStore((s) => s.isTaskCompleteFromTransactions)

  const isTaskDone = (task) =>
    isDailyBaseComplete(childId, task.id) || isTaskCompleteFromTransactions(childId, task)

  const tasksByBlock = useMemo(
    () => groupTasksByBlock(taskDefinitions),
    []
  )

  const blockOrder = ['morning', 'afternoon', 'evening']

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-white/10 p-4',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'
      )}
      aria-label="Карта миссий"
    >
      <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        Карта миссий — до 50 ⚡ на спин
      </h3>

      <div className="flex flex-col gap-4 max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
        {blockOrder.map((block) => {
          const tasks = tasksByBlock[block] ?? []
          if (tasks.length === 0) return null

          return (
            <div key={block} className="flex flex-col gap-2">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {BLOCK_HEADERS[block]}
              </h4>
              <ul className="flex flex-col gap-2" role="list">
                {tasks.map((task) => (
                  <QuestItem
                    key={task.id}
                    task={task}
                    isDone={isTaskDone(task)}
                  />
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
