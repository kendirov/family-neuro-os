import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { PilotWalletAdjustParams, PilotWalletLastAction } from '../../lib/pilot-wallet-ui-model'
import { PilotWalletPopover } from './PilotWalletPopover'
import { PilotWalletSheet } from './PilotWalletSheet'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 640px)')
    const apply = () => setMobile(!!mql.matches)
    apply()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onChange = (e: any) => setMobile(!!e.matches)
    if (typeof mql.addEventListener === 'function') mql.addEventListener('change', onChange)
    else mql.addListener(onChange)
    return () => {
      if (typeof mql.removeEventListener === 'function') mql.removeEventListener('change', onChange)
      else mql.removeListener(onChange)
    }
  }, [])
  return mobile
}

type PilotWalletButtonProps = {
  pilotId: 'kirill' | 'roma'
  busy?: boolean
  lastAction?: PilotWalletLastAction | null
  onApply: (params: Omit<PilotWalletAdjustParams, 'pilotId'>) => void
}

export function PilotWalletButton({ pilotId, onApply, busy, lastAction }: PilotWalletButtonProps) {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement | null>(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const placement = useMemo(() => {
    const el = anchorRef.current
    if (!el) return { top: 0, left: 0 }
    const r = el.getBoundingClientRect()
    // Popover opens below/right-aligned with button.
    return { top: r.bottom + 8, left: Math.max(12, r.right - 360) }
  }, [open, isMobile])

  return (
    <div ref={anchorRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'min-h-[34px] rounded-lg border border-white/10 bg-white/[0.04] px-2.5',
          'text-xs font-semibold text-slate-100 transition hover:bg-white/[0.08] hover:border-white/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        Кошелек
      </button>

      {/* Desktop popover */}
      {!isMobile && open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Закрыть"
            onClick={close}
          />
          <div className="fixed z-50" style={{ top: placement.top, left: placement.left }}>
            <PilotWalletPopover pilotId={pilotId} onClose={close} onApply={onApply} busy={busy} lastAction={lastAction} />
          </div>
        </>
      ) : null}

      {/* Mobile sheet */}
      {isMobile ? (
        <PilotWalletSheet open={open} onClose={close} pilotId={pilotId} onApply={onApply} busy={busy} lastAction={lastAction} />
      ) : null}
    </div>
  )
}

