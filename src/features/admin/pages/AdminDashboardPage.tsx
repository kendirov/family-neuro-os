import { AdminPageHeader } from '../components/common/AdminPageHeader'
import { AdminDashboardGrid } from '../components/dashboard/AdminDashboardGrid'

export function AdminDashboardPage() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <AdminPageHeader
        title="Главная"
        description="Семейный Control Center: два пилота, быстрые макросы, мгновенное закрытие ежедневных задач."
        className="mb-3"
      />
      <AdminDashboardGrid />
    </div>
  )
}
