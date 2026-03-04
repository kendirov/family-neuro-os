/**
 * SpinAndQuests — Gacha-кнопка + Quest Map (все дневные миссии).
 * Expensive Minimalism: glassmorphism, sci-fi terminal.
 * UI: русский.
 */
import { useCallback } from 'react'
import { Check, Sparkles, Lock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { pickRandomPrize } from '@/data/DailyRoulettePrizes'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { cn } from '@/lib/utils'

const BLOCK_HEADERS = {
  morning: 'УТРО',
  afternoon: 'ДЕНЬ / ШКОЛА',
  evening: 'ВЕЧЕР',
}

function QuestCard({ task, isDone }) {
  const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)

  return (
    <li
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs transition-all',
        isDone
          ? 'bg-cyan-950/30 border border-cyan-500/40 text-cyan-100'
          : 'bg-slate-900/20 border border-white/5 text-slate-600'
      )}
      role="listitem"
    >
      {isDone ? (
        <Check
          className="w-4 h-4 shrink-0 text-emerald-400"
          strokeWidth={2.5}
          style={{ filter: 'drop-shadow(0 0 6px rgba(52,211,153,0.6))' }}
        />
      ) : (
        <span className="shrink-0 text-slate-600">{task.emoji}</span>
      )}
      <span className="flex-1 min-w-0 truncate">{task.label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums',
          isDone ? 'text-cyan-300' : 'text-slate-600'
        )}
      >
        +{reward} ⚡
      </span>
    </li>
  )
}

export function SpinAndQuests({ childId = 'kirill', accentColor = 'cyan' }) {
  const getAvailableSpins = useAppStore((s) => s.getAvailableSpins)
  const getPointsToNextSpin = useAppStore((s) => s.getPointsToNextSpin)
  const useSpin = useAppStore((s) => s.useSpin)
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)

  const availableSpins = getAvailableSpins(childId)
  const pointsNeeded = getPointsToNextSpin(childId)
  const isLocked = availableSpins <= 0

  const handleSpin = useCallback(() => {
    if (isLocked || getAvailableSpins(childId) < 1) return
    const prize = pickRandomPrize()
    useSpin(childId, prize)
  }, [childId, isLocked, getAvailableSpins, useSpin])

  const tasksByBlock = taskDefinitions.reduce((acc, task) => {
    const block = task.time_block === 'anytime' ? 'afternoon' : task.time_block
    if (!acc[block]) acc[block] = []
    acc[block].push(task)
    return acc
  }, {})

  ;['morning', 'afternoon', 'evening'].forEach((b) => {
    if (tasksByBlock[b]) {
      tasksByBlock[b].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }
  })

  const blockOrder = ['morning', 'afternoon', 'evening']

  return (
    <div
      className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}
      role="region"
      aria-label="Рулетка и квесты"
    >
      {/* Spin Button */}
      <button
        type="button"
        onClick={handleSpin}
        disabled={isLocked}
        className={cn(
          'mb-4 flex w-full items-center justify-center gap-2 py-4 font-mono text-sm font-black uppercase tracking-widest transition-all touch-manipulation rounded-2xl',
          isLocked
            ? 'cursor-not-allowed opacity-50 grayscale bg-slate-800 text-slate-500'
            : 'bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white shadow-[0_0_30px_rgba(192,38,211,0.5)] hover:shadow-[0_0_40px_rgba(192,38,211,0.6)] active:scale-[0.98] animate-pulse'
        )}
      >
        {isLocked ? (
          <>
            <Lock className="w-4 h-4 shrink-0" />
            ДО РУЛЕТКИ: {pointsNeeded} ⚡
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 shrink-0" />
            КРУТИТЬ СПИН! ({availableSpins})
          </>
        )}
      </button>

      {/* Quest Map */}
      <div className="space-y-3">
        {blockOrder.map((block) => {
          const tasks = tasksByBlock[block] ?? []
          if (tasks.length === 0) return null

          return (
            <div key={block}>
              <h3 className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {BLOCK_HEADERS[block]}
              </h3>
              <ul className="space-y-1.5" role="list">
                {tasks.map((task) => (
                  <QuestCard
                    key={task.id}
                    task={task}
                    isDone={isDailyBaseComplete(childId, task.id)}
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
