# Timer & Penalty System — Schema Design

## 1. Анализ текущей архитектуры

### Что есть сейчас
- **profiles** — таймер «вшит» в профиль: `timer_status`, `timer_start_at`, `session_elapsed`, `timer_mode`, `seconds_today`, `today_game_time`, `today_media_time`
- **transactions** — одна строка на сессию (`type='burn'`, `status='active'`) для учёта сгорания XP
- **Логика штрафов** — захардкожена в `useAppStore.js`: `calculateBurnRate()`, `creditsBurnedAt()` в GamingTimerWidget
- **Источник истины** — частично сервер (profiles), частично клиент (setInterval в GamingTimerWidget)

### Проблемы
1. **setInterval ненадёжен** — при перезагрузке/закрытии вкладки таймер «теряется», если не успел синхронизироваться
2. **Разрозненные данные** — таймер в profiles, burn в transactions, логика в store
3. **Нет гибких пресетов** — «Строгий будний» vs «Выходной» нельзя менять без правки кода
4. **Сложная миграция дня** — `checkDailyReset` обнуляет много колонок в profiles

---

## 2. Предлагаемые улучшения UX/Архитектуры

### 2.1 Разделение ответственности
| Слой | Роль |
|------|------|
| **timer_presets** | Правила: лимиты, ставки, множители штрафов |
| **active_sessions** | Единственный источник истины для текущей сессии |
| **profiles** | Только баланс и метаданные пилота (без таймера) |

### 2.2 Устойчивость к перезагрузкам
- **Формула**: `Total Elapsed = accumulated_seconds + (now - started_at)` при `status = 'active'`
- При **pause**: `accumulated_seconds += (now - started_at)`, `started_at = null`
- При **resume**: `started_at = now`, `accumulated_seconds` не меняется
- При **reload**: клиент читает `active_sessions`, вычисляет elapsed по формуле — **никакого setInterval для истины**

### 2.3 Один активный сеанс на пилота
- Ограничение: у пилота максимум одна сессия со статусом `active` или `paused`
- Можно реализовать через unique partial index: `(user_id) WHERE status IN ('active','paused')`

### 2.4 Аудит и аналитика
- `completed_at` — когда сессия завершена (для отчётов)
- `accumulated_seconds` — финальное время при `status = 'completed'`

### 2.5 Realtime
- Подписка Supabase Realtime на `active_sessions` — при старте/паузе/стопе на одном устройстве все остальные видят обновление без перезагрузки

---

## 3. Схема таблиц

### timer_presets
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | «Строгий будний», «Выходной расслабленный» |
| safe_minutes | int | Бесплатные/дешёвые минуты (до первого множителя) |
| base_cost_per_min | float | Базовая ставка XP/мин |
| penalty_multiplier_x2_after_mins | int | После N минут — x2 |
| penalty_multiplier_x3_after_mins | int | После N минут — x3 |
| created_at | timestamptz | Аудит |

### active_sessions
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid | PK |
| user_id | text | FK → profiles.id (roma, kirill) |
| activity_type | text | 'game' \| 'cartoon' |
| status | text | 'active' \| 'paused' \| 'completed' |
| started_at | timestamptz | Начало текущего сегмента (active) или null (paused) |
| accumulated_seconds | int | Сумма секунд до pause; при active — добавляется (now - started_at) |
| active_preset_id | uuid | FK → timer_presets |

---

## 4. Миграция с текущей схемы

- **Не удалять** старые колонки в profiles сразу — оставить параллельно на время перехода
- Новый код читает только `active_sessions`; при отсутствии строки — fallback на старую логику (если нужно)
- После полного перехода — удалить `timer_*`, `session_*` из profiles
