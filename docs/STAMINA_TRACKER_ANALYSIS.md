# StaminaTracker — Анализ и рекомендации перед реализацией

## 1. Требования (кратко)

- **Компонент:** `<StaminaTracker />` — в верхней части колонок Кирилла и Ромы
- **Два трекера на ребёнка:** «Игры» и «Мультики»
- **Прогресс-бар:** толстый (`h-8`), скруглённый, цветовая логика по зонам
- **Цифровой секундомер:** `00:00:00`, live из Supabase `active_sessions`
- **Текст статуса:** «Время в игре:» над секундомером
- **Язык:** строго русский

---

## 2. Текущее состояние кодовой базы

### 2.1 Источники данных

| Источник | Назначение | Структура |
|----------|------------|-----------|
| **active_sessions** (Supabase) | Текущая сессия таймера | `user_id`, `activity_type` ('game'\|'cartoon'), `status`, `started_at`, `accumulated_seconds` |
| **profiles** (Supabase) | Накопленное время за день | `today_game_time`, `today_media_time` (минуты) |
| **dailyGamingBreakdown** (store) | Разбивка по режимам | `{ game: { roma, kirill }, youtube: { roma, kirill }, good: { roma, kirill } }` |
| **todayTimeTracking** (store) | Из profiles | `{ kirill: { game, media }, roma: { game, media } }` |

### 2.2 Ограничение active_sessions

- **Один активный/приостановленный сеанс на пользователя** (unique на `user_id`)
- В один момент может быть активна только **одна** сессия: либо «Игры», либо «Мультики»
- `activity_type`: `'game'` → Игры, `'cartoon'` → Мультики

### 2.3 Существующие хуки и утилиты

| Хук/утилита | Назначение |
|-------------|------------|
| **useActiveSessionId(userId)** | ID активной сессии для пилота |
| **usePenaltyTimer(sessionId)** | `totalSecondsElapsed`, `currentMultiplier`, `coinsBurned`, `isBurning` |
| **getTotalElapsedSeconds(session, now)** | Секунды: `accumulated_seconds` + (now - started_at) при active |
| **getDisplayBreakdownToday()** | `{ game, youtube }` — сохранённое + live из pilots |
| **getTodayGameTime(userId)** | Минуты игр за сегодня (из todayTimeTracking) |
| **getTodayMediaTime(userId)** | Минуты мультиков за сегодня (из todayTimeTracking) |

### 2.4 Проблема синхронизации

- **TimerDispatchPanel** (Admin) пишет в `active_sessions` и при остановке **не обновляет** `profiles.today_game_time` / `today_media_time`
- В результате `todayTimeTracking` и `getDisplayBreakdownToday()` могут быть неактуальны после Admin stop
- **Рекомендация:** при `handleStop` в TimerDispatchPanel добавить обновление `profiles`:
  ```js
  // После update active_sessions — добавить:
  await supabase.from('profiles').update({
    today_game_time: currentGame + (s.activity_type === 'game' ? minutes : 0),
    today_media_time: currentMedia + (s.activity_type === 'cartoon' ? minutes : 0),
  }).eq('id', s.user_id)
  ```

---

## 3. Рекомендации по UX/архитектуре

### 3.1 Источник данных для StaminaTracker

| Трекер | Накопленное время | Live-время |
|--------|-------------------|------------|
| **Игры** | `getTodayGameTime(childId)` (минуты) | Если `active_session.activity_type === 'game'` → `getTotalElapsedSeconds(session)` |
| **Мультики** | `getTodayMediaTime(childId)` (минуты) | Если `active_session.activity_type === 'cartoon'` → `getTotalElapsedSeconds(session)` |

**Формула итоговых секунд для отображения:**
```
totalSeconds = accumulatedMinutes * 60 + (liveSession ? getTotalElapsedSeconds(session) : 0)
```

### 3.2 Новый хук: `useStaminaTime(childId, activityType)`

Возвращает:
- `totalSeconds` — накопленное + live
- `session` — активная сессия (если есть и `activity_type` совпадает)
- `isLive` — идёт ли сейчас сессия этого типа

Логика:
1. `useActiveSessionId(childId)` → sessionId
2. Загрузить сессию (или использовать `usePenaltyTimer` и взять `session` из результата)
3. Проверить `session.activity_type === activityType`
4. `accumulatedMinutes = activityType === 'game' ? getTodayGameTime : getTodayMediaTime`
5. `totalSeconds = accumulatedMinutes * 60 + (match ? getTotalElapsedSeconds : 0)`

### 3.3 Структура компонента

```
StaminaTracker (childId, accentColor)
├── SingleStaminaBar (label: "Игры", activityType: "game")
│   ├── Label: "Игры"
│   ├── Progress bar (h-8, rounded, gradient by zone)
│   ├── Dividers at 60m, 90m with "x1", "x2", "x3"
│   ├── Status: "Время в игре:" (или "Время в мультиках:")
│   └── Digital stopwatch: HH:MM:SS
└── SingleStaminaBar (label: "Мультики", activityType: "cartoon")
    └── (аналогично)
```

### 3.4 Цветовая логика прогресс-бара

| Зона | Минуты | Градиент | Дополнительно |
|------|--------|----------|---------------|
| Safe | 0–60 | `from-emerald-500 to-cyan-500` | — |
| Warning | 60–90 | `from-amber-500 to-orange-500` | — |
| Danger | >90 | `from-red-600 to-rose-500` | `animate-pulse`, red shadow/glow |

Деления: вертикальные линии на 60 и 90 минутах с подписями «x1», «x2», «x3».

### 3.5 Максимум шкалы

- Текущий `StaminaBars`: `BAR_MAX_MINUTES = 120`
- Для RPG-ощущения можно оставить 120 или увеличить до 150
- Процент заполнения: `Math.min(100, (minutes / MAX) * 100)`

### 3.6 Формат секундомера

- `HH:MM:SS` — например `01:23:45`
- Моноширинный шрифт (`font-mono`), крупный размер
- Обновление раз в секунду (`setInterval` при наличии live-сессии или при mounted для статичного)

---

## 4. Размещение

- **Где:** вверху колонки каждого пилота в `PilotsPanel` (или `KirillPanel` / `RomaPanel`)
- **Порядок:** StaminaTracker → TimerOverlay → SpinProgressBar → RouletteCard → MissionsList
- Либо StaminaTracker **заменяет** текущий `StaminaBars` в общем хедере и дублируется в каждой колонке — по ТЗ нужен «в верхней части колонок», значит в каждой колонке отдельно.

---

## 5. Открытые вопросы

1. **Максимум шкалы:** 120 минут или другое значение?
2. **Синхронизация:** внедрять обновление `profiles` в TimerDispatchPanel в рамках этой задачи или отдельно?
3. **Текст статуса:** «Время в игре:» для Игр и «Время в мультиках:» для Мультиков — подходит?

---

## 6. План реализации

1. Создать хук `useStaminaTime(childId, activityType)` (или расширить существующие)
2. Создать `SingleStaminaBar` — один бар с прогрессом, делениями, секундомером
3. Создать `StaminaTracker` — два `SingleStaminaBar` (Игры, Мультики)
4. Вставить `StaminaTracker` в `PilotsPanel` над `TimerOverlay`
5. (Опционально) Обновить TimerDispatchPanel для синхронизации `profiles` при stop
