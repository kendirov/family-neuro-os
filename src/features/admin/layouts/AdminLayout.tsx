import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { mapLegacyAdminTabToPath } from '../lib/admin-routes'
import { AdminSidebar } from '../components/nav/AdminSidebar'
import { AdminBottomBar } from '../components/nav/AdminBottomBar'

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const sp = new URLSearchParams(location.search)
    const hasLegacyTab = sp.has('tab')
    if (!hasLegacyTab) return

    const nextPath = mapLegacyAdminTabToPath(sp.get('tab'))
    sp.delete('tab')
    const nextSearch = sp.toString()
    const canonicalPath = nextPath ?? location.pathname
    const target = `${canonicalPath}${nextSearch ? `?${nextSearch}` : ''}`
    const current = `${location.pathname}${location.search}`

    if (target !== current) navigate(target, { replace: true })
  }, [location.pathname, location.search, navigate])

  return (
    <div className="min-h-screen bg-turbo-garage text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1920px] flex-col lg:flex-row">
        <AdminSidebar />

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/65 px-4 py-3 backdrop-blur-xl lg:px-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
              Turbo Garage / Admin
            </div>
          </header>

          <main className="flex min-h-0 flex-1 flex-col p-4 pb-24 lg:p-6 lg:pb-6">
            <Outlet />
          </main>
        </div>
      </div>

      <AdminBottomBar />
    </div>
  )
}
