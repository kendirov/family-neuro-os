export function AdminSettingsPage() {
  return (
    <div className="min-h-0">
      <AdminPageHeader
        title="Настройки"
        description="Конфигурация задач, расписаний и правил прогрессии. Изменения должны быть управляемыми и аудируемыми."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <AdminPlaceholderPanel
          className="lg:col-span-7"
          title="Редактор задач"
          subtitle="Категории, награды, условия и порядок."
        >
          <div className="rounded-xl border border-white/10 bg-slate-950/35 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="h-4 w-56 rounded bg-white/[0.06]" />
              <div className="h-9 w-28 rounded-xl border border-white/10 bg-white/[0.03]" />
            </div>
            <div className="mt-4 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <div className="h-3 w-56 rounded bg-white/[0.06]" />
                    <div className="mt-2 h-3 w-28 rounded bg-white/[0.05]" />
                  </div>
                  <div className="h-7 w-20 rounded-lg bg-white/[0.04]" />
                </div>
              ))}
            </div>
          </div>
        </AdminPlaceholderPanel>

        <AdminPlaceholderPanel
          className="lg:col-span-5"
          title="Расписания"
          subtitle="Окна активности, дни недели, исключения."
        >
          <div className="space-y-3">
            {['Week', 'Exceptions', 'Time windows'].map((x) => (
              <div key={x} className="rounded-xl border border-white/10 bg-slate-950/35 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{x}</div>
                <div className="mt-2 h-10 w-full rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        </AdminPlaceholderPanel>

        <AdminPlaceholderPanel
          className="lg:col-span-12"
          title="Уровни и правила наград"
          subtitle="Пороговые значения, множители, ограничения и миграции."
          tone="quiet"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  Rule {i + 1}
                </div>
                <div className="mt-3 h-10 w-full rounded bg-white/[0.06]" />
                <div className="mt-3 h-3 w-2/3 rounded bg-white/[0.05]" />
              </div>
            ))}
          </div>
        </AdminPlaceholderPanel>
      </div>
    </div>
  )
}

import { AdminPageHeader } from '../components/common/AdminPageHeader'
import { AdminPlaceholderPanel } from '../components/common/AdminPlaceholderPanel'
