import { motion, useReducedMotion } from 'motion/react'
import type { InventoryRarity } from '../../lib/inventory-ui-model'

const LABEL: Record<InventoryRarity, string> = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  EPIC: 'EPIC',
  LEGENDARY: 'LEGENDARY',
}

function baseClasses(rarity: InventoryRarity) {
  if (rarity === 'COMMON') return 'border-cyan-500/45 bg-cyan-500/10 text-cyan-200'
  if (rarity === 'RARE') return 'border-blue-500/50 bg-blue-500/10 text-blue-200'
  if (rarity === 'EPIC') return 'border-purple-500/60 bg-purple-500/10 text-purple-200'
  return 'border-amber-500/65 bg-amber-500/10 text-amber-200'
}

function glowStyle(rarity: InventoryRarity) {
  if (rarity === 'COMMON') return { boxShadow: '0 0 18px rgba(34,211,238,0.22)' }
  if (rarity === 'RARE') return { boxShadow: '0 0 20px rgba(59,130,246,0.20)' }
  if (rarity === 'EPIC') return { boxShadow: '0 0 24px rgba(168,85,247,0.24)' }
  return { boxShadow: '0 0 26px rgba(251,191,36,0.28)' }
}

export function RarityBadge({ rarity, compact = true }: { rarity: InventoryRarity; compact?: boolean }) {
  const shouldReduceMotion = useReducedMotion()
  const classes = baseClasses(rarity)

  const content = LABEL[rarity]
  const pulse = !shouldReduceMotion && rarity === 'LEGENDARY'

  return (
    <motion.span
      className={[
        'inline-flex items-center justify-center rounded-lg border px-2',
        compact ? 'py-1 text-[10px] font-mono uppercase tracking-widest' : 'py-2 text-[11px] font-mono uppercase tracking-widest',
        classes,
      ].join(' ')}
      style={glowStyle(rarity)}
      animate={pulse ? { scale: [1, 1.05, 1], opacity: [0.95, 1, 0.98] } : undefined}
      transition={pulse ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
    >
      {content}
    </motion.span>
  )
}

