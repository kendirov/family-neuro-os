export function AdminLogsPage() {
  const transactions = useAppStore((s) => s.transactions) as unknown as Transaction[]

  const baseRows = useMemo(() => {
    const real = mapTransactionsToLogs(transactions ?? [])
    if (real.length) return real
    return LOGS_MOCK.slice().sort((a, b) => b.at - a.at)
  }, [transactions])

  const [filters, setFilters] = useState<LogsFilters>({
    actor: 'all',
    actionType: 'all',
    direction: 'all',
    pilotId: 'all',
    day: 'all',
    search: '',
  })

  const availableDays = useMemo(() => getAvailableDays(baseRows), [baseRows])
  const rows = useMemo(() => applyLogsFilters(baseRows, filters).sort((a, b) => b.at - a.at), [baseRows, filters])

  const [detailId, setDetailId] = useState<string | null>(null)
  const detailRow = useMemo(() => (detailId ? rows.find((r) => r.id === detailId) ?? null : null), [detailId, rows])

  return (
    <div className="min-h-0">
      <AdminPageHeader
        title="История"
        description="Неизменяемый журнал фактов. Быстрый поиск и фильтры — для разборов без эмоций."
        right={
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">rows</div>
            <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-100">
              {rows.length}
            </div>
          </div>
        }
        className="mb-4"
      />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4 min-h-0">
        <LogsFiltersBar
          className="lg:col-span-4"
          value={filters}
          onChange={setFilters}
          availableDays={availableDays}
        />

        <div className="lg:col-span-8 min-h-0">
          <LogsTable rows={rows} onOpenDetail={setDetailId} />
        </div>
      </div>

      <LogDetailDrawer
        open={detailId != null}
        row={detailRow}
        onClose={() => setDetailId(null)}
      />
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import type { Transaction } from '@/types/entities'
import { AdminPageHeader } from '../components/common/AdminPageHeader'
import { LogsFiltersBar } from '../components/logs/LogsFiltersBar'
import { LogsTable } from '../components/logs/LogsTable'
import { LogDetailDrawer } from '../components/logs/LogDetailDrawer'
import type { LogsFilters } from '../lib/admin-logs-ui-model'
import { applyLogsFilters, getAvailableDays, mapTransactionsToLogs } from '../lib/admin-logs-ui-model'
import { LOGS_MOCK } from '../mocks/logs.mock'
