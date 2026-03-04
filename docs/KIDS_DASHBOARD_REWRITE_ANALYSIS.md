# Kids Dashboard Rewrite — UX/Architecture Analysis

## Текущее состояние

- **KidsDashboard.jsx** — layout wrapper с `ChildColumn`, внутри: SmartSchedule, StaminaTracker, SpinAndQuests
- **GlobalHeader** — общая шапка с датой и очками семьи
- **PilotsPanel** — компактный header (Avatar, Level, Balance) + TimerOverlay, SpinProgressBar, RouletteCard, MissionsList
- **PilotPanel** — альтернативный layout с центрированным аватаром

## Референс: ArchitectAdmin / Dashboard (commander mode)

- **panel-glass**: `bg-white/5`, `backdrop-blur-xl`, `border-white/10`, `shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]`
- **panel-bolt** — декоративные болты по углам
- **SupplyDepotColumn** header: PilotAvatar + hud-player-name + Wallet (только в commander)
- **AdminControlPanel** score card: `rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-xl`
- **GlassCard** — переиспользуемый компонент для glassmorphism

## Предлагаемая архитектура

### 1. Main Wrapper
- `min-h-screen bg-slate-950` — строгий тёмный фон (Expensive Minimalism)
- Убрать radial-gradient mesh — заменить на чистый `bg-slate-950`
- Сохранить GlobalHeader (дата + очки семьи) — опционально, можно оставить или упростить

### 2. Split-Screen Grid
- `grid grid-cols-2 gap-6 p-6` — фиксированное разделение
- Левая колонка: Кирилл (purple accent)
- Правая колонка: Рома (cyan accent)
- Без переключателей — всегда 50/50

### 3. Child Column Header (per child)
- **Glassmorphism card** в стиле Admin:
  - `rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl`
  - `shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.25)]`
- **Содержимое:**
  - PilotAvatar (size="column", w-14 h-14 или w-16 h-16)
  - Имя (Кирилл / Рома) — `hud-player-name` или `font-gaming text-lg font-black uppercase`
  - Уровень — `font-mono text-[10px] uppercase tracking-widest text-purple-400/80` или `text-cyan-400/80`
  - Total Turbo Coins — `font-turbo-nums text-2xl font-black tabular-nums` + `CountUpNumber` + `⚡`

### 4. Data Fetching (Read-Only)
- `useAppStore((s) => s.users)` — список пилотов
- `useAppStore((s) => s.transactions)` — транзакции (для подсчёта сегодня, если нужно)
- `useAppStore((s) => s.isLoading)` — loading state
- **НЕ импортировать:** addPoints, spendPoints, markDailyBaseComplete, undoDailyTask, purchaseItem, removeTransaction

### 5. Level Calculation
- `level = Math.floor(balance / 500) + 1` (XP_PER_LEVEL = 500)

### 6. Placeholder при загрузке
- Если `user` отсутствует — показать placeholder с "Загрузка..." в стиле PilotColumnPlaceholder

## Файлы для изменения

1. **src/components/KidsDashboard/KidsDashboard.jsx** — полная перезапись
2. **src/components/KidsDashboard/ChildHeader.jsx** (новый) — переиспользуемый header с Avatar, Name, Level, Turbo Coins, glassmorphism

## Порядок реализации

1. Создать `ChildHeader.jsx` — read-only header с glassmorphism
2. Переписать `KidsDashboard.jsx` — wrapper + grid + два ChildColumn с ChildHeader
3. Убрать временно SmartSchedule, StaminaTracker, SpinAndQuests из ChildColumn (или оставить пустой placeholder)
