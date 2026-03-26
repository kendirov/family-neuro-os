import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { GlobalHeader } from '@/components/KidsDashboard/GlobalHeader'
import { LootboxOpenModal } from '../components/loot/LootboxOpenModal'
import { RaidBossArena } from '../components/raid/RaidBossArena'
import { RaidVictoryModal } from '../components/raid/RaidVictoryModal'
import { makeMockBoss } from '../mocks/raid.mock'
import { tgText } from '@/i18n/tgMessages'
import { PilotTabBar, usePilotTab, type PilotZoneTabId } from '../components/nav/PilotTabBar'
import { PilotBaseScreen } from './PilotBaseScreen'
import { PilotControlScreen } from './PilotControlScreen'
import { PilotArenaScreen } from './PilotArenaScreen'


export function PilotHomePage() {
  const [tab] = usePilotTab()
  const [raidOpen, setRaidOpen] = useState(false)
  const [victoryOpen, setVictoryOpen] = useState(false)
  const [damageEvent, setDamageEvent] = useState<null | { id: string; amount: number; sourceLabel: string }>(null)
  const raidProgressRaw = useAppStore((s) => s.raidProgress ?? 0)
  const raidProgress = typeof raidProgressRaw === 'number' ? raidProgressRaw : 0
  const RAID_TARGET = 1500

  const bossHp = Math.max(0, RAID_TARGET - raidProgress)
  const boss = makeMockBoss({ hp: bossHp, maxHp: RAID_TARGET, rarity: 'EPIC' })

  const prevProgressRef = useRef(raidProgress)
  useEffect(() => {
    const prev = prevProgressRef.current
    if (raidProgress > prev) {
      const dmg = raidProgress - prev
      const id = `dmg-${Date.now()}-${Math.random().toString(16).slice(2)}`
      setDamageEvent({ id, amount: Math.max(0, dmg), sourceLabel: 'Прогресс' })
      window.setTimeout(() => setDamageEvent(null), 900)
    }
    if (prev < RAID_TARGET && raidProgress >= RAID_TARGET) {
      window.setTimeout(() => setVictoryOpen(true), 450)
    }
    prevProgressRef.current = raidProgress
  }, [raidProgress])

  const [weekendLootboxOpen, setWeekendLootboxOpen] = useState(false)
  const weekendLootboxItem = useState(() => ({
    id: 'lb-weekend-001',
    itemType: 'LOOTBOX' as const,
    rarity: 'EPIC' as const,
    status: 'AVAILABLE' as const,
    name: 'Выходной лутбокс',
    emoji: '🧰',
    subtitle: 'награда рейда',
  }))[0]

  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden text-white bg-slate-950"
      role="main"
      aria-label={tgText('kid', 'pilotHome.aria')}
    >
      <GlobalHeader />

      {/* Pilot Tab Bar (mobile bottom, desktop inline) */}
      <div className="px-4 sm:px-6 pt-4 md:pt-3">
        <div className="md:flex md:items-center md:justify-between md:gap-3">
          <div className="hidden md:block">
            <PilotTabBar />
          </div>
        </div>
      </div>

      {tab === 'base' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PilotBaseScreen />
        </div>
      ) : tab === 'control' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PilotControlScreen />
        </div>
      ) : tab === 'arena' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <PilotArenaScreen onOpenRaid={() => setRaidOpen(true)} />
        </div>
      ) : null}

      {/* Mobile bottom tabs */}
      <div className="md:hidden">
        <PilotTabBar />
      </div>

      <RaidBossArena open={raidOpen} boss={boss} onClose={() => setRaidOpen(false)} pendingDamageEvent={damageEvent} />
      <RaidVictoryModal
        open={victoryOpen}
        boss={boss}
        onClose={() => setVictoryOpen(false)}
        onOpenWeekendLootbox={() => {
          setVictoryOpen(false)
          setWeekendLootboxOpen(true)
        }}
      />
      <LootboxOpenModal
        open={weekendLootboxOpen}
        pilotId="family"
        accent="cyan"
        lootbox={weekendLootboxItem}
        onClose={() => setWeekendLootboxOpen(false)}
        onReward={() => {
          // UI-only: reward flow ends here until backend exists.
        }}
      />
    </div>
  )
}

