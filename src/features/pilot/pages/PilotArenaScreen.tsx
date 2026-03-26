import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { ArenaHeroHeader } from '../components/arena/ArenaHeroHeader'
import { DailySpinCard } from '../components/arena/DailySpinCard'
import { BossArenaCard } from '../components/arena/BossArenaCard'

type PilotId = 'kirill' | 'roma'

const PILOTS: Array<{ id: PilotId; fallbackName: string; fallbackAccent: 'cyan' | 'purple' }> = [
  { id: 'kirill', fallbackName: 'Кирилл', fallbackAccent: 'purple' },
  { id: 'roma', fallbackName: 'Рома', fallbackAccent: 'cyan' },
]

export function PilotArenaScreen({ onOpenRaid }: { onOpenRaid: () => void }) {
  const users = useAppStore((s) => s.users)

  const meta = useMemo(() => {
    const list = Array.isArray(users) ? users : []
    const m: Record<PilotId, { name: string; accent: 'cyan' | 'purple' }> = {
      kirill: { name: 'Кирилл', accent: 'purple' },
      roma: { name: 'Рома', accent: 'cyan' },
    }
    for (const p of PILOTS) {
      const u = list.find((x) => x && x.id === p.id)
      m[p.id] = {
        name: (u?.name ?? p.fallbackName) as string,
        accent: (u?.color === 'cyan' ? 'cyan' : 'purple') as 'cyan' | 'purple',
      }
    }
    return m
  }, [users])

  return (
    <div className="px-4 sm:px-6 pt-3 pb-24 md:pb-6">
      <div className="max-w-[1100px] mx-auto flex flex-col gap-5">
        <ArenaHeroHeader />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <DailySpinCard childId="kirill" accent={meta.kirill.accent} name={meta.kirill.name} />
          <DailySpinCard childId="roma" accent={meta.roma.accent} name={meta.roma.name} />
        </div>

        <BossArenaCard onOpenArena={onOpenRaid} />
      </div>
    </div>
  )
}

