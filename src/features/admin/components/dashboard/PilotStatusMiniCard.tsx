import { cn } from '@/lib/utils'
import { useAppStore } from '@/stores/useAppStore'
import { PilotAvatar } from '@/components/HelmetAvatar'
import { levelFromXp } from '@/features/pilot/lib/pilot-base-ui-model'
import { TaskSuccessToast } from './TaskSuccessToast'
import type { PilotId } from '../../lib/admin-dashboard-grouped-ui-model'
import { PilotWalletButton } from './PilotWalletButton'
import { usePilotWalletAdjust } from '../../hooks/usePilotWalletAdjust'

type Pilot = {
  id: PilotId
  name: string
  balance: number
} | null

type PilotStatusMiniCardProps = {
  pilotId: PilotId
  pilot: Pilot
  requiredCoreTaskIds: string[]
  isLoading?: boolean
}

export function PilotStatusMiniCard({ pilotId, pilot, requiredCoreTaskIds, isLoading }: PilotStatusMiniCardProps) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const getTodayGameTime = useAppStore((s) => s.getTodayGameTime)
  const getTodayMediaTime = useAppStore((s) => s.getTodayMediaTime)
  const wallet = usePilotWalletAdjust(pilotId)

  const screenMinutes = (getTodayGameTime(pilotId) ?? 0) + (getTodayMediaTime(pilotId) ?? 0)
  const balance = pilot?.balance ?? 0
  const name = pilot?.name ?? (pilotId === 'kirill' ? 'Кирилл' : 'Рома')
  const { level } = levelFromXp(balance)

  const remainingRequired = requiredCoreTaskIds.filter((id) => !isDailyBaseComplete(pilotId, id)).length

  return (
    <div
      className={cn(
        'relative rounded-2xl border border-white/10 bg-slate-950/25 px-3 py-3',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
      )}
      aria-busy={isLoading}
    >
      <TaskSuccessToast message={wallet.feedback?.message ?? null} tone={wallet.feedback?.tone} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <PilotAvatar pilotId={pilotId} size="engine" />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <div className="truncate text-sm font-semibold tracking-tight text-slate-100">{name}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Level {level}</div>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[11px] font-semibold tabular-nums text-slate-100">{balance} XP</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                Топливо {screenMinutes}м
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
                осталось {remainingRequired}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <PilotWalletButton
            pilotId={pilotId}
            busy={wallet.busy}
            lastAction={wallet.lastAction}
            onApply={(params) => wallet.adjustPilotBalance({ pilotId, ...params })}
          />
        </div>
      </div>
    </div>
  )
}

