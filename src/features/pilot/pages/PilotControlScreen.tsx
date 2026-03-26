import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useActiveSessionId } from '@/hooks/useActiveSessionId'
import { usePenaltyTimer } from '@/hooks/usePenaltyTimer'
import { KidTimerEmptyState } from '../components/control/KidTimerEmptyState'
import { KidTimerHero } from '../components/control/KidTimerHero'
import { KidTimerStatusCard } from '../components/control/KidTimerStatusCard'
import { KidEnergyBurnCard } from '../components/control/KidEnergyBurnCard'

type PilotId = 'kirill' | 'roma'

const PILOTS: Array<{ id: PilotId; fallbackName: string; fallbackAccent: 'cyan' | 'purple' }> = [
  { id: 'kirill', fallbackName: 'Кирилл', fallbackAccent: 'purple' },
  { id: 'roma', fallbackName: 'Рома', fallbackAccent: 'cyan' },
]

function pickPrimaryPilot({
  kirill,
  roma,
}: {
  kirill: { hasSession: boolean; status: string | null }
  roma: { hasSession: boolean; status: string | null }
}): PilotId | null {
  // Prefer active, then paused, then any.
  const order = (x: { hasSession: boolean; status: string | null }) =>
    !x.hasSession ? 0 : x.status === 'active' ? 3 : x.status === 'paused' ? 2 : 1
  const k = order(kirill)
  const r = order(roma)
  if (k === 0 && r === 0) return null
  return k >= r ? 'kirill' : 'roma'
}

export function PilotControlScreen() {
  const users = useAppStore((s) => s.users)

  const kirillSessionId = useActiveSessionId('kirill')
  const romaSessionId = useActiveSessionId('roma')

  const kirill = usePenaltyTimer(kirillSessionId)
  const roma = usePenaltyTimer(romaSessionId)

  const primary = pickPrimaryPilot({
    kirill: { hasSession: !!kirillSessionId, status: kirill.session?.status ?? null },
    roma: { hasSession: !!romaSessionId, status: roma.session?.status ?? null },
  })

  const pilotMeta = useMemo(() => {
    const list = Array.isArray(users) ? users : []
    const meta: Record<PilotId, { name: string; accent: 'cyan' | 'purple' }> = {
      kirill: { name: 'Кирилл', accent: 'purple' },
      roma: { name: 'Рома', accent: 'cyan' },
    }
    for (const p of PILOTS) {
      const u = list.find((x) => x && x.id === p.id)
      meta[p.id] = {
        name: (u?.name ?? p.fallbackName) as string,
        accent: (u?.color === 'cyan' ? 'cyan' : 'purple') as 'cyan' | 'purple',
      }
    }
    return meta
  }, [users])

  const anySession = kirillSessionId != null || romaSessionId != null
  if (!anySession) {
    return (
      <div className="px-4 sm:px-6 pt-3 pb-24 md:pb-6">
        <div className="max-w-[1100px] mx-auto">
          <KidTimerEmptyState />
        </div>
      </div>
    )
  }

  const primaryResult = primary === 'roma' ? roma : kirill
  const primaryName = primary ? pilotMeta[primary].name : 'Пилот'

  return (
    <div className="px-4 sm:px-6 pt-3 pb-24 md:pb-6">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-4">
          {PILOTS.map((p) => {
            const sid = p.id === 'kirill' ? kirillSessionId : romaSessionId
            if (!sid) return null
            const res = p.id === 'kirill' ? kirill : roma
            return (
              <KidTimerHero
                key={p.id}
                pilotId={p.id}
                pilotName={pilotMeta[p.id].name}
                accent={pilotMeta[p.id].accent}
                result={res}
              />
            )
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <KidTimerStatusCard pilotName={primaryName} result={primaryResult} />
          <KidEnergyBurnCard result={primaryResult} />
        </div>
      </div>
    </div>
  )
}

