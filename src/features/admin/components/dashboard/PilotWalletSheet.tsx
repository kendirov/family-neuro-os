import { cn } from '@/lib/utils'
import type { PilotWalletAdjustParams, PilotWalletLastAction } from '../../lib/pilot-wallet-ui-model'
import { PilotWalletPopover } from './PilotWalletPopover'

type PilotWalletSheetProps = {
  open: boolean
  onClose: () => void
  pilotId: 'kirill' | 'roma'
  onApply: (params: Omit<PilotWalletAdjustParams, 'pilotId'>) => void
  busy?: boolean
  lastAction?: PilotWalletLastAction | null
}

export function PilotWalletSheet({ open, onClose, pilotId, onApply, busy, lastAction }: PilotWalletSheetProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute left-0 right-0 bottom-0',
          'rounded-t-3xl border border-white/10 bg-slate-950/75 backdrop-blur-xl',
          'shadow-[0_-18px_60px_rgba(0,0,0,0.65)]'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Кошелек"
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-center">
          <div className="h-1.5 w-12 rounded-full bg-white/10" aria-hidden />
        </div>
        <div className="px-3 pb-4">
          <PilotWalletPopover pilotId={pilotId} onClose={onClose} onApply={onApply} busy={busy} lastAction={lastAction} />
        </div>
      </div>
    </div>
  )
}

