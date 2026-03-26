import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useMemo, useState } from 'react'
import type { InventoryItemDisplayModel } from '../../lib/inventory-ui-model'
import { InventoryGrid } from './InventoryGrid'
import { tgText } from '@/i18n/tgMessages'

type FilterKey = 'ALL' | 'BOXES' | 'BOOSTS' | 'SKINS' | 'TIME'

function filterLabel(key: FilterKey) {
  if (key === 'ALL') return 'Все'
  if (key === 'BOXES') return 'Коробки'
  if (key === 'BOOSTS') return 'Бусты'
  if (key === 'SKINS') return 'Скины'
  return 'Время'
}

function matchesFilter(item: InventoryItemDisplayModel, key: FilterKey) {
  if (key === 'ALL') return true
  if (key === 'BOXES') return item.itemType === 'LOOTBOX' || item.itemType === 'SPIN'
  if (key === 'BOOSTS') return item.itemType === 'BOOST'
  if (key === 'SKINS') return item.itemType === 'SKIN'
  return item.itemType === 'TIME_PACK'
}

export function InventorySheet({
  open,
  accent,
  items,
  onClose,
  onOpenLootbox,
}: {
  open: boolean
  accent: 'cyan' | 'purple'
  items: InventoryItemDisplayModel[]
  onClose: () => void
  onOpenLootbox: (lootboxId: string) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const [filter, setFilter] = useState<FilterKey>('ALL')

  const filtered = useMemo(() => items.filter((it) => matchesFilter(it, filter)), [items, filter])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center p-0"
          role="dialog"
          aria-modal="true"
          aria-label={tgText('kid', 'inventory.drawer.aria')}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        >
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />

          {/* sheet */}
          <motion.div
            className="relative w-full rounded-t-[28px] sm:rounded-3xl sm:w-[92vw] max-w-[980px] panel-glass border border-white/10 overflow-hidden"
            initial={
              shouldReduceMotion
                ? { y: 0, opacity: 1 }
                : { y: 24, opacity: 0 }
            }
            animate={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.25 }}
          >
            <div className="p-4 sm:p-5 border-b border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-gaming text-base sm:text-lg uppercase tracking-wider">
                    {tgText('kid', 'inventory.title')}
                  </h2>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    {tgText('kid', 'inventory.drawer.hint')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-mono uppercase tracking-widest text-slate-200 hover:bg-white/10 active:scale-[0.98] touch-manipulation"
                  aria-label={tgText('kid', 'inventory.drawer.closeAria')}
                >
                  {tgText('kid', 'inventory.drawer.close')}
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 overflow-x-auto pb-1">
                {(['ALL', 'BOXES', 'BOOSTS', 'SKINS', 'TIME'] as FilterKey[]).map((k) => {
                  const active = filter === k
                  const base =
                    accent === 'cyan'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                      : 'border-purple-500/40 bg-purple-500/10 text-purple-200'

                  return (
                    <motion.button
                      key={k}
                      type="button"
                      onClick={() => setFilter(k)}
                      className={[
                        'shrink-0 rounded-2xl border px-3 py-2 font-mono text-[10px] uppercase tracking-widest touch-manipulation transition',
                        active ? base : 'border-white/10 bg-white/5 text-slate-300/90 hover:bg-white/10',
                      ].join(' ')}
                      whileHover={shouldReduceMotion ? undefined : { scale: active ? 1.0 : 1.02 }}
                      whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                      aria-label={tgText('kid', 'inventory.filter.aria', { label: filterLabel(k) })}
                    >
                      {filterLabel(k)}
                    </motion.button>
                  )
                })}
              </div>
            </div>

            <div className="p-4 sm:p-5 max-h-[70vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-slate-950/35 p-6 text-center font-mono text-slate-400 text-sm">
                  {tgText('kid', 'inventory.emptyFilter')}
                </div>
              ) : (
                <InventoryGrid items={filtered} accent={accent} onOpenLootbox={onOpenLootbox} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

