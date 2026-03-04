/**
 * Status Widget: круговая шкала XP до следующего уровня + крупные Turbo Coins.
 */
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'

const XP_PER_LEVEL = 500

export function PilotStatusWidget({ user, accentColor = 'cyan' }) {
  const balance = user?.balance ?? 0
  const currentXP = balance % XP_PER_LEVEL
  const progress = (currentXP / XP_PER_LEVEL) * 100
  const level = Math.floor(balance / XP_PER_LEVEL) + 1
  const strokeColor = accentColor === 'purple' ? '#a855f7' : '#22d3ee'
  const size = 80
  const strokeWidth = 6
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (progress / 100) * circumference

  return (
    <GlassCard className="p-4 flex flex-col items-center gap-3">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        Уровень {level}
      </span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="rotate-[-90deg]" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-500"
            style={{ filter: `drop-shadow(0 0 6px ${strokeColor}80)` }}
          />
        </svg>
      </div>
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'font-turbo-nums text-3xl font-black',
            accentColor === 'purple' ? 'text-purple-300' : 'text-cyan-300'
          )}
          style={{ textShadow: `0 0 20px ${strokeColor}60` }}
        >
          {balance}
        </span>
        <span className="font-mono text-xs text-amber-400/90">⚡ XP</span>
      </div>
    </GlassCard>
  )
}
