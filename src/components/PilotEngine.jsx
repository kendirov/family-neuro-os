import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Fan } from 'lucide-react'
import { useAppStore } from '@/stores/useAppStore'
import { playEngineRev, playCashRegister, playError } from '@/lib/sounds'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { cn } from '@/lib/utils'

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

/** Elapsed seconds → "00:15" or "01:05:00". */
function formatElapsed(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PILOT_CONFIG = {
  roma: {
    name: 'Рома',
    glowClass: 'shadow-[0_0_20px_rgba(34,211,238,0.4)] border-cyan-500/70',
    textClass: 'text-cyan-300',
    bgGlow: 'bg-cyan-500/10',
  },
  kirill: {
    name: 'Кирилл',
    glowClass: 'shadow-[0_0_20px_rgba(168,85,247,0.4)] border-purple-500/70',
    textClass: 'text-purple-300',
    bgGlow: 'bg-purple-500/10',
  },
}

/**
 * Single pilot engine card: header (name + avatar), large timer, big Play/Pause circle, small Stop square.
 * Border glows (cyan/purple) when RUNNING; dims with "PAUSED" overlay when PAUSED.
 */
export function PilotEngine({ id, elapsedSeconds = 0, mode = 'game', onStartRefs, onPause, onResume, onStop }) {
  const pilot = useAppStore((s) => s.pilots?.[id])
  const users = useAppStore((s) => s.users)
  const startEngineStore = useAppStore((s) => s.startEngine)
  const pauseEngineStore = useAppStore((s) => s.pauseEngine)
  const resumeEngineStore = useAppStore((s) => s.resumeEngine)
  const stopEngineStore = useAppStore((s) => s.stopEngine)

  const config = PILOT_CONFIG[id] ?? PILOT_CONFIG.roma
  const { name, glowClass, textClass, bgGlow } = config
  const status = pilot?.status ?? 'IDLE'
  const isRunning = status === 'RUNNING'
  const isPaused = status === 'PAUSED'
  const isIdle = status === 'IDLE'

  const user = users?.find((u) => u.id === id)
  const canStart = user && user.balance >= 1

  /** Total daily minutes (saved + both pilots' session) for Plasma Core stage. */
  const totalDailyMinutes = useAppStore((s) => {
    const today = getDateKey()
    const base = s.gamingToday?.dateKey === today ? (s.gamingToday?.minutes ?? 0) : 0
    return base + (s.pilots?.roma?.sessionMinutes ?? 0) + (s.pilots?.kirill?.sessionMinutes ?? 0)
  })
  const day = new Date().getDay()
  const isWeekend = day === 0 || day === 6
  const plasmaStage = isWeekend ? 3 : totalDailyMinutes >= 60 ? 2 : 1
  const plasmaFillPercent =
    isWeekend ? Math.min(100, (totalDailyMinutes / 90) * 100) : Math.min(100, (totalDailyMinutes / 60) * 100)
  const statusText =
    plasmaStage === 1 ? 'СИСТЕМА НОРМА' : plasmaStage === 2 ? 'РЕЖИМ ТУРБО (x2)' : 'БЕЗЛИМИТ'
  const plasmaBarClass =
    plasmaStage === 1
      ? 'plasma-core-liquid'
      : plasmaStage === 2
        ? 'plasma-core-plasma'
        : 'plasma-core-shimmer'
  const statusClass =
    plasmaStage === 1
      ? 'text-cyan-300'
      : plasmaStage === 2
        ? 'text-pink-300'
        : 'text-amber-300'

  const handlePlayPause = () => {
    if (isIdle) {
      if (!canStart) {
        playError()
        return
      }
      playEngineRev()
      startEngineStore(id, mode)
      if (onStartRefs) onStartRefs(id)
    } else if (isRunning) {
      pauseEngineStore(id)
      if (onPause) onPause(id)
    } else if (isPaused) {
      resumeEngineStore(id)
      if (onResume) onResume(id)
    }
  }

  const handleStop = () => {
    if (isIdle) return
    stopEngineStore(id)
    playCashRegister()
    if (onStop) onStop(id)
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border-[3px] bg-slate-800/95 p-4 overflow-hidden transition-all duration-300',
        isRunning && glowClass,
        isRunning && bgGlow,
        !isRunning && 'border-slate-600/70',
        isPaused && 'opacity-80'
      )}
    >
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 z-10 pointer-events-none">
          <span className="font-gaming text-lg font-black uppercase tracking-widest text-amber-400/90 drop-shadow-lg">
            ПАУЗА
          </span>
        </div>
      )}

      {/* Header: pixel art avatar + name */}
      <div className={cn('flex items-center gap-3 mb-3', textClass)}>
        <PilotAvatar pilotId={id} size="engine" />
        <span className="font-gaming text-base font-bold uppercase tracking-wider">{name}</span>
      </div>

      {/* Large digital timer + animated icon when active */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center justify-center gap-2">
          <div className="font-lcd text-3xl sm:text-4xl font-black tabular-nums text-center py-3 flex-1 min-w-0 rounded-xl bg-slate-900/80 border border-slate-600/60 text-slate-100">
            {formatElapsed(Math.max(0, Math.floor(elapsedSeconds)))}
          </div>
          {isRunning && (
            <motion.div
              className={cn(
                'shrink-0 w-10 h-10 rounded-xl border-2 flex items-center justify-center',
                id === 'roma' ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400' : 'border-purple-500/50 bg-purple-500/20 text-purple-400'
              )}
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              aria-hidden
            >
              <Fan className="h-5 w-5" strokeWidth={2} />
            </motion.div>
          )}
        </div>
        {(isRunning || isPaused) && pilot?.sessionBalanceAtStart != null && (
          <p className="font-mono text-[10px] text-slate-500 uppercase tracking-wider text-center">
            Осталось примерно:{' '}
            <span className="tabular-nums text-slate-400 font-bold">
              {Math.max(0, Math.floor((pilot.sessionBalanceAtStart ?? 0) - (pilot.sessionMinutes ?? 0)))} мин
            </span>
          </p>
        )}
      </div>

      {/* Plasma Core: thick bar, glass bg, stage gradient + status text */}
      <div className="rounded-xl border border-slate-600/60 bg-slate-900/70 backdrop-blur-sm overflow-hidden mb-4 h-10 relative">
        <motion.div
          className={cn(
            'absolute inset-y-0 left-0 rounded-xl min-w-[8%]',
            plasmaStage === 1 &&
              'bg-gradient-to-r from-cyan-400 via-emerald-400 to-green-400 bg-[length:200%_100%]',
            plasmaStage === 2 &&
              'bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-400 bg-[length:200%_100%]',
            plasmaStage === 3 &&
              'bg-gradient-to-r from-amber-400 via-yellow-400 to-yellow-300 bg-[length:200%_100%]',
            plasmaBarClass
          )}
          style={{ width: `${Math.max(8, plasmaFillPercent)}%` }}
          transition={{ width: { duration: 0.5 } }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className={cn(
              'font-gaming text-[10px] sm:text-xs font-bold uppercase tracking-widest drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]',
              statusClass
            )}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Controls: Burn Cycle ring + big circle (Play/Pause) + small square (Stop) */}
      <div className="flex items-center justify-center gap-3">
        <div className="relative flex items-center justify-center">
          {/* Burn Cycle: circular progress 0%→100% over 60s, resets when XP drops */}
          {(isRunning || isPaused) && (
            <svg
              className="absolute w-[72px] h-[72px] -rotate-90 pointer-events-none"
              viewBox="0 0 72 72"
              aria-hidden
            >
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                strokeWidth="3"
                className="stroke-slate-600/70"
              />
              <circle
                cx="36"
                cy="36"
                r="30"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                className={cn(
                  'burn-cycle-progress transition-[stroke-dasharray] duration-1000 ease-linear',
                  isRunning ? 'stroke-amber-400/90' : 'stroke-emerald-500/70'
                )}
                style={{
                  strokeDasharray: `${((elapsedSeconds % 60) / 60) * Math.PI * 60} ${Math.PI * 60}`,
                }}
              />
            </svg>
          )}
          <motion.button
            type="button"
            onClick={handlePlayPause}
            disabled={isIdle && !canStart}
            className={cn(
              'relative z-10 w-14 h-14 rounded-full border-[3px] flex items-center justify-center transition touch-manipulation',
              isIdle && !canStart && 'opacity-50 cursor-not-allowed',
              isRunning && 'border-amber-500/80 bg-amber-500/25 text-amber-100 hover:bg-amber-500/35',
              isPaused && 'border-emerald-500/80 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35',
              isIdle && canStart && 'border-emerald-500/80 bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35'
            )}
            whileHover={(isIdle && canStart) || !isIdle ? { scale: 1.05 } : undefined}
            whileTap={(isIdle && canStart) || !isIdle ? { scale: 0.95 } : undefined}
            aria-label={isIdle ? 'Запуск' : isRunning ? 'Пауза' : 'Продолжить'}
          >
            {isRunning ? (
              <Pause className="h-7 w-7" strokeWidth={2.5} />
            ) : (
              <Play className="h-7 w-7 ml-0.5" strokeWidth={2.5} />
            )}
          </motion.button>
        </div>
        <motion.button
          type="button"
          onClick={handleStop}
          disabled={isIdle}
          className={cn(
            'w-11 h-11 rounded-lg border-[3px] flex items-center justify-center border-red-500/80 bg-red-500/20 text-red-200 hover:bg-red-500/30 transition touch-manipulation',
            isIdle && 'opacity-40 cursor-not-allowed'
          )}
          whileHover={!isIdle ? { scale: 1.05 } : undefined}
          whileTap={!isIdle ? { scale: 0.95 } : undefined}
          aria-label="Стоп (сохранить и сбросить)"
        >
          <Square className="h-4 w-4 fill-current" strokeWidth={2} />
        </motion.button>
      </div>
    </motion.div>
  )
}
