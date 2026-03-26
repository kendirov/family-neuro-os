import type {
  InventoryItemDisplayModel,
  InventoryItemType,
  InventoryRarity,
  InventoryStatus,
  LootboxRewardDisplayModel,
  LootboxRewardTable,
} from '../lib/inventory-ui-model'

export const INVENTORY_MOCK_ITEMS: Record<string, InventoryItemDisplayModel[]> = {
  roma: [
    {
      id: 'lb-roma-001',
      itemType: 'LOOTBOX',
      rarity: 'COMMON',
      status: 'AVAILABLE',
      name: 'Garage Box',
      emoji: '📦',
      subtitle: '1 reward roll',
    },
    {
      id: 'lb-roma-002',
      itemType: 'LOOTBOX',
      rarity: 'RARE',
      status: 'AVAILABLE',
      name: 'Neon Crate',
      emoji: '🧊',
      subtitle: 'shiny fuel parts',
    },
    {
      id: 'lb-roma-003',
      itemType: 'LOOTBOX',
      rarity: 'EPIC',
      status: 'LOCKED',
      name: 'Command Cache',
      emoji: '🗄️',
      subtitle: 'locked until next day',
      expiresLabel: null,
    },
    {
      id: 'skin-roma-001',
      itemType: 'SKIN',
      rarity: 'COMMON',
      status: 'AVAILABLE',
      name: 'Tech Sticker Pack',
      emoji: '🟦',
      subtitle: 'cosmetic only',
    },
    {
      id: 'boost-roma-001',
      itemType: 'BOOST',
      rarity: 'RARE',
      status: 'AVAILABLE',
      name: 'XP Turbo Chip',
      emoji: '⚡',
      subtitle: 'boost day XP',
    },
    {
      id: 'time-roma-001',
      itemType: 'TIME_PACK',
      rarity: 'EPIC',
      status: 'AVAILABLE',
      name: 'Screen Time Pack',
      emoji: '⏱️',
      subtitle: 'game minutes pack',
    },
    {
      id: 'spin-roma-001',
      itemType: 'SPIN',
      rarity: 'COMMON',
      status: 'EXPIRED',
      name: 'Wheel Spin Token',
      emoji: '🎰',
      subtitle: 'expired token',
      expiresLabel: 'expired 2d ago',
    },
    {
      id: 'badge-roma-001',
      itemType: 'BADGE',
      rarity: 'LEGENDARY',
      status: 'AVAILABLE',
      name: 'Garage Veteran',
      emoji: '🏅',
      subtitle: 'permanent badge',
    },
  ],
  kirill: [
    {
      id: 'lb-kirill-001',
      itemType: 'LOOTBOX',
      rarity: 'RARE',
      status: 'AVAILABLE',
      name: 'Purple Drop',
      emoji: '🟪',
      subtitle: 'rare reward roll',
    },
    {
      id: 'lb-kirill-002',
      itemType: 'LOOTBOX',
      rarity: 'LEGENDARY',
      status: 'AVAILABLE',
      name: 'Legend Garage Box',
      emoji: '🌌',
      subtitle: 'legendary roll',
    },
    {
      id: 'lb-kirill-003',
      itemType: 'LOOTBOX',
      rarity: 'COMMON',
      status: 'USED',
      name: 'Old Toolbox',
      emoji: '🧰',
      subtitle: 'already used',
    },
    {
      id: 'skin-kirill-001',
      itemType: 'SKIN',
      rarity: 'EPIC',
      status: 'AVAILABLE',
      name: 'Space Helmet Glow',
      emoji: '🚀',
      subtitle: 'cosmetic',
    },
    {
      id: 'boost-kirill-001',
      itemType: 'BOOST',
      rarity: 'COMMON',
      status: 'AVAILABLE',
      name: 'Routine Booster',
      emoji: '📈',
      subtitle: 'small XP boost',
    },
    {
      id: 'time-kirill-001',
      itemType: 'TIME_PACK',
      rarity: 'RARE',
      status: 'AVAILABLE',
      name: 'Focus Time Pack',
      emoji: '🕒',
      subtitle: 'time pack',
    },
  ],
}

export const INVENTORY_MOCK_REWARD_TABLES: LootboxRewardTable[] = [
  {
    lootboxId: 'lb-roma-001',
    options: [
      { rewardId: 'reward-roma-coin-01', weight: 55, quantity: 35 },
      { rewardId: 'reward-roma-skin-01', weight: 25, quantity: 1 },
      { rewardId: 'reward-roma-boost-01', weight: 20, quantity: 1 },
    ],
  },
  {
    lootboxId: 'lb-roma-002',
    options: [
      { rewardId: 'reward-roma-coin-02', weight: 40, quantity: 65 },
      { rewardId: 'reward-roma-boost-02', weight: 40, quantity: 1 },
      { rewardId: 'reward-roma-time-01', weight: 20, quantity: 1 },
    ],
  },
  {
    lootboxId: 'lb-kirill-001',
    options: [
      { rewardId: 'reward-kirill-coin-01', weight: 50, quantity: 45 },
      { rewardId: 'reward-kirill-skin-01', weight: 30, quantity: 1 },
      { rewardId: 'reward-kirill-boost-01', weight: 20, quantity: 1 },
    ],
  },
  {
    lootboxId: 'lb-kirill-002',
    options: [
      { rewardId: 'reward-kirill-legend-boost-01', weight: 50, quantity: 1 },
      { rewardId: 'reward-kirill-legend-badge-01', weight: 30, quantity: 1 },
      { rewardId: 'reward-kirill-legend-skin-01', weight: 20, quantity: 1 },
    ],
  },
  {
    lootboxId: 'lb-weekend-001',
    options: [
      { rewardId: 'reward-weekend-rare-skin-01', weight: 45, quantity: 1 },
      { rewardId: 'reward-weekend-epic-boost-01', weight: 35, quantity: 1 },
      { rewardId: 'reward-weekend-legend-badge-01', weight: 20, quantity: 1 },
    ],
  },
]

