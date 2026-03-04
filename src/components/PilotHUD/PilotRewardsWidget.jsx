/**
 * Rewards Widget: 2–3 награды по балансу. Доступные — ярко, остальные — приглушены.
 */
import { GlassCard } from '@/components/GlassCard'
import { PILOT_REWARDS } from '@/data/pilotRewards'
import { cn } from '@/lib/utils'

export function PilotRewardsWidget({ balance, onPurchase, accentColor = 'cyan' }) {
  const sorted = [...PILOT_REWARDS].sort((a, b) => a.cost - b.cost).slice(0, 3)
  const accent = accentColor === 'purple' ? 'purple' : 'cyan'

  return (
    <GlassCard className="p-4">
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 mb-3">
        Награды
      </h3>
      <div className="flex flex-wrap gap-2">
        {sorted.map((item) => {
          const affordable = balance >= item.cost
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => affordable && onPurchase?.(item)}
              disabled={!affordable}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl border font-mono text-sm transition touch-manipulation',
                affordable
                  ? accent === 'purple'
                    ? 'border-purple-500/50 bg-purple-500/20 text-purple-200 hover:bg-purple-500/30'
                    : 'border-cyan-500/50 bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/30'
                  : 'border-white/10 bg-white/5 text-slate-500 opacity-60 cursor-not-allowed'
              )}
            >
              <span>{item.emoji}</span>
              <span className="truncate max-w-[100px]">{item.name}</span>
              <span className="tabular-nums text-amber-400/90">{item.cost}⚡</span>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
