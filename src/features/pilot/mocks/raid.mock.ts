import type { RaidBossDisplayModel, RaidPhaseDisplay, RaidRarity } from '../lib/raid-ui-model'

export const RAID_PHASES: RaidPhaseDisplay[] = [
  {
    id: 'PHASE_1',
    label: 'PHASE 1: гаражный гость',
    description: 'Тёплый старт. Контракты наносят урон.',
    hpPercentAtOrBelow: 100,
  },
  {
    id: 'PHASE_2',
    label: 'PHASE 2: режим тревоги',
    description: 'Босс злится. Визуал становится жарче.',
    hpPercentAtOrBelow: 66,
  },
  {
    id: 'PHASE_3',
    label: 'PHASE 3: финал',
    description: 'Последний рывок. Яркий reveal награды.',
    hpPercentAtOrBelow: 33,
  },
]

export function pickPhase(hp: number, maxHp: number): RaidPhaseDisplay {
  const pct = maxHp <= 0 ? 0 : Math.round((hp / maxHp) * 100)
  if (pct <= 33) return RAID_PHASES[2]
  if (pct <= 66) return RAID_PHASES[1]
  return RAID_PHASES[0]
}

export function makeMockBoss({
  hp = 1200,
  maxHp = 1200,
  rarity = 'EPIC',
}: {
  hp?: number
  maxHp?: number
  rarity?: RaidRarity
} = {}): RaidBossDisplayModel {
  const phase = pickPhase(hp, maxHp)
  return {
    bossId: 'boss-day-001',
    name: 'Суши‑Босс',
    emoji: '🍣',
    rarity,
    maxHp,
    hp,
    phase,
    rewardLootboxId: 'lb-weekend-001',
    rewardLabel: 'Weekend Lootbox (Rare/Epic шанс)',
  }
}

