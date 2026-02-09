import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Star } from 'lucide-react'
import { TASK_CONFIG } from '@/data/taskConfig'
import { TaskGroup } from '@/components/TaskGroup'
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
function TaskButton({
  task,
  status,
  onComplete,
  disabled,
  accentColor,
  className,
  variant = 'default',
  isDaily = false,
  onUndo,
  size = 'default', // 'default' | 'small'
  isGodMode = false, // only commanders/admins can undo
}) {
  const completed = status === 'completed'
  const pending = status === 'pending'
  const isPenalty = task.credits < 0
  const handleClick = (e) => {
    // Main action is disabled for completed tasks or when column is locked/read-only
    if (completed || disabled) return
    onComplete(task, e)
  }
  const handleUndoClick = (e) => {
    e.stopPropagation()
    // Do not allow undo when:
    // - task is not completed
    // - there is no handler
    // - column is in read-only/locked mode
    // - user is not in god/admin mode
    if (!completed || !onUndo || disabled || !isGodMode) return
    onUndo(task, e)
  }

  // Default state: dark background, thin border
  // Special styling for bonus buttons (variant="base" + size="small") - make them brighter
  const isBonusButton = variant === 'base' && size === 'small'
  
  const defaultBorderClass = isBonusButton
    ? 'border-amber-500/60 hover:border-amber-400/80'
    : 'border-slate-600'
  const defaultBgClass = isBonusButton
    ? 'bg-amber-500/20 hover:bg-amber-500/30'
    : 'bg-slate-800'
  const defaultTextClass = isBonusButton
    ? 'text-amber-200'
    : 'text-slate-200'

  // Completed state: bright background, solid border, DARK text (high contrast)
  const completedBorderClass = completed && !isPenalty
    ? 'border-green-400'
    : completed && isPenalty
      ? 'border-red-500'
      : defaultBorderClass

  const completedBgClass = completed && !isPenalty
    ? 'bg-green-400'
    : completed && isPenalty
      ? 'bg-red-500'
      : defaultBgClass

  // CRITICAL: Dark text on bright background for readability
  const completedTextClass = completed
    ? 'text-slate-900 font-black'
    : defaultTextClass

  // Size-specific classes - allow buttons to grow, prevent text clipping
  // Bonus buttons (variant="base" + size="small") get extra compact styling
  const sizeClass = isBonusButton
    ? 'h-auto min-h-[32px] px-1 py-2 rounded-full text-[9px]'
    : size === 'small'
      ? 'h-auto min-h-[32px] px-1 py-2 rounded-full text-[11px]'
      : 'h-auto min-h-[42px] px-1 py-2 rounded-xl text-[11px]'

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      // IMPORTANT: do NOT disable button just because it's completed,
      // otherwise nested Undo button will never receive click events.
      disabled={disabled}
      className={cn(
        'relative border-2 flex items-center justify-center gap-1.5 font-sans font-semibold capitalize tracking-wide transition touch-manipulation whitespace-normal text-center leading-tight break-words',
        sizeClass,
        // Default state styling
        !completed && defaultBorderClass,
        !completed && defaultBgClass,
        !completed && defaultTextClass,
        !completed && !isBonusButton && 'hover:bg-slate-700 hover:border-slate-500 hover:text-slate-100',
        !completed && isBonusButton && 'hover:bg-amber-500/40 hover:border-amber-400 hover:text-amber-100',
        // Completed state styling (achievement unlocked)
        completed && completedBorderClass,
        completed && completedBgClass,
        completed && completedTextClass,
        completed && 'cursor-default',
        // CRITICAL: Disabled state must maintain 100% vibrancy - no opacity/grayscale
        disabled && 'opacity-100 cursor-default',
        className
      )}
      whileTap={!completed && !disabled ? { scale: 0.97 } : undefined}
      whileHover={!completed && !disabled ? { scale: 1.02 } : undefined}
      aria-pressed={completed}
      aria-label={completed ? `${task.label} — выполнено` : `${task.label} — ${task.credits >= 0 ? '+' : ''}${task.credits} XP`}
    >
      {/* Undo icon: ONLY show if user has edit permissions (not disabled/read-only) */}
      {completed && isDaily && onUndo && !disabled && isGodMode && (
        <button
          type="button"
          onClick={handleUndoClick}
          className="absolute top-1 right-1 z-20 w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/90 text-white hover:bg-red-500 border border-red-400/80 shadow-md touch-manipulation transition hover:scale-110 active:scale-95 pointer-events-auto cursor-pointer"
          aria-label="Отменить действие"
          title="Отменить"
        >
          <X className="w-4 h-4" strokeWidth={2.5} />
        </button>
      )}
      {/* Achievement icon: Star for rewards, Check for penalties - DARK for contrast */}
      {completed && size !== 'small' && (
        <span className="shrink-0 mr-0.5 flex items-center justify-center pointer-events-none">
          {isPenalty ? (
            <X className="w-4 h-4 text-slate-900" strokeWidth={3} />
          ) : (
            <Star className="w-4 h-4 text-slate-900 fill-slate-900" strokeWidth={2} />
          )}
        </span>
      )}
      <span className="shrink-0 text-base leading-none" aria-hidden>
        {task.emoji}
      </span>
      <span className={cn(
        'min-w-0 leading-tight text-center break-words font-sans',
        completed 
          ? 'font-bold text-slate-900' 
          : 'font-semibold text-slate-200'
      )}>
        {task.label}
      </span>
      <span
        className={cn(
          'shrink-0 tabular-nums font-sans font-semibold leading-tight',
          size === 'small' ? 'text-[10px]' : 'text-[11px]',
          completed
            ? 'text-slate-900'
            : isPenalty
              ? 'text-red-300'
              : variant === 'base'
                ? 'text-indigo-300/90'
                : 'text-amber-300/90'
        )}
      >
        {task.credits >= 0 ? `+${task.credits}` : task.credits}
      </span>
    </motion.button>
  )
}

