import type { PilotHeroUiModel } from '../../lib/pilot-base-ui-model'
import { PilotHeroCard } from './PilotHeroCard'

export function PilotsHeroGrid({ pilots }: { pilots: PilotHeroUiModel[] }) {
  return (
    <section aria-label="Пилоты">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider">Пилоты</h2>
          <p className="mt-1 font-mono text-[11px] text-slate-400/90">Два пилота. Спокойный статус. Никаких кнопок.</p>
        </div>
        <span className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-slate-200">
          Два пилота
        </span>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {pilots.map((p) => (
          <PilotHeroCard key={p.pilotId} pilot={p} />
        ))}
      </div>
    </section>
  )
}

