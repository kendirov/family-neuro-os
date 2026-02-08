import { useState, useEffect, useRef } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const LONG_PRESS_MS = 800

/** Display order: Mon–Fri then Sat–Sun. getDay(): 0=Sun, 1=Mon, …, 6=Sat */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABELS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']

function formatTimeFull(date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function formatDateShort(date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function Header() {
  const [now, setNow] = useState(() => new Date())
  const panelLocked = useAppStore((s) => s.panelLocked)
  const setPanelLocked = useAppStore((s) => s.setPanelLocked)
  const longPressTimerRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handlePointerDown = () => {
    clearLongPress()
    longPressTimerRef.current = setTimeout(() => {
      longPressTimerRef.current = null
      setPanelLocked(!panelLocked)
    }, LONG_PRESS_MS)
  }

  const handlePointerUp = () => clearLongPress()
  const handlePointerLeave = () => clearLongPress()
  const handleContextMenu = (e) => e.preventDefault()

  const dayIndex = now.getDay()
  const weekend = dayIndex === 0 || dayIndex === 6

  /** Index in DAY_ORDER for current day (0..6) */
  const activeDayOrderIndex = DAY_ORDER.indexOf(dayIndex)

  return (
    <header className="shrink-0 flex flex-col" role="banner">
      {/* Chrono-Stream: unified Timeline Rail (~80px) */}
      <div className="chrono-stream-rail relative min-h-[80px] flex items-stretch overflow-hidden">
        {/* Glass panel */}
        <div className="chrono-stream-glass absolute inset-0" aria-hidden />

        {/* Time Axis: horizontal line through the middle — weekday grey, weekend gold/green */}
        <div
          className="chrono-stream-axis absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 z-0"
          aria-hidden
        />

        {/* Nodes container: 7 equal columns, no gaps */}
        <div className="relative z-10 flex flex-1 w-full min-w-0">
          {DAY_ORDER.map((d, i) => {
            const isWeekend = d === 0 || d === 6
            const isActive = d === dayIndex
            const isPast = i < activeDayOrderIndex
            const isFuture = i > activeDayOrderIndex

            return (
              <div
                key={d}
                className={cn(
                  'chrono-node-cell flex flex-col items-center justify-center flex-1 min-w-0 relative',
                  isActive && 'chrono-node-cell-active'
                )}
              >
                {/* Node on the line: label above, dot on axis, meta below (active only) */}
                <div
                  className={cn(
                    'chrono-node relative flex flex-col items-center justify-center shrink-0',
                    isPast && 'chrono-node-past',
                    isActive && 'chrono-node-active',
                    isFuture && 'chrono-node-future',
                    isWeekend && !isActive && 'chrono-node-weekend'
                  )}
                  aria-current={isActive ? 'date' : undefined}
                >
                  {isActive && <span className="chrono-node-bracket" aria-hidden />}
                  <span
                    className={cn(
                      'chrono-node-label font-lcd font-bold tabular-nums order-first',
                      isActive ? 'text-base sm:text-lg' : 'text-[10px] sm:text-xs'
                    )}
                  >
                    {DAY_LABELS[i]}
                  </span>
                  <span className="chrono-node-dot" />
                  {/* Below dot for current day: date, time, "РАСПИСАНИЕ" */}
                  {isActive && (
                    <div className="chrono-current-meta flex flex-col items-center gap-0.5 min-w-0 mt-0.5">
                      <time
                        dateTime={now.toISOString()}
                        className="chrono-datetime font-lcd text-xs sm:text-sm font-bold tabular-nums text-cyan-300/95 whitespace-nowrap"
                      >
                        {formatDateShort(now)}, {formatTimeFull(now)}
                      </time>
                      <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-slate-400">
                        РАСПИСАНИЕ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Left: compact brand */}
        <div className="relative z-20 flex items-center pl-2 sm:pl-3 shrink-0">
          <span className="font-mono text-[10px] sm:text-xs font-medium tracking-widest text-slate-500 uppercase hidden sm:inline">
            ТУРБО-ГАРАЖ v2.7
          </span>
        </div>

        {/* Lock button: right edge */}
        <div className="relative z-20 flex items-center pr-2 sm:pr-3 shrink-0">
          <button
            type="button"
            className="flex items-center justify-center w-9 h-9 rounded-xl border-2 border-slate-600/80 bg-slate-800/80 text-slate-300 hover:text-slate-100 hover:border-slate-500 transition touch-manipulation select-none icon-pop"
            aria-label={panelLocked ? 'Панель заблокирована — долгое нажатие для разблокировки' : 'Панель разблокирована — долгое нажатие для блокировки'}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            onPointerCancel={handlePointerUp}
            onContextMenu={handleContextMenu}
          >
            {panelLocked ? <Lock className="w-4 h-4" strokeWidth={2.5} /> : <Unlock className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>

      {/* Status line below the rail */}
      <div
        className={cn(
          'px-4 md:px-6 py-1.5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-center border-b border-slate-700/50',
          weekend ? 'text-emerald-400/95 bg-emerald-500/10' : 'text-amber-400/95 bg-amber-500/10'
        )}
      >
        {weekend ? 'СТАТУС: ВЫХОДНОЙ (БЕЗЛИМИТ) 🏖' : 'СТАТУС: БУДНИ (ЛИМИТ 1 ЧАС) 🏫'}
      </div>
    </header>
  )
}
