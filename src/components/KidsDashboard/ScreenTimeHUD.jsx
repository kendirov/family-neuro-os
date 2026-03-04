/**
 * ScreenTimeHUD — Radial HUD Energy Rings.
 * Два светящихся SVG-кольца: ИГРЫ (Cyan), МУЛЬТИКИ (Orange/Pink).
 * Анимация strokeDashoffset через framer-motion.
 * Glassmorphism-карточка, компактный вид.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'
import { useRealtimeTimer } from '@/hooks/useRealtimeTimer'
import { cn } from '@/lib/utils'

const SAFE_THRESHOLD_SEC = 3600 // 60 мин
const BAR_MAX_SEC = 7200 // 120 мин

/** Форматирует секунды в MM:SS или HH:MM:SS */
function formatStopwatch(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const RING_SIZE = 88
const STROKE_WIDTH = 8
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2
const CENTER = RING_SIZE / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Одно энергетическое кольцо: track (тёмный) + progress (градиент, glow).
 * strokeDashoffset: 0 = полное, circumference = пустое.
 */
function EnergyRing({ type, elapsedSeconds, isActive, isGames, isPenalty }) {
  const progress = Math.min(elapsedSeconds / BAR_MAX_SEC, 1)
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress)

  const gradientId = `ring-grad-${isGames ? 'games' : 'media'}`
  const filterId = `ring-glow-${isGames ? 'games' : 'media'}`

  const timeColorClass = isActive
    ? isPenalty
      ? 'text-orange-200'
      : isGames
        ? 'text-cyan-300'
        : 'text-amber-300'
    : 'text-slate-500'

  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="progressbar"
      aria-valuenow={elapsedSeconds}
      aria-valuemin={0}
      aria-valuemax={BAR_MAX_SEC}
      aria-label={`${type}: ${formatStopwatch(elapsedSeconds)}`}
    >
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
        {type}
      </span>

      <div className="relative" style={{ width: RING_SIZE, height: RING_SIZE }}>
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="overflow-visible"
        >
          <defs>
            {/* Градиент для progress stroke */}
            <linearGradient
              id={gradientId}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              {isPenalty ? (
                <>
                  <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
                  <stop offset="50%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f87171" stopOpacity="1" />
                </>
              ) : isGames ? (
                <>
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="1" />
                  <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                  <stop offset="50%" stopColor="#fb923c" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="1" />
                </>
              )}
            </linearGradient>

            {/* Neon glow: тяжёлый drop-shadow */}
            <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track: тёмный полупрозрачный круг */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={STROKE_WIDTH}
          />

          {/* Progress: градиент + glow, анимация strokeDashoffset */}
          <motion.circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            filter={`url(#${filterId})`}
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${CENTER}px ${CENTER}px`,
            }}
            initial={false}
            animate={{ strokeDashoffset }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, mass: 0.8 }}
          />
        </svg>

        {/* Центр: время в цифровом шрифте */}
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-mono text-xl sm:text-2xl font-black tabular-nums',
            timeColorClass
          )}
          style={
            isActive && !isPenalty
              ? isGames
                ? { textShadow: '0 0 16px rgba(34,211,238,0.8), 0 0 32px rgba(34,211,238,0.4)' }
                : { textShadow: '0 0 16px rgba(251,146,60,0.8), 0 0 32px rgba(251,146,60,0.4)' }
              : isPenalty
                ? { textShadow: '0 0 20px rgba(251,146,60,0.7), 0 0 40px rgba(239,68,68,0.4)' }
                : undefined
          }
        >
          {formatStopwatch(elapsedSeconds)}
        </div>
      </div>

      {isPenalty && (
        <span className="font-mono text-[8px] text-orange-400/90 uppercase tracking-wider">
          x2 ШТРАФ
        </span>
      )}
    </div>
  )
}

export function ScreenTimeHUD({ childId, accentColor = 'cyan' }) {
  const pilot = useAppStore((s) => s.pilots?.[childId])
  const todayTimeTracking = useAppStore((s) => s.todayTimeTracking?.[childId])

  const gameTimer = useRealtimeTimer(childId, 'game')
  const youtubeTimer = useRealtimeTimer(childId, 'youtube')
  const goodTimer = useRealtimeTimer(childId, 'good')

  const mode = pilot?.mode ?? null

  const { gameElapsed, cartoonElapsed, gameActive, cartoonActive } = useMemo(() => {
    const baseGameSec = (todayTimeTracking?.game ?? 0) * 60
    const baseMediaSec = (todayTimeTracking?.media ?? 0) * 60

    const isGame = mode === 'game'
    const isYoutube = mode === 'youtube'
    const isGood = mode === 'good'

    const gameSessionSec =
      isGame && (gameTimer.isPlaying || gameTimer.row?.status === 'paused')
        ? gameTimer.displaySeconds
        : 0
    const mediaSessionSec =
      (isYoutube && (youtubeTimer.isPlaying || youtubeTimer.row?.status === 'paused'))
        ? youtubeTimer.displaySeconds
        : isGood && (goodTimer.isPlaying || goodTimer.row?.status === 'paused')
          ? goodTimer.displaySeconds
          : 0

    return {
      gameElapsed: baseGameSec + gameSessionSec,
      cartoonElapsed: baseMediaSec + mediaSessionSec,
      gameActive: isGame && gameTimer.isPlaying,
      cartoonActive:
        (isYoutube && youtubeTimer.isPlaying) || (isGood && goodTimer.isPlaying),
    }
  }, [
    todayTimeTracking?.game,
    todayTimeTracking?.media,
    mode,
    gameTimer.displaySeconds,
    gameTimer.isPlaying,
    gameTimer.row?.status,
    youtubeTimer.displaySeconds,
    youtubeTimer.isPlaying,
    youtubeTimer.row?.status,
    goodTimer.displaySeconds,
    goodTimer.isPlaying,
    goodTimer.row?.status,
  ])

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900/50 backdrop-blur-xl p-4',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'
      )}
      aria-label="Время экрана: игры и мультики"
    >
      <div className="flex items-center justify-center gap-8 sm:gap-12">
        <EnergyRing
          type="ИГРЫ"
          elapsedSeconds={gameElapsed}
          isActive={gameActive}
          isGames
          isPenalty={gameElapsed >= SAFE_THRESHOLD_SEC}
        />
        <EnergyRing
          type="МУЛЬТИКИ"
          elapsedSeconds={cartoonElapsed}
          isActive={cartoonActive}
          isGames={false}
          isPenalty={cartoonElapsed >= SAFE_THRESHOLD_SEC}
        />
      </div>
    </div>
  )
}
