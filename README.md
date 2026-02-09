# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Supabase: синхронизация таймера между вкладками и устройствами

Чтобы таймер (Пуск/Пауза/Стоп) отображался одинаково во всех вкладках и на всех устройствах, нужен **Supabase Realtime** для таблицы `profiles`.

1. Зайди в [Supabase Dashboard](https://supabase.com/dashboard) → свой проект.
2. **Database** → **Replication** (или **Realtime** в меню).
3. Включи репликацию (Replication) для таблицы **`public.profiles`**.

Без этого обновления `timer_status`, `timer_start_at`, `seconds_today` не приходят на другие вкладки/устройства в реальном времени, и таймер «живёт» только на той странице, где нажали Пуск.

**Проверка:** открой консоль браузера (F12). При загрузке приложения должно появиться сообщение `[Realtime] ✅ Subscribed to public.profiles updates`. Если видишь `CHANNEL_ERROR` или подписка не устанавливается — проверь Replication для `profiles`.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
