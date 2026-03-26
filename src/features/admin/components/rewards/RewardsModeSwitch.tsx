import { cn } from '@/lib/utils'
import type { RewardsMode } from '../../lib/admin-rewards-ui-model'

type RewardsModeSwitchProps = {
  mode: RewardsMode
  onChange: (mode: RewardsMode) => void
  className?: string
}

export function RewardsModeSwitch({ mode, onChange, className }: RewardsModeSwitchProps) {
  return (
    <div className={cn('inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-1', className)}>
      {[
        { id: 'store' as const, label: 'Магазин' },
        { id: 'wheel' as const, label: 'Колесо' },
      ].map((opt) => {
        const active = mode === opt.id
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'min-h-[40px] rounded-2xl px-4 text-sm font-semibold tracking-tight transition touch-manipulation',
              active ? 'bg-white/[0.10] text-slate-50' : 'text-slate-300 hover:bg-white/[0.06]'
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

