/**
 * GlassCard — Expensive Minimalism: чистое glassmorphism.
 * bg-white/5, backdrop-blur-xl, razor-thin border, soft inner glows.
 * Без сплошных фонов.
 */
import { cn } from '@/lib/utils'

const GLASS_BASE =
  'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]'

/** Вариант с чуть более тёмным стеклом (для контраста на светлом фоне) */
const GLASS_DARK = 'bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl ' +
  'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.35)]'

export function GlassCard({ children, className, variant = 'base', ...props }) {
  const glassClass = variant === 'dark' ? GLASS_DARK : GLASS_BASE
  return (
    <div className={cn(glassClass, className)} {...props}>
      {children}
    </div>
  )
}
