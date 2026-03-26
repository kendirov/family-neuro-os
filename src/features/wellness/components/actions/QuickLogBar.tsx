import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Droplets, Footprints, Pill, CheckCircle2, History } from 'lucide-react'
import { cn } from '@/lib/utils'

export type QuickLogActionId = 'water_250' | 'water_500' | 'steps_1000' | 'vitamins' | 'close_day' | 'history'

export function QuickLogBar({
  onAction,
  hint,
}: {
  onAction: (id: QuickLogActionId) => void
  hint?: string | null
}) {
  const reduce = useReducedMotion()

  const buttons: Array<{
    id: QuickLogActionId
    label: string
    Icon: typeof Droplets
  }> = [
    { id: 'water_250', label: '+250 ml', Icon: Droplets },
    { id: 'water_500', label: '+500 ml', Icon: Droplets },
    { id: 'steps_1000', label: '+1k', Icon: Footprints },
    { id: 'vitamins', label: 'Vitamins', Icon: Pill },
    { id: 'close_day', label: 'Close day', Icon: CheckCircle2 },
    { id: 'history', label: 'History', Icon: History },
  ]

  return (
    <div className="sticky bottom-0 z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-white/10 bg-slate-950/55 backdrop-blur-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_40px_rgba(0,0,0,0.55)] p-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
            {buttons.map(({ id, label, Icon }) => (
              <motion.button
                key={id}
                type="button"
                onClick={() => onAction(id)}
                className={cn(
                  'shrink-0 min-h-[52px] rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation',
                  'px-3.5 flex items-center gap-2'
                )}
                whileTap={reduce ? undefined : { scale: 0.98 }}
                aria-label={label}
              >
                <Icon className="h-4 w-4 text-slate-200" strokeWidth={2.5} aria-hidden />
                <span className="font-mono text-[11px] uppercase tracking-widest text-slate-100">
                  {label}
                </span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {hint && (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: reduce ? 0.01 : 0.2 }}
                className="mt-2 px-2"
              >
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
                  <span className="font-sans-data text-[12px] text-slate-200/90">{hint}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

