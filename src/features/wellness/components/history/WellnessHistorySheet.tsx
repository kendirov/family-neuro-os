import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WellnessHistoryItemModel } from '../../lib/wellness-ui-model'

function formatTime(at: number) {
  return new Date(at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function kindChip(kind: WellnessHistoryItemModel['kind']) {
  if (kind === 'water') return 'Hydration'
  if (kind === 'steps') return 'Steps'
  if (kind === 'vitamin') return 'Vitamins'
  if (kind === 'sleep') return 'Sleep'
  if (kind === 'day_closed') return 'Day'
  if (kind === 'streak') return 'Streak'
  return 'Family'
}

export function WellnessHistorySheet({
  open,
  items,
  onClose,
}: {
  open: boolean
  items: WellnessHistoryItemModel[]
  onClose: () => void
}) {
  const reduce = useReducedMotion()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.section
            key="sheet"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: reduce ? 0.01 : 0.22, ease: 'easeOut' }}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50',
              'mx-auto max-w-3xl'
            )}
            role="dialog"
            aria-modal="true"
            aria-label="Wellness history"
          >
            <div className="rounded-t-[28px] border border-white/10 bg-slate-950/70 backdrop-blur-2xl shadow-[0_-20px_70px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-white/10">
                <div className="min-w-0">
                  <h2 className="font-sans-data text-[14px] font-semibold text-slate-50">
                    History & insights
                  </h2>
                  <p className="mt-0.5 font-sans-data text-[12px] text-slate-400 truncate">
                    Recent logs, streak changes, and family bonus events.
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 h-10 w-10 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 active:bg-white/10 transition touch-manipulation flex items-center justify-center"
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  aria-label="Close history"
                >
                  <X className="h-4 w-4 text-slate-200" strokeWidth={2.5} />
                </motion.button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto p-4 space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <span className="font-sans-data text-[12px] text-slate-300/90">
                      No history yet.
                    </span>
                  </div>
                ) : (
                  items.map((it) => (
                    <motion.div
                      key={it.id}
                      layout
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500 shrink-0">
                              {formatTime(it.at)}
                            </span>
                            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-300 border border-white/10 bg-slate-950/30 px-2 py-1 rounded-lg shrink-0">
                              {kindChip(it.kind)}
                            </span>
                          </div>
                          <div className="mt-2 font-sans-data text-[13px] text-slate-100">
                            {it.title}
                          </div>
                          {it.detail && (
                            <div className="mt-0.5 font-sans-data text-[12px] text-slate-400">
                              {it.detail}
                            </div>
                          )}
                        </div>
                        {it.deltaLabel && (
                          <span className="shrink-0 font-mono text-[11px] uppercase tracking-widest text-slate-200">
                            {it.deltaLabel}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
              <div className="h-[max(0.75rem,env(safe-area-inset-bottom))]" />
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  )
}

