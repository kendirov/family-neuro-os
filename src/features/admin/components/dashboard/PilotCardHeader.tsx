import { PilotAvatar } from '@/components/HelmetAvatar'
import { levelFromXp } from '@/features/pilot/lib/pilot-base-ui-model'

type PilotCardHeaderProps = {
  pilotId: 'roma' | 'kirill'
  name: string
  balance: number
  screenMinutes: number
}

export function PilotCardHeader({ pilotId, name, balance, screenMinutes }: PilotCardHeaderProps) {
  const { level } = levelFromXp(balance)
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <PilotAvatar pilotId={pilotId} size="engine" />
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold tracking-tight text-slate-100">{name}</h3>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            Level {level}
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono text-sm font-semibold tabular-nums text-slate-100">{balance} XP</div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
          Топливо • {screenMinutes}м
        </div>
      </div>
    </div>
  )
}
