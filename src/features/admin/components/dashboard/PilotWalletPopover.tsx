import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PilotWalletAdjustParams, PilotWalletDirection, PilotWalletReasonId, PilotWalletResource, PilotWalletLastAction } from '../../lib/pilot-wallet-ui-model'
import {
  WALLET_DIRECTION_LABEL,
  WALLET_PRESETS,
  WALLET_REASON_LABEL,
  WALLET_REASON_ORDER,
  WALLET_RESOURCE_LABEL,
  clampAmount,
} from '../../lib/pilot-wallet-ui-model'

type PilotWalletPopoverProps = {
  pilotId: 'kirill' | 'roma'
  onClose: () => void
  onApply: (params: Omit<PilotWalletAdjustParams, 'pilotId'>) => void
  busy?: boolean
  lastAction?: PilotWalletLastAction | null
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-semibold tracking-tight transition',
        active
          ? 'border-white/20 bg-white/[0.10] text-slate-100'
          : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:border-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
      )}
    >
      {children}
    </button>
  )
}

export function PilotWalletPopover({ onClose, onApply, busy, lastAction }: PilotWalletPopoverProps) {
  const [resource, setResource] = useState<PilotWalletResource>('xp')
  const [direction, setDirection] = useState<PilotWalletDirection>('credit')
  const [reasonId, setReasonId] = useState<PilotWalletReasonId>('lessons')
  const [preset, setPreset] = useState<number | null>(10)
  const [custom, setCustom] = useState<string>('')

  const presets = WALLET_PRESETS[resource]

  const parsedCustom = clampAmount(custom === '' ? 0 : Number(custom))
  const amount = parsedCustom > 0 ? parsedCustom : preset ?? 0
  const canApply = amount > 0 && !busy

  const titleRight = useMemo(() => {
    return resource === 'minutes' ? 'мин' : resource === 'coins' ? 'коины' : 'XP'
  }, [resource])

  return (
    <div className="w-[360px] max-w-[calc(100vw-28px)] rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-[0_18px_50px_rgba(0,0,0,0.55)] overflow-hidden">
      <div className="px-3.5 py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-tight text-slate-100">Кошелек</div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
            {WALLET_RESOURCE_LABEL[resource]} · {WALLET_DIRECTION_LABEL[direction]}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={cn(
            'h-8 w-8 rounded-lg border border-white/10 bg-white/[0.04] text-slate-200',
            'transition hover:bg-white/[0.08] hover:border-white/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
          aria-label="Закрыть"
          title="Закрыть"
        >
          ×
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Ресурс</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['xp', 'coins', 'minutes'] as PilotWalletResource[]).map((r) => (
              <Chip
                key={r}
                active={resource === r}
                onClick={() => {
                  setResource(r)
                  setPreset(WALLET_PRESETS[r][1] ?? WALLET_PRESETS[r][0] ?? null)
                  setCustom('')
                }}
              >
                {WALLET_RESOURCE_LABEL[r]}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Действие</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(['credit', 'debit'] as PilotWalletDirection[]).map((d) => (
              <Chip key={d} active={direction === d} onClick={() => setDirection(d)}>
                {WALLET_DIRECTION_LABEL[d]}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Сумма</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-600">{titleRight}</div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((n) => (
              <Chip
                key={n}
                active={preset === n && parsedCustom === 0}
                onClick={() => {
                  setPreset(n)
                  setCustom('')
                }}
              >
                {n}
              </Chip>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <input
                value={custom}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') return setCustom('')
                  if (!/^\d+$/.test(v)) return
                  setCustom(v)
                }}
                inputMode="numeric"
                placeholder="..."
                className={cn(
                  'h-9 w-[84px] rounded-xl border border-white/10 bg-white/[0.03] px-3',
                  'font-mono text-xs tabular-nums text-slate-100 placeholder:text-slate-600',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
                aria-label="Своя сумма"
              />
            </div>
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">Причина</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {WALLET_REASON_ORDER.map((id) => (
              <Chip key={id} active={reasonId === id} onClick={() => setReasonId(id)}>
                {WALLET_REASON_LABEL[id]}
              </Chip>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={!canApply}
          onClick={() => {
            onApply({ resource, direction, amount, reasonId })
          }}
          className={cn(
            'w-full h-10 rounded-xl border border-white/10 bg-white/[0.06]',
            'text-sm font-semibold text-slate-100 transition',
            'hover:bg-white/[0.10] hover:border-white/20',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
            (!canApply || busy) && 'opacity-60 cursor-not-allowed hover:bg-white/[0.06]'
          )}
        >
          Применить
        </button>

        {lastAction?.summary ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 flex items-center justify-between gap-2">
            <div className="min-w-0 font-mono text-[11px] text-slate-300 truncate">{lastAction.summary}</div>
            {lastAction.undo ? (
              <button
                type="button"
                onClick={() => lastAction.undo?.()}
                className={cn(
                  'shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5',
                  'font-mono text-[10px] uppercase tracking-[0.14em] text-slate-200',
                  'transition hover:bg-white/[0.08] hover:border-white/20',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                {lastAction.undoLabel}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

