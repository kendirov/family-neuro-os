/**
 * ReadOnlyStaminaBar — RPG-style stamina bar для экранного времени.
 * Строго из глобального store (pilots + todayTimeTracking), синхронизированного через Realtime.
 * 0–60m: Green/Cyan. 60–90m: Orange/Yellow. >90m: Red + pulse.
 */
import { useState, useEffect, useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { StaminaTracker } from './StaminaTracker'
import { cn } from '@/lib/utils'

export function ReadOnlyStaminaBar({ childId, accentColor = 'cyan' }) {
  const pilot = useAppStore((s) => s.pilots?.[childId])
  const todayTimeTracking = useAppStore((s) => s.todayTimeTracking?.[childId])
  const [tick, setTick] = useState(0)

  const timerStatus = pilot?.timerStatus ?? 'idle'
  const mode = pilot?.mode ?? null
  const timerStartAt = pilot?.timerStartAt ?? null
  const sessionElapsed = pilot?.sessionElapsed ?? 0
  const baseGameMinutes = todayTimeTracking?.game ?? 0
  const baseMediaMinutes = todayTimeTracking?.media ?? 0

  const hasActive = timerStatus === 'running'
  useEffect(() => {
    if (!hasActive) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [hasActive])

  const { gameElapsed, cartoonElapsed, gameActive, cartoonActive } = useMemo(() => {
    const isGame = mode === 'game'
    const isMedia = mode === 'youtube' || mode === 'good'
    let currentSegmentSeconds = 0
    if (timerStatus === 'running' && timerStartAt) {
      currentSegmentSeconds = Math.max(0, Math.floor((Date.now() - new Date(timerStartAt).getTime()) / 1000))
    } else if (timerStatus === 'paused') {
      currentSegmentSeconds = sessionElapsed
    }
    const baseGameSec = baseGameMinutes * 60
    const baseMediaSec = baseMediaMinutes * 60
    return {
      gameElapsed: baseGameSec + (isGame ? currentSegmentSeconds : 0),
      cartoonElapsed: baseMediaSec + (isMedia ? currentSegmentSeconds : 0),
      gameActive: isGame && hasActive,
      cartoonActive: isMedia && hasActive,
    }
  }, [baseGameMinutes, baseMediaMinutes, mode, timerStatus, timerStartAt, sessionElapsed, hasActive, tick])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'
      )}
      aria-label="Время игры и мультиков"
    >
      <h3 className="font-mono text-[10px] text-slate-500 uppercase tracking-widest shrink-0">
        Время экрана
      </h3>
      <div className="flex flex-col gap-4">
        <StaminaTracker
          type="ИГРЫ"
          elapsedSeconds={gameElapsed}
          isActive={gameActive}
          stopwatchSize="large"
          accentColor={accentColor}
        />
        <StaminaTracker
          type="МУЛЬТИКИ"
          elapsedSeconds={cartoonElapsed}
          isActive={cartoonActive}
          stopwatchSize="large"
          accentColor={accentColor}
        />
      </div>
    </div>
  )
}
