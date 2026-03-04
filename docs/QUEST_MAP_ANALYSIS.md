# QuestMap — Анализ и рекомендации перед реализацией

## 1. Требования (кратко)

- **Компонент:** `<QuestMap />` — внизу колонки каждого ребёнка (заменяет стандартные списки)
- **RPG-style mission board:** все дневные миссии, ничего не скрывать
- **Визуальные состояния:**
  - **Pending:** disabled/greyed, "incomplete skill tree"
  - **Completed:** ярко, с зелёной галочкой и очками (+10 ⚡)
- **Layout:** grid или вертикальный список, `gap-3`, заголовки категорий
- **Read-Only:** клики не делают ничего (Admin управляет)
- **Контраст:** Pending vs Completed должен быть максимально заметным

---

## 2. Текущее состояние кодовой базы

### 2.1 Источники данных

| Источник | Назначение |
|----------|------------|
| **taskDefinitionsSeed.json** | 14 задач: id, label, emoji, time_block, category, base_reward, bonus_reward, sort_order |
| **isDailyBaseComplete(userId, taskId)** | true если задача выполнена сегодня |
| **dailyBase** (store) | `{ [userId]: { [taskId]: dateKey } }` — даты выполнения |

### 2.2 Структура задачи (TaskDefinition)

```ts
{
  id: string
  label: string
  emoji: string
  time_block: 'morning' | 'afternoon' | 'evening' | 'anytime'
  category: 'routine' | 'food' | 'school' | 'bonus'
  base_reward: number
  bonus_reward: number
  max_daily_completions: number
  sort_order: number
}
```

### 2.3 Существующие компоненты

| Компонент | Поведение | Ограничения |
|-----------|-----------|-------------|
| **MissionsList** | available (5) + completed (4), клик → markDailyBaseComplete + addPoints | Скрывает часть задач (slice), интерактивен |
| **ActiveMissions** | Только невыполненные, без кликов | Использует transactions для completion (другой источник) |
| **AdminControlPanel** | Группировка по time_block + category | Admin-only, интерактивен |

### 2.4 Группировка (AdminControlPanel)

- **УТРЕННИЙ ПРОТОКОЛ** — morning
- **ДЕНЬ / ШКОЛА** — afternoon + anytime
- **ВЕЧЕРНИЙ ПРОТОКОЛ** — evening

### 2.5 Очки за выполнение

- **base_reward + bonus_reward** — из определения задачи
- Реальное начисление может быть base или base+bonus (Admin решает). Для read-only QuestMap показываем **base_reward + bonus_reward** как максимум, или только base_reward как типичное значение. Рекомендация: показывать `base_reward + bonus_reward` как "+15 ⚡" (типичный завтрак 10+5).

---

## 3. Рекомендации по UX/архитектуре

### 3.1 Отображение ВСЕХ миссий

- **Не slice, не filter** — рендерить все 14 задач из taskDefinitions
- Сортировка: по `sort_order`, внутри группы — по time_block, затем category

### 3.2 Заголовки категорий (русский)

| time_block | Заголовок | Задачи |
|------------|-----------|--------|
| morning | УТРО | wake_on_time, make_bed, teeth_morning, breakfast, pack_bag, school_leave |
| afternoon | ДЕНЬ / ШКОЛА | lunch, snack, homework_done, extra_study, help_clean, take_trash |
| evening | ВЕЧЕР | dinner, sleep_on_time |

**anytime** → помещать в "ДЕНЬ / ШКОЛА" (как в AdminControlPanel)

Стиль заголовков: `font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500`

### 3.3 Визуальные состояния

| Состояние | Стили | Элементы |
|-----------|-------|----------|
| **Pending** | `bg-slate-900/30`, `text-slate-500`, `border border-white/5` | emoji, label, "+X ⚡" (приглушённо) |
| **Completed** | `bg-cyan-950/40`, `text-white`/`text-cyan-100`, `border border-cyan-500/50` | emoji, label, зелёная ✅, "+10 ⚡" ярко |

**Контраст:** Pending — тёмный, приглушённый; Completed — светлый, с cyan-рамкой и glow.

### 3.4 Очки за выполненную задачу

- Вариант A: всегда `base_reward + bonus_reward` из определения
- Вариант B: искать в transactions сумму за эту задачу сегодня (точнее, но сложнее)
- **Рекомендация:** A — `base_reward + bonus_reward`. Admin мог начислить base или base+bonus, но для Kids UI показываем типичный максимум.

### 3.5 Layout

- **Вертикальный список** с `gap-3` между карточками
- Внутри каждой группы (УТРО, ДЕНЬ, ВЕЧЕР) — `space-y-2` или `gap-2`
- Карточка: `rounded-xl`, `px-3 py-2`, `flex items-center gap-2`

### 3.6 Read-Only

- `pointer-events-none` на карточках или просто не передавать onClick
- Не импортировать: `markDailyBaseComplete`, `addPoints`
- Роль: `role="list"` для списка, `role="listitem"` для карточек (без button)

### 3.7 Замена MissionsList

- QuestMap **заменяет** MissionsList в PilotsPanel
- MissionsList: available (5) + completed (4), интерактивен
- QuestMap: все 14, read-only, RPG-стиль

---

## 4. Структура компонента

```
QuestMap (childId, accentColor?)
├── Section "УТРО"
│   ├── QuestCard (pending) × N
│   └── QuestCard (completed) × M
├── Section "ДЕНЬ / ШКОЛА"
│   └── QuestCard × ...
└── Section "ВЕЧЕР"
    └── QuestCard × ...
```

**QuestCard** — одна задача:
- Pending: `bg-slate-900/30`, `border-white/5`, `text-slate-500`, emoji + label + "+X ⚡"
- Completed: `bg-cyan-950/40`, `border-cyan-500/50`, emoji + label + ✅ + "+X ⚡"

---

## 5. Маппинг time_block → заголовок

```js
const BLOCK_HEADERS = {
  morning: 'УТРО',
  afternoon: 'ДЕНЬ / ШКОЛА',
  evening: 'ВЕЧЕР',
}
// anytime → afternoon
```

---

## 6. Порядок задач в группах

Внутри каждой группы сортировать по `sort_order`:

- **УТРО:** 10, 20, 30, 40, 70, 75 (wake, bed, teeth, breakfast, pack_bag, school_leave)
- **ДЕНЬ:** 50, 55, 80, 85, 90, 95 (lunch, snack, homework, extra_study, help_clean, take_trash)
- **ВЕЧЕР:** 60, 100 (dinner, sleep_on_time)

---

## 7. Открытые вопросы

1. **Очки для Completed:** всегда base+bonus или пытаться брать из transactions?
2. **Акцент по ребёнку:** cyan для Ромы, purple для Кирилла — использовать для Completed border/glow или единый cyan?
3. **Скролл:** QuestMap внизу колонки — нужен `overflow-y-auto` и `max-h` для прокрутки при 14 задачах?

---

## 8. План реализации

1. Создать `QuestMap.jsx` в `src/components/KidsDashboard/`
2. Импорт: `taskDefinitions`, `isDailyBaseComplete`, `dailyBase` из store
3. Группировка по time_block (anytime → afternoon)
4. Рендер секций с заголовками
5. Компонент `QuestCard` с Pending/Completed стилями
6. Заменить `MissionsList` на `QuestMap` в PilotsPanel
7. Экспорт в index.js
