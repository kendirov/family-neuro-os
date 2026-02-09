import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { cn } from '@/lib/utils'

const PILOT_IDS = ['kirill', 'roma']

const GAME_SOFT_LIMIT_MIN = 60
const MEDIA_SOFT_LIMIT_MIN = 40

function PilotConsumptionCard({ pilotId, gameMinutes, mediaMinutes }) {
  const name = pilotId === 'roma' ? 'Рома' : 'Кирилл'
  const accent =
    pilotId === 'roma'
      ? 'text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
      : 'text-purple-300 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]'

  // Dynamic scale max: ensures bar is ~80% full if usage exceeds limit
  const gameScaleMax = Math.max(GAME_SOFT_LIMIT_MIN, gameMinutes * 1.2)
  const mediaScaleMax = Math.max(MEDIA_SOFT_LIMIT_MIN, mediaMinutes * 1.2)

  // Calculate percentage based on dynamic scale
  const gamePercent = Math.min(100, (gameMinutes / gameScaleMax) * 100 || 0)
  const mediaPercent = Math.min(100, (mediaMinutes / mediaScaleMax) * 100 || 0)

  // Color logic still based on original thresholds (for visual consistency)
  const gameOverdrive = gameMinutes > GAME_SOFT_LIMIT_MIN
  const mediaOverdrive = mediaMinutes > MEDIA_SOFT_LIMIT_MIN

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-700/80 bg-slate-900/70 backdrop-blur-sm p-3 sm:p-4 shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
      <div className="flex items-center gap-3">
        <PilotAvatar pilotId={pilotId} size="chip" />
        <div className="flex flex-col">
          <span className={cn('font-gaming text-xs uppercase tracking-wider', accent)}>{name}</span>
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">
            Топливо за сегодня
          </span>
        </div>
      </div>

      {/* Games bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="text-sm">
              🎮
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-400">Игры</span>
          </div>
          <span
            className={cn(
              'font-mono text-[10px] tabular-nums',
              gameOverdrive ? 'text-red-400' : 'text-cyan-300'
            )}
          >
            {gameMinutes} мин
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-900/90 border border-slate-700/80 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-400',
              gameOverdrive
                ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'
                : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-cyan-500'
            )}
            style={{ width: `${gamePercent}%` }}
          />
        </div>
      </div>

      {/* Media bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span aria-hidden className="text-sm">
              📺
            </span>
            <span className="font-mono text-[10px] uppercase text-slate-400">Мультики</span>
          </div>
          <span
            className={cn(
              'font-mono text-[10px] tabular-nums',
              mediaOverdrive ? 'text-red-400' : 'text-orange-300'
            )}
          >
            {mediaMinutes} мин
          </span>
        </div>
        <div className="relative h-2 rounded-full bg-slate-900/90 border border-slate-700/80 overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-400',
              mediaOverdrive
                ? 'bg-gradient-to-r from-red-500 via-red-400 to-red-500'
                : 'bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500'
            )}
            style={{ width: `${mediaPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function ConsumptionWidget() {
  const pilots = useAppStore((s) => s.pilots ?? {})
  const dailyGamingBreakdown = useAppStore((s) => s.dailyGamingBreakdown ?? {})

  const { game, youtube } = useMemo(() => {
    const state = useAppStore.getState()
    return state.getDisplayBreakdownToday()
  }, [pilots, dailyGamingBreakdown])

  const gameMinutesByPilot = {
    roma: game?.roma ?? 0,
    kirill: game?.kirill ?? 0,
  }

  const mediaMinutesByPilot = {
    roma: youtube?.roma ?? 0,
    kirill: youtube?.kirill ?? 0,
  }

  return (
    <div className="rounded-2xl border-[3px] border-slate-700/80 bg-slate-900/90 backdrop-blur-md px-3 py-3 sm:px-4 sm:py-4 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <p className="font-gaming text-[10px] sm:text-xs text-slate-400 uppercase tracking-wider">
          Дневной расход топлива
        </p>
        <span className="font-mono text-[9px] text-slate-500 uppercase tracking-widest">
          🎮 + 📺 за сегодня
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {PILOT_IDS.map((id) => (
          <PilotConsumptionCard
            key={id}
            pilotId={id}
            gameMinutes={gameMinutesByPilot[id] ?? 0}
            mediaMinutes={mediaMinutesByPilot[id] ?? 0}
          />
        ))}
      </div>
    </div>
  )
}

