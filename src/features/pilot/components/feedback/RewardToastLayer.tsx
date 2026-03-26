import { motion, useReducedMotion } from 'motion/react'
import type { PilotAccent, RewardToastEvent, RewardToastVariant } from '../../lib/pilot-ui-model'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import { tgText } from '@/i18n/tgMessages'

function variantClasses(variant: RewardToastVariant, accent: PilotAccent) {
  if (variant === 'success') return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
  if (variant === 'danger') return 'bg-red-500/15 border-red-500/45 text-red-200'
  if (variant === 'warning') return 'bg-amber-500/15 border-amber-500/45 text-amber-200'
  if (variant === 'cyan') return `${ACCENT_THEMES.cyan.hudChip} bg-cyan-500/10 text-cyan-200`
  return `${ACCENT_THEMES.purple.hudChip} bg-purple-500/10 text-purple-200`
}

export function RewardToastLayer({
  accent,
  events,
}: {
  accent: PilotAccent
  events: RewardToastEvent[]
}) {
  const shouldReduceMotion = useReducedMotion()

  if (events.length === 0) return null

  return (
    <div className="pointer-events-none absolute left-0 right-0 bottom-0 flex flex-col gap-2 p-4" aria-label={tgText('kid', 'rewardLayer.aria')}>
      {events.map((ev, index) => (
        <motion.div
          key={ev.id}
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, delay: index * 0.03 }}
          className={[
            'pointer-events-none rounded-2xl border px-4 py-3 font-mono shadow-lg backdrop-blur-xl',
            variantClasses(ev.variant, accent),
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px]" aria-hidden>
                  {ev.variant === 'success' ? '✅' : ev.variant === 'danger' ? '🚫' : ev.variant === 'warning' ? '⚠️' : ev.variant === 'cyan' ? '🟦' : '🟪'}
                </span>
                <span className="text-[12px] uppercase tracking-widest text-slate-50/95 truncate">
                  {ev.title}
                </span>
              </div>
              {ev.message && <div className="mt-1 text-[11px] text-slate-200/90 leading-tight">{ev.message}</div>}
            </div>
            {!shouldReduceMotion && ev.variant === 'success' && (
              <motion.span
                className="shrink-0 rounded-full h-8 w-8 border border-emerald-400/40 bg-emerald-500/10 flex items-center justify-center"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 0.8 }}
                aria-hidden
              >
                <span className="text-[14px]">⚡</span>
              </motion.span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// Turbo-Garage Pilot Home components (Stage 2A).

