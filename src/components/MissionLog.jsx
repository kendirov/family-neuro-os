import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sun, UtensilsCrossed, Briefcase, BookOpen, Home } from 'lucide-react'
import { TaskCard } from '@/components/TaskCard'
import { CompositeTaskCard } from '@/components/CompositeTaskCard'
import { cn } from '@/lib/utils'

/** Order and config for 4 chronological phases. */
const CATEGORY_ORDER = ['Morning', 'School', 'Food', 'Base']
const CATEGORY_CONFIG = {
  Morning: { label: 'Утро', icon: Sun, key: 'morning' },
  School: { label: 'Школа', icon: BookOpen, key: 'school' },
  Food: { label: 'Питание', icon: UtensilsCrossed, key: 'food' },
  Base: { label: 'Дом и сон', icon: Home, key: 'base' },
}

/**
 * Mission Log: daily missions grouped by category with collapsible sections.
 * Tasks have id, label, reward, category, status. Calls onTaskComplete(task, event) on click.
 */
export function MissionLog({
  tasksByCategory,
  getStatus,
  onTaskComplete,
  disabled,
  accentColor,
  className,
}) {
  const [collapsed, setCollapsed] = useState({})

  const toggle = (key) => {
    setCollapsed((c) => ({ ...c, [key]: !c[key] }))
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <h3 className="font-gaming text-xs text-slate-400 uppercase tracking-wider mb-1 text-pop">
        Ежедневные миссии
      </h3>

      {CATEGORY_ORDER.map((category) => {
        const config = CATEGORY_CONFIG[category]
        if (!config) return null
        const tasks = tasksByCategory[category] ?? []
        const foodComposite = tasksByCategory.foodComposite ?? []
        const isFood = category === 'Food'
        const hasContent = isFood ? foodComposite.length > 0 : tasks.length > 0
        if (!hasContent) return null

        const isCollapsed = collapsed[config.key]
        const Icon = config.icon

        return (
          <motion.div
            key={config.key}
            initial={false}
            className="rounded-2xl border-[3px] border-slate-600/70 bg-slate-800/90 overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            <button
              type="button"
              onClick={() => toggle(config.key)}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left font-gaming text-sm font-bold text-slate-300 hover:text-slate-100 hover:bg-slate-700/60 transition-colors border-b-2 border-slate-600/50 bg-gradient-to-r from-slate-700/50 to-slate-800/50"
              aria-expanded={!isCollapsed}
            >
              <span className="flex items-center gap-2 icon-pop">
                <Icon className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
                <span className="uppercase tracking-wider text-pop">{config.label}</span>
              </span>
              <motion.span
                animate={{ rotate: isCollapsed ? -90 : 0 }}
                transition={{ duration: 0.2 }}
                className="icon-pop"
              >
                <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 pt-1 space-y-2">
                    {isFood && foodComposite.length > 0 ? (
                      foodComposite.map((group) => (
                        <CompositeTaskCard
                          key={group.main.id}
                          mainTask={group.main}
                          modifierTasks={group.modifiers}
                          getStatus={getStatus}
                          onTaskComplete={onTaskComplete}
                          disabled={disabled}
                        />
                      ))
                    ) : (
                      tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          id={task.id}
                          label={task.label}
                          reward={task.reward}
                          icon={task.emoji}
                          status={getStatus(task.id)}
                          disabled={disabled}
                          variant={config.key}
                          accentColor={accentColor}
                          onComplete={(e) => onTaskComplete(task, e)}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
