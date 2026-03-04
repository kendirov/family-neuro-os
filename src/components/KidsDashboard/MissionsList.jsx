/**
 * MissionsList — ДОСТУПНЫЕ МИССИИ + ВЫПОЛНЕНО СЕГОДНЯ.
 * Glassmorphism, Next-Gen Gaming HUD.
 */
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import taskDefinitions from '@/data/taskDefinitionsSeed.json'
import { cn } from '@/lib/utils'

const TIME_BLOCK_ORDER = { morning: 0, afternoon: 1, evening: 2, anytime: -1 }

function getCurrentTimeBlock() {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  if (hour >= 18 && hour < 22) return 'evening'
  return 'evening'
}

export function MissionsList({ childId, accentColor = 'cyan', onTaskComplete }) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const markDailyBaseComplete = useAppStore((s) => s.markDailyBaseComplete)
  const addPoints = useAppStore((s) => s.addPoints)
  const dailyBase = useAppStore((s) => s.dailyBase ?? {})

  const currentBlock = getCurrentTimeBlock()
  const isPurple = accentColor === 'purple'

  const { available, completed } = useMemo(() => {
    const av = []
    const comp = []
    taskDefinitions.forEach((task) => {
      const done = isDailyBaseComplete(childId, task.id)
      if (done) comp.push(task)
      else av.push(task)
    })
    av.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    comp.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return { available: av, completed: comp }
  }, [childId, isDailyBaseComplete, dailyBase])

  const isFutureBlock = (block) => {
    if (block === 'anytime') return false
    return TIME_BLOCK_ORDER[block] > TIME_BLOCK_ORDER[currentBlock]
  }

  const handleClick = (task) => {
    if (isDailyBaseComplete(childId, task.id)) return
    const amount = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
    const reason = task.reason_template ?? task.label
    markDailyBaseComplete(childId, task.id)
    addPoints(childId, amount, reason)
    onTaskComplete?.(task)
  }

  return (
    <div
      className="rounded-2xl border border-white/10 bg-slate-950/60 backdrop-blur-xl overflow-hidden"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      {/* ДОСТУПНЫЕ МИССИИ */}
      <div className="px-3 py-2 border-b border-white/5">
        <h3
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest',
            isPurple ? 'text-purple-400' : 'text-cyan-400'
          )}
        >
          ДОСТУПНЫЕ МИССИИ
        </h3>
      </div>
      <ul className="max-h-28 overflow-y-auto [scrollbar-width:thin] px-2 py-1.5 space-y-0.5">
        <AnimatePresence mode="popLayout">
          {available.length === 0 ? (
            <motion.li
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 text-xs py-3 text-center font-mono"
            >
              Всё сделано! 🎉
            </motion.li>
          ) : (
            available.slice(0, 5).map((task) => {
              const isFuture = isFutureBlock(task.time_block)
              const reward = (task.base_reward ?? 0) + (task.bonus_reward ?? 0)
              return (
                <motion.li
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-lg font-mono text-xs transition',
                    isFuture
                      ? 'opacity-50 text-slate-500'
                      : onTaskComplete
                        ? 'text-slate-200 hover:bg-white/5 cursor-pointer active:scale-[0.98]'
                        : 'text-slate-200'
                  )}
                  onClick={() => !isFuture && handleClick(task)}
                  role={onTaskComplete ? 'button' : undefined}
                >
                  <span className="shrink-0">{task.emoji}</span>
                  <span className="flex-1 min-w-0 truncate">{task.label}</span>
                  <span className="shrink-0 text-amber-400/90 tabular-nums">
                    +{reward} ⚡
                  </span>
                </motion.li>
              )
            })
          )}
        </AnimatePresence>
      </ul>

      {/* ВЫПОЛНЕНО СЕГОДНЯ */}
      {completed.length > 0 && (
        <>
          <div className="px-3 py-2 border-t border-white/5">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              ВЫПОЛНЕНО СЕГОДНЯ
            </h3>
          </div>
          <ul className="max-h-20 overflow-y-auto [scrollbar-width:thin] px-2 py-1.5 space-y-0.5">
            {completed.slice(0, 4).map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-2 px-2 py-1 rounded-lg text-slate-500 font-mono text-xs"
              >
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                <span className="flex-1 min-w-0 truncate line-through">{task.label}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
