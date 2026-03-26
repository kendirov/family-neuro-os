import React from 'react'

export class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (import.meta?.env?.DEV) {
      // eslint-disable-next-line no-console
      console.groupCollapsed('[TG_ROUTE] Unhandled error')
      // eslint-disable-next-line no-console
      console.error(error)
      // eslint-disable-next-line no-console
      console.log(info)
      // eslint-disable-next-line no-console
      console.groupEnd()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 text-white bg-slate-950">
          <div className="max-w-md w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h1 className="font-gaming text-lg uppercase tracking-wider text-slate-200">
              Что-то пошло не так
            </h1>
            <p className="mt-2 font-mono text-sm text-slate-400">
              Экран упал, но приложение живо. Обновите страницу или вернитесь назад.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className="min-h-[44px] rounded-xl border border-cyan-500/50 bg-cyan-500/15 text-cyan-200 font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-500/20 transition touch-manipulation"
                onClick={() => window.location.reload()}
              >
                Обновить
              </button>
              <button
                type="button"
                className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 text-slate-300 font-mono text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition touch-manipulation"
                onClick={() => window.history.back()}
              >
                Назад
              </button>
            </div>
            {import.meta?.env?.DEV && this.state.error && (
              <pre className="mt-4 max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-slate-300">
                {String(this.state.error?.stack ?? this.state.error)}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

