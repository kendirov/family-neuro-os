/**
 * AdminScheduleEditor — редактор расписания для админ-панели.
 * Expensive Minimalism: Slate-950, glassmorphism, карточки вместо таблиц.
 * 2026 UI: моно-шрифт для времени, input type="time" в тёмной теме.
 * Collapsible accordion: по умолчанию свёрнут, плавная анимация grid-template-rows.
 */
import { useState, useCallback } from 'react'
import { Plus, Trash2, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DayOfWeek, PilotId, ScheduleSlot, WeeklySchedule } from '@/types/schedule'
import { generateSlotId, migrateFromLegacy } from '@/lib/scheduleUtils'
import { useScheduleStore } from '@/stores/useScheduleStore'

const DAY_KEYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri']
const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'ПН',
  tue: 'ВТ',
  wed: 'СР',
  thu: 'ЧТ',
  fri: 'ПТ',
}

const PILOT_OPTIONS: { id: PilotId; label: string; accent: string }[] = [
  { id: 'roma', label: 'Рома (1-я смена)', accent: 'cyan' },
  { id: 'kirill', label: 'Кирилл (2-я смена)', accent: 'purple' },
]

/** Карточка одного урока */
function LessonSlotCard({
  slot,
  onUpdate,
  onDelete,
  accent,
}: {
  slot: ScheduleSlot
  onUpdate: (slot: ScheduleSlot) => void
  onDelete: () => void
  accent: 'cyan' | 'purple'
}) {
  const isCyan = accent === 'cyan'

  return (
    <div
      className={cn(
        'group rounded-xl border p-3 transition-all duration-200',
        'bg-white/5 backdrop-blur-xl border-white/10',
        'hover:bg-white/[0.07] hover:border-white/15',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
      )}
    >
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        {/* Время — моно, компактно */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="time"
            value={slot.startTime}
            onChange={(e) => onUpdate({ ...slot, startTime: e.target.value })}
            className={cn(
              'font-mono text-sm tabular-nums w-[72px] px-2 py-1.5 rounded-lg',
              'bg-slate-900/80 border border-white/10 text-slate-200',
              'focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20',
              '[&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            aria-label="Начало"
          />
          <span className="font-mono text-slate-500 text-xs">—</span>
          <input
            type="time"
            value={slot.endTime}
            onChange={(e) => onUpdate({ ...slot, endTime: e.target.value })}
            className={cn(
              'font-mono text-sm tabular-nums w-[72px] px-2 py-1.5 rounded-lg',
              'bg-slate-900/80 border border-white/10 text-slate-200',
              'focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20',
              '[&::-webkit-calendar-picker-indicator]:opacity-40 [&::-webkit-calendar-picker-indicator]:cursor-pointer'
            )}
            aria-label="Конец"
          />
        </div>
        {/* Предмет */}
        <input
          type="text"
          value={slot.subject}
          onChange={(e) => onUpdate({ ...slot, subject: e.target.value.trim() || slot.subject })}
          onBlur={(e) => {
            const v = e.target.value.trim()
            if (v !== slot.subject) onUpdate({ ...slot, subject: v || 'Урок' })
          }}
          placeholder="Предмет"
          className={cn(
            'flex-1 min-w-0 font-mono text-sm px-3 py-1.5 rounded-lg',
            'bg-slate-900/80 border border-white/10 text-slate-100 placeholder:text-slate-500',
            'focus:outline-none focus:ring-1 focus:ring-white/20 focus:border-white/20'
          )}
          aria-label="Название предмета"
        />
        {/* Удалить */}
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'shrink-0 p-2 rounded-lg transition',
            'text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/30',
            'opacity-60 group-hover:opacity-100'
          )}
          aria-label="Удалить урок"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

export function AdminScheduleEditor() {
  const schedule = useScheduleStore((s) => s.schedule)
  const setSchedule = useScheduleStore((s) => s.setSchedule)
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')
  const [selectedPilot, setSelectedPilot] = useState<PilotId>('roma')
  const [isOpen, setIsOpen] = useState(false)

  const slots = schedule[selectedDay][selectedPilot]
  const pilotAccent = selectedPilot === 'roma' ? 'cyan' : 'purple'

  const updateSlot = useCallback(
    (slotId: string, updates: Partial<ScheduleSlot>) => {
      setSchedule((prev) => {
        const next = { ...prev }
        const day = { ...next[selectedDay] }
        const list = [...day[selectedPilot]]
        const idx = list.findIndex((s) => s.id === slotId)
        if (idx < 0) return prev
        list[idx] = { ...list[idx], ...updates }
        day[selectedPilot] = list
        next[selectedDay] = day
        return next
      })
    },
    [selectedDay, selectedPilot]
  )

  const deleteSlot = useCallback(
    (slotId: string) => {
      setSchedule((prev) => {
        const next = { ...prev }
        const day = { ...next[selectedDay] }
        day[selectedPilot] = day[selectedPilot].filter((s) => s.id !== slotId)
        next[selectedDay] = day
        return next
      })
    },
    [selectedDay, selectedPilot]
  )

  const addSlot = useCallback(() => {
    const newSlot: ScheduleSlot = {
      id: generateSlotId(),
      dayOfWeek: selectedDay,
      subject: 'Новый урок',
      startTime: '08:00',
      endTime: '08:45',
    }
    setSchedule((prev) => {
      const next = { ...prev }
      const day = { ...next[selectedDay] }
      day[selectedPilot] = [...day[selectedPilot], newSlot].sort(
        (a, b) => a.startTime.localeCompare(b.startTime)
      )
      next[selectedDay] = day
      return next
    })
  }, [selectedDay, selectedPilot])

  const resetToDefault = useCallback(() => {
    if (window.confirm('Сбросить расписание к исходному? Текущие изменения будут потеряны.')) {
      setSchedule(migrateFromLegacy())
    }
  }, [setSchedule])

  return (
    <div
      className={cn(
        'rounded-2xl overflow-hidden',
        'bg-slate-900/50 border border-white/10',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.35)]'
      )}
    >
      {/* Заголовок + Toggle — glassmorphic */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setIsOpen((o) => !o)}
          className={cn(
            'flex items-center gap-2 min-w-0 flex-1 text-left',
            'rounded-xl px-3 py-2 -mx-1 -my-0.5 transition-colors',
            'hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-white/20 focus:ring-inset'
          )}
          aria-expanded={isOpen}
          aria-controls="schedule-editor-content"
        >
          <Calendar className="h-5 w-5 text-slate-400 shrink-0" strokeWidth={2} aria-hidden />
          <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-slate-300 truncate">
            Редактор расписания
          </h2>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-slate-400 shrink-0 ml-auto transition-transform duration-300 ease-out',
              isOpen && 'rotate-180'
            )}
            strokeWidth={2.5}
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            resetToDefault()
          }}
          className={cn(
            'shrink-0 font-mono text-[10px] text-slate-500 hover:text-slate-300 px-2.5 py-1.5 rounded-lg transition',
            'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/15'
          )}
        >
          Сбросить
        </button>
      </div>

      {/* Accordion: grid-template-rows для плавного slide без layout jump */}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div id="schedule-editor-content" className="min-h-0 overflow-hidden">
          <div className="p-4 space-y-4 border-t border-white/5">
            {/* Выбор дня: ПН–ПТ */}
            <div className="flex flex-wrap gap-1.5">
              {DAY_KEYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'font-mono text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition',
                    selectedDay === day
                      ? 'bg-white/15 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-slate-300'
                  )}
                >
                  {DAY_LABELS[day]}
                </button>
              ))}
            </div>

            {/* Выбор пилота: Рома / Кирилл */}
            <div className="flex gap-2">
              {PILOT_OPTIONS.map(({ id, label, accent }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedPilot(id)}
                  className={cn(
                    'font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition border',
                    selectedPilot === id
                      ? accent === 'cyan'
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                        : 'bg-purple-500/20 text-purple-200 border-purple-400/50'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Список уроков — карточки */}
            <div className="space-y-2">
              {slots.length === 0 ? (
                <div
                  className={cn(
                    'rounded-xl border border-dashed border-white/20 py-8 text-center',
                    'bg-white/[0.02] text-slate-500 font-mono text-sm'
                  )}
                >
                  Нет уроков в этот день
                </div>
              ) : (
                slots.map((slot) => (
                  <LessonSlotCard
                    key={slot.id}
                    slot={slot}
                    onUpdate={(updated) => updateSlot(slot.id, updated)}
                    onDelete={() => deleteSlot(slot.id)}
                    accent={pilotAccent}
                  />
                ))
              )}

              {/* Кнопка добавить */}
              <button
                type="button"
                onClick={addSlot}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed transition',
                  'border-white/20 text-slate-400 hover:border-white/30 hover:text-slate-300 hover:bg-white/5',
                  'font-mono text-xs font-medium uppercase tracking-wider'
                )}
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Добавить урок
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
