export function KidTimerEmptyState() {
  return (
    <section
      className="panel-glass rounded-3xl border border-white/10 p-6"
      aria-label="Экран не запущен"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-gaming text-lg sm:text-xl font-black uppercase tracking-wider">
            Сейчас экран не запущен
          </h2>
          <p className="mt-2 font-mono text-sm text-slate-300/90">
            Жди сигнала. Старт даёт родитель.
          </p>
          <p className="mt-1 font-mono text-[11px] text-slate-500">
            Когда начнётся сессия — здесь появится большой таймер и режим.
          </p>
        </div>
        <div className="shrink-0 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Статус</div>
          <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-slate-100">
            Остановлено
          </div>
        </div>
      </div>
    </section>
  )
}

