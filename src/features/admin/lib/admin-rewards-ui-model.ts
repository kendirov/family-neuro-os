export type RewardSource = 'store' | 'wheel'
export type RewardType = 'one_time' | 'persistent'

export type RewardItem = {
  id: string
  name: string
  costCoins: number
  type: RewardType
  /**
   * 0..1. Only meaningful for wheel items; keep null for store-only items.
   */
  dropRate: number | null
  enabled: boolean
  archived: boolean
  source: RewardSource
  updatedAt: string
}

export type RewardsMode = RewardSource

export function clampInt(n: number, min = 0, max = 1_000_000) {
  const x = Math.floor(Number(n))
  if (!Number.isFinite(x)) return min
  return Math.max(min, Math.min(max, x))
}

export function clampRate01(n: number | null) {
  if (n == null) return null
  const x = Number(n)
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

export function formatCoins(n: number) {
  return `${clampInt(n)}`
}

export function formatPercent(rate01: number | null) {
  if (rate01 == null) return '—'
  const pct = Math.round(rate01 * 10_000) / 100
  return `${pct.toFixed(2)}%`
}

export function rewardTypeLabel(t: RewardType) {
  return t === 'one_time' ? 'One‑time' : 'Persistent'
}

export function rewardSourceLabel(s: RewardSource) {
  return s === 'store' ? 'Store' : 'Wheel'
}

export function calcRewardsSummary(items: RewardItem[]) {
  const total = items.filter((x) => !x.archived).length
  const enabled = items.filter((x) => !x.archived && x.enabled).length
  const store = items.filter((x) => !x.archived && x.source === 'store').length
  const wheel = items.filter((x) => !x.archived && x.source === 'wheel').length
  const wheelRateSum = items
    .filter((x) => !x.archived && x.source === 'wheel' && x.enabled)
    .reduce((sum, x) => sum + (x.dropRate ?? 0), 0)

  return { total, enabled, store, wheel, wheelRateSum }
}

