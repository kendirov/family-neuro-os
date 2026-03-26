import { motion, useReducedMotion } from 'motion/react'
import { useAppStore } from '@/stores/useAppStore'
import type { PilotAccent } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

const RAID_TARGET = 1500

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function RaidTeaserCard({ accent }: { accent: PilotAccent }) {
  const shouldReduceMotion = useReducedMotion()
  const theme = ACCENT_THEMES[accent]
  const raidProgressRaw = useAppStore((s) => s.raidProgress ?? 0)
  const raidProgress = typeof raidProgressRaw === 'number' ? raidProgressRaw : 0

  const overflow = raidProgress > RAID_TARGET ? raidProgress - RAID_TARGET : 0
  const currentHP = Math.max(0, RAID_TARGET - raidProgress)
  const hpPercent = clamp((currentHP / RAID_TARGET) * 100, 0, 100)
  const isWin = raidProgress >= RAID_TARGET

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4" aria-label={tgText('kid', 'raidTeaser.aria')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300/90">{tgText('kid', 'raidTeaser.title')}</h3>
          <p className="mt-1 font-mono text-xs text-slate-400/90">
            {isWin ? tgText('kid', 'raidTeaser.win') : tgText('kid', 'raidTeaser.progress')}
          </p>
        </div>
        <div className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', isWin ? 'border-amber-500/60 bg-amber-500/15 text-amber-200' : theme.hudChip].join(' ')}>
          {raidProgress}/{RAID_TARGET}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative shrink-0">
          <motion.div
            className={[
              'h-16 w-16 rounded-2xl border border-purple-500/30 bg-gradient-to-b from-slate-800 to-slate-950/60 flex items-center justify-center',
              isWin ? 'shadow-[0_0_30px_rgba(251,191,36,0.25)] border-amber-500/40' : '',
              !shouldReduceMotion ? 'animate-boss-float' : '',
            ].join(' ')}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
            animate={isWin && !shouldReduceMotion ? { rotate: [0, -6, 0] } : undefined}
            transition={{ duration: 0.6 }}
            aria-hidden
          >
            <span className="text-[28px] leading-none drop-shadow">🍣</span>
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">HP</span>
            <span className="font-mono text-[10px] text-slate-400 tabular-nums">{currentHP} / {RAID_TARGET}</span>
          </div>
          <div className="h-5 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
            <motion.div
              className={['h-full', isWin ? 'bg-gradient-to-r from-amber-400/80 via-yellow-300/50 to-amber-500/90' : 'bg-gradient-to-r from-red-500/60 via-orange-500/30 to-amber-400/60'].join(' ')}
              initial={false}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.4 }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <span>
              {isWin
                ? tgText('kid', 'raidTeaser.winOverflow', { overflow })
                : tgText('kid', 'raidTeaser.keepBoosting')}
            </span>
            <span className={isWin ? 'text-amber-300' : 'text-slate-400'}>
              {isWin ? tgText('kid', 'raidTeaser.claimSoon') : `${Math.round((raidProgress / RAID_TARGET) * 100)}%`}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