/** Food row: main + optional modifiers (compact). One cohesive unit with tight spacing. */
function FoodRow({ main, modifiers = [], getStatus, onTaskComplete, disabled, onUndo, isGodMode = false }) {
  const mainTask = normalizeTask(main, true)
  const modTasks = modifiers.map((m) => normalizeTask(m, true))
  const mainCompleted = getStatus(main.id) === 'completed'

  return (
    <div className="rounded-lg border-2 border-orange-500/50 bg-slate-800/80 overflow-hidden flex flex-col gap-0.5">
      <motion.button
        type="button"
        onClick={(e) => !mainCompleted && !disabled && onTaskComplete(mainTask, e)}
        // keep column-level disabled, but do NOT disable just because completed,
        // so that nested Undo button can still be clicked in commander view
        disabled={disabled}
        className={cn(
          'relative w-full h-auto min-h-[32px] px-1 py-2 flex items-center justify-center gap-1.5 font-sans text-[9px] font-semibold capitalize tracking-wide transition touch-manipulation whitespace-normal leading-tight break-words',
          modTasks.length > 0 ? 'rounded-t-lg' : 'rounded-lg',
          mainCompleted
            ? 'bg-slate-800/60 text-slate-500 opacity-60 grayscale cursor-default'
            : 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-100 hover:from-amber-500/35 hover:to-orange-500/35'
        )}
        whileTap={!mainCompleted && !disabled ? { scale: 0.98 } : undefined}
      >
        {/* Undo icon: ONLY show if user has edit permissions (not disabled/read-only) */}
        {mainCompleted && onUndo && !disabled && isGodMode && (
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
          <span className="absolute top-0.5 left-0.5 z-10 flex items-center justify-center pointer-events-none">
            <Check className="h-3.5 w-3.5 text-emerald-400 drop-shadow-[0_0_4px_rgba(52,211,153,0.9)]" strokeWidth={2.5} />
          </span>
        )}
        <span className="shrink-0 text-base leading-none">{main.emoji}</span>
        <span
          className={cn(
            'min-w-0 break-words text-center font-sans font-semibold capitalize tracking-wide',
            mainCompleted ? 'line-through text-slate-500' : 'text-slate-200'
          )}
        >
          {main.shortLabel ?? main.label}
        </span>
        <span
          className={cn(
            'shrink-0 tabular-nums font-sans font-semibold text-[8px]',
            mainCompleted ? 'line-through text-slate-400/80' : 'text-amber-300'
          )}
        >
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
                // do not fully disable when completed to allow nested Undo button
                disabled={disabled}
                className={cn(
                  'relative flex-1 h-auto min-h-[32px] px-1 py-2 flex items-center justify-center gap-0.5 font-sans text-[9px] font-semibold tabular-nums transition touch-manipulation border-r border-orange-600/20 last:border-r-0 whitespace-normal leading-tight break-words rounded',
                  modCompleted
                    ? 'bg-slate-800/70 text-slate-500 opacity-60 grayscale cursor-default'
                    : 'bg-amber-700/30 text-amber-200 hover:bg-amber-700/40'
                )}
                whileTap={!modCompleted && !disabled ? { scale: 0.98 } : undefined}
              >
                {/* Undo icon: ONLY show if user has edit permissions (not disabled/read-only) */}
                {modCompleted && onUndo && !disabled && isGodMode && (
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
                <span aria-hidden className="shrink-0 text-base leading-none">{mod.emoji}</span>
                <span className="min-w-0 break-words text-center text-[9px] font-sans font-semibold capitalize tracking-wide text-slate-200">{mod.label}</span>
                <span className="shrink-0 tabular-nums font-sans font-semibold text-[9px] text-amber-300">+{mod.credits}</span>
              </motion.button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Grade button config: Trophy Case — fixed square, 5+ gold glow, 3/2 warning style. */
const GRADE_STYLE = {
  grade_5_plus: {
    num: '5+',
    xp: 50,
    labelRu: 'Пятерка с плюсом',
    class: 'border-2 border-amber-400 bg-amber-500/30 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/60',
    textClass: 'font-extrabold',
  },
  grade_5: {
    num: '5',
    xp: 40,
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
    xp: -10,
    labelRu: 'Тройка',
    class: 'border-2 border-orange-600/80 bg-orange-600/25 text-orange-200/90',
    textClass: 'font-bold',
  },
  grade_2: {
    num: '2',
    xp: -50,
    labelRu: 'Двойка',
    class: 'border-2 border-red-600/80 bg-red-600/25 text-red-200/90',
    textClass: 'font-bold',
  },
}
const GRADE_ORDER = ['grade_5_plus', 'grade_5', 'grade_4', 'grade_3', 'grade_2']

/**
 * Chronological Supply Depot: 5 control blocks (Daily Routine, Nutrition, School, Base Support, Penalty Box-style handled in parent).
 * Compact buttons; same getStatus/onTaskComplete contract as MissionLog.
 * isGodMode: true only for commander/admin views (allows undo).
 */
export function SupplyDepotSchedule({ getStatus, onTaskComplete, disabled, accentColor, userId, onUndoDailyTask, isGodMode = false }) {
  const morning = TASK_CONFIG.MORNING_ROUTINE.tasks || []
  const school = TASK_CONFIG.SCHOOL_INTELLECT.tasks || []
  const grades = school.filter((t) => t.id.startsWith('grade_'))
  const foodComposite = TASK_CONFIG.NUTRITION.foodComposite || []
  const foodBonus = TASK_CONFIG.NUTRITION.bonus || []
  const base = TASK_CONFIG.BASE_MAINTENANCE.tasks || []
  const handleUndo = (task) => userId && onUndoDailyTask?.(userId, task)

  // Map into logical control blocks with chronological structure
  const morningTasks = [
    morning.find((t) => t.id === 'wake_up'),
    morning.find((t) => t.id === 'teeth_morning'),
    morning.find((t) => t.id === 'make_bed'),
  ].filter(Boolean)
  
  const dayTasks = [] // Can add daytime tasks here if needed
  
  const eveningTasks = [
    base.find((t) => t.id === 'sleep_time'),
  ].filter(Boolean)

  const nutritionMainMeals = foodComposite.filter((row) =>
    ['breakfast', 'lunch', 'dinner'].includes(row.main.id)
  )
  const nutritionSnack = foodComposite.find((row) => row.main.id === 'snack')

  const schoolRoutine = [
    school.find((t) => t.id === 'school_leave'),
    school.find((t) => t.id === 'pack_bag'),
  ].filter(Boolean)

  const baseSupport = [
    base.find((t) => t.id === 'help_clean'),
    base.find((t) => t.id === 'take_trash'),
    base.find((t) => t.id === 'go_store'),
  ].filter(Boolean)

  // Debounce map for grade buttons (500ms between clicks per grade id, but keep repeatable)
  const lastGradeClickRef = useRef({})
  // Ripple animation state per grade button
  const [gradeRipples, setGradeRipples] = useState({})

  const handleGradeClick = (task, event) => {
    if (disabled) return
    const now = Date.now()
    const last = lastGradeClickRef.current[task.id] || 0
    if (now - last < 500) {
      return
    }
    lastGradeClickRef.current[task.id] = now
    
    // Trigger ripple animation
    setGradeRipples((prev) => ({ ...prev, [task.id]: Date.now() }))
    setTimeout(() => {
      setGradeRipples((prev) => {
        const next = { ...prev }
        delete next[task.id]
        return next
      })
    }, 600)
    
    onTaskComplete(task, event)
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Block 1: РЕЖИМ ДНЯ — Chronological structure with sub-sections */}
      <TaskGroup
        title="РЕЖИМ ДНЯ"
        titleColor="text-blue-400"
        headerClass="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border-b-2 border-blue-500/60"
        bodyClass="pt-2 space-y-4"
        className="bg-slate-800/70 border-blue-500/60"
      >
        {/* 🌅 Утро Section */}
        <div>
          <h4 className="font-gaming text-xs font-bold text-yellow-400 mb-2 uppercase tracking-wider">
            🌅 Утро
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {morningTasks.map((t) => (
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
                isGodMode={isGodMode}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        {morningTasks.length > 0 && (dayTasks.length > 0 || eveningTasks.length > 0) && (
          <hr className="border-t border-slate-600/30 my-2" />
        )}

        {/* ☀️ День Section */}
        {dayTasks.length > 0 && (
          <>
            <div>
              <h4 className="font-gaming text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider mt-4">
                ☀️ День
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {dayTasks.map((t) => (
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
                    isGodMode={isGodMode}
                  />
                ))}
              </div>
            </div>
            {/* Divider */}
            {eveningTasks.length > 0 && (
              <hr className="border-t border-slate-600/30 my-2" />
            )}
          </>
        )}

        {/* 🌙 Вечер Section */}
        {eveningTasks.length > 0 && (
          <div>
            <h4 className="font-gaming text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider mt-4">
              🌙 Вечер
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {eveningTasks.map((t) => (
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
                  isGodMode={isGodMode}
                />
              ))}
            </div>
          </div>
        )}
      </TaskGroup>

      {/* Block 2: ПИТАНИЕ — main meals row + bonus buttons */}
      <TaskGroup
        title="ПИТАНИЕ"
        titleColor="text-yellow-400"
        headerClass="bg-gradient-to-r from-amber-900/40 to-orange-900/40 border-b-2 border-amber-500/60"
        bodyClass="pt-2 space-y-3"
        className="bg-slate-800/70 border-amber-500/60"
      >
        {/* Meal Rows: Завтрак / Обед / Ужин */}
        {nutritionMainMeals.map((row) => {
          const main = normalizeTask(row.main, true)
          return (
            <div key={main.id} className="mb-3 space-y-2">
              {/* Row 1: Main Meal Button (Full Width) */}
              <FoodRow
                main={row.main}
                modifiers={row.modifiers ?? []}
                getStatus={getStatus}
                onTaskComplete={onTaskComplete}
                disabled={disabled}
                onUndo={handleUndo}
                isGodMode={isGodMode}
              />
              {/* Row 2: Bonus tags container (below main meal) */}
              {foodBonus.length > 0 && (
                <div className="flex gap-1 justify-center">
                  {foodBonus.map((bonus) => {
                    const bonusTask = normalizeTask(bonus, true)
                    return (
                      <TaskButton
                        key={`${bonusTask.id}-${main.id}`}
                        task={bonusTask}
                        status={getStatus(bonusTask.id)}
                        onComplete={onTaskComplete}
                        disabled={disabled}
                        accentColor={accentColor}
                        variant="base"
                        isDaily={true}
                        onUndo={handleUndo}
                        isGodMode={isGodMode}
                        size="small"
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Extra meal: Полдник */}
        {nutritionSnack && (
          <div className="pt-1">
            <TaskButton
              key={nutritionSnack.main.id}
              task={normalizeTask(nutritionSnack.main, true)}
              status={getStatus(nutritionSnack.main.id)}
              onComplete={onTaskComplete}
              disabled={disabled}
              accentColor={accentColor}
              variant="morning"
              isDaily={true}
              onUndo={handleUndo}
              isGodMode={isGodMode}
              className="w-full"
            />
          </div>
        )}
      </TaskGroup>

      {/* Block 3: ШКОЛА — routine grid + compact grades row */}
      <TaskGroup
        title="ШКОЛА"
        titleColor="text-purple-400"
        headerClass="bg-gradient-to-r from-purple-900/40 to-violet-900/40 border-b-2 border-purple-500/60"
        bodyClass="pt-2 space-y-3"
        className="bg-slate-800/70 border-purple-500/60"
      >
        {/* Routine: Ушел вовремя / Собрал портфель */}
        {schoolRoutine.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {schoolRoutine.map((t) => (
              <TaskButton
                key={t.id}
                task={normalizeTask(t, true)}
                status={getStatus(t.id)}
                onComplete={onTaskComplete}
                disabled={disabled}
                accentColor={accentColor}
                variant="school"
                isDaily={true}
                onUndo={handleUndo}
                isGodMode={isGodMode}
              />
            ))}
          </div>
        )}
        
        {/* Grades: Compact row */}
        {grades.length > 0 && (
          <div className="pt-1">
            <h4 className="font-gaming text-xs font-bold text-purple-300 uppercase tracking-wider mb-2">
              ОЦЕНКИ СЕГОДНЯ
            </h4>
            <div className="flex flex-wrap gap-1 justify-between">
              {GRADE_ORDER.map((gradeId) => {
                const t = grades.find((g) => g.id === gradeId)
                if (!t) return null
                const style = GRADE_STYLE[gradeId]
                const task = normalizeTask(t, false)
                const hasRipple = gradeRipples[task.id] !== undefined
                const isGoldGrade = gradeId === 'grade_5_plus'
                const isRedGrade = gradeId === 'grade_2'
                
                // Special glow classes for 5+ (gold) and 2 (red flash)
                const specialGlowClass = hasRipple
                  ? isGoldGrade
                    ? 'shadow-[0_0_20px_rgba(251,191,36,0.8),0_0_30px_rgba(251,191,36,0.5)] ring-2 ring-amber-400/60'
                    : isRedGrade
                      ? 'shadow-[0_0_20px_rgba(239,68,68,0.8),0_0_30px_rgba(239,68,68,0.5)] ring-2 ring-red-500/60'
                      : 'shadow-[0_0_15px_rgba(16,185,129,0.6)] ring-1 ring-green-400/40'
                  : ''
                
                // Grades are intentionally always "pending" to keep them repeatable
                return (
                  <motion.div
                    key={t.id}
                    className="relative w-9 h-9 shrink-0"
                    initial={false}
                    animate={hasRipple ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    {/* Ripple effect overlay */}
                    {hasRipple && (
                      <motion.div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={{
                          background: isGoldGrade
                            ? 'radial-gradient(circle, rgba(251,191,36,0.6) 0%, transparent 70%)'
                            : isRedGrade
                              ? 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)'
                              : 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
                        }}
                      />
                    )}
                    <motion.button
                      type="button"
                      onClick={(e) => handleGradeClick(task, e)}
                      disabled={disabled}
                      className={cn(
                        'relative w-full h-full rounded-lg flex flex-col items-center justify-center gap-0 p-1 transition touch-manipulation',
                        style?.class,
                        specialGlowClass,
                        // CRITICAL: Disabled state must maintain 100% vibrancy - no opacity/grayscale
                        disabled && 'opacity-100 cursor-default'
                      )}
                      whileTap={!disabled ? { scale: 0.95 } : undefined}
                      aria-label={`${style?.labelRu} — ${style?.xp >= 0 ? '+' : ''}${style?.xp} XP (повторяемая)`}
                    >
                      <span
                        className={cn(
                          'font-gaming text-xs font-bold tabular-nums leading-none relative z-10',
                          style?.textClass ?? 'font-black'
                        )}
                      >
                        {style?.num ?? t.emoji}
                      </span>
                      <span className="font-mono text-[7px] tabular-nums leading-tight opacity-90 relative z-10">
                        {style?.xp >= 0 ? `+${style?.xp}` : style?.xp}
                      </span>
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}
      </TaskGroup>

      {/* Block 4: ПОМОЩЬ — Base support 2-column grid */}
      <TaskGroup
        title="ПОМОЩЬ"
        titleColor="text-emerald-400"
        headerClass="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border-b-2 border-emerald-500/60"
        bodyClass="pt-2"
        className="bg-slate-800/70 border-emerald-500/60"
      >
        <div className="grid grid-cols-2 gap-2">
          {baseSupport.map((t) => (
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
              isGodMode={isGodMode}
            />
          ))}
        </div>
      </TaskGroup>
    </div>
  )
}
