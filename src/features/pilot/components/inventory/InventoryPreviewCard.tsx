import { motion, useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { ACCENT_THEMES } from '../../lib/pilot-theme'
import type { PilotAccent } from '../../lib/pilot-ui-model'
import type { InventoryItemDisplayModel } from '../../lib/inventory-ui-model'
import { RarityBadge } from '../loot/RarityBadge'
import { tgText } from '@/i18n/tgMessages'

export function InventoryPreviewCard({
  accent,
  items,
  onOpenInventory,
}: {
  accent: PilotAccent
  items: InventoryItemDisplayModel[]
  onOpenInventory: () => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const theme = ACCENT_THEMES[accent]

  const capacity = 12
  const preview = useMemoPreview(items)

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/55 backdrop-blur-xl p-4" aria-label={tgText('kid', 'inventory.preview.aria')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.25em] text-slate-300/90">{tgText('kid', 'inventory.preview.title')}</h3>
          <p className="mt-1 font-mono text-xs text-slate-400/90">
            {items.length > 0
              ? tgText('kid', 'inventory.preview.count', { count: items.length })
              : tgText('kid', 'inventory.preview.empty')}
          </p>
        </div>
        <div className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', theme.hudChip].join(' ')}>
          {items.length}/{capacity}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {preview.length === 0 ? (
          <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-center font-mono text-xs text-slate-500">
            {tgText('kid', 'inventory.preview.noneYet')}
          </div>
        ) : (
          preview.map((it) => (
            <motion.div
              key={it.id}
              className="rounded-2xl border border-white/10 bg-slate-950/40 p-3 overflow-hidden relative"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              role="button"
              tabIndex={0}
              aria-label={tgText('kid', 'inventory.item.aria', { name: it.name, status: it.status, type: it.itemType })}
            >
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 bg-cyan-400/40 blur-2xl" />
              <div className="relative flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[18px]" aria-hidden>
                    {it.emoji}
                  </span>
                  <RarityBadge rarity={it.rarity} compact />
                </div>
                <p className="font-mono text-[11px] text-slate-200 truncate">{it.name}</p>
                <p className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">
                  {it.status}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="mt-4">
        <motion.button
          type="button"
          onClick={onOpenInventory}
          className={[
            'w-full rounded-2xl border px-3 py-3 font-mono text-[11px] uppercase tracking-widest touch-manipulation',
            accent === 'cyan'
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20'
              : 'border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20',
          ].join(' ')}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
          aria-label={tgText('kid', 'inventory.openCta')}
        >
          {tgText('kid', 'inventory.openCta')}
        </motion.button>
      </div>
    </section>
  )
}

function useMemoPreview(items: InventoryItemDisplayModel[]) {
  return useMemo(() => {
    const sorted = [...items].sort((a, b) => {
      const rarityOrder: Record<string, number> = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 }
      const sA = rarityOrder[a.rarity] ?? 0
      const sB = rarityOrder[b.rarity] ?? 0
      if (sA !== sB) return sB - sA
      const statusOrder: Record<string, number> = { AVAILABLE: 4, LOCKED: 3, EXPIRED: 2, USED: 1 }
      const stA = statusOrder[a.status] ?? 0
      const stB = statusOrder[b.status] ?? 0
      if (stA !== stB) return stB - stA
      return a.name.localeCompare(b.name)
    })

    return sorted.slice(0, 4)
  }, [items])
}

// Turbo-Garage Pilot Home components (Stage 2A).

