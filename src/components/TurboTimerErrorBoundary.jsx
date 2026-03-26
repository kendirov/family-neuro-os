import React from 'react'

export class TurboTimerErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message ? String(err.message) : 'Unknown error' }
  }

  componentDidCatch(err, info) {
    console.error('[TG_TIMER] ErrorBoundary caught', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-950/25 backdrop-blur-xl p-4 text-slate-100 shadow-[0_0_18px_rgba(239,68,68,0.18)]">
          <div className="font-gaming text-sm uppercase tracking-wider text-red-200">
            Таймер временно недоступен
          </div>
          <div className="mt-2 font-mono text-xs text-red-100/80">
            {this.state.message}
          </div>
          <div className="mt-3 font-mono text-[10px] text-red-200/70 uppercase tracking-widest">
            [TG_TIMER] UI recovered (no white-screen)
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

