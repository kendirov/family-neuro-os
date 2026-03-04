/**
 * ReadOnlyQuestMap — карта миссий в стиле RPG Inventory / Bento Grid.
 * Плотная сетка слотов: emoji, badge XP, короткий label.
 * Pending: glassmorphic dimmed. Completed: neon border, inset glow.
 */
import { useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { fireMissionCompleteConfetti } from '@/lib/confettiUtils'
import { cn } from '@/lib/utils'

/** Короткие подписи для компактных слотов */
const SHORT_LABELS = {
  wake_on_time: 'Пробуждение',
  make_bed: 'Кровать',
  teeth_morning: 'Зубы',
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Полдник',
  pack_bag: 'Портфель',
  school_leave: 'Ушёл',
  homework_done: 'Уроки',
  extra_study: 'Чтение',
  help_clean: 'Уборка',
  take_trash: 'Мусор',
  sleep_on_time: 'Сон',
}

function getShortLabel(task) {
  return SHORT_LABELS[task.id] ?? task.label.slice(0, 8)
}

/** Группировка по time_block, сортировка по sort_order */
function getOrderedTasks(tasks) {
  const byBlock = {}
  tasks.forEach((t) => {
    const block = t.time_block === 'anytime' ? 'afternoon' : t.time_block
    if (!byBlock[block]) byBlock[block] = []
    byBlock[block].push(t)
  })
  const order = ['morning', 'afternoon', 'evening']
  const result = []
  order.forEach((b) => {
    (byBlock[b] ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).forEach((t) => result.push(t))
  })
  return result
}

/** Один слот инвентаря: квадрат, emoji, badge XP, label */
function InventorySlot({ task, isDone }) {
  const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
  const shortLabel = getShortLabel(task)

  return (
    <motion.div
      className={cn(
        'relative flex flex-col items-center justify-center aspect-square rounded-xl',
        'cursor-default select-none touch-manipulation overflow-hidden',
        'transition-colors duration-300 ease-out',
        isDone
          ? 'bg-slate-800 border-2 border-emerald-500/80 text-white opacity-100'
          : 'bg-slate-900/40 backdrop-blur-sm border border-white/10 text-slate-500 opacity-60'
      )}
      style={
        isDone
          ? {
              boxShadow:
                'inset 0 2px 12px rgba(16,185,129,0.2), 0 0 16px rgba(16,185,129,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
            }
          : undefined
      }
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      role="listitem"
      aria-label={isDone ? `Выполнено: ${task.label}` : `Ожидает: ${task.label}`}
    >
      {/* Badge XP — top-right */}
      <div
        className={cn(
          'absolute top-1 right-1 px-1.5 py-0.5 rounded-md font-mono text-[8px] font-bold tabular-nums uppercase tracking-wider',
          isDone
            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
            : 'bg-slate-700/60 text-slate-400 border border-slate-600/50'
        )}
      >
        +{reward} ⚡
      </div>

      {/* Checkmark — top-left при completed */}
      {isDone && (
        <div className="absolute top-1 left-1">
          <Check className="w-3.5 h-3.5 text-emerald-400" strokeWidth={2.5} aria-hidden />
        </div>
      )}

      {/* Центральный emoji */}
      <span
        className={cn(
          'text-2xl sm:text-3xl leading-none',
          isDone ? 'opacity-100' : 'opacity-70 saturate-50'
        )}
      >
        {task.emoji}
      </span>

      {/* Короткий label внизу */}
      <span
        className={cn(
          'absolute bottom-2 left-1 right-1 text-center font-mono text-[9px] uppercase tracking-wider truncate',
          isDone ? 'text-slate-200' : 'text-slate-500'
        )}
      >
        {shortLabel}
      </span>
    </motion.div>
  )
}

export function ReadOnlyQuestMap({ childId }) {
  const transactions = useAppStore((s) => s.transactions ?? [])
  const dailyBase = useAppStore((s) => s.dailyBase ?? {})
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const isTaskCompleteFromTransactions = useAppStore((s) => s.isTaskCompleteFromTransactions)

  const isTaskDone = (task) =>
    isDailyBaseComplete(childId, task.id) || isTaskCompleteFromTransactions(childId, task)

  const orderedTasks = useMemo(() => getOrderedTasks(taskDefinitions), [])

  const prevDoneRef = useRef(new Set())
  const isFirstRender = useRef(true)

  useEffect(() => {
    const state = useAppStore.getState()
    const isDone = (task) =>
      state.isDailyBaseComplete(childId, task.id) ||
      state.isTaskCompleteFromTransactions(childId, task)

    const nowDone = new Set()
    orderedTasks.forEach((task) => {
      if (isDone(task)) nowDone.add(task.id)
    })

    if (isFirstRender.current) {
      isFirstRender.current = false
      prevDoneRef.current = nowDone
      return
    }

    const justCompleted = orderedTasks.filter(
      (task) => nowDone.has(task.id) && !prevDoneRef.current.has(task.id)
    )

    if (justCompleted.length > 0) {
      fireMissionCompleteConfetti({ x: 0.5, y: 0.2 })
    }

    prevDoneRef.current = nowDone
  }, [transactions, dailyBase, childId, orderedTasks])

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-white/10 p-4',
        'bg-white/5 backdrop-blur-xl',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'
      )}
      aria-label="Карта миссий"
    >
      <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        Карта миссий — до 50 ⚡ на спин
      </h3>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3 max-h-[280px] overflow-y-auto [scrollbar-width:thin]">
        {orderedTasks.map((task) => (
          <InventorySlot
            key={task.id}
            task={task}
            isDone={isTaskDone(task)}
          />
        ))}
      </div>
    </div>
  )
}
