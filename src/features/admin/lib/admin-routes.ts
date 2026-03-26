export type AdminRouteId = 'dashboard' | 'timer' | 'rewards' | 'logs' | 'settings'

export const ADMIN_BASE_PATH = '/admin'

export function mapLegacyAdminTabToPath(rawTab: string | null): string | null {
  if (rawTab === 'center' || rawTab === 'kids') return '/admin'
  if (rawTab === 'timer') return '/admin/timer'
  if (rawTab === 'rewards') return '/admin/rewards'
  if (rawTab === 'log' || rawTab === 'logs') return '/admin/logs'
  if (rawTab === 'settings') return '/admin/settings'
  return null
}
