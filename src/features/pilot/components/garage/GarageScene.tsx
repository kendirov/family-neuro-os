import { motion, useReducedMotion } from 'motion/react'
import type { FuelStateKind, PilotAccent } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES, FUEL_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

function levelTier(level: number) {
  if (level <= 3) return 'low' as const
  if (level <= 8) return 'mid' as const
  return 'high' as const
}

export function GarageScene({
  level,
  accent,
  fuelKind,
}: {
  level: number
  accent: PilotAccent
  fuelKind: FuelStateKind
}) {
  const shouldReduceMotion = useReducedMotion()
  const tier = levelTier(level)
  const accentTheme = ACCENT_THEMES[accent]
  const fuelTheme = FUEL_THEMES[fuelKind]

  const heroLabel =
    tier === 'low'
      ? tgText('kid', 'garage.hero.low')
      : tier === 'mid'
        ? tgText('kid', 'garage.hero.mid')
        : tgText('kid', 'garage.hero.high')

  const fuelShake = fuelKind === 'overheat'
  const lift = shouldReduceMotion ? 0 : 2

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full"
      aria-label={tgText('kid', 'garage.hero.aria')}
    >
      <div
        className={[
          'relative overflow-hidden rounded-3xl panel-metal',
          'bg-turbo-garage bg-turbo-garage-radial',
          'border border-white/10',
        ].join(' ')}
      >
        {/* Ambient scanlines */}
        <div className="absolute inset-0 opacity-25 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(34,211,238,0.08)_0,transparent_1px)] bg-[length:6px_6px]" />
        </div>

        {/* Top neon frame */}
        <div className="absolute left-0 right-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400/60 via-purple-500/45 to-amber-400/60" />

        {/* Garage layout */}
        <div className="relative p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-gaming text-[11px] uppercase tracking-[0.25em] text-slate-300/90">
                  {heroLabel}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-slate-400/90">
                {fuelTheme.description}
              </p>
            </div>

            {/* Fuel lamps */}
            <div className="flex items-center gap-2 shrink-0">
              {[
                { k: 0, label: tgText('kid', 'garage.lamp.statusA') },
                { k: 1, label: tgText('kid', 'garage.lamp.statusB') },
                { k: 2, label: tgText('kid', 'garage.lamp.statusC') },
              ].map((lamp, idx) => {
                const isLit =
                  fuelKind === 'empty_low' ? idx === 0 : fuelKind === 'normal' ? idx <= 1 : true
                const isOver = fuelKind === 'overheat'
                const lampBase =
                  isOver && idx === 2
                    ? 'bg-red-500/75 shadow-[0_0_20px_rgba(248,113,113,0.7)] border-red-400/70'
                    : fuelKind === 'premium_fuel'
                      ? 'bg-amber-400/75 shadow-[0_0_20px_rgba(251,191,36,0.55)] border-amber-300/70'
                      : accent === 'cyan'
                        ? 'bg-cyan-300/65 shadow-[0_0_20px_rgba(34,211,238,0.45)] border-cyan-300/70'
                        : 'bg-purple-300/60 shadow-[0_0_20px_rgba(168,85,247,0.45)] border-purple-300/70'

                return (
                  <motion.span
                    key={lamp.k}
                    aria-hidden
                    className={[
                      'h-3.5 w-3.5 rounded-full border',
                      lampBase,
                      !isLit && 'opacity-30 filter grayscale',
                      fuelTheme.glowClass ? fuelTheme.glowClass : '',
                    ].join(' ')}
                    animate={
                      fuelShake && idx === 2 && !shouldReduceMotion
                        ? { x: [0, -6, 6, -4, 4, 0] }
                        : undefined
                    }
                    transition={{ duration: 0.75 }}
                  />
                )
              })}
            </div>
          </div>

          {/* Garage modules */}
          <div className="mt-4">
            {tier === 'low' && (
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-10">
                  <div
                    className={[
                      'rounded-2xl bg-slate-900/60 border border-white/10 p-3',
                      'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400/70 shadow-[0_0_12px_rgba(251,191,36,0.4)]" />
                      <p className="font-mono text-[11px] text-slate-300/85">{tgText('kid', 'garage.manualControls')}</p>
                    </div>
                    <div className="mt-3 h-24 rounded-xl border border-slate-700/60 bg-slate-950/40 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,0.15)_0,transparent_55%)]" />
                      <div className="absolute inset-x-3 bottom-3 h-1 rounded bg-cyan-300/25" />
                      <div className="absolute inset-x-8 bottom-7 h-1 rounded bg-amber-300/20" />
                      {!shouldReduceMotion && (
                        <motion.div
                          className="absolute left-6 top-4 h-3 w-20 rounded-full bg-gradient-to-r from-cyan-300/0 via-cyan-300/30 to-cyan-300/0"
                          animate={{ x: [0, 90, 0] }}
                          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="h-24 rounded-2xl border border-white/10 bg-slate-900/30 flex flex-col justify-between p-2">
                    <span className="h-2 rounded bg-cyan-300/20" />
                    <span className="h-2 rounded bg-amber-300/20" />
                    <span className="h-2 rounded bg-purple-300/20" />
                  </div>
                </div>
              </div>
            )}

            {tier === 'mid' && (
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-8">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_60%_25%,rgba(168,85,247,0.22)_0,transparent_55%)]" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-gaming text-[11px] uppercase tracking-wider text-slate-300/90">
                          {tgText('kid', 'garage.reactorLamps')}
                        </p>
                        <span className={['text-[10px] font-mono uppercase tracking-wider', accentTheme.text].join(' ')}>
                          {accent === 'cyan' ? 'РОМА' : 'КИРИЛЛ'}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {Array.from({ length: 6 }, (_, i) => {
                          const hot = fuelKind === 'overheat' ? i % 3 === 2 : i % 2 === 0
                          const cls =
                            hot && fuelKind === 'overheat'
                              ? 'bg-red-500/70 border-red-400/70 shadow-[0_0_16px_rgba(248,113,113,0.55)]'
                              : fuelKind === 'premium_fuel'
                                ? 'bg-amber-400/65 border-amber-300/70 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                                : accent === 'cyan'
                                  ? 'bg-cyan-300/60 border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                                  : 'bg-purple-300/55 border-purple-300/70 shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                          const off = !hot
                          return (
                            <div
                              key={i}
                              className={[
                                'h-10 rounded-xl border',
                                cls,
                                off && 'opacity-30 filter grayscale',
                              ].join(' ')}
                            />
                          )
                        })}
                      </div>

                      {!shouldReduceMotion && (
                        <motion.div
                          className={['absolute -right-20 -bottom-20 h-64 w-64 rounded-full blur-2xl opacity-40', fuelTheme.glowClass].join(' ')}
                          animate={{ opacity: [0.2, 0.55, 0.2] }}
                          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-3">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-slate-300/85">
                      {tgText('kid', 'garage.statusBoard')}
                    </p>
                    <div className="mt-3 space-y-2">
                      {[
                        { label: tgText('kid', 'garage.fuelLink'), value: fuelTheme.label },
                        { label: tgText('kid', 'garage.xpBoost'), value: `x${fuelKind === 'premium_fuel' ? '1.25' : fuelKind === 'overheat' ? '0.70' : fuelKind === 'empty_low' ? '0.85' : '1.00'}` },
                      ].map((row) => (
                        <div key={row.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono text-slate-400">{row.label}</span>
                            <span className="text-[10px] font-mono font-bold tabular-nums text-amber-300/90 drop-shadow">
                              {row.value}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tier === 'high' && (
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/55 p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_25%_20%,rgba(34,211,238,0.18)_0,transparent_55%)]" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-gaming text-[11px] uppercase tracking-wider text-slate-300/90">
                          {tgText('kid', 'garage.premiumPanels')}
                        </p>
                        <span className={['text-[10px] font-mono uppercase tracking-wider', accentTheme.hudChip].join(' ')}>
                          {tgText('kid', 'garage.level', { level })}
                        </span>
                      </div>

                      {!shouldReduceMotion && (
                        <motion.div
                          className="mt-4 h-28 rounded-2xl border border-white/10 bg-slate-950/40 relative overflow-hidden"
                          animate={fuelShake ? { rotate: [-0.2, 0.2, -0.2] } : { y: [0, -lift, 0] }}
                          transition={{ duration: 1.6, repeat: fuelShake ? 2 : Infinity, ease: 'easeInOut' }}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,rgba(34,211,238,0.25)_35%,transparent_70%)] bg-[length:200%_100%] animate-[none]" />
                          <div
                            className="absolute inset-0 opacity-70"
                            style={{
                              background:
                                fuelKind === 'overheat'
                                  ? 'radial-gradient(circle at 70% 40%, rgba(248,113,113,0.45) 0%, transparent 60%)'
                                  : fuelKind === 'premium_fuel'
                                    ? 'radial-gradient(circle at 70% 40%, rgba(251,191,36,0.45) 0%, transparent 60%)'
                                    : 'radial-gradient(circle at 70% 40%, rgba(34,211,238,0.35) 0%, transparent 60%)',
                            }}
                          />
                          {!shouldReduceMotion && (
                            <motion.div
                              className="absolute left-3 top-3 h-2 w-24 rounded-full bg-gradient-to-r from-white/0 via-white/35 to-white/0"
                              animate={{ x: [0, 90, 0] }}
                              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          )}
                        </motion.div>
                      )}

                      {shouldReduceMotion && (
                        <div className="mt-4 h-28 rounded-2xl border border-white/10 bg-slate-950/40" />
                      )}

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {Array.from({ length: 9 }, (_, i) => {
                          const on =
                            fuelKind === 'overheat'
                              ? i % 4 === 3
                              : fuelKind === 'premium_fuel'
                                ? i % 3 === 0
                                : i % 2 === 0
                          const cls = on
                            ? fuelKind === 'overheat'
                              ? 'bg-red-500/70 border-red-400/70 shadow-[0_0_16px_rgba(248,113,113,0.55)]'
                              : fuelKind === 'premium_fuel'
                                ? 'bg-amber-400/65 border-amber-300/70 shadow-[0_0_16px_rgba(251,191,36,0.45)]'
                                : accent === 'cyan'
                                  ? 'bg-cyan-300/60 border-cyan-300/70 shadow-[0_0_16px_rgba(34,211,238,0.35)]'
                                  : 'bg-purple-300/55 border-purple-300/70 shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                            : 'bg-slate-800/60 border-white/10 opacity-40'
                          return <div key={i} className={['h-10 rounded-xl border', cls].join(' ')} />
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-5">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 relative overflow-hidden">
                    <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full opacity-30 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35)_0,transparent_60%)]" />
                    <div className="relative">
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-300/85">
                        {tgText('kid', 'garage.heatControl')}
                      </p>
                      <div className="mt-3 space-y-2">
                        {[
                          { label: tgText('kid', 'garage.fuelState'), value: fuelTheme.label },
                          { label: tgText('kid', 'garage.dayMult'), value: `x${fuelTheme.kind === 'premium_fuel' ? '1.25' : fuelTheme.kind === 'overheat' ? '0.70' : fuelTheme.kind === 'empty_low' ? '0.85' : '1.00'}` },
                          { label: tgText('kid', 'garage.gateStatus'), value: tier === 'high' ? tgText('kid', 'garage.gateOpen') : tgText('kid', 'garage.gateLocked') },
                        ].map((row) => (
                          <div key={row.label} className="rounded-xl border border-white/10 bg-slate-950/40 p-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono text-slate-400">{row.label}</span>
                              <span className="text-[11px] font-mono font-bold tabular-nums text-amber-300/90 drop-shadow">
                                {row.value}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 h-px bg-white/10" />

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                            {tgText('kid', 'garage.activePanels')}
                          </span>
                          <span className={['mt-1 font-gaming text-[15px] uppercase tracking-wider', fuelTheme.text].join(' ')}>
                            {fuelKind === 'overheat'
                              ? tgText('kid', 'garage.panelDanger')
                              : fuelKind === 'premium_fuel'
                                ? tgText('kid', 'garage.panelBoost')
                                : tgText('kid', 'garage.panelOnline')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className={['h-3 w-3 rounded-full border', fuelKind === 'overheat' ? 'bg-red-500/75 border-red-400/70' : fuelKind === 'premium_fuel' ? 'bg-amber-400/70 border-amber-300/70' : 'bg-cyan-300/60 border-cyan-300/70'].join(' ')} />
                          <div className={['h-3 w-3 rounded-full border', 'bg-slate-800/70 border-white/10 opacity-50'].join(' ')} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom footer strip */}
          <div className="mt-4 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-[0.25em] text-slate-500/90">
            <span>{tgText('kid', 'garage.footer')}</span>
            <span className="flex items-center gap-2">
              <span className={['h-1.5 w-1.5 rounded-full', fuelKind === 'overheat' ? 'bg-red-400' : fuelKind === 'premium_fuel' ? 'bg-amber-400' : 'bg-cyan-300'].join(' ')} />
              {fuelKind.replaceAll('_', ' ')}
            </span>
          </div>
        </div>

        {/* Fuel glow overlay */}
        <div className={['pointer-events-none absolute inset-0 opacity-40', fuelTheme.glowClass].join(' ')} />
      </div>
    </motion.section>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

