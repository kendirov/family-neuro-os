/**
 * KidsDashboard — главная страница для детей.
 * Expensive Minimalism, строго read-only, split-screen.
 * Левая колонка: Кирилл | Правая колонка: Рома.
 * Строгое выравнивание: grid-cols-2, фикс. высота Schedule → Mission Maps на одной линии.
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { GlobalHeader } from './GlobalHeader'
import { ChildHeader } from './ChildHeader'
import { ReadOnlySchedule } from './ReadOnlySchedule'
import { DailySpinModule } from './DailySpinModule'
import { ScreenTimeHUD } from './ScreenTimeHUD'
import { QuestTimeline } from './QuestTimeline'
import { cn } from '@/lib/utils'

/** Placeholder при загрузке данных пилота */
function ChildColumnPlaceholder({ name, accent }) {
  const isPurple = accent === 'purple'
  return (
    <div
      className={cn(
        'flex flex-col gap-4 overflow-auto rounded-2xl border p-6 items-center justify-center min-h-[200px]',
        isPurple
          ? 'border-purple-500/30 bg-purple-950/20'
          : 'border-cyan-500/30 bg-cyan-950/20'
      )}
      aria-label={`Панель ${name} — загрузка`}
    >
      <p className={cn(
        'font-gaming text-lg uppercase tracking-wider',
        isPurple ? 'text-purple-400/80' : 'text-cyan-400/80'
      )}>
        {name}
      </p>
      <p className="font-mono text-xs text-slate-500">Загрузка...</p>
    </div>
  )
}

/** Одна колонка пилота: header, ScreenTime, Schedule (фикс. высота), Spin, Mission Map */
function ChildColumn({ childId, name, accent }) {
  const users = useAppStore((s) => s.users)
  const user = useMemo(() => users?.find((u) => u.id === childId), [users, childId])

  const isPurple = accent === 'purple'
  const borderAccent = isPurple ? 'border-purple-500/30' : 'border-cyan-500/30'

  if (!user) {
    return <ChildColumnPlaceholder name={name} accent={accent} />
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 min-h-0 min-w-0 overflow-y-auto rounded-2xl p-4',
        'bg-white/5 backdrop-blur-xl border border-white/10',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]',
        borderAccent
      )}
      aria-label={`Панель ${name}`}
    >
      <ChildHeader childId={childId} user={user} accentColor={accent} />

      <ScreenTimeHUD childId={childId} accentColor={accent} />

      {/* Schedule: фикс. высота h-56 → Mission Maps всегда на одной линии */}
      <div className="h-56 shrink-0 overflow-y-auto scrollbar-hide">
        <ReadOnlySchedule childId={childId} accentColor={accent} />
      </div>

      <DailySpinModule childId={childId} accentColor={accent} />

      <QuestTimeline childId={childId} />
    </div>
  )
}

export function KidsDashboard() {
  return (
    <div
      className="flex min-h-screen flex-col overflow-hidden text-white bg-slate-950"
      role="main"
      aria-label="Детский дашборд"
    >
      <GlobalHeader />

      <div className="grid flex-1 min-h-0 grid-cols-2 gap-6 p-6 items-start">
        <ChildColumn childId="kirill" name="Кирилл" accent="purple" />
        <ChildColumn childId="roma" name="Рома" accent="cyan" />
      </div>
    </div>
  )
}
