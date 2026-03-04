/**
 * PilotsPanel — базовая панель пилота (Кирилл/Рома).
 * Spin Progress Bar → Roulette Card → Missions List.
 * Next-Gen Gaming HUD: slate-950, backdrop-blur-xl, neon accents.
 */
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { CountUpNumber } from '@/components/CountUpNumber'
import { TimerOverlay } from './TimerOverlay'
import { SpinProgressBar } from './SpinProgressBar'
import { RouletteCard } from './RouletteCard'
import { MissionsList } from './MissionsList'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 500

export function PilotsPanel({ childId, accentColor = 'cyan', onTaskComplete }) {
  const users = useAppStore((s) => s.users)
  const user = users?.find((u) => u.id === childId)
  const balance = user?.balance ?? 0
  const level = Math.floor(balance / XP_PER_LEVEL) + 1
  const isPurple = accentColor === 'purple'
  const strokeColor = isPurple ? '#a855f7' : '#22d3ee'

  return (
    <div
      className={cn(
        'flex flex-col h-full overflow-hidden',
        isPurple ? 'bg-gradient-to-b from-slate-950 to-purple-950/20' : 'bg-gradient-to-b from-slate-950 to-cyan-950/20'
      )}
    >
      {/* Compact header: Avatar + Level + Balance */}
      <div className="shrink-0 px-4 py-3 flex items-center gap-3 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <PilotAvatar pilotId={childId} size="column" className="w-12 h-12 sm:w-14 sm:h-14" />
        <div className="flex-1 min-w-0">
          <span
            className={cn(
              'font-mono text-[10px] uppercase tracking-widest block',
              isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
            )}
          >
            Уровень {level}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                'font-turbo-nums text-2xl sm:text-3xl font-black tabular-nums',
                isPurple ? 'text-purple-300' : 'text-cyan-300'
              )}
              style={{ textShadow: `0 0 16px ${strokeColor}50` }}
            >
              <CountUpNumber value={balance} duration={400} />
            </span>
            <span className="text-lg text-amber-400/90 font-bold">⚡</span>
          </div>
        </div>
      </div>

      {/* Timer Overlay */}
      <div className="shrink-0 px-4 py-1.5">
        <TimerOverlay childId={childId} />
      </div>

      {/* Spin Progress Bar */}
      <div className="shrink-0 px-4 py-2">
        <SpinProgressBar childId={childId} accentColor={accentColor} />
      </div>

      {/* Roulette Card — massive, stylized */}
      <div className="shrink-0 px-4 py-2">
        <RouletteCard childId={childId} accentColor={accentColor} />
      </div>

      {/* Missions List */}
      <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
        <MissionsList
          childId={childId}
          accentColor={accentColor}
          onTaskComplete={onTaskComplete}
        />
      </div>
    </div>
  )
}
