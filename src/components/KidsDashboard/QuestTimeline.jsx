/**
 * QuestTimeline — линейный лог квестов по временным блокам.
 * Expensive Minimalism: тёмный фон (slate-950), вертикальная timeline-линия.
 * Для детей 8–9 лет: понятный flow дня, tooltip с критериями.
 */
import { useMemo } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { getDailyQuestsSections } from '@/data/dailyQuests'
import { QuestRow } from './QuestRow'
import { cn } from '@/lib/utils'

/** Секция: заголовок блока + список задач */
function TimelineSection({ section, isTaskDone }) {
  return (
    <section className="relative" aria-labelledby={`section-${section.id}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg" aria-hidden>{section.emoji}</span>
        <h3
          id={`section-${section.id}`}
          className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500"
        >
          {section.label}
        </h3>
      </div>
      <ul className="space-y-2" role="list">
        {section.tasks.map((task) => (
          <QuestRow
            key={task.id}
            task={task}
            isDone={isTaskDone(task)}
          />
        ))}
      </ul>
    </section>
  )
}

export function QuestTimeline({ childId }) {
  const isDailyBaseComplete = useAppStore((s) => s.isDailyBaseComplete)
  const isTaskCompleteFromTransactions = useAppStore((s) => s.isTaskCompleteFromTransactions)

  const sections = useMemo(() => getDailyQuestsSections(), [])

  const isTaskDone = (task) =>
    isDailyBaseComplete(childId, task.id) ||
    isTaskCompleteFromTransactions(childId, {
      reason_template: task.reasonTemplate,
      label: task.title,
      bonus_reward: task.bonusReward ?? 0,
    })

  return (
    <div
      className={cn(
        'rounded-xl border border-white/10 overflow-visible',
        'bg-slate-950',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_24px_rgba(0,0,0,0.3)]'
      )}
      aria-label="Лог квестов"
    >
      <div className="border-l-2 border-slate-800 pl-4 py-4 ml-2">
        {sections.map((section) => (
          <div key={section.id} className="mb-6 last:mb-0">
            <TimelineSection section={section} isTaskDone={isTaskDone} />
          </div>
        ))}
      </div>
    </div>
  )
}
