import { motion, useReducedMotion } from 'motion/react'
import type { InventoryRarity } from '../../lib/inventory-ui-model'

function colorSet(rarity: InventoryRarity) {
  if (rarity === 'COMMON') return ['rgba(34,211,238,0.85)', 'rgba(34,211,238,0.35)']
  if (rarity === 'RARE') return ['rgba(59,130,246,0.85)', 'rgba(59,130,246,0.35)']
  if (rarity === 'EPIC') return ['rgba(168,85,247,0.85)', 'rgba(168,85,247,0.35)']
  return ['rgba(251,191,36,0.9)', 'rgba(251,191,36,0.35)']
}

export function LootParticles({ rarity, enabled }: { rarity: InventoryRarity; enabled: boolean }) {
  const shouldReduceMotion = useReducedMotion()
  if (!enabled || shouldReduceMotion) return null

  const colors = colorSet(rarity)

  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (Math.PI * 2 * i) / 12
    const dist = 20 + (i % 4) * 7 + (rarity === 'LEGENDARY' ? 12 : 0)
    const size = 4 + (i % 3) * 2
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
      size,
    }
  })

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.i}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: colors[0],
            boxShadow: `0 0 18px ${colors[1]}`,
          }}
          initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
          animate={{ opacity: [0.1, 0.9, 0], scale: [0.9, 1.15, 1], x: p.x, y: p.y }}
          transition={{ duration: rarity === 'LEGENDARY' ? 0.75 : 0.55, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

