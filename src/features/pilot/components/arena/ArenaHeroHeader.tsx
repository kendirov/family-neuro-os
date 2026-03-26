import { motion, useReducedMotion } from 'motion/react'

export function ArenaHeroHeader() {
  const reduce = useReducedMotion()
  return (
    <motion.header
      className="panel-glass rounded-3xl border border-white/10 p-6 overflow-hidden"
      initial={reduce ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.25 }}
      aria-label="Зона наград"
    >
      <div className="relative">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" aria-hidden />
        <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-gaming text-xl sm:text-2xl font-black uppercase tracking-widest text-pop">
              Зона наград
            </h1>
            <p className="mt-2 font-mono text-sm text-slate-200/90">
              Сегодня здесь можно крутить, открывать и побеждать.
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              Награды ощущаются как прогресс — без лишнего шума.
            </p>
          </div>
          <div className="shrink-0 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-widest text-slate-400">Стиль</div>
            <div className="mt-1 font-gaming text-base font-black uppercase tracking-wider text-slate-100">
              Арена
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

