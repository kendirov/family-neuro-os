# SpinModule — Анализ и рекомендации перед реализацией

## 1. Требования (кратко)

- **Компонент:** `<SpinModule />` — под Stamina trackers в колонке каждого ребёнка
- **Points Progress:** "Собрано для СПИНА: [points % 50] / 50 ⚡"
- **Spin Button:** крупная центральная кнопка
  - **Locked:** `available_spins == 0` → opacity-40, grayscale, "СПИН ЗАБЛОКИРОВАН (нужно 50 ⚡)"
  - **Ready:** `available_spins > 0` → vibrant, gradient, pulse, glow, "КРУТИТЬ СПИН! (Доступно: {spins})"
- **Read-Only:** пока только визуальные состояния и кнопка; реальное списание — позже
- **Цель:** самый привлекательный элемент на экране

---

## 2. Текущее состояние кодовой базы

### 2.1 Существующие компоненты

| Компонент | Назначение | Связь с SpinModule |
|-----------|------------|--------------------|
| **SpinProgressBar** | "До рулетки: X ⚡" + тонкий прогресс-бар | Логика прогресса, можно переиспользовать |
| **RouletteCard** | Окно рулетки + кнопка "КРУТИТЬ РУЛЕТКУ" | Анимация спина, useSpin |
| **PilotsPanel** | Layout: TimerOverlay → SpinProgressBar → RouletteCard → MissionsList | SpinModule заменит/дополнит SpinProgressBar + часть RouletteCard |

### 2.2 Логика спина (store)

| Метод | Формула | Назначение |
|-------|---------|------------|
| **getAvailableSpins(childId)** | `floor(daily_points_earned / 50) - spins_used_today` | Доступные спины |
| **getPointsToNextSpin(childId)** | `50 - (earned % 50)` или 50 при remainder=0 | Очков до следующего спина |
| **useSpin(childId, prize)** | Списывает спин, записывает приз, addPoints для XP | Реальное списание (пока не вызывать) |

### 2.3 Данные

- **daily_points_earned** — очки за сегодня (из profiles)
- **spins_used_today** — использовано спинов сегодня
- **progressInCurrentBlock** = `daily_points_earned % 50` — прогресс в текущем блоке 0–49

### 2.4 Текст прогресса

Требование: "Собрано для СПИНА: [points % 50] / 50 ⚡"

- `points % 50` при earned=37 → 37
- При earned=50 → 0 (новый блок)
- При earned=75 → 25 (второй спин заработан, идём к третьему)

**Уточнение:** когда `availableSpins > 0`, показывать "0/50" может сбивать. Варианты:
- **A:** Всегда "X / 50" (X = earned % 50)
- **B:** При spins > 0 — "Блок выполнен! Спинов: N" или "50/50 ✓"
- **Рекомендация:** A — единообразно. При 50 earned показываем "0/50" (старт следующего блока).

---

## 3. Рекомендации по UX/архитектуре

### 3.1 Структура SpinModule

```
SpinModule (childId, accentColor)
├── PointsProgress — текст "Собрано для СПИНА: X / 50 ⚡"
├── SpinButton — центральная кнопка
│   ├── Locked: grayscale, opacity-40, disabled
│   └── Ready: gradient, pulse, glow, enabled (визуально)
└── (опционально) тонкий прогресс-бар под текстом
```

### 3.2 Визуальная иерархия

| Элемент | Стиль | Цель |
|---------|-------|------|
| **Points text** | font-mono, text-sm, text-slate-400 | Информативно, не отвлекает |
| **Locked button** | grayscale, opacity-40, cursor-not-allowed | Чётко «нельзя» |
| **Ready button** | `bg-gradient-to-r from-fuchsia-600 to-purple-600`, `animate-pulse`, `shadow-[0_0_20px_rgba(192,38,211,0.6)]` | Максимальная заметность |

### 3.3 Отношение к RouletteCard

