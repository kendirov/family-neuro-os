import { motion, useReducedMotion } from 'motion/react'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function BossProgressBar({
  current,
  target,
  tone = 'danger',
}: {
  current: number
  target: number
  tone?: 'danger' | 'win'
}) {
  const reduce = useReducedMotion()
  const pct = target > 0 ? clamp((Math.max(0, target - current) / target) * 100, 0, 100) : 0
  const hp = Math.max(0, target - current)

  return (
    <div aria-label="Прогресс босса">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">HP</span>
        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
          {hp} / {target}
        </span>
      </div>
      <div className="h-5 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
        <motion.div
          className={[
            'h-full',
            tone === 'win'
              ? 'bg-gradient-to-r from-amber-400/80 via-yellow-300/50 to-amber-500/90'
              : 'bg-gradient-to-r from-red-500/60 via-orange-500/30 to-amber-400/60',
          ].join(' ')}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0.01 : 0.4 }}
        />
      </div>
    </div>
  )
}

