import type { AdminRouteId } from './admin-routes'

export type AdminNavItemConfig = {
  id: AdminRouteId
  path: string
  label: string
  shortLabel: string
}

export const ADMIN_NAV_ITEMS: AdminNavItemConfig[] = [
  { id: 'dashboard', path: '/admin', label: 'Главная', shortLabel: 'Главная' },
  { id: 'timer', path: '/admin/timer', label: 'Таймер', shortLabel: 'Таймер' },
  { id: 'rewards', path: '/admin/rewards', label: 'Награды', shortLabel: 'Награды' },
  { id: 'logs', path: '/admin/logs', label: 'История', shortLabel: 'История' },
  { id: 'settings', path: '/admin/settings', label: 'Настройки', shortLabel: 'Настройки' },
]
