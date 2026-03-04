# Анализ: Real-time синхронизация таймера Admin ↔ Pilot

## Текущая архитектура

### 1. Два параллельных источника таймера

| Источник | Таблица | Используется | Обновляется Admin |
|----------|---------|--------------|-------------------|
| **profiles** | `timer_status`, `timer_start_at`, `session_elapsed`, `balance` | useAppStore, ScreenTimeHUD, ChildHeader | ✅ Да (startTimer, pauseTimer, stopTimer) |
| **active_sessions** | `status`, `started_at`, `accumulated_seconds` | usePenaltyTimer, TimerOverlay (PilotsPanel) | ❌ Нет |

**Вывод:** Admin пишет только в `profiles`. `active_sessions` не синхронизируется с Admin. TimerOverlay (если используется) будет пустым.

### 2. Поток данных

```
Admin (TimerDispatchPanel)                    Pilot (/pilot → KidsDashboard)
        │                                              │
        ▼                                              │
  startTimer(id, mode)                                 │
        │                                              │
        ▼                                              │
  profiles.update({                                    │
    timer_status: 'running',                            │
    timer_start_at: now,                                │
    ...                                                │
  })                                                   │
        │                                              │
        ▼                                              │
  Supabase Realtime ──────────────────────────────────► │
  (postgres_changes: profiles UPDATE)                   │
        │                                              ▼
        │                                    syncTimerStateFromProfile(row)
        │                                              │
        │                                              ▼
        │                                    pilots[id] = { timerStatus, timerStartAt, ... }
        │                                              │
        │                                    ScreenTimeHUD: setInterval 1s для elapsed
        │
  ControlCenter (только на Admin странице!)
        │
        ▼
  setInterval 60s: updateSessionBurn()
  → transactions.update, profiles.update(balance)
        │
        ▼
  Realtime → Pilot получает новый balance
```

### 3. Выявленные проблемы

| # | Проблема | Влияние |
|---|----------|---------|
| 1 | **Баланс обновляется раз в минуту** | Ребёнок видит «застывшие» цифры; XP «падают» рывками, а не плавно |
| 2 | **Нет optimistic UI для баланса** | Нет расчёта `displayBalance = balance_at_start - sessionBurned` в реальном времени |
| 3 | **ControlCenter только на Admin** | Списывание XP (`updateSessionBurn`) выполняется только когда открыта страница Admin. Если Admin закрыл вкладку — списание останавливается |
| 4 | **Reconnection без явной логики** | При обрыве WebSocket нет retry; при восстановлении — только разовый fetch при SUBSCRIBED |
| 5 | **session_balance_at_start не синхронизируется** | `syncTimerStateFromProfile` не обновляет `sessionBalanceAtStart` из профиля |
| 6 | **active_sessions не используется Admin** | TimerOverlay (PilotsPanel) читает active_sessions, но Admin туда не пишет |

---

## Рекомендации по UX/Архитектуре

### A. Единый источник истины: `profiles`

**Рекомендация:** Оставить `profiles` как единственный источник для таймера. Не дублировать логику в `active_sessions` для основного потока.

- Admin уже пишет в `profiles`
- Realtime уже подписан на `profiles`
- Упрощение: один источник, меньше рассинхронов

**Опционально:** Если нужен `active_sessions` (например, для пресетов штрафов), синхронизировать его с `profiles` через триггеры или при start/pause/stop.

---

### B. Optimistic UI для баланса (Pilot)

**Цель:** Ребёнок видит, как XP уменьшаются каждую секунду.

**Формула:**
```
displayBalance = sessionBalanceAtStart - sessionBurnedXP
sessionBurnedXP = f(elapsedSeconds, mode, todayGameTime, todayMediaTime)
```

Функция `f` — та же логика, что в `calculateBurnRate` и `calculateSessionCost` (tiered: 0–20/60 мин и т.д.).

**Реализация:**
- Хук `useOptimisticBalance(childId)`:
  - Берёт `pilots[childId]`, `users`, `todayTimeTracking`
  - При `timerStatus === 'running'` считает `elapsedSeconds` от `timerStartAt`
  - Считает `sessionBurnedXP` по tiered-логике
  - Возвращает `displayBalance = sessionBalanceAtStart - sessionBurnedXP`
- ChildHeader (и PilotsPanel) используют этот хук вместо `user.balance` при активной сессии

---

### C. Списывание XP: сервер vs клиент

**Проблема:** `updateSessionBurn` вызывается из ControlCenter каждые 60 секунд. Если Admin закрыл вкладку — списание останавливается.

**Варианты:**

1. **Edge Function / Cron (предпочтительно)**  
   Supabase Edge Function или pg_cron раз в минуту:
   - Находит `profiles` с `timer_status = 'running'`
   - Считает elapsed, списывает XP, обновляет `balance`, `last_burn_at`
   - Не зависит от открытой вкладки Admin

2. **Триггер в БД**  
   Сложнее: нужна логика tiered rate в PL/pgSQL.

3. **Оставить как есть + предупреждение**  
   Показывать Admin: «Держите эту вкладку открытой для списания XP».

**Рекомендация:** Вариант 1 (Edge Function) для production.

---

### D. Realtime: reconnection и fallback

**Текущее поведение:**
- При `SUBSCRIBED` — разовый fetch профилей пилотов
- При `CHANNEL_ERROR` / `TIMED_OUT` — `realtimeStatus = 'error'`, без retry

**Рекомендации:**
1. При `CLOSED` или `CHANNEL_ERROR` — retry с exponential backoff (1s, 2s, 4s, … до 30s).
2. При успешном переподключении — полный `fetchState()` для гарантированной синхронизации.
3. Показывать индикатор «Синхронизация…» при `realtimeStatus === 'connecting'` или `'error'`.

---

### E. syncTimerStateFromProfile: доработки

При получении `profile` через Realtime нужно:
1. Обновлять `sessionBalanceAtStart` из `session_balance_at_start` (если есть).
2. При `timer_status === 'idle'` — сбрасывать `activeSessionId`, `sessionTotalBurned` и т.п.

---

### F. Проверка Realtime для `profiles`

Убедиться, что `profiles` в publication `supabase_realtime`:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

Если `profiles` нет — добавить:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

---

## План реализации (приоритеты)

| # | Задача | Сложность | Влияние |
|---|--------|-----------|---------|
| 1 | Хук `useOptimisticBalance` + использование в ChildHeader | Низкая | Высокое — «живой» баланс |
| 2 | Доработка `syncTimerStateFromProfile` (sessionBalanceAtStart) | Низкая | Среднее |
| 3 | Reconnection с retry в `subscribeToRealtime` | Средняя | Среднее |
| 4 | Проверка/добавление `profiles` в Realtime publication | Низкая | Критическое |
| 5 | Edge Function для списания XP (опционально) | Высокая | Высокое для production |

---

## Схема данных (текущая, profiles)

```
profiles:
  timer_status     'idle' | 'running' | 'paused'
  timer_start_at   timestamptz (null при paused)
  timer_mode       'game' | 'cartoon'
  session_elapsed  int (секунды при paused)
  session_balance_at_start  int (баланс на старт; cap)
  balance          int (текущий баланс)
  today_game_time  int (минуты)
  today_media_time int (минуты)
  last_burn_at     timestamptz
```

Этого достаточно для real-time синхронизации. Таблица `active_sessions` может использоваться отдельно (например, для TimerOverlay с пресетами), но для основного потока Admin → Pilot достаточно `profiles`.
