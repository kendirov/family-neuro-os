import { useMemo } from 'react'
import { ADMIN_MACROS, getMacroTasks } from '../../lib/admin-macros.config'
import { MacroButton } from './MacroButton'
import { TaskSuccessToast } from './TaskSuccessToast'
import { useRunMacroOptimistic } from '../../hooks/useRunMacroOptimistic'

type QuickMacrosBarProps = {
  pilotIds: Array<'roma' | 'kirill'>
}

export function QuickMacrosBar({ pilotIds }: QuickMacrosBarProps) {
  const macroOps = useRunMacroOptimistic(pilotIds)

  const summaries = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of ADMIN_MACROS) {
      const tasks = getMacroTasks(m)
      map.set(m.id, `${tasks.length} задач`)
    }
    return map
  }, [])

  return (
    <section className="relative panel-glass rounded-2xl border border-white/10 bg-white/[0.04] p-3 sm:p-4">
      <TaskSuccessToast message={macroOps.feedback?.message ?? null} tone={macroOps.feedback?.tone} />
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-100">Быстрые макросы</h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">2 пилота</span>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {ADMIN_MACROS.map((macro) => (
          <MacroButton
            key={macro.id}
            label={macro.label}
            summary={summaries.get(macro.id)}
            disabled={macroOps.busyMacroId != null || pilotIds.length === 0}
            onClick={() => macroOps.runMacro(macro)}
          />
        ))}
      </div>
    </section>
  )
}
