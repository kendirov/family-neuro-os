# PilotDashboard — UX/Architecture Analysis & Recommendations

## Цель
Единая главная страница для детей (`<PilotDashboard />`): **Read-Only** зеркало данных Admin-панели. Визуально идентично, без кнопок изменения данных.

---

## 1. Текущее состояние кодовой базы

### Существующие компоненты

| Компонент | Мутации | Read-Only? | Переиспользование |
|-----------|---------|------------|-------------------|
| **PilotPanel** | Нет | ✅ | Прямо — Balance, Daily Progress, QuestTracker |
| **QuestTracker** | Нет | ✅ | Прямо — Active/Completed missions |
| **ActiveMissionHUD** | Нет | ✅ | Прямо — Timer (usePenaltyTimer) |
| **PilotStatusWidget** | Нет | ✅ | Прямо — Level, Balance |
| **PilotTodayTimeline** | Нет | ✅ | Прямо — события дня |
| **PilotMainFocus** | `onComplete` | ❌ | Нужен readOnly-режим |
| **PilotRewardsWidget** | `onPurchase` | ❌ | Нужен readOnly-режим |
| **PilotHUDGrid** | `onTaskComplete`, `onPurchase` | ❌ | Не использовать |

### Источники данных
- **useAppStore**: `users`, `transactions`, `isDailyBaseComplete`
- **usePenaltyTimer(sessionId)**: live timer (safe zone, multiplier, coins burned)
- **useActiveSessionId(userId)**: `sessionId` для usePenaltyTimer
- **taskDefinitionsSeed.json**: список задач для QuestTracker

---

## 2. Рекомендации по UX

### 2.1 Иерархия внимания
1. **Таймер** — самый заметный элемент (если есть активная сессия)
2. **Баланс** — ключевая метрика
3. **Прогресс дня** — мотивация
4. **Миссии** — контекст и цели

### 2.2 Таймер: один или два?
- Admin может запустить таймер для **Кирилла**, **Ромы** или **обоих**
- Рекомендация: **показывать оба таймера**, если у обоих есть активные сессии
- Если активна только одна сессия — один крупный виджет
- Если нет активных сессий — компактный placeholder: «Таймер не запущен» (или скрыть блок)

### 2.3 Bento Grid — предложенная структура

```
┌─────────────────────────────────────────────────────────┐
│  LIVE TIMER (full width)                                │
│  Kirill: [Safe 45:00] | Roma: [Burning −12.5 ⚡ x2]     │
│  или один, если только у одного активна                 │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────┬──────────────────────────────┐
│  КИРИЛЛ                  │  РОМА                       │
│  ┌────────────────────┐  │  ┌────────────────────┐    │
│  │ Balance + Progress  │  │  │ Balance + Progress  │    │
│  └────────────────────┘  │  └────────────────────┘    │
│  Active Missions         │  Active Missions            │
│  Completed Today        │  Completed Today             │
└──────────────────────────┴──────────────────────────────┘
```

### 2.4 Состояние «нет таймера»
- Не показывать пустой блок
- Или минимальный текст: «Ожидание старта» с иконкой
- Стиль: `bg-slate-900/30 border-slate-700/50` — нейтральный, не отвлекающий

---

## 3. Архитектурные решения

### 3.1 Новый компонент: `PilotDashboard`
- **Путь**: `src/views/PilotDashboard.jsx` (или `src/pages/PilotDashboard.jsx`)
- **Роут**: заменить `/pilot` на `<PilotDashboard />` вместо `<PilotHUD />`
- **Зависимости**: только read-only компоненты + `usePenaltyTimer`, `useActiveSessionId`

### 3.2 Read-Only варианты компонентов

**Вариант A: проп `readOnly`**
```jsx
<PilotMainFocus focus={focus} readOnly />
<PilotRewardsWidget balance={balance} readOnly />
```
- Плюсы: один компонент, меньше дублирования
- Минусы: усложнение логики внутри

**Вариант B: отдельные read-only компоненты**
```jsx
<PilotMainFocusReadOnly focus={focus} />
<PilotRewardsReadOnly balance={balance} items={rewards} />
```
- Плюсы: чёткое разделение, проще тестировать
- Минусы: дублирование разметки

**Рекомендация**: Вариант A — добавить `readOnly` в существующие компоненты. При `readOnly` отключать `onClick`, скрывать кнопки.

### 3.3 Таймер: единый виджет для двух пилотов
Создать `UnifiedTimerWidget`:
- Использует `useActiveSessionId('kirill')` и `useActiveSessionId('roma')`
- Для каждого пилота с активной сессией — `usePenaltyTimer(sessionId)`
- Рендерит `ActiveMissionHUD` для каждого (или обёртку с подписью «Кирилл» / «Рома»)
- Layout: два блока side-by-side на desktop, stack на mobile

### 3.4 Безопасность (UI-уровень)
- Не импортировать: `addPoints`, `spendPoints`, `markDailyBaseComplete`, `purchaseItem`, `removeTransaction`
- Не передавать: `onTaskComplete`, `onPurchase`, `onComplete`
- Не рендерить: `TimerDispatchPanel`, `AdminControlPanel`, `GodModeCommandBar`, `TransactionModal`
- Компонент только **подписывается** на store и Realtime, не вызывает мутирующие экшены

---

## 4. Консистентность с Admin

| Данные | Admin (PilotHUDGrid / SupplyDepot) | PilotDashboard |
|--------|-----------------------------------|----------------|
| Timer | TimerDispatchPanel + ActiveMissionHUD | ActiveMissionHUD (read-only) |
| Balance | PilotStatusWidget | PilotStatusWidget |
| Daily Progress | 0–150, bar | 0–150, bar |
| Active Missions | QuestTracker | QuestTracker |
| Completed | QuestTracker | QuestTracker |
| Timeline | PilotTodayTimeline | PilotTodayTimeline |

**DAILY_MAX**: 150 (из PilotPanel) — использовать везде для пилотских колонок.

---

## 5. План реализации

1. **Добавить `readOnly` в PilotMainFocus и PilotRewardsWidget**
2. **Создать `UnifiedTimerWidget`** — обёртка над ActiveMissionHUD для Kirill + Roma
3. **Создать `PilotDashboard`** — Bento grid, только read-only
4. **Обновить App.jsx** — `/pilot` → `<PilotDashboard />`
5. **Опционально**: оставить PilotHUD как альтернативный split-view (если нужен)

---

## 6. Стиль (Expensive Minimalism, Slate-950)

- Фон: `bg-slate-950`
- Карточки: `GlassCard` (bg-white/5, backdrop-blur-xl)
- Акценты: purple (Кирилл), cyan (Рома)
- Шрифты: `font-mono`, `font-turbo-nums`, `font-gaming`
- Без кнопок с `onClick` — только `div`, `span`, `ul`, `li`
