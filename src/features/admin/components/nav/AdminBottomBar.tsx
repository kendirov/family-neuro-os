import { ADMIN_NAV_ITEMS } from '../../lib/admin-nav.config'
import { AdminNavItem } from './AdminNavItem'

export function AdminBottomBar() {
  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-white/10 bg-slate-950/80 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] lg:hidden"
      aria-label="Навигация администратора мобильная"
    >
      <div className="grid grid-cols-5 gap-1.5">
        {ADMIN_NAV_ITEMS.map((item) => (
          <AdminNavItem key={item.id} item={item} mobile />
        ))}
      </div>
    </nav>
  )
}
