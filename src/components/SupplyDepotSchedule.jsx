import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { TASK_CONFIG } from '@/data/taskConfig'
import { cn } from '@/lib/utils'

function normalizeTask(raw, isDaily = true) {
  return {
    id: raw.id,
    label: raw.label,
    reward: raw.credits,
    credits: raw.credits,
    reason: raw.reason,
    emoji: raw.emoji,
    isDaily,
    type: raw.type,
  }
}

/** Single compact task button (used in grids). Optional inline Undo (X) when completed and daily. */
function TaskButton({ task, status, onComplete, disabled, accentColor, className, variant = 'default', isDaily = false, onUndo }) {
  const completed = status === 'completed'
  const pending = status === 'pending'
  const isPenalty = task.credits < 0
  const handleClick = (e) => {
    if (completed || disabled) return
    onComplete(task, e)
  }
  const handleUndo = (e) => {
    e.stopPropagation()
    if (!completed || !onUndo || disabled) return
    onUndo(task)
  }

  const borderClass =
    variant === 'morning'
      ? 'border-cyan-500/60 hover:border-cyan-400/80'
      : variant === 'school'
        ? isPenalty
          ? 'border-red-500/60 hover:border-red-400/80'
          : 'border-violet-500/60 hover:border-violet-400/80'
        : variant === 'base'
          ? 'border-indigo-500/50 hover:border-indigo-400/70'
          : 'border-slate-500/60 hover:border-slate-400/80'

  const bgClass =
    variant === 'morning'
      ? pending && !disabled ? 'bg-cyan-500/15' : 'bg-slate-800/60'
      : variant === 'school'
        ? isPenalty
          ? pending && !disabled ? 'bg-red-500/15' : 'bg-slate-800/60'
          : pending && !disabled ? 'bg-violet-500/15' : 'bg-slate-800/60'
        : variant === 'base'
          ? pending && !disabled ? 'bg-indigo-500/15' : 'bg-slate-800/70'
          : 'bg-slate-800/60'

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={completed || disabled}
      className={cn(
        'relative rounded-xl border-2 min-h-[40px] px-2 py-2 flex items-center justify-center gap-1.5 font-gaming text-[10px] font-bold uppercase tracking-wider transition touch-manipulation truncate',
        borderClass,
        bgClass,
        completed && 'opacity-50 grayscale border-slate-600/50 bg-slate-800/50 cursor-default',
        className
      )}
      whileTap={!completed && !disabled ? { scale: 0.97 } : undefined}
      aria-pressed={completed}
      aria-label={completed ? `${task.label} — выполнено` : `${task.label} — ${task.credits >= 0 ? '+' : ''}${task.credits} XP`}
    >
      {completed && isDaily && onUndo && (
        <button
          type="button"
          onClick={handleUndo}
          className="absolute top-1 right-1 z-20 w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 border border-red-400/80 shadow-md touch-manipulation transition hover:scale-110 active:scale-95"
          aria-label="Отменить действие"
          title="Отменить"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      )}
      {completed && (
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
        </span>
      )}
      <span className={cn('shrink-0', completed && 'opacity-0')} aria-hidden>
        {task.emoji}
      </span>
        <span className={cn('truncate min-w-0', completed && 'opacity-0')}>{task.label}</span>
      <span
        className={cn(
          'shrink-0 tabular-nums text-[9px]',
          completed ? 'opacity-0' : isPenalty ? 'text-red-300' : variant === 'base' ? 'text-indigo-300/90' : 'text-amber-300/90'
        )}
      >
        {task.credits >= 0 ? `+${task.credits}` : task.credits}
      </span>
    </motion.button>
  )
}

