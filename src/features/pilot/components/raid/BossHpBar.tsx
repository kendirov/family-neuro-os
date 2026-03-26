import { motion, useReducedMotion } from 'motion/react'
import type { RaidBossDisplayModel } from '../../lib/raid-ui-model'
import { tgText } from '@/i18n/tgMessages'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function BossHpBar({ boss }: { boss: RaidBossDisplayModel }) {
  const shouldReduceMotion = useReducedMotion()
  const hpPct = boss.maxHp <= 0 ? 0 : clamp((boss.hp / boss.maxHp) * 100, 0, 100)
  const isCritical = hpPct <= 33

  return (
    <div className="w-full" aria-label={tgText('kid', 'boss.hp.aria')}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">HP</span>
        <span className="font-mono text-[10px] tabular-nums text-slate-300">
          {boss.hp} / {boss.maxHp}
        </span>
      </div>
      <div className="h-5 rounded-xl bg-white/5 border border-white/10 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.45)]">
        <motion.div
          className={[
            'h-full rounded-xl',
            isCritical
              ? 'bg-gradient-to-r from-red-500/85 via-orange-500/60 to-amber-400/70'
              : 'bg-gradient-to-r from-red-600/70 via-orange-500/40 to-amber-400/55',
          ].join(' ')}
          initial={false}
          animate={{ width: `${hpPct}%` }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.45, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

