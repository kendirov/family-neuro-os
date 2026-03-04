/**
 * Quest Tracker — Active Missions (To Do) + Completed Today (Done).
 * Zeigarnik effect: kids want to clear Active and move to Completed.
 * Tasks from taskDefinitionsSeed, completion from transactions.
 */
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { cn } from '@/lib/utils'

const TIME_BLOCK_ORDER = { morning: 0, afternoon: 1, evening: 2, anytime: -1 }

function getTodayStartTs() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

function getCurrentTimeBlock() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'evening'
}

/** Match transaction to task by description (reason_template or reason_template + " — бонус") */
function taskCompletedByTransaction(task, tx) {
  const base = task.reason_template ?? ''
  const bonus = base + ' — бонус'
  return tx.description === base || tx.description === bonus
}

export function QuestTracker({ childId, accentColor = 'cyan', transactions = [] }) {
  const todayStart = getTodayStartTs()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000
  const currentBlock = getCurrentTimeBlock()
  const isPurple = accentColor === 'purple'
  const borderClass = isPurple ? 'border-purple-500/30' : 'border-cyan-500/30'

  const { active, completed } = useMemo(() => {
    const todayTxs = transactions.filter(
      (t) =>
        t.userId === childId &&
        t.at >= todayStart &&
        t.at < todayEnd &&
        t.type !== 'burn' &&
        t.amount > 0
    )

    const completedList = []
    const activeList = []

    taskDefinitions.forEach((task) => {
      const matchTx = todayTxs.find((tx) => taskCompletedByTransaction(task, tx))
      if (matchTx) {
        completedList.push({
          ...task,
          earned: matchTx.amount,
          completedAt: matchTx.at,
        })
      } else {
        activeList.push(task)
      }
    })

    completedList.sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0))
    activeList.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

    return { active: activeList, completed: completedList }
  }, [transactions, childId, todayStart, todayEnd])

  const isFutureBlock = (block) => {
    if (block === 'anytime') return false
    return TIME_BLOCK_ORDER[block] > TIME_BLOCK_ORDER[currentBlock]
  }

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
      {/* Active Missions */}
      <div className="flex flex-col min-h-0">
        <h3
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest mb-2 shrink-0',
            isPurple ? 'text-purple-400/90' : 'text-cyan-400/90'
          )}
        >
          Активные миссии
        </h3>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 [scrollbar-width:thin]">
          <AnimatePresence mode="popLayout">
            {active.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-slate-500 text-sm py-4 text-center"
              >
                Все миссии выполнены! 🎉
              </motion.p>
            ) : (
              active.map((task) => {
                const isFuture = isFutureBlock(task.time_block)
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200',
                      borderClass,
                      isFuture
                        ? 'opacity-50 bg-slate-900/30 border-slate-600/40'
                        : 'bg-slate-900/50 text-slate-100'
                    )}
                  >
                    <span className="shrink-0 text-base" aria-hidden>
                      {task.emoji}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm font-medium">
                      {task.label}
                    </span>
                    <span className="shrink-0 text-xs text-amber-400/90 tabular-nums">
                      +{task.base_reward + (task.bonus_reward || 0)}
                    </span>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Completed Today */}
      <div className="shrink-0 flex flex-col">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          Выполнено сегодня
        </h3>
        <div className="space-y-1 max-h-32 overflow-y-auto [scrollbar-width:thin]">
          <AnimatePresence mode="popLayout">
            {completed.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/20 text-slate-500"
              >
                <Check className="w-4 h-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                <span className="shrink-0 text-base" aria-hidden>
                  {task.emoji}
                </span>
                <span className="flex-1 min-w-0 truncate text-sm">{task.label}</span>
                <span className="shrink-0 text-xs text-emerald-400/90 tabular-nums font-medium">
                  +{task.earned} ⚡
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
