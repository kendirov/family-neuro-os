/**
 * Main Focus: одна текущая задача или урок. Крупная типографика.
 */
import { GlassCard } from '@/components/GlassCard'
import { cn } from '@/lib/utils'

export function PilotMainFocus({ focus, onComplete, accentColor = 'cyan', disabled }) {
  const isTask = focus?.type === 'task'
  const canComplete = isTask && !disabled && focus.credits != null

  const handleClick = () => {
    if (canComplete && onComplete) onComplete(focus)
  }

  const accent = accentColor === 'purple' ? 'purple' : 'cyan'

  return (
    <GlassCard
      className={cn(
        'p-6 sm:p-8 flex flex-col items-center justify-center min-h-[180px] cursor-default',
        canComplete && 'cursor-pointer hover:border-white/20 transition-colors'
      )}
      onClick={canComplete ? handleClick : undefined}
      role={canComplete ? 'button' : undefined}
    >
      <span className="text-5xl sm:text-6xl mb-3" aria-hidden>
        {focus?.emoji ?? '✨'}
      </span>
      <h2
        className={cn(
          'font-sans-data text-xl sm:text-2xl md:text-3xl font-bold text-center text-white leading-tight',
          accent === 'purple' ? 'drop-shadow-[0_0_12px_rgba(168,85,247,0.5)]' : 'drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]'
        )}
      >
        {focus?.label ?? '—'}
      </h2>
      {isTask && focus.credits != null && (
        <span className="mt-2 font-turbo-nums text-sm text-amber-400/90">
          {focus.credits >= 0 ? '+' : ''}{focus.credits} ⚡
        </span>
      )}
    </GlassCard>
  )
}
