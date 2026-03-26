export type InventoryItemType = 'LOOTBOX' | 'SPIN' | 'SKIN' | 'BOOST' | 'TIME_PACK' | 'BADGE'
export type InventoryRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY'
export type InventoryStatus = 'AVAILABLE' | 'USED' | 'LOCKED' | 'EXPIRED'

/**
 * Display model — UI-ready shape.
 * Raw API model can have different field names / structure.
 */
export interface InventoryItemDisplayModel {
  id: string
  itemType: InventoryItemType
  rarity: InventoryRarity
  status: InventoryStatus
  name: string
  emoji: string
  subtitle?: string
  /**
   * Optional: used to render expiration label (no backend logic in UI).
   * Examples: "expired 2d ago", "expires in 3h"
   */
  expiresLabel?: string | null
}

export interface LootboxRewardDisplayModel {
  rewardId: string
  itemType: InventoryItemType
  rarity: InventoryRarity
  name: string
  emoji: string
  quantity: number
  subtitle?: string
}

export interface LootboxRewardOption {
  rewardId: string
  weight: number
  quantity: number
}

export interface LootboxRewardTable {
  lootboxId: string
  options: LootboxRewardOption[]
}

export interface InventoryApiShape {
  /**
   * Fetch inventory items for pilot.
   * Integration point: map raw API items -> InventoryItemDisplayModel.
   */
  fetchInventoryForPilot: (pilotId: string) => Promise<InventoryItemDisplayModel[]>
  /**
   * Open a lootbox and return chosen reward.
   * Integration point: replace mock roll with server-chosen reward.
   */
  openLootbox: (pilotId: string, lootboxId: string) => Promise<LootboxRewardDisplayModel>
}

