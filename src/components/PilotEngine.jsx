import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Fan, Leaf, Coins, Flame } from 'lucide-react'
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

  // Get per-user time tracking for tier calculation
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  const todayGameTime = getTodayGameTime(id)
  const todayMediaTime = getTodayMediaTime(id)

  // Determine tier and zone info based on mode
  const isMediaMode = mode === 'youtube' || mode === 'good'
  const currentTime = isMediaMode ? todayMediaTime : todayGameTime

  // Zone configuration for Media (Cartoons)
  const mediaZone = useMemo(() => {
    if (currentTime < 20) {
      return {
        tier: 1,
        label: 'БЕСПЛАТНО 🎁',
        icon: Leaf,
        timerColor: 'text-green-400',
        timerBg: 'bg-green-500/10 border-green-500/50',
        badgeColor: 'bg-green-500/20 border-green-500/60 text-green-300',
        progressColor: 'bg-green-500',
        nextThreshold: 20,
        progressPercent: (currentTime / 20) * 100,
        maxScale: 20,
      }
    } else if (currentTime < 60) {
      return {
        tier: 2,
        label: 'ТАРИФ 0.5x ⭐️',
        icon: Coins,
        timerColor: 'text-yellow-400',
        timerBg: 'bg-yellow-500/10 border-yellow-500/50',
        badgeColor: 'bg-yellow-500/20 border-yellow-500/60 text-yellow-300',
        progressColor: 'bg-yellow-500',
        nextThreshold: 60,
        progressPercent: (currentTime / 60) * 100, // Overall progress from 0 to 60
        maxScale: 60,
      }
    } else {
      return {
        tier: 3,
        label: 'ПЕРЕГРУЗКА 2x 🔥',
        icon: Flame,
        timerColor: 'text-red-400',
        timerBg: 'bg-red-500/10 border-red-500/50',
        badgeColor: 'bg-red-500/20 border-red-500/60 text-red-300',
        progressColor: 'bg-red-500',
        nextThreshold: null,
        progressPercent: 100,
        maxScale: 60,
      }
    }
  }, [currentTime, isMediaMode])

  // Zone configuration for Games
  const gameZone = useMemo(() => {
    if (currentTime < 60) {
      return {
        tier: 1,
        label: 'НОРМА 1x 💠',
        timerColor: 'text-cyan-400',
        timerBg: 'bg-cyan-500/10 border-cyan-500/50',
        badgeColor: 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300',
        progressColor: 'bg-cyan-500',
        nextThreshold: 60,
        progressPercent: (currentTime / 60) * 100,
        maxScale: 60,
      }
    } else {
      return {
        tier: 2,
        label: 'ПЕРЕГРУЗКА 2x 🔥',
        timerColor: 'text-red-400',
        timerBg: 'bg-red-500/10 border-red-500/50',
        badgeColor: 'bg-red-500/20 border-red-500/60 text-red-300',
        progressColor: 'bg-red-500',
        nextThreshold: null,
        progressPercent: 100,
        maxScale: 60,
      }
    }
  }, [currentTime, isMediaMode])

  const zone = isMediaMode ? mediaZone : gameZone
  const ZoneIcon = zone.icon

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

      {/* Zone Indicator Badge */}
      {(isRunning || isPaused) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border-2 mb-2 font-gaming text-xs font-bold uppercase tracking-wider',
            zone.badgeColor,
            zone.tier === 3 && 'animate-pulse'
          )}
        >
          {ZoneIcon && <ZoneIcon className="h-4 w-4" strokeWidth={2.5} />}
          <span>{zone.label}</span>
        </motion.div>
      )}

      {/* Large digital timer + animated icon when active */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center justify-center gap-2">
          <motion.div
            className={cn(
              'font-lcd text-3xl sm:text-4xl font-black tabular-nums text-center py-3 flex-1 min-w-0 rounded-xl border-2 transition-colors duration-300',
              (isRunning || isPaused) ? zone.timerBg : 'bg-slate-900/80 border-slate-600/60',
              (isRunning || isPaused) ? zone.timerColor : 'text-slate-100',
              zone.tier === 3 && isRunning && 'animate-pulse'
            )}
          >
            {formatElapsed(Math.max(0, Math.floor(elapsedSeconds)))}
          </motion.div>
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

      {/* Tier Progress Bar: shows progress toward next tier */}
      {(isRunning || isPaused) && (
        <div className="rounded-xl border border-slate-600/60 bg-slate-900/70 backdrop-blur-sm overflow-hidden mb-4 h-8 relative">
          {/* Progress fill */}
          <motion.div
            className={cn('absolute inset-y-0 left-0 rounded-xl min-w-[4%]', zone.progressColor)}
            style={{ width: `${Math.max(4, Math.min(100, zone.progressPercent))}%` }}
            transition={{ width: { duration: 0.5 } }}
          />
          
          {/* Segment markers */}
          {isMediaMode ? (
            <>
              {/* 20 min marker (33.3% of 60 min scale) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-500/50 z-10"
                style={{ left: `${(20 / zone.maxScale) * 100}%` }}
                aria-hidden
              />
              {/* 60 min marker (100% of scale) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-500/50 z-10"
                style={{ left: '100%' }}
                aria-hidden
              />
            </>
          ) : (
            <>
              {/* 60 min marker for games */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-500/50 z-10"
                style={{ left: '100%' }}
                aria-hidden
              />
            </>
          )}
          
          {/* Progress text overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider tabular-nums drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {currentTime} мин {zone.nextThreshold ? `→ ${zone.nextThreshold} мин` : '(макс)'}
            </span>
          </div>
        </div>
      )}

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
