import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Square, Gamepad2, Tv, Play, Pause, Loader2, Flame } from 'lucide-react'
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
 * Single pilot engine card: header (name + avatar), large timer, mode selector, dynamic action button, stop button.
 * Border glows (cyan/purple) when RUNNING; dims with "PAUSED" overlay when PAUSED.
 * Timer display is calculated from server-authoritative state.
 */
export function PilotEngine({ id, elapsedSeconds: propElapsedSeconds, mode: initialMode = 'game', onStartRefs, onPause, onResume, onStop }) {
  const [localMode, setLocalMode] = useState(initialMode)
  const [isStarting, setIsStarting] = useState(false)
  const pilot = useAppStore((s) => s.pilots?.[id])
  const users = useAppStore((s) => s.users)
  const startTimer = useAppStore((s) => s.startTimer)
  const pauseTimer = useAppStore((s) => s.pauseTimer)
  const resumeTimer = useAppStore((s) => s.resumeTimer)
  const stopTimer = useAppStore((s) => s.stopTimer)
  
  // Calculate elapsed seconds from server-authoritative timer state
  // IF timer_status === 'idle': Display 00:00
  // IF timer_status === 'paused': Display seconds_today formatted
  // IF timer_status === 'running': Display seconds_today + (NOW() - timer_start_at)
  const calculateElapsedSeconds = (pilotState) => {
    if (!pilotState || pilotState.timerStatus === 'idle') return 0
    
    const secondsToday = pilotState.secondsToday ?? 0
    
    if (pilotState.timerStatus === 'running' && pilotState.timerStartAt) {
      const now = Date.now()
      const startMs = new Date(pilotState.timerStartAt).getTime()
      const currentSegmentSeconds = Math.floor((now - startMs) / 1000)
      return secondsToday + currentSegmentSeconds
    }
    
    // Paused: just return seconds_today
    return secondsToday
  }
  
  const [displayElapsedSeconds, setDisplayElapsedSeconds] = useState(() => calculateElapsedSeconds(pilot))
  
  // Update display every second when timer is running (UI-only counter based on server timestamp)
  // This "ticker" forces re-renders to update the calculated time display (NOW - start_at)
  // It does NOT change data, only updates the visual text "14:01", "14:02"...
  useEffect(() => {
    // Если пилот отсутствует — показываем 0
    if (!pilot) {
      setDisplayElapsedSeconds(0)
      return
    }

    // При паузе жёстко привязываемся к накопленным секундам в сторе,
    // чтобы никакие сетевые лаги не сбивали отображение.
    if (pilot.timerStatus === 'paused') {
      setDisplayElapsedSeconds(pilot.secondsToday ?? 0)
      return
    }

    // Для idle/running пересчитываем через helper
    const currentElapsed = calculateElapsedSeconds(pilot)
    setDisplayElapsedSeconds(currentElapsed)
    
    // Интервал нужен только в состоянии running
    if (pilot.timerStatus !== 'running') {
      return
    }
    
    // Set up ticker: update display every second
    // Read from store directly to get latest state (not closure)
    const interval = setInterval(() => {
      const currentPilot = useAppStore.getState().pilots?.[id]
      if (currentPilot) {
        const elapsed = calculateElapsedSeconds(currentPilot)
        setDisplayElapsedSeconds(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [pilot?.timerStatus, pilot?.timerStartAt, pilot?.secondsToday, id])
  
  const elapsedSeconds = displayElapsedSeconds

  const config = PILOT_CONFIG[id] ?? PILOT_CONFIG.roma
  const { name, glowClass, textClass, bgGlow } = config
  // Use timerStatus from server-authoritative state
  const timerStatus = pilot?.timerStatus ?? 'idle'
  const isRunning = timerStatus === 'running'
  const isPaused = timerStatus === 'paused'
  const isIdle = timerStatus === 'idle'

  const user = users?.find((u) => u.id === id)
  const canStart = user && user.balance >= 1

  // Use mode from pilot state if running/paused, otherwise use local mode
  const effectiveMode = (isRunning || isPaused) && pilot?.mode ? pilot.mode : localMode
  const isMediaMode = effectiveMode === 'youtube' || effectiveMode === 'good'

  // Get per-user time tracking for tier calculation
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  const todayGameTime = getTodayGameTime(id)
  const todayMediaTime = getTodayMediaTime(id)

  // Determine tier and zone info based on effective mode
  const currentTime = isMediaMode ? todayMediaTime : todayGameTime

  // Calculate current zone and cost for visual timeline
  const timelineZone = useMemo(() => {
    if (isMediaMode) {
      // Media mode: 0-20 = Green (Free), 20+ = Orange (Paid)
      const isGreenZone = currentTime < 20
      const cost = isGreenZone ? 0 : (currentTime < 60 ? 0.5 : 2)
      return {
        isGreenZone,
        cost,
        timerGlow: isGreenZone ? 'text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.6)]',
        timerBg: isGreenZone ? 'bg-green-500/10 border-green-500/50' : 'bg-orange-500/10 border-orange-500/50',
      }
    } else {
      // Game mode: Always paid, but simpler display
      const cost = currentTime < 60 ? 1 : 2
      return {
        isGreenZone: false,
        cost,
        timerGlow: 'text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]',
        timerBg: 'bg-cyan-500/10 border-cyan-500/50',
      }
    }
  }, [currentTime, isMediaMode])

  // Live session burn (XP consumed in current engine session for this pilot)
  const burnedXP = pilot?.sessionTotalBurned ?? 0
  const burnedLabel =
    burnedXP === 0
      ? '0'
      : Number.isInteger(burnedXP)
        ? String(burnedXP)
        : burnedXP.toFixed(1)

  const handleActionButton = async () => {
    // Prevent spamming / double-clicks while a previous action is in flight
    if (isStarting) return

    if (isIdle) {
      if (!canStart) {
        playError()
        return
      }
      setIsStarting(true)
      playEngineRev()
      try {
        await startTimer(id, effectiveMode)
        if (onStartRefs) onStartRefs(id)
      } catch (e) {
        console.error('Failed to start timer:', e)
        playError()
      } finally {
        // Short cooldown so UI and Supabase stay in sync
        setTimeout(() => {
          setIsStarting(false)
        }, 500)
      }
    } else if (isRunning) {
      setIsStarting(true)
      pauseTimer(id)
      if (onPause) onPause(id)
      setTimeout(() => {
        setIsStarting(false)
      }, 500)
    } else if (isPaused) {
      setIsStarting(true)
      resumeTimer(id)
      if (onResume) onResume(id)
      setTimeout(() => {
        setIsStarting(false)
      }, 500)
    }
  }
  
  const handleModeChange = (newMode) => {
    if (isRunning || isPaused) return // Don't allow mode change during active session
    setLocalMode(newMode)
  }

  const handleStop = () => {
    if (isIdle) return
    stopTimer(id)
    playCashRegister()
    if (onStop) onStop(id)
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl border-[3px] bg-slate-800/95 p-4 overflow-hidden transition-all duration-300 flex flex-col gap-3',
        isRunning && glowClass,
        isRunning && bgGlow,
        !isRunning && 'border-slate-600/70'
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
      <div className={cn('flex items-center gap-2', textClass)}>
        <PilotAvatar pilotId={id} size="engine" />
        <span className="font-gaming text-base font-bold uppercase tracking-wider">{name}</span>
      </div>

      {/* Mode Switcher: Top (only changeable when idle) */}
      <div className="mt-1">
        <div className="flex gap-1.5 rounded-xl border-2 border-slate-600/60 bg-slate-900/60 p-1">
          <button
            type="button"
            onClick={() => handleModeChange('game')}
            disabled={isRunning || isPaused}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-gaming text-[11px] font-bold uppercase transition-all touch-manipulation',
              effectiveMode === 'game'
                ? 'bg-cyan-500/25 border-2 border-cyan-500/60 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-slate-300 border-2 border-transparent',
              (isRunning || isPaused) && effectiveMode !== 'game' && 'opacity-50 cursor-not-allowed',
              (isRunning || isPaused) && effectiveMode === 'game' && 'cursor-default'
            )}
            title={(isRunning || isPaused) ? 'Режим активной сессии' : 'Выбрать режим'}
          >
            <Gamepad2 className="h-4 w-4" strokeWidth={2.5} />
            <span>🎮 ИГРЫ</span>
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('youtube')}
            disabled={isRunning || isPaused}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg font-gaming text-[11px] font-bold uppercase transition-all touch-manipulation',
              isMediaMode
                ? 'bg-orange-500/25 border-2 border-orange-500/60 text-orange-300 shadow-[0_0_10px_rgba(251,146,60,0.3)]'
                : 'text-slate-400 hover:text-slate-300 border-2 border-transparent',
              (isRunning || isPaused) && !isMediaMode && 'opacity-50 cursor-not-allowed',
              (isRunning || isPaused) && isMediaMode && 'cursor-default'
            )}
            title={(isRunning || isPaused) ? 'Режим активной сессии' : 'Выбрать режим'}
          >
            <Tv className="h-4 w-4" strokeWidth={2.5} />
            <span>📺 МУЛЬТИКИ</span>
          </button>
        </div>
      </div>

      {/* Center: Time Display + burn indicator + primary controls (compact stack) */}
      <div className="flex flex-col items-center justify-center flex-1 min-h-[96px] gap-1.5">
        <motion.div
          className={cn(
            'font-mono text-4xl sm:text-5xl font-black tabular-nums text-center transition-all duration-300',
            (isRunning || isPaused) ? timelineZone.timerGlow : 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]'
          )}
        >
          {formatElapsed(Math.max(0, Math.floor(elapsedSeconds)))}
        </motion.div>
        {/* Real-time fuel burn indicator (XP consumed this session) */}
        {(isRunning || isPaused) && burnedXP > 0 && (
          <div className="flex items-center gap-1 font-mono text-xs text-orange-400 opacity-80 animate-pulse">
            <Flame className="w-3.5 h-3.5" strokeWidth={2.5} />
            <span>-{burnedLabel} XP</span>
          </div>
        )}
        
        {/* Cost Display */}
        {(isRunning || isPaused) && (
          <div className="mt-1 text-center">
            <span className={cn(
              'font-mono text-xs font-bold uppercase tracking-wider',
              timelineZone.isGreenZone ? 'text-green-400' : 'text-orange-400'
            )}>
              COST: {timelineZone.cost === 0 ? '0' : `-${timelineZone.cost}`} XP/min
            </span>
          </div>
        )}
      </div>

      {/* Visual Timeline Bar: Below Time Display */}
      {(isRunning || isPaused) && isMediaMode && (
        <div className="mb-3">
          <div className="relative h-12 rounded-xl border-2 border-slate-600/60 bg-slate-900/80 overflow-hidden">
            {/* Green Zone (0-20 mins): БОНУС */}
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 via-emerald-400 to-green-500"
              style={{ width: '33.33%' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-gaming text-[10px] font-bold uppercase text-green-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]">
                  БОНУС
                </span>
              </div>
            </div>
            
            {/* Orange Zone (20+ mins): ТАРИФ */}
            <div 
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500"
              style={{ left: '33.33%', width: '66.67%' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-gaming text-[10px] font-bold uppercase text-orange-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.3)]">
                  ТАРИФ
                </span>
              </div>
            </div>
            
            {/* Zone divider at 20 mins */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 z-10 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
              style={{ left: '33.33%' }}
              aria-hidden
            />
            
            {/* White Needle/Marker: moves based on current_minutes */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ 
                left: `${Math.min(100, Math.max(0, (currentTime / 60) * 100))}%`,
                transform: 'translateX(-50%)'
              }}
              transition={{ left: { duration: 0.3, ease: 'easeOut' } }}
              aria-hidden
            >
              {/* Needle pointer */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-white" />
            </motion.div>
          </div>
        </div>
      )}
      
      {/* Simplified timeline for Game mode */}
      {(isRunning || isPaused) && !isMediaMode && (
        <div className="mb-3">
          <div className="relative h-8 rounded-xl border-2 border-slate-600/60 bg-slate-900/80 overflow-hidden">
            {/* Cyan fill for game mode */}
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500"
              style={{ width: `${Math.min(100, (currentTime / 60) * 100)}%` }}
              transition={{ width: { duration: 0.3 } }}
            />
            
            {/* White needle */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white z-20 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{ 
                left: `${Math.min(100, Math.max(0, (currentTime / 60) * 100))}%`,
                transform: 'translateX(-50%)'
              }}
              transition={{ left: { duration: 0.3, ease: 'easeOut' } }}
              aria-hidden
            />
          </div>
        </div>
      )}

      {/* Controls: Primary Button + Stop Button (tight row) */}
      <div className="flex items-center justify-center gap-3 mt-1">
        {/* Primary Button: Huge Round Play/Pause */}
        <motion.button
          type="button"
          onClick={handleActionButton}
          disabled={(isIdle && !canStart) || isStarting}
          className={cn(
            'relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-[3px] transition-all touch-manipulation flex items-center justify-center shadow-2xl',
            isIdle && !canStart && 'cursor-not-allowed border-slate-600 bg-slate-700/80',
            // Старт / Продолжить — всегда яркая, сочная кнопка
            (isIdle && canStart) && 'bg-gradient-to-br from-emerald-500 to-blue-500 border-emerald-400/80 hover:scale-105 active:scale-95 animate-pulse',
            isRunning && 'bg-gradient-to-br from-amber-500 to-yellow-500 border-amber-400/80 hover:scale-105 active:scale-95',
            isPaused && 'bg-gradient-to-br from-emerald-500 to-blue-500 border-emerald-400/80 hover:scale-105 active:scale-95',
            // Во время сетевых операций просто блокируем клики, но НЕ тускним
            isStarting && 'pointer-events-none'
          )}
          whileHover={(isIdle && canStart && !isStarting) || !isIdle ? { scale: 1.05 } : undefined}
          whileTap={(isIdle && canStart && !isStarting) || !isIdle ? { scale: 0.95 } : undefined}
          aria-label={isIdle ? 'Старт' : isRunning ? 'Пауза' : 'Продолжить'}
          >
          {isStarting ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" strokeWidth={3} />
          ) : isIdle ? (
            <Play className="w-9 h-9 sm:w-10 sm:h-10 text-white ml-0.5" strokeWidth={3} fill="currentColor" />
          ) : isRunning ? (
            <Pause className="w-9 h-9 sm:w-10 sm:h-10 text-white" strokeWidth={3} fill="currentColor" />
          ) : (
            // Paused state: show Play icon, label says "Продолжить"
            <Play className="w-9 h-9 sm:w-10 sm:h-10 text-white ml-0.5" strokeWidth={3} fill="currentColor" />
          )}
        </motion.button>

        {/* Stop Button: Small, Right */}
        <motion.button
          type="button"
          onClick={handleStop}
          disabled={isIdle}
          className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all touch-manipulation shadow-lg',
            isIdle
              ? 'opacity-40 cursor-not-allowed border-slate-600 bg-slate-700/30 text-slate-500'
              : 'border-red-500/80 bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-200 hover:bg-red-500/30 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
          )}
          whileHover={!isIdle ? { scale: 1.05 } : undefined}
          whileTap={!isIdle ? { scale: 0.95 } : undefined}
          aria-label="Стоп (сохранить и сбросить)"
        >
          <Square className="w-5 h-5 sm:w-6 sm:h-6 fill-current" strokeWidth={2.5} />
        </motion.button>
      </div>
    </motion.div>
  )
}
