export type PilotWalletResource = 'xp' | 'coins' | 'minutes'
export type PilotWalletDirection = 'credit' | 'debit'

export type PilotWalletReasonId = 'lessons' | 'food' | 'help' | 'bonus' | 'penalty' | 'manual'

export type PilotWalletAdjustParams = {
  pilotId: 'kirill' | 'roma'
  resource: PilotWalletResource
  direction: PilotWalletDirection
  amount: number
  reasonId: PilotWalletReasonId
}

export type PilotWalletLastAction = {
  summary: string
  undoLabel: string
  undo?: () => void
}

export const WALLET_RESOURCE_LABEL: Record<PilotWalletResource, string> = {
  xp: 'XP',
  coins: 'Турбо-коины',
  minutes: 'Минуты',
}

export const WALLET_DIRECTION_LABEL: Record<PilotWalletDirection, string> = {
  credit: 'Начислить',
  debit: 'Списать',
}

export const WALLET_REASON_LABEL: Record<PilotWalletReasonId, string> = {
  lessons: 'Уроки',
  food: 'Еда',
  help: 'Помощь',
  bonus: 'Бонус',
  penalty: 'Штраф',
  manual: 'Ручная правка',
}

export const WALLET_REASON_ORDER: PilotWalletReasonId[] = ['lessons', 'food', 'help', 'bonus', 'penalty', 'manual']

export const WALLET_PRESETS: Record<PilotWalletResource, number[]> = {
  xp: [5, 10, 20, 50],
  coins: [5, 10, 20, 50],
  minutes: [5, 10, 15, 30],
}

export function clampAmount(n: number) {
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.floor(n))
}

export function formatWalletDelta(params: PilotWalletAdjustParams) {
  const sign = params.direction === 'credit' ? '+' : '−'
  const unit = params.resource === 'minutes' ? 'минут' : params.resource === 'coins' ? 'коинов' : 'XP'
  return `${sign}${params.amount} ${unit}`
}

export function describeWalletAction(params: PilotWalletAdjustParams) {
  const res = WALLET_RESOURCE_LABEL[params.resource]
  const dir = WALLET_DIRECTION_LABEL[params.direction]
  const reason = WALLET_REASON_LABEL[params.reasonId]
  const amount = params.amount
  if (params.resource === 'minutes') return `${dir}: ${amount} мин · ${reason}`
  return `${dir}: ${amount} ${res} · ${reason}`
}

