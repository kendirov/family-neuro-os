import { motion, useReducedMotion } from 'motion/react'
import type { DailyMissionsModel, PilotAccent } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

export function TodayContractsCard({
  missions,
  accent,
  onMissionTap,
}: {
  missions: DailyMissionsModel
  accent: PilotAccent
  onMissionTap?: (missionId: string) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const theme = ACCENT_THEMES[accent]

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4" aria-label={tgText('kid', 'missions.card.aria')}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300/90">
          {missions.dayLabel}
        </h3>
        <span className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', theme.hudChip].join(' ')}>
          {tgText('kid', 'missions.countOpen', { count: missions.available.length })}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'missions.available')}</span>
            <span className="font-mono text-[10px] text-slate-500">{tgText('kid', 'missions.tapHint')}</span>
          </div>
          <ul className="space-y-1 max-h-44 overflow-y-auto scrollbar-hide pr-1">
            {missions.available.length === 0 ? (
              <li className="text-slate-500 text-xs py-3 text-center font-mono">{tgText('kid', 'missions.allDone')}</li>
            ) : (
              missions.available.slice(0, 7).map((m) => {
                const isLocked = m.status === 'future_locked'
                const baseClasses = [
                  'rounded-xl border px-3 py-2 flex items-center gap-2',
                  'touch-manipulation',
                ].join(' ')

                const statusClasses = isLocked
                  ? 'opacity-45 bg-white/5 border-white/10 text-slate-400 cursor-not-allowed'
                  : 'bg-white/5 border-white/10 text-slate-200 hover:bg-white/10 cursor-pointer active:scale-[0.99]'

                return (
                  <motion.li
                    key={m.id}
                    whileHover={shouldReduceMotion || isLocked ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion || isLocked ? undefined : { scale: 0.98 }}
                    className={`${baseClasses} ${statusClasses}`}
                    onClick={() => {
                      if (isLocked) return
                      onMissionTap?.(m.id)
                    }}
                    role={isLocked ? undefined : 'button'}
                    aria-label={tgText('kid', 'missions.item.aria', {
                      label: m.label,
                      lockedSuffix: isLocked ? tgText('kid', 'missions.lockedSuffix') : '',
                    })}
                  >
                    <span className="shrink-0 text-[16px]" aria-hidden>
                      {m.emoji}
                    </span>
                    <span className="flex-1 min-w-0 truncate font-mono text-xs">{m.label}</span>
                    <span className="shrink-0 font-mono text-xs text-amber-400/90 tabular-nums">+{m.rewardXp}</span>
                  </motion.li>
                )
              })
            )}
          </ul>
        </div>

        {missions.completed.length > 0 && (
          <div className="pt-3 border-t border-white/10">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'missions.completed')}</span>
              <span className="font-mono text-[10px] text-slate-500">{missions.completed.length}</span>
            </div>
            <ul className="space-y-1 max-h-20 overflow-y-auto scrollbar-hide pr-1">
              {missions.completed.slice(0, 4).map((m) => (
                <li key={m.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 flex items-center gap-2">
                  <span className="shrink-0 text-[16px]" aria-hidden>
                    ✅
                  </span>
                  <span className="flex-1 min-w-0 truncate font-mono text-xs text-slate-200">{m.label}</span>
                  <span className="shrink-0 font-mono text-xs text-emerald-300/90 tabular-nums">+{m.rewardXp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