export const INVENTORY_MOCK_REWARD_CATALOG: Record<string, Omit<LootboxRewardDisplayModel, 'quantity'>> = {
  'reward-roma-coin-01': {
    rewardId: 'reward-roma-coin-01',
    itemType: 'BOOST',
    rarity: 'COMMON',
    name: '+35 XP day boost',
    emoji: '⚡',
    subtitle: 'micro reward',
  },
  'reward-roma-skin-01': {
    rewardId: 'reward-roma-skin-01',
    itemType: 'SKIN',
    rarity: 'COMMON',
    name: 'Sticker Tech Pack',
    emoji: '🟦',
    subtitle: 'cosmetic unlock',
  },
  'reward-roma-boost-01': {
    rewardId: 'reward-roma-boost-01',
    itemType: 'BOOST',
    rarity: 'RARE',
    name: 'Neon XP Chip',
    emoji: '🧩',
    subtitle: 'rare boost',
  },
  'reward-roma-coin-02': {
    rewardId: 'reward-roma-coin-02',
    itemType: 'BOOST',
    rarity: 'RARE',
    name: '+65 XP day boost',
    emoji: '⚡',
    subtitle: 'strong micro reward',
  },
  'reward-roma-boost-02': {
    rewardId: 'reward-roma-boost-02',
    itemType: 'BOOST',
    rarity: 'EPIC',
    name: 'Premium Fuel Part',
    emoji: '🛢️',
    subtitle: 'epic boost component',
  },
  'reward-roma-time-01': {
    rewardId: 'reward-roma-time-01',
    itemType: 'TIME_PACK',
    rarity: 'RARE',
    name: 'Focus Time +',
    emoji: '🕒',
    subtitle: 'time pack',
  },
  'reward-kirill-coin-01': {
    rewardId: 'reward-kirill-coin-01',
    itemType: 'BOOST',
    rarity: 'RARE',
    name: '+45 XP day boost',
    emoji: '⚡',
    subtitle: 'rare boost',
  },
  'reward-kirill-skin-01': {
    rewardId: 'reward-kirill-skin-01',
    itemType: 'SKIN',
    rarity: 'EPIC',
    name: 'Space Helmet Glow',
    emoji: '🚀',
    subtitle: 'epic cosmetic',
  },
  'reward-kirill-boost-01': {
    rewardId: 'reward-kirill-boost-01',
    itemType: 'BOOST',
    rarity: 'COMMON',
    name: 'Routine Booster',
    emoji: '📈',
    subtitle: 'small boost',
  },
  'reward-kirill-legend-boost-01': {
    rewardId: 'reward-kirill-legend-boost-01',
    itemType: 'BOOST',
    rarity: 'LEGENDARY',
    name: 'Legend Turbo Chip',
    emoji: '👑',
    subtitle: 'legend boost',
  },
  'reward-kirill-legend-badge-01': {
    rewardId: 'reward-kirill-legend-badge-01',
    itemType: 'BADGE',
    rarity: 'LEGENDARY',
    name: 'Legend Garage Veteran',
    emoji: '🏅',
    subtitle: 'permanent badge',
  },
  'reward-kirill-legend-skin-01': {
    rewardId: 'reward-kirill-legend-skin-01',
    itemType: 'SKIN',
    rarity: 'LEGENDARY',
    name: 'Galaxy Command Skin',
    emoji: '🌌',
    subtitle: 'legend cosmetic',
  },
  'reward-weekend-rare-skin-01': {
    rewardId: 'reward-weekend-rare-skin-01',
    itemType: 'SKIN',
    rarity: 'RARE',
    name: 'Weekend Neon Decal',
    emoji: '🟦',
    subtitle: 'rare cosmetic',
  },
  'reward-weekend-epic-boost-01': {
    rewardId: 'reward-weekend-epic-boost-01',
    itemType: 'BOOST',
    rarity: 'EPIC',
    name: 'Weekend Turbo Core',
    emoji: '🛢️',
    subtitle: 'epic boost',
  },
  'reward-weekend-legend-badge-01': {
    rewardId: 'reward-weekend-legend-badge-01',
    itemType: 'BADGE',
    rarity: 'LEGENDARY',
    name: 'Weekend Raid Champion',
    emoji: '🏅',
    subtitle: 'legend badge',
  },
}

export function pickWeightedRewardRewardId(
  lootboxId: string,
  tableOverrides?: LootboxRewardTable[]
): string {
  const table = (tableOverrides ?? INVENTORY_MOCK_REWARD_TABLES).find((t) => t.lootboxId === lootboxId)
  if (!table) return Object.keys(INVENTORY_MOCK_REWARD_CATALOG)[0] ?? 'reward-unknown'

  const totalWeight = table.options.reduce((sum, o) => sum + Math.max(0, o.weight), 0)
  const r = Math.random() * totalWeight
  let acc = 0
  for (const opt of table.options) {
    acc += Math.max(0, opt.weight)
    if (r <= acc) return opt.rewardId
  }
  return table.options[0]?.rewardId ?? Object.keys(INVENTORY_MOCK_REWARD_CATALOG)[0] ?? 'reward-unknown'
}

export function getLootboxRewardQuantity(lootboxId: string, rewardId: string): number {
  const table = INVENTORY_MOCK_REWARD_TABLES.find((t) => t.lootboxId === lootboxId)
  if (!table) return 1
  return table.options.find((o) => o.rewardId === rewardId)?.quantity ?? 1
}

