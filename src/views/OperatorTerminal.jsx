/**
 * OperatorTerminal — вид оператора (Александра).
 * Холодный утилитарный дашборд: Logistics SLAs, toggle + countdown.
 * Без админ-контролов, без геймификации.
 */
import { useState, useEffect } from 'react'
import { KioskLayout } from '@/components/Layout/KioskLayout'
import { Header } from '@/components/Header'
import { GlassCard } from '@/components/GlassCard'
import { OPERATOR_SLAS } from '@/data/operatorSlas'
import { SlaCard } from '@/components/OperatorTerminal/SlaCard'
import { loadSlaState, saveSlaState } from '@/lib/operatorSlaUtils'

function getDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export function OperatorTerminal() {
  const [slaState, setSlaState] = useState(() => loadSlaState())
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    saveSlaState(slaState)
  }, [slaState])

  const handleToggle = (slaId, completed) => {
    setSlaState((prev) => ({
      ...prev,
      [slaId]: {
        completed,
        completedAt: completed ? new Date().toISOString() : undefined,
      },
    }))
  }

  const completedCount = Object.values(slaState).filter((s) => s?.completed).length
  const totalCount = OPERATOR_SLAS.length

  return (
    <KioskLayout>
      <Header />
      <main className="flex-1 p-4 md:p-6" data-view="operator">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Cold header: title + stats */}
          <GlassCard variant="dark" className="p-4">
            <div className="flex items-center justify-between">
              <h1 className="font-mono text-sm font-bold uppercase tracking-widest text-slate-400">
                Operator Terminal
              </h1>
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-4">
              <span className="font-mono text-[10px] text-slate-500">
                {getDateKey()}
              </span>
              <span className="font-mono text-[10px] text-slate-500">
                SLA: {completedCount}/{totalCount}
              </span>
            </div>
          </GlassCard>

          {/* SLA list */}
          <div className="space-y-2">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-slate-500 px-1">
              Logistics SLAs
            </h2>
            {OPERATOR_SLAS.map((sla) => (
              <SlaCard
                key={sla.id}
                sla={sla}
                completed={!!slaState[sla.id]?.completed}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </main>
    </KioskLayout>
  )
}
