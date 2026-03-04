/**
 * ChildHeader — read-only заголовок колонки пилота.
 * Avatar, Name, Level, Total Turbo Coins ⚡.
 * Premium Glassmorphism в стиле ArchitectAdmin.
 * UI: русский. Без мутаций.
 */
import { PilotAvatar } from '@/components/HelmetAvatar'
import { CountUpNumber } from '@/components/CountUpNumber'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 500

const DISPLAY_NAMES = {
  kirill: 'Кирилл',
  roma: 'Рома',
}

export function ChildHeader({ childId, user, accentColor = 'cyan' }) {
  const balance = user?.balance ?? 0
  const level = Math.floor(balance / XP_PER_LEVEL) + 1
  const isPurple = accentColor === 'purple'
  const strokeColor = isPurple ? '#a855f7' : '#22d3ee'
  const displayName = DISPLAY_NAMES[childId] ?? user?.name ?? childId

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]',
        'p-4 flex items-center gap-4',
        isPurple ? 'border-purple-500/30' : 'border-cyan-500/30'
      )}
      aria-label={`Панель ${displayName}`}
    >
      <PilotAvatar
        pilotId={childId}
        size="column"
        className="w-14 h-14 sm:w-16 sm:h-16 shrink-0"
      />
      <div className="flex-1 min-w-0 relative z-10">
        <h2 className="hud-player-name text-white font-black truncate text-sm sm:text-base md:text-lg">
          {displayName}
        </h2>
        <span
          className={cn(
            'font-mono text-[10px] uppercase tracking-widest block mt-0.5',
            isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
          )}
        >
          Уровень {level}
        </span>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className={cn(
              'font-turbo-nums text-xl sm:text-2xl font-black tabular-nums',
              isPurple ? 'text-purple-300' : 'text-cyan-300'
            )}
            style={{ textShadow: `0 0 16px ${strokeColor}50` }}
          >
            <CountUpNumber value={balance} duration={400} />
          </span>
          <span className="text-lg sm:text-xl text-amber-400/90 font-bold">⚡</span>
        </div>
      </div>
    </div>
  )
}
