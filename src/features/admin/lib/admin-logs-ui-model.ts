import type { Transaction } from '@/types/entities'

export type LogActor = 'parent' | 'system' | 'kid'
export type LogDirection = 'positive' | 'negative' | 'neutral'
export type LogActionType = 'task' | 'points' | 'timer' | 'reward' | 'system' | 'unknown'

export type AdminLogRecord = {
  id: string
  at: number
  actor: LogActor
  actionType: LogActionType
  direction: LogDirection
  title: string
  valueLabel: string
  pilotId: string | null
  raw: unknown
}

export type LogsFilters = {
  actor: LogActor | 'all'
  actionType: LogActionType | 'all'
  direction: LogDirection | 'all'
  pilotId: 'all' | 'kirill' | 'roma'
  day: 'all' | string // YYYY-MM-DD
  search: string
}

function dayKey(at: number) {
  return new Date(at).toISOString().slice(0, 10)
}

function directionFromAmount(amount: number): LogDirection {
  if (amount > 0) return 'positive'
  if (amount < 0) return 'negative'
  return 'neutral'
}

function actionTypeFromTx(tx: Transaction): LogActionType {
  if (tx.type === 'burn') return 'timer'
  if (tx.type === 'earn' || tx.type === 'spend') return 'points'
  return 'unknown'
}

function valueLabelFromTx(tx: Transaction) {
  // Keep it compact and machine-readable in the column.
  const n = Math.abs(Number(tx.amount) || 0)
  const sign = tx.amount >= 0 ? '+' : '−'
  return `${sign}${n} XP`
}

function titleFromTx(tx: Transaction) {
  // Human sentence: clear fact, not a code.
  // Without actor metadata, we treat transactions as "system ledger" for now.
  const base = tx.description?.trim()
  if (base) return `Система: ${base}`
  if (tx.amount >= 0) return 'Система начислила XP'
  return 'Система списала XP'
}

export function mapTransactionsToLogs(transactions: Transaction[]): AdminLogRecord[] {
  return (transactions ?? []).map((tx) => {
    const direction = directionFromAmount(tx.amount)
    return {
      id: tx.id,
      at: tx.at,
      actor: 'system',
      actionType: actionTypeFromTx(tx),
      direction,
      title: titleFromTx(tx),
      valueLabel: valueLabelFromTx(tx),
      pilotId: tx.userId ?? null,
      raw: tx,
    }
  })
}

export function getAvailableDays(rows: AdminLogRecord[]) {
  const days = Array.from(new Set(rows.map((r) => dayKey(r.at)))).sort().reverse()
  return days
}

export function applyLogsFilters(rows: AdminLogRecord[], f: LogsFilters) {
  const q = f.search.trim().toLowerCase()
  return rows.filter((r) => {
    if (f.actor !== 'all' && r.actor !== f.actor) return false
    if (f.actionType !== 'all' && r.actionType !== f.actionType) return false
    if (f.direction !== 'all' && r.direction !== f.direction) return false
    if (f.pilotId !== 'all' && r.pilotId !== f.pilotId) return false
    if (f.day !== 'all' && dayKey(r.at) !== f.day) return false
    if (q) {
      const hay = `${r.title} ${r.valueLabel} ${r.pilotId ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

