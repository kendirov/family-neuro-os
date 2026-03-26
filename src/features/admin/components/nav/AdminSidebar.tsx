import { ADMIN_NAV_ITEMS } from '../../lib/admin-nav.config'
import { AdminNavItem } from './AdminNavItem'

export function AdminSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:border-r lg:border-white/10 lg:bg-white/[0.03] lg:backdrop-blur-xl">
      <div className="sticky top-0 flex h-screen flex-col px-5 py-6">
        <div className="mb-6 border-b border-white/10 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-slate-500">Turbo Garage</p>
          <h1 className="mt-2 text-lg font-semibold tracking-tight text-slate-100">Admin Panel</h1>
        </div>

        <nav className="space-y-2" aria-label="Навигация администратора">
          {ADMIN_NAV_ITEMS.map((item) => (
            <AdminNavItem key={item.id} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  )
}
