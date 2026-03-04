/**
 * ActiveMissions — компактный список задач для заработка монет.
 * Только активные (не выполненные сегодня).
 */
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

function taskCompletedByTransaction(task, tx) {
  const base = task.reason_template ?? ''
  const bonus = base + ' — бонус'
  return tx.description === base || tx.description === bonus
}

export function ActiveMissions({ childId, accentColor = 'cyan', transactions = [] }) {
  const todayStart = getTodayStartTs()
  const todayEnd = todayStart + 24 * 60 * 60 * 1000
  const currentBlock = getCurrentTimeBlock()
  const isPurple = accentColor === 'purple'

  const active = useMemo(() => {
    const todayTxs = transactions.filter(
      (t) =>
        t.userId === childId &&
        t.at >= todayStart &&
        t.at < todayEnd &&
        t.type !== 'burn' &&
        t.amount > 0
    )

    const list = []
    taskDefinitions.forEach((task) => {
      const matchTx = todayTxs.find((tx) => taskCompletedByTransaction(task, tx))
      if (!matchTx) list.push(task)
    })
    list.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return list
  }, [transactions, childId, todayStart, todayEnd])

  const isFutureBlock = (block) => {
    if (block === 'anytime') return false
    return TIME_BLOCK_ORDER[block] > TIME_BLOCK_ORDER[currentBlock]
  }

  return (
    <div className="rounded-xl border border-white/5 bg-white/5 backdrop-blur-xl px-3 py-3">
      <h3
        className={cn(
          'font-mono text-[10px] uppercase tracking-widest mb-2',
          isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
        )}
      >
        Миссии
      </h3>
      <ul className="space-y-1 max-h-32 overflow-y-auto [scrollbar-width:thin]">
        <AnimatePresence mode="popLayout">
          {active.length === 0 ? (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 text-xs py-2 text-center"
            >
              Всё сделано! 🎉
            </motion.li>
          ) : (
            active.slice(0, 6).map((task) => {
              const isFuture = isFutureBlock(task.time_block)
              return (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs',
                    isFuture
                      ? 'opacity-50 text-slate-500'
                      : 'text-slate-200'
                  )}
                >
                  <span className="shrink-0">{task.emoji}</span>
                  <span className="flex-1 min-w-0 truncate">{task.label}</span>
                  <span className="shrink-0 text-amber-400/90 tabular-nums">
                    +{task.base_reward + (task.bonus_reward || 0)}
                  </span>
                </motion.li>
              )
            })
          )}
        </AnimatePresence>
      </ul>
    </div>
  )
}
