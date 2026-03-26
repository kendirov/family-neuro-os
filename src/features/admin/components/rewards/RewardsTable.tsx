import { cn } from '@/lib/utils'
import type { RewardItem, RewardSource } from '../../lib/admin-rewards-ui-model'
import { formatCoins, formatPercent, rewardSourceLabel, rewardTypeLabel } from '../../lib/admin-rewards-ui-model'

type RewardsTableProps = {
  items: RewardItem[]
  onEdit: (id: string) => void
  onToggleEnabled: (id: string) => void
  onArchive: (id: string) => void
  onMoveSource: (id: string, next: RewardSource) => void
  className?: string
}

function pill(cls: string) {
  return cn(
    'inline-flex items-center justify-center rounded-xl border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]',
    cls
  )
}

export function RewardsTable({
  items,
  onEdit,
  onToggleEnabled,
  onArchive,
  onMoveSource,
  className,
}: RewardsTableProps) {
  return (
    <div className={cn('rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden', className)}>
      <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-4 py-3 text-[11px] font-medium text-slate-300">
        <div className="col-span-5 font-mono uppercase tracking-[0.18em] text-slate-400">Название</div>
        <div className="col-span-2 font-mono uppercase tracking-[0.18em] text-slate-400">Цена</div>
        <div className="col-span-2 font-mono uppercase tracking-[0.18em] text-slate-400">Тип</div>
        <div className="col-span-1 font-mono uppercase tracking-[0.18em] text-slate-400">Рейт</div>
        <div className="col-span-2 font-mono uppercase tracking-[0.18em] text-slate-400 text-right">Действия</div>
      </div>

      <div className="divide-y divide-white/10">
        {items.map((it) => (
          <div
            key={it.id}
            className={cn(
              'grid grid-cols-12 gap-2 px-4 py-3 transition',
              'hover:bg-white/[0.03]'
            )}
          >
            <div className="col-span-5 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={pill(
                    it.source === 'store'
                      ? 'border-white/10 bg-white/[0.03] text-slate-300'
                      : 'border-white/10 bg-slate-950/30 text-slate-300'
                  )}
                >
                  {rewardSourceLabel(it.source)}
                </span>
                {!it.enabled ? (
                  <span className={pill('border-white/10 bg-white/[0.02] text-slate-500')}>Выключено</span>
                ) : null}
                <div className="min-w-0">
                  <div className={cn('truncate text-sm font-semibold tracking-tight', it.archived && 'text-slate-500')}>
                    {it.name}
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    id {it.id}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                {formatCoins(it.costCoins)}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Coins</div>
            </div>

            <div className="col-span-2">
              <div className="text-sm text-slate-200">{rewardTypeLabel(it.type)}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Type</div>
            </div>

            <div className="col-span-1">
              <div className="font-mono text-sm font-semibold tabular-nums text-slate-100">
                {formatPercent(it.dropRate)}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Wheel</div>
            </div>

            <div className="col-span-2 flex items-start justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(it.id)}
                className={cn(
                  'h-9 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-slate-100 transition',
                  'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                Правка
              </button>
              <button
                type="button"
                onClick={() => onToggleEnabled(it.id)}
                className={cn(
                  'h-9 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-xs font-semibold text-slate-300 transition',
                  'hover:bg-white/[0.06] hover:border-white/20 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                {it.enabled ? 'Выключить' : 'Включить'}
              </button>
              <button
                type="button"
                onClick={() => onMoveSource(it.id, it.source === 'store' ? 'wheel' : 'store')}
                className={cn(
                  'h-9 rounded-xl border border-white/10 bg-white/[0.02] px-3 text-xs font-semibold text-slate-300 transition',
                  'hover:bg-white/[0.06] hover:border-white/20 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                Перенос
              </button>
              <button
                type="button"
                onClick={() => onArchive(it.id)}
                className={cn(
                  'h-9 rounded-xl border border-white/10 bg-red-500/10 px-3 text-xs font-semibold text-red-200 transition',
                  'hover:bg-red-500/15 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                Архив
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            Нет элементов в этом режиме.
          </div>
        ) : null}
      </div>
    </div>
  )
}

