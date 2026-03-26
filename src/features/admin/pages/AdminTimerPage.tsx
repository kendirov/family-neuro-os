export function AdminTimerPage() {
  // Shared timer domain subscription (server-driven).
  // No authoritative timer logic lives in this page.
  useTimerSocket()

  return (
    <div className="min-h-0">
      <AdminPageHeader
        title="Таймер"
        description="Операционный контроль поверхности таймера. Источник правды — сервер, интерфейс — быстрый и строгий."
      />

      <div className="flex flex-col gap-3 lg:gap-4">
        <TimerConnectionBanner />
        <TimerDevPanel />
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-4">
          <AdminTimerControlPanel className="lg:col-span-5" />
          <div className="lg:col-span-7">
            <ActiveTimerSessionsPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

import { AdminPageHeader } from '../components/common/AdminPageHeader'
import { useTimerSocket } from '@/features/timer/hooks/useTimerSocket'
import { TimerConnectionBanner } from '../components/timer/TimerConnectionBanner'
import { AdminTimerControlPanel } from '../components/timer/AdminTimerControlPanel'
import { ActiveTimerSessionsPanel } from '../components/timer/ActiveTimerSessionsPanel'
import { TimerDevPanel } from '../components/timer/TimerDevPanel'
