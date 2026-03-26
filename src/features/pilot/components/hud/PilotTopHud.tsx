import { motion, useReducedMotion } from 'motion/react'
import type { FuelStateModel, PilotAccent, ProfileSummary } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { tgText } from '@/i18n/tgMessages'

export type QuickActionId = 'healthy_meal' | 'sweet_snack' | 'claim_contract_reward'

export function PilotTopHud({
  profile,
  fuel,
  accent,
  xpPulseToken,
  onQuickAction,
}: {
  profile: ProfileSummary
  fuel: FuelStateModel
  accent: PilotAccent
  xpPulseToken: number
  onQuickAction: (actionId: QuickActionId) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const theme = ACCENT_THEMES[accent]

  const multiplierText =
    fuel.xpDayMultiplier === 1
      ? 'x1.00'
      : fuel.xpDayMultiplier === 1.25
        ? 'x1.25'
        : fuel.xpDayMultiplier === 0.85
          ? 'x0.85'
          : fuel.xpDayMultiplier === 0.7
            ? 'x0.70'
            : `x${fuel.xpDayMultiplier.toFixed(2)}`

  return (
    <section
      className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4"
      aria-label={tgText('kid', 'hud.aria')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <PilotAvatar pilotId={profile.pilotId} size="column" className="w-12 h-12 rounded-full" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">
                {profile.name}
              </h2>
              <span className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', theme.hudChip].join(' ')}>
                {tgText('kid', 'hud.levelShort')} {profile.level}
              </span>
            </div>
            <p className="mt-1 font-mono text-[11px] text-slate-400/90">
              {tgText('kid', 'hud.todayLine', { xp: profile.xpTodayDisplayed, mult: multiplierText })}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-baseline justify-end gap-2">
            <span className="font-turbo-nums text-3xl sm:text-4xl font-black tabular-nums text-amber-300 drop-shadow">
              {shouldReduceMotion ? profile.xpTotal : (
                <motion.span
                  key={xpPulseToken}
                  initial={{ opacity: 0.7, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {profile.xpTotal}
                </motion.span>
              )}
            </span>
            <span className="text-xl text-amber-400/90 font-bold">⚡</span>
          </div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {tgText('kid', 'hud.coinsLabel')}: <span className="text-slate-200 font-bold tabular-nums">{profile.coins}</span>
          </div>
        </div>
      </div>

      {/* Level progress */}
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">{tgText('kid', 'hud.levelProgress')}</span>
          <span className="font-mono text-[10px] text-slate-400 tabular-nums">
            {tgText('kid', 'hud.nextAt', { xp: profile.nextLevelXp })}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/5 border border-white/10 overflow-hidden">
          <motion.div
            className={[
              'h-full rounded-full',
              accent === 'cyan' ? 'bg-cyan-500/70' : 'bg-purple-500/70',
            ].join(' ')}
            initial={false}
            animate={{ width: `${profile.levelProgressPct}%` }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35 }}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <motion.button
          type="button"
          onClick={() => onQuickAction('healthy_meal')}
          className={[
            'btn-arcade-juicy-rounded',
            'rounded-xl border px-2 py-2 touch-manipulation',
            'bg-cyan-500/10 border-cyan-500/40 text-cyan-200',
          ].join(' ')}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          aria-label={tgText('kid', 'hud.action.healthyAria')}
        >
          <span className="text-[18px] leading-none" aria-hidden>
            🥗
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest">{tgText('kid', 'hud.action.healthy')}</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onQuickAction('sweet_snack')}
          className={[
            'btn-arcade-juicy-rounded',
            'rounded-xl border px-2 py-2 touch-manipulation',
            'bg-amber-500/10 border-red-500/40 text-red-200',
          ].join(' ')}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          aria-label={tgText('kid', 'hud.action.sweetAria')}
        >
          <span className="text-[18px] leading-none" aria-hidden>
            🍬
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest">{tgText('kid', 'hud.action.sweet')}</span>
        </motion.button>

        <motion.button
          type="button"
          onClick={() => onQuickAction('claim_contract_reward')}
          className={[
            'btn-arcade-juicy-rounded',
            'rounded-xl border px-2 py-2 touch-manipulation',
            'bg-amber-500/10 border-amber-500/40 text-amber-200',
          ].join(' ')}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
          aria-label={tgText('kid', 'hud.action.boostAria')}
        >
          <span className="text-[18px] leading-none" aria-hidden>
            ⚙️
          </span>
          <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest">{tgText('kid', 'hud.action.boost')}</span>
        </motion.button>
      </div>
    </section>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

