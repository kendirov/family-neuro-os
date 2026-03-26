import { motion, useReducedMotion } from 'motion/react'
import type { InventoryItemDisplayModel } from '../../lib/inventory-ui-model'
import { InventoryItemCard } from './InventoryItemCard'
import { tgText } from '@/i18n/tgMessages'

export function InventoryGrid({
  items,
  accent,
  onOpenLootbox,
}: {
  items: InventoryItemDisplayModel[]
  accent: 'cyan' | 'purple'
  onOpenLootbox: (lootboxId: string) => void
}) {
  const shouldReduceMotion = useReducedMotion()

  const sorted = [...items].sort((a, b) => {
    const order: Record<string, number> = { LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 }
    const sA = order[a.rarity] ?? 0
    const sB = order[b.rarity] ?? 0
    if (sA !== sB) return sB - sA
    return a.name.localeCompare(b.name)
  })

  return (
    <motion.ul
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      layout
      initial={false}
      animate={shouldReduceMotion ? undefined : { opacity: 1 }}
      aria-label={tgText('kid', 'inventory.grid.aria')}
    >
      {sorted.map((it) => (
        <InventoryItemCard key={it.id} item={it} accent={accent} onOpenLootbox={onOpenLootbox} />
      ))}
    </motion.ul>
  )
}