/** Food row: main + optional modifiers (compact). One cohesive unit with tight spacing. */
function FoodRow({ main, modifiers = [], getStatus, onTaskComplete, disabled, onUndo }) {
  const mainTask = normalizeTask(main, true)
  const modTasks = modifiers.map((m) => normalizeTask(m, true))
  const mainCompleted = getStatus(main.id) === 'completed'

  return (
    <div className="rounded-lg border-2 border-orange-500/50 bg-slate-800/80 overflow-hidden flex flex-col gap-0.5">
      <motion.button
        type="button"
        onClick={(e) => !mainCompleted && !disabled && onTaskComplete(mainTask, e)}
        disabled={mainCompleted || disabled}
        className={cn(
          'relative w-full min-h-[32px] h-8 px-2.5 py-1.5 flex items-center justify-center gap-1.5 font-gaming text-[9px] font-bold uppercase tracking-wider transition touch-manipulation truncate',
          modTasks.length > 0 ? 'rounded-t-lg' : 'rounded-lg',
          mainCompleted
            ? 'bg-slate-800/60 text-slate-500 opacity-60 grayscale cursor-default'
            : 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-100 hover:from-amber-500/35 hover:to-orange-500/35'
        )}
        whileTap={!mainCompleted && !disabled ? { scale: 0.98 } : undefined}
      >
        {mainCompleted && onUndo && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onUndo(mainTask) }}
            className="absolute top-0.5 right-0.5 z-20 w-6 h-6 rounded flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 border border-red-400/80 shadow touch-manipulation transition hover:scale-110 active:scale-95"
            aria-label="Отменить действие"
            title="Отменить"
          >
            <X className="w-3 h-3" strokeWidth={2.5} />
          </button>
        )}
        {mainCompleted && (
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Check className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.5} />
          </span>
        )}
        <span className={cn('shrink-0', mainCompleted && 'opacity-0')}>{main.emoji}</span>
        <span className={cn('truncate min-w-0', mainCompleted && 'opacity-0')}>{(main.shortLabel ?? main.label)}</span>
        <span className={cn('shrink-0 tabular-nums text-[8px]', mainCompleted ? 'opacity-0' : 'text-amber-300')}>
          +{main.credits}
        </span>
      </motion.button>
      {modTasks.length > 0 && (
        <div className="flex border-t border-orange-600/20 gap-0.5 px-0.5 pb-0.5">
          {modTasks.map((mod) => {
            const modCompleted = getStatus(mod.id) === 'completed'
            return (
              <motion.button
                key={mod.id}
                type="button"
                onClick={(e) => !modCompleted && !disabled && onTaskComplete(mod, e)}
                disabled={modCompleted || disabled}
                className={cn(
                  'relative flex-1 h-8 min-h-[32px] px-1.5 py-1 flex items-center justify-center gap-0.5 font-gaming text-[10px] font-bold tabular-nums transition touch-manipulation border-r border-orange-600/20 last:border-r-0 truncate rounded',
                  modCompleted
                    ? 'bg-slate-800/70 text-slate-500 opacity-60 grayscale cursor-default'
                    : 'bg-amber-700/30 text-amber-200 hover:bg-amber-700/40'
                )}
                whileTap={!modCompleted && !disabled ? { scale: 0.98 } : undefined}
              >
                {modCompleted && onUndo && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onUndo(mod) }}
                    className="absolute top-0.5 right-0.5 z-20 w-5 h-5 rounded flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 border border-red-400/80 touch-manipulation transition hover:scale-110 active:scale-95"
                    aria-label="Отменить"
                    title="Отменить"
                  >
                    <X className="w-2.5 h-2.5" strokeWidth={2.5} />
                  </button>
                )}
                <span aria-hidden className="shrink-0 text-[10px]">{mod.emoji}</span>
                <span className="truncate min-w-0 text-[10px]">{mod.label}</span>
                <span className="shrink-0 tabular-nums text-[9px]">+{mod.credits}</span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Block wrapper: header + distinct border by time-of-day. Optional headerClass for section highlight. */
function Block({ title, borderClass, headerClass, children, className }) {
  return (
    <div className={cn('rounded-xl border-2 overflow-hidden bg-slate-800/70 shadow-[0_2px_8px_rgba(0,0,0,0.25)]', borderClass, className)}>
      <div className={cn('px-2.5 py-1.5 border-b border-inherit', headerClass ?? 'bg-black/20')}>
        <h4 className="font-gaming text-[11px] font-bold uppercase tracking-wider text-slate-200">
          {title}
        </h4>
      </div>
      <div className="p-2">{children}</div>
    </div>
  )
}

/** Grade button config: Trophy Case — fixed square, 5+ gold glow, 3/2 warning style. */
const GRADE_STYLE = {
  grade_5_plus: {
    num: '5+',
    xp: 100,
    labelRu: 'Пятерка с плюсом',
    class: 'border-2 border-amber-400 bg-amber-500/30 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/60',
    textClass: 'font-extrabold',
  },
  grade_5: {
    num: '5',
    xp: 70,
    labelRu: 'Пятерка',
    class: 'border-2 border-emerald-500 bg-emerald-500/40 text-emerald-50',
    textClass: 'font-black',
  },
  grade_4: {
    num: '4',
    xp: 20,
    labelRu: 'Четвёрка',
    class: 'border-2 border-blue-500 bg-blue-500/35 text-blue-100',
    textClass: 'font-black',
  },
  grade_3: {
    num: '3',
    xp: -20,
    labelRu: 'Тройка',
    class: 'border-2 border-orange-600/80 bg-orange-600/25 text-orange-200/90',
    textClass: 'font-bold',
  },
  grade_2: {
    num: '2',
    xp: -100,
    labelRu: 'Двойка',
    class: 'border-2 border-red-600/80 bg-red-600/25 text-red-200/90',
    textClass: 'font-bold',
  },
}
const GRADE_ORDER = ['grade_5_plus', 'grade_5', 'grade_4', 'grade_3', 'grade_2']

/**
 * Chronological Supply Depot: 4 blocks (Morning, School, Food, Home).
 * Compact buttons; same getStatus/onTaskComplete contract as MissionLog.
 */
export function SupplyDepotSchedule({ getStatus, onTaskComplete, disabled, accentColor, userId, onUndoDailyTask }) {
  const morning = TASK_CONFIG.MORNING_ROUTINE.tasks || []
  const school = TASK_CONFIG.SCHOOL_INTELLECT.tasks || []
  const homework = school.filter((t) => t.id === 'homework_base' || t.id === 'homework_extra')
  const grades = school.filter((t) => t.id.startsWith('grade_'))
  const foodComposite = TASK_CONFIG.NUTRITION.foodComposite || []
  const base = TASK_CONFIG.BASE_MAINTENANCE.tasks || []
  const handleUndo = (task) => userId && onUndoDailyTask?.(userId, task)

  return (
    <div className="flex flex-col gap-3.5">
      {/* Block 1: 🌅 НАЧАЛО ДНЯ — Yellow/Cyan */}
      <Block
        title="🌅 НАЧАЛО ДНЯ"
        borderClass="border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
      >
        <div className="grid grid-cols-2 gap-1.5">
          {morning.map((t) => (
            <TaskButton
              key={t.id}
              task={normalizeTask(t, true)}
              status={getStatus(t.id)}
              onComplete={onTaskComplete}
              disabled={disabled}
              accentColor={accentColor}
              variant="morning"
              isDaily={true}
              onUndo={handleUndo}
            />
          ))}
        </div>
      </Block>

      {/* Block 2: 🏫 АКАДЕМИЯ — Golden/Intelligence highlight; Homework + Trophy Case */}
      <Block
        title="🏫 АКАДЕМИЯ"
        borderClass="border-amber-400/70 shadow-[0_0_16px_rgba(251,191,36,0.2),inset_0_1px_0_rgba(251,191,36,0.08)]"
        headerClass="bg-amber-500/10 border-amber-400/30"
      >
        <div className="space-y-2">
          {/* Homework: distinct Base (📚) and Extra (🧠) */}
          <div className="grid grid-cols-2 gap-1.5">
            {homework.map((t) => (
              <TaskButton
                key={t.id}
                task={normalizeTask(t, false)}
                status={getStatus(t.id)}
                onComplete={onTaskComplete}
                disabled={disabled}
                accentColor={accentColor}
                variant="school"
                isDaily={false}
                className={t.id === 'homework_base' ? 'bg-violet-500/15 border-violet-500/70' : 'bg-amber-500/10 border-amber-500/50'}
              />
            ))}
          </div>
          {/* Trophy Case: fixed square grades, centered */}
          <div>
            <p className="font-mono text-[9px] text-amber-200/80 uppercase tracking-wider mb-1.5">Оценки</p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {GRADE_ORDER.map((gradeId) => {
                const t = grades.find((g) => g.id === gradeId)
                if (!t) return null
                const style = GRADE_STYLE[gradeId]
                const status = getStatus(t.id)
                const task = normalizeTask(t, false)
                const completed = status === 'completed'
                return (
                  <motion.button
                    key={t.id}
                    type="button"
                    onClick={(e) => !completed && !disabled && onTaskComplete(task, e)}
                    disabled={completed || disabled}
                    className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex flex-col items-center justify-center gap-0 transition touch-manipulation shrink-0',
                      style?.class,
                      completed && 'opacity-50 grayscale border-slate-600/50 bg-slate-800/50 cursor-default'
                    )}
                    whileTap={!completed && !disabled ? { scale: 0.96 } : undefined}
                    aria-label={completed ? `${style?.labelRu} — выполнено` : `${style?.labelRu} — ${style?.xp >= 0 ? '+' : ''}${style?.xp} XP`}
                  >
                    <span className={cn('font-gaming text-lg sm:text-xl tabular-nums leading-none', style?.textClass ?? 'font-black')}>
                      {style?.num ?? t.emoji}
                    </span>
                    <span className="font-mono text-[8px] sm:text-[9px] tabular-nums mt-0.5 opacity-90">
                      {style?.xp >= 0 ? `+${style?.xp}` : style?.xp}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </Block>

      {/* Block 3: 🔋 ТОПЛИВО — Orange; compact Breakfast → Lunch → Snack → Dinner */}
      <Block
        title="🔋 ТОПЛИВО"
        borderClass="border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
      >
        <div className="space-y-1">
          {foodComposite.map((row) => (
            <FoodRow
              key={row.main.id}
              main={row.main}
              modifiers={row.modifiers || []}
              getStatus={getStatus}
              onTaskComplete={onTaskComplete}
              disabled={disabled}
              onUndo={handleUndo}
            />
          ))}
        </div>
      </Block>

      {/* Block 4: 🏠 БАЗА И СОН — Evening phase: Indigo/Slate, 2x2 grid */}
      <div className="mt-4 pt-3 border-t border-slate-600/50">
        <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-2 text-center">
          Вечер
        </p>
        <Block
          title="🏠 БАЗА И СОН"
          borderClass="border-indigo-500/50 shadow-[0_0_10px_rgba(99,102,241,0.12)]"
          headerClass="bg-indigo-500/10 border-indigo-400/20"
        >
          <div className="grid grid-cols-2 gap-2">
            {base.map((t) => (
              <TaskButton
                key={t.id}
                task={normalizeTask(t, true)}
                status={getStatus(t.id)}
                onComplete={onTaskComplete}
                disabled={disabled}
                accentColor={accentColor}
                variant="base"
                isDaily={true}
                onUndo={handleUndo}
              />
            ))}
          </div>
        </Block>
      </div>
    </div>
  )
}
