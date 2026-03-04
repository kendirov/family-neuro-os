/**
 * Утилиты для Pilot HUD: текущая задача по времени, таймлайн дня.
 */
import { getScheduleKey } from '@/data/weeklySchedule'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { TASK_CONFIG } from '@/data/taskConfig'

/** Временные слоты для задач (приблизительно). */
const TIME_SLOTS = [
  { start: 6, end: 9, phase: 'morning', taskIds: ['wake_up', 'teeth_morning', 'make_bed'], meal: 'breakfast' },
  { start: 9, end: 13, phase: 'school_roma', taskIds: ['school_leave', 'pack_bag'] },
  { start: 12, end: 14, phase: 'lunch', taskIds: ['lunch'] },
  { start: 13, end: 18, phase: 'school_kirill', taskIds: [] },
  { start: 15, end: 18, phase: 'afternoon', taskIds: ['homework_base', 'homework_extra'] },
  { start: 18, end: 20, phase: 'dinner', taskIds: ['dinner'] },
  { start: 19, end: 22, phase: 'evening', taskIds: ['help_clean', 'take_trash', 'go_store', 'sleep_time'] },
]

/** Получить текущую задачу/урок по времени и пилоту. */
export function getCurrentFocus(now, pilotId, isDailyBaseComplete) {
  const hour = now.getHours() + now.getMinutes() / 60
  const dayKey = getScheduleKey(now.getDay())

  // Школа: текущий урок по расписанию
  const legacySchedule = useScheduleStore.getState().getLegacySchedule()
  if (dayKey && legacySchedule[dayKey]) {
    const lessons = legacySchedule[dayKey][pilotId] ?? []
    const isRoma = pilotId === 'roma'
    const schoolStart = isRoma ? 8 : 13.33 // 13:20
    const schoolEnd = isRoma ? 13 : 18

    if (hour >= schoolStart && hour < schoolEnd && lessons.length > 0) {
      const lessonDuration = 45 / 60 + 15 / 60 // 45 мин + 15 перерыв
      const index = Math.floor((hour - schoolStart) / lessonDuration)
      const lesson = lessons[Math.min(index, lessons.length - 1)]
      if (lesson) {
        return {
          type: 'lesson',
          label: lesson.name,
          emoji: '📚',
          id: `lesson_${index}`,
        }
      }
    }
  }

  // Задачи по времени
  for (const slot of TIME_SLOTS) {
    if (hour >= slot.start && hour < slot.end) {
      if (slot.phase === 'school_roma' && pilotId !== 'roma') continue
      if (slot.phase === 'school_kirill' && pilotId !== 'kirill') continue

      for (const taskId of slot.taskIds) {
        if (!isDailyBaseComplete(pilotId, taskId)) {
          const task = findTaskById(taskId)
          if (task) return { type: 'task', ...task }
        }
      }
      if (slot.meal) {
        const mealId = slot.meal
        if (!isDailyBaseComplete(pilotId, mealId)) {
          const task = findTaskById(mealId)
          if (task) return { type: 'task', ...task }
        }
      }
    }
  }

  return { type: 'idle', label: 'Свободное время', emoji: '✨', id: 'idle' }
}

function findTaskById(id) {
  const sources = [
    TASK_CONFIG.MORNING_ROUTINE.tasks,
    TASK_CONFIG.SCHOOL_INTELLECT.tasks,
    TASK_CONFIG.BASE_MAINTENANCE.tasks,
    ...TASK_CONFIG.NUTRITION.foodComposite.flatMap((r) => [r.main, ...(r.modifiers ?? [])]),
  ]
  const t = sources.find((x) => x.id === id)
  const isDaily = !['grade_5_plus', 'grade_5', 'grade_4', 'grade_3', 'grade_2'].includes(id)
  return t ? { id: t.id, label: t.label, emoji: t.emoji, credits: t.credits, reason: t.reason, isDaily } : null
}

/** Таймлайн событий на сегодня (уроки + приёмы пищи). */
export function getTodayTimeline(now, pilotId) {
  const dayKey = getScheduleKey(now.getDay())
  const events = []
  const isRoma = pilotId === 'roma'

  const legacySchedule = useScheduleStore.getState().getLegacySchedule()
  if (dayKey && legacySchedule[dayKey]) {
    const lessons = legacySchedule[dayKey][pilotId] ?? []
    const startHour = isRoma ? 8 : 13.33
    lessons.forEach((lesson, i) => {
      const start = startHour + i * (45 / 60 + 15 / 60)
      const h = Math.floor(start)
      const m = Math.round((start % 1) * 60)
      events.push({
        time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        label: lesson.name,
        type: 'lesson',
        hour: start,
      })
    })
  }

  // Приёмы пищи
  const meals = [
    { hour: 8, label: 'Завтрак', emoji: '🍳' },
    { hour: 13, label: 'Обед', emoji: '🍔' },
    { hour: 16, label: 'Полдник', emoji: '🍪' },
    { hour: 19, label: 'Ужин', emoji: '🍲' },
  ]
  meals.forEach((m) => {
    events.push({
      time: `${String(Math.floor(m.hour)).padStart(2, '0')}:00`,
      label: m.label,
      type: 'meal',
      hour: m.hour,
      emoji: m.emoji,
    })
  })

  const currentHour = now.getHours() + now.getMinutes() / 60
  events.sort((a, b) => a.hour - b.hour)

  return events.map((e) => ({
    ...e,
    isPast: e.hour < currentHour,
    isNow: Math.abs(e.hour - currentHour) < 0.5,
  }))
}
