import { motion, useReducedMotion } from 'motion/react'
import type { InventoryItemDisplayModel, InventoryItemType, InventoryRarity, InventoryStatus } from '../../lib/inventory-ui-model'
import { RarityBadge } from '../loot/RarityBadge'
import { tgText } from '@/i18n/tgMessages'

const STATUS_META: Record<InventoryStatus, { label: string; cls: string }> = {
  AVAILABLE: { label: tgText('kid', 'inventory.status.AVAILABLE'), cls: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200' },
  USED: { label: tgText('kid', 'inventory.status.USED'), cls: 'border-white/10 bg-white/5 text-slate-500' },
  LOCKED: { label: tgText('kid', 'inventory.status.LOCKED'), cls: 'border-purple-500/40 bg-purple-500/10 text-purple-200 opacity-90' },
  EXPIRED: { label: tgText('kid', 'inventory.status.EXPIRED'), cls: 'border-red-500/45 bg-red-500/10 text-red-200 opacity-95' },
}

function ctaForItem(item: InventoryItemDisplayModel): { label: string; isDisabled: boolean } {
  if (item.itemType === 'LOOTBOX') {
    if (item.status !== 'AVAILABLE') return { label: tgText('kid', 'inventory.cta.notReady'), isDisabled: true }
    return { label: tgText('kid', 'inventory.cta.open'), isDisabled: false }
  }
  if (item.itemType === 'SPIN') {
    if (item.status !== 'AVAILABLE') return { label: tgText('kid', 'inventory.status.LOCKED'), isDisabled: true }
    return { label: tgText('kid', 'inventory.cta.use'), isDisabled: true }
  }
  return { label: tgText('kid', 'inventory.cta.view'), isDisabled: true }
}

export function InventoryItemCard({
  item,
  accent,
  onOpenLootbox,
}: {
  item: InventoryItemDisplayModel
  accent: 'cyan' | 'purple'
  onOpenLootbox?: (lootboxId: string) => void
}) {
  const shouldReduceMotion = useReducedMotion()
  const statusMeta = STATUS_META[item.status]
  const cta = ctaForItem(item)

  const borderBase =
    accent === 'cyan'
      ? 'border-cyan-500/15 hover:border-cyan-500/25'
      : 'border-purple-500/15 hover:border-purple-500/25'

  const isLootbox = item.itemType === 'LOOTBOX'
  const isInteractive = Boolean(onOpenLootbox && isLootbox && item.status === 'AVAILABLE')

  const onClick = () => {
    if (!isInteractive) return
    onOpenLootbox?.(item.id)
  }

  return (
    <motion.li
      layout
      layoutId={`inv-item-${item.id}`}
      className={[
        'rounded-2xl border bg-slate-900/40 backdrop-blur-xl p-3 overflow-hidden relative',
        borderBase,
        item.status === 'EXPIRED' ? 'opacity-70' : '',
      ].join(' ')}
      whileHover={shouldReduceMotion ? undefined : isInteractive ? { scale: 1.02 } : { scale: 1.0 }}
      whileTap={shouldReduceMotion ? undefined : isInteractive ? { scale: 0.99 } : undefined}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      aria-label={tgText('kid', 'inventory.item.aria', { name: item.name, status: statusMeta.label, type: item.itemType })}
      style={{ touchAction: 'manipulation' }}
    >
      {/* glow corner */}
      <div
        className={[
          'absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-20 blur-2xl',
          item.rarity === 'COMMON'
            ? 'bg-cyan-500'
            : item.rarity === 'RARE'
              ? 'bg-blue-500'
              : item.rarity === 'EPIC'
                ? 'bg-purple-500'
                : 'bg-amber-500',
        ].join(' ')}
        aria-hidden
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-[22px] shrink-0" aria-hidden>
              {item.emoji}
            </span>
            <div className="min-w-0">
              <div className="font-gaming text-sm uppercase tracking-wider truncate">{item.name}</div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <RarityBadge rarity={item.rarity} />
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className={['rounded-lg border px-2 py-1 text-[10px] font-mono uppercase tracking-widest', statusMeta.cls].join(' ')}>
              {statusMeta.label}
            </span>
            {item.expiresLabel && item.status === 'EXPIRED' && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">({item.expiresLabel})</span>
            )}
          </div>
          {item.subtitle && <p className="mt-2 font-mono text-[10px] text-slate-400/90">{item.subtitle}</p>}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClick()
            }}
            disabled={!isInteractive}
            className={[
              'rounded-2xl border px-3 py-2 font-mono text-[11px] uppercase tracking-widest touch-manipulation transition',
              isInteractive
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25 active:scale-[0.98]'
                : 'border-white/10 bg-white/5 text-slate-500 cursor-not-allowed',
            ].join(' ')}
            aria-label={cta.label}
          >
            {cta.label}
          </button>
          {item.itemType === 'LOOTBOX' && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-500">{tgText('kid', 'inventory.type.lootbox')}</span>
          )}
        </div>
      </div>
    </motion.li>
  )
}

