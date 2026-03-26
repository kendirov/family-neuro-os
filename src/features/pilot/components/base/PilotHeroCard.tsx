import { motion, useReducedMotion } from 'motion/react'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import type { PilotHeroUiModel } from '../../lib/pilot-base-ui-model'

function badgeClasses(tone: PilotHeroUiModel['badge']['tone'], accent: 'cyan' | 'purple') {
  if (tone === 'boost') return 'border-amber-500/45 bg-amber-500/15 text-amber-200'
  if (tone === 'active') return accent === 'cyan' ? 'border-cyan-500/45 bg-cyan-500/15 text-cyan-200' : 'border-purple-500/45 bg-purple-500/15 text-purple-200'
  return 'border-white/10 bg-white/5 text-slate-200'
}

export function PilotHeroCard({ pilot }: { pilot: PilotHeroUiModel }) {
  const reduce = useReducedMotion()
  const theme = ACCENT_THEMES[pilot.accent]

  return (
    <motion.section
      className={[
        'relative overflow-hidden rounded-3xl border border-white/10',
        'bg-slate-900/55 backdrop-blur-xl p-5',
        pilot.accent === 'cyan' ? 'border-cyan-500/20' : 'border-purple-500/20',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_10px_38px_rgba(0,0,0,0.35)]',
      ].join(' ')}
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label={`Пилот: ${pilot.name}`}
    >
      <div className={['absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-30', pilot.accent === 'cyan' ? 'bg-cyan-500/30' : 'bg-purple-500/30'].join(' ')} aria-hidden />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PilotAvatar pilotId={pilot.pilotId} size="column" className="w-14 h-14 rounded-2xl" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-gaming text-lg sm:text-xl font-black uppercase tracking-wider truncate text-pop">
                {pilot.name}
              </h3>
              <span className={['rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest', theme.hudChip].join(' ')}>
                LVL {pilot.level}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className={['rounded-xl border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest', badgeClasses(pilot.badge.tone, pilot.accent)].join(' ')}>
                {pilot.badge.label}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                Пилот готов
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span className="font-turbo-nums text-3xl sm:text-4xl font-black tabular-nums text-amber-300 drop-shadow">
              {pilot.xpTotal}
            </span>
            <span className="text-xl text-amber-400/90 font-bold">⚡</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            Монеты: <span className="text-slate-200 font-bold tabular-nums">{pilot.coins}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">XP</div>
          <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-slate-100">
            {pilot.xpTotal} ⚡
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Баланс</div>
          <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-slate-100">
            {pilot.coins} 🪙
          </div>
        </div>
      </div>
    </motion.section>
  )
}

