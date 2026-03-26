import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { RewardItem, RewardSource, RewardType } from '../../lib/admin-rewards-ui-model'
import { clampInt, clampRate01, formatPercent } from '../../lib/admin-rewards-ui-model'

type RewardEditorDraft = Pick<RewardItem, 'name' | 'costCoins' | 'type' | 'dropRate' | 'enabled' | 'source'>

type RewardEditorSheetProps = {
  open: boolean
  mode: RewardSource
  item: RewardItem | null
  onClose: () => void
  onSave: (next: RewardEditorDraft) => void
}

function fieldLabel(s: string) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{s}</div>
}

export function RewardEditorSheet({ open, mode, item, onClose, onSave }: RewardEditorSheetProps) {
  const isNew = !item

  const initial = useMemo<RewardEditorDraft>(
    () => ({
      name: item?.name ?? '',
      costCoins: item?.costCoins ?? 0,
      type: item?.type ?? 'one_time',
      dropRate: item?.dropRate ?? (mode === 'wheel' ? 0.1 : null),
      enabled: item?.enabled ?? true,
      source: item?.source ?? mode,
    }),
    [item, mode]
  )

  const [draft, setDraft] = useState<RewardEditorDraft>(initial)

  useEffect(() => {
    setDraft(initial)
  }, [initial, open])

  if (!open) return null

  const canSave = draft.name.trim().length >= 2

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />

      <aside
        className={cn(
          'absolute right-0 top-0 h-full w-full max-w-[520px]',
          'border-l border-white/10 bg-slate-950/80 backdrop-blur-xl',
          'p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)]'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Редактор награды"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
              {isNew ? 'НОВЫЙ ЭЛЕМЕНТ' : 'РЕДАКТИРОВАНИЕ'}
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-slate-50">
              {draft.name.trim() ? draft.name : 'Награда'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm font-semibold text-slate-100 transition',
              'hover:bg-white/[0.08] hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
            )}
          >
            Закрыть
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <div>
            {fieldLabel('Название')}
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className={cn(
                'mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-100',
                'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20'
              )}
              placeholder="Название"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {fieldLabel('Цена (Coins)')}
              <input
                value={String(draft.costCoins)}
                inputMode="numeric"
                onChange={(e) => setDraft((d) => ({ ...d, costCoins: clampInt(Number(e.target.value), 0, 9999) }))}
                className={cn(
                  'mt-2 h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-100',
                  'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20'
                )}
              />
            </div>
            <div>
              {fieldLabel('Тип')}
              <div className="mt-2 inline-flex w-full rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {[
                  { id: 'one_time' as const, label: 'One‑time' },
                  { id: 'persistent' as const, label: 'Persistent' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, type: opt.id }))}
                    className={cn(
                      'flex-1 min-h-[40px] rounded-lg px-3 text-xs font-semibold transition',
                      draft.type === opt.id ? 'bg-white/[0.10] text-slate-50' : 'text-slate-300 hover:bg-white/[0.06]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              {fieldLabel('Источник')}
              <div className="mt-2 inline-flex w-full rounded-xl border border-white/10 bg-white/[0.02] p-1">
                {[
                  { id: 'store' as const, label: 'Store' },
                  { id: 'wheel' as const, label: 'Wheel' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({ ...d, source: opt.id, dropRate: opt.id === 'wheel' ? d.dropRate ?? 0.1 : null }))
                    }
                    className={cn(
                      'flex-1 min-h-[40px] rounded-lg px-3 text-xs font-semibold transition',
                      draft.source === opt.id ? 'bg-white/[0.10] text-slate-50' : 'text-slate-300 hover:bg-white/[0.06]'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              {fieldLabel('Статус')}
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, enabled: !d.enabled }))}
                className={cn(
                  'mt-2 h-11 w-full rounded-xl border border-white/10 px-3 text-sm font-semibold transition',
                  draft.enabled
                    ? 'bg-white/[0.06] text-slate-100 hover:bg-white/[0.10]'
                    : 'bg-white/[0.02] text-slate-400 hover:bg-white/[0.06]'
                )}
              >
                {draft.enabled ? 'Включено' : 'Выключено'}
              </button>
            </div>
          </div>

          <div className={cn(draft.source !== 'wheel' && 'opacity-50')}>
            {fieldLabel('Drop rate (Wheel)')}
            <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
              <input
                disabled={draft.source !== 'wheel'}
                value={draft.dropRate == null ? '' : String(Math.round((draft.dropRate ?? 0) * 10_000) / 100)}
                inputMode="decimal"
                placeholder="0.00"
                onChange={(e) => {
                  const pct = Number(e.target.value)
                  if (!Number.isFinite(pct)) {
                    setDraft((d) => ({ ...d, dropRate: d.source === 'wheel' ? 0 : null }))
                    return
                  }
                  const rate = clampRate01(pct / 100)
                  setDraft((d) => ({ ...d, dropRate: d.source === 'wheel' ? rate : null }))
                }}
                className={cn(
                  'h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-100',
                  'placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed'
                )}
                aria-label="Drop rate (percent)"
              />
              <div className="h-11 rounded-xl border border-white/10 bg-white/[0.02] px-3 flex items-center">
                <span className="font-mono text-xs text-slate-400">{formatPercent(draft.dropRate)}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              В колесе используйте строгие проценты и держите сумму включённых позиций под контролем.
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">{!canSave ? 'Название должно быть \u22652 символов' : ' '}</div>
          <button
            type="button"
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            className={cn(
              'h-11 rounded-2xl border px-5 text-sm font-semibold tracking-tight transition',
              canSave
                ? 'border-white/20 bg-white/[0.10] text-slate-50 hover:bg-white/[0.14]'
                : 'border-white/10 bg-white/[0.03] text-slate-500 cursor-not-allowed'
            )}
          >
            Сохранить
          </button>
        </div>
      </aside>
    </div>
  )
}

