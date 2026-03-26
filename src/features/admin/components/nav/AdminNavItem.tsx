import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { AdminNavItemConfig } from '../../lib/admin-nav.config'

type AdminNavItemProps = {
  item: AdminNavItemConfig
  mobile?: boolean
}

export function AdminNavItem({ item, mobile = false }: AdminNavItemProps) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/admin'}
      className={({ isActive }) =>
        cn(
          'group rounded-xl border transition duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0',
          mobile
            ? 'min-h-[46px] px-2 py-2 text-center text-[11px] font-medium tracking-tight'
            : 'min-h-[44px] px-3 py-2 text-sm font-medium tracking-tight',
          isActive
            ? 'border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_18px_rgba(0,0,0,0.22)]'
            : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-slate-100'
        )
      }
      aria-label={item.label}
    >
      <span className={cn('block truncate', mobile ? 'leading-tight' : '')}>
        {mobile ? item.shortLabel : item.label}
      </span>
    </NavLink>
  )
}
