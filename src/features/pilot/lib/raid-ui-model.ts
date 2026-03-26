export type RaidRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
export type RaidPhaseId = 'PHASE_1' | 'PHASE_2' | 'PHASE_3'

export interface RaidPhaseDisplay {
  id: RaidPhaseId
  label: string
  description: string
  /**
   * Threshold in HP percent (inclusive upper bound).
   * Example: phase 1: >66, phase 2: >33, phase 3: <=33.
   */
  hpPercentAtOrBelow: number
}

export interface RaidBossDisplayModel {
  bossId: string
  name: string
  emoji: string
  rarity: RaidRarity
  maxHp: number
  hp: number
  phase: RaidPhaseDisplay
  rewardLootboxId: string
  rewardLabel: string
}

export interface RaidDamageEvent {
  id: string
  amount: number
  sourceLabel: string
}

export interface RaidApiShape {
  fetchRaidBoss: () => Promise<RaidBossDisplayModel>
  applyContractDamage: (contractId: string) => Promise<{ ok: boolean; damage: number }>
}

