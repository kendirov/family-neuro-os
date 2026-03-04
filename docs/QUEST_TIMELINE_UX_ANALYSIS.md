# Quest Timeline — UX/Architecture анализ и рекомендации

## 1. Текущее состояние

### 1.1 Дублирование источников данных

| Источник | Структура | Использование |
|----------|-----------|---------------|
| **taskDefinitionsSeed.json** | id, label, emoji, time_block, base_reward, bonus_reward, sort_order | ReadOnlyQuestMap, SpinAndQuests, Admin |
| **taskConfig.js** | MORNING_ROUTINE, SCHOOL_INTELLECT, NUTRITION — другая структура, другие id | Dashboard, MissionLog |

**Проблема:** Два параллельных источника с разными id (wake_up vs wake_on_time). Риск рассинхронизации.

### 1.2 Текущие UI-компоненты

| Компонент | Layout | Стиль | Ограничения |
|-----------|--------|-------|-------------|
| **ReadOnlyQuestMap** | Bento grid 4×5, квадратные карточки | Slate-800, emerald glow | Плотная сетка — сложно читать порядок дня |
| **SpinAndQuests** | Вертикальный список по блокам | Cyan/purple accent | Нет timeline-линии, нет tooltip |
| **MissionsList** | Списки available/completed | — | Интерактивен, slice задач |

### 1.3 Проверка выполнения

- `isDailyBaseComplete(userId, taskId)` — локальный dailyBase
- `isTaskCompleteFromTransactions(userId, task)` — транзакции (Realtime sync)
- ReadOnlyQuestMap использует **оба** — корректно для multi-device

---

## 2. Рекомендации по UX (для 8–9 лет)

### 2.1 Линейный flow дня

- **Вертикальная timeline** — естественный порядок: утро → день → вечер
- Ребёнок видит "путь дня" и понимает, что уже сделано и что впереди
- Контраст: выполнено (ярко) vs ожидает (приглушённо)

### 2.2 Визуальная иерархия

- **Секции** (УТРО, ДЕНЬ, ВЕЧЕР) — крупные заголовки с emoji
- **Задачи** — компактные строки: emoji + title + reward
- **Timeline-линия** — `border-l-2 border-slate-800` слева, соединяет секции

### 2.3 Tooltip (description)

- Время: "До 07:30" для wake_on_time
- Критерии: "Съел всё", "Без напоминаний"
- Помогает родителям объяснять, что именно нужно сделать

### 2.4 Touch-friendly

- Минимальная высота карточки ~44px
- Достаточный gap между элементами

### 2.5 Expensive Minimalism

- Фон: `bg-slate-950`
- Текст: slate-200 / slate-500
- Completed: emerald/cyan accent, subtle glow
- Без лишних декораций — фокус на контенте

---

## 3. Архитектурные решения

### 3.1 Единый источник данных: `dailyQuests.ts`

- **Типы:** `DailyQuest`, `TimeBlock`, `DailyQuestsData`
- **Данные:** Трансформация из taskDefinitionsSeed.json + добавление `description`
- **isCompleted:** Вычисляется в компоненте из store (реактивно)

### 3.2 Интерфейс задачи

```ts
interface DailyQuest {
  id: string
  emoji: string
  title: string
  reward: number
  description: string  // для tooltip
  isCompleted: boolean // передаётся извне, не из статики
}
```

### 3.3 Группировка по блокам

- `🌅 УТРО` — morning
- `☀️ ДЕНЬ` — afternoon + anytime
- `🌙 ВЕЧЕР` — evening

### 3.4 Интеграция

- QuestTimeline — **read-only**, как ReadOnlyQuestMap
- Можно заменить ReadOnlyQuestMap на QuestTimeline в KidsDashboard
- Или использовать оба (timeline как альтернативный вид)

---

## 4. План реализации

1. Создать `src/data/dailyQuests.ts` — типы + данные
2. Создать `src/components/KidsDashboard/QuestTimeline.jsx`
3. Экспорт в index.js
4. Подключить в KidsDashboard (замена или рядом с ReadOnlyQuestMap)
