import { cn } from '@/lib/utils'

export function ScheduleCollapseToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'min-h-[34px] rounded-lg border border-white/10 bg-white/[0.04] px-3',
        'text-xs font-semibold text-slate-100 transition hover:bg-white/[0.08] hover:border-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
      )}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Развернуть расписание' : 'Свернуть расписание'}
    >
      {collapsed ? 'Развернуть' : 'Свернуть'}
    </button>
  )
}

