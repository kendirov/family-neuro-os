/**
 * StaminaTracker — RPG-style stamina bar для экранного времени.
 * Expensive Minimalism: градиенты по зонам, маркеры x1/x2/x3, цифровой секундомер.
 * UI: русский.
 */
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

const BAR_MAX_SECONDS = 7200 // 120 минут
const SAFE_SECONDS = 3600   // 60 мин
const WARNING_SECONDS = 5400 // 90 мин

/** Форматирует секунды в HH:MM:SS */
function formatStopwatch(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

/** Градиент по зоне: 0–60 safe, 60–90 warning, 90+ penalty */
function getGradientClass(elapsedSeconds) {
  if (elapsedSeconds < SAFE_SECONDS) {
    return 'bg-gradient-to-r from-emerald-500 to-cyan-500'
  }
  if (elapsedSeconds < WARNING_SECONDS) {
    return 'bg-gradient-to-r from-amber-400 to-orange-500'
  }
  return 'bg-gradient-to-r from-red-600 to-rose-500 animate-pulse'
}

export function StaminaTracker({
  type = 'ИГРЫ',
  elapsedSeconds = 0,
  isActive = false,
  /** 'default' | 'large' — large для Kids Dashboard (массивный секундомер) */
  stopwatchSize = 'default',
  /** 'cyan' | 'purple' — цвет подсветки при активной сессии */
  accentColor = 'cyan',
}) {
  const widthPercent = useMemo(
    () => Math.min((elapsedSeconds / BAR_MAX_SECONDS) * 100, 100),
    [elapsedSeconds]
  )

  const gradientClass = useMemo(
    () => getGradientClass(elapsedSeconds),
    [elapsedSeconds]
  )

  const stopwatchText = useMemo(
    () => formatStopwatch(elapsedSeconds),
    [elapsedSeconds]
  )

  return (
    <div
      className="flex flex-col gap-2"
      role="progressbar"
      aria-valuenow={elapsedSeconds}
      aria-valuemin={0}
      aria-valuemax={BAR_MAX_SECONDS}
      aria-label={`${type}: ${formatStopwatch(elapsedSeconds)}`}
    >
      {/* Label */}
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {type}
      </span>

      {/* Bar container */}
      <div className="relative h-10 w-full overflow-hidden rounded-2xl border border-white/5 bg-slate-900">
        {/* Fill */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-l-2xl transition-all duration-500',
            gradientClass
          )}
          style={{ width: `${widthPercent}%` }}
        />

        {/* Markers: 50% (60m), 75% (90m) */}
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: '50%' }}
          aria-hidden
        />
        <div
          className="absolute top-0 bottom-0 w-px bg-white/30"
          style={{ left: '75%' }}
          aria-hidden
        />

        {/* Labels above markers: x1 (safe), x2 at 60m, x3 at 90m */}
        <div className="pointer-events-none absolute inset-0">
          <span
            className="absolute font-mono text-[9px] text-white/40"
            style={{ left: '25%', transform: 'translateX(-50%)', top: 2 }}
          >
            x1
          </span>
          <span
            className="absolute font-mono text-[9px] text-white/40"
            style={{ left: '50%', transform: 'translateX(-50%)', top: 2 }}
          >
            x2
          </span>
          <span
            className="absolute font-mono text-[9px] text-white/40"
            style={{ left: '75%', transform: 'translateX(-50%)', top: 2 }}
          >
            x3
          </span>
        </div>
      </div>

      {/* Digital stopwatch — massive monospace */}
      <time
        className={cn(
          'font-mono font-bold tracking-widest tabular-nums',
          stopwatchSize === 'large' ? 'text-5xl sm:text-6xl' : 'text-4xl',
          isActive && (accentColor === 'purple' ? 'text-purple-400' : 'text-cyan-400'),
          !isActive && 'text-slate-500'
        )}
        dateTime={`PT${Math.floor(elapsedSeconds)}S`}
        style={
          isActive && accentColor === 'purple'
            ? { textShadow: '0 0 20px rgba(168,85,247,0.5)' }
            : isActive
              ? { textShadow: '0 0 20px rgba(34,211,238,0.5)' }
              : undefined
        }
      >
        {stopwatchText}
      </time>
    </div>
  )
}