- **Вариант A:** SpinModule — только прогресс + кнопка. RouletteCard остаётся для анимации рулетки. Клик по кнопке в SpinModule открывает/запускает RouletteCard.
- **Вариант B:** SpinModule заменяет SpinProgressBar и кнопку RouletteCard. RouletteCard — только окно анимации, вызывается из SpinModule.
- **Вариант C:** SpinModule полностью самодостаточен: прогресс + кнопка. RouletteCard убираем или оставляем отдельно.

**Рекомендация:** Вариант B — SpinModule = прогресс + кнопка. RouletteCard — только анимация. При клике «КРУТИТЬ СПИН!» вызываем callback, который родитель (PilotsPanel) может передать для открытия RouletteCard или модалки. Пока по ТЗ — только визуальные состояния, без реального списания.

### 3.4 Размещение в PilotsPanel

Текущий порядок:
1. Header (Avatar + Level + Balance)
2. TimerOverlay
3. SpinProgressBar
4. RouletteCard
5. MissionsList

С StaminaTracker и SpinModule:
1. Header
2. StaminaTracker
3. **SpinModule** ← новый блок
4. RouletteCard (или встроенная анимация)
5. MissionsList

SpinProgressBar можно убрать — его логика войдёт в SpinModule.

### 3.5 Read-Only и будущая интеграция

- **Сейчас:** кнопка в Ready визуально активна, но `onClick` не вызывает `useSpin`. Либо пустой handler, либо `() => {}` / заглушка для анимации.
- **Позже:** передать `onSpinClick` из PilotsPanel, который вызовет анимацию рулетки и затем `useSpin`.

---

## 4. Визуальная спецификация

### 4.1 Points Progress

```
Собрано для СПИНА: 37 / 50 ⚡
```

- Шрифт: `font-mono`, `text-xs` или `text-sm`
- Цвет: `text-slate-400` или accent (cyan/purple) при `availableSpins > 0`
- Выравнивание: по центру или слева

### 4.2 Locked Button

- `opacity-40`, `grayscale` (или `grayscale` через filter)
- `cursor-not-allowed`
- Фон: `bg-slate-700/60` или `bg-slate-800`
- Текст: "СПИН ЗАБЛОКИРОВАН (нужно 50 ⚡)"
- `disabled` или `pointer-events-none` при клике

### 4.3 Ready Button

- `bg-gradient-to-r from-fuchsia-600 to-purple-600`
- `animate-pulse`
- `shadow-[0_0_20px_rgba(192,38,211,0.6)]`
- Дополнительно: `hover:shadow-[0_0_28px_rgba(192,38,211,0.8)]`, `active:scale-[0.98]`
- Текст: "КРУТИТЬ СПИН! (Доступно: {spins})"
- Размер: `py-4` или `py-5`, `text-lg` / `text-xl`, `font-black`

### 4.4 Контейнер

- `rounded-2xl`, `border border-white/10`
- `bg-slate-900/30` или glassmorphism
- Внутренние отступы: `p-4`

---

## 5. Открытые вопросы

1. **Мини-прогресс-бар:** оставлять ли тонкую полоску под текстом (как в SpinProgressBar) или только текст?
2. **RouletteCard:** SpinModule заменяет кнопку RouletteCard или они сосуществуют? Если заменяет — RouletteCard только как модалка/оверлей анимации?
3. **Акцент по ребёнку:** для Кирилла — purple/fuchsia, для Ромы — cyan? В ТЗ указан fuchsia–purple для Ready. Оба пилота с одинаковым стилем или разный accent?

---

## 6. План реализации

1. Создать `SpinModule.jsx` в `src/components/KidsDashboard/`
2. Использовать `getAvailableSpins`, `getPointsToNextSpin`, `daily_points_earned` из store
3. Реализовать Points Progress текст
4. Реализовать Spin Button с Locked и Ready состояниями
5. Добавить `SpinModule` в `PilotsPanel` под StaminaTracker
6. Экспортировать в `index.js`
7. (Опционально) Удалить или скрыть `SpinProgressBar` при наличии SpinModule
