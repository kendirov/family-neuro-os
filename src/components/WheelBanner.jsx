import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PilotAvatar } from '@/components/HelmetAvatar'

/** 3D Wheel icon (or use chest: https://cdn-icons-png.flaticon.com/512/8682/8682705.png) */
const WHEEL_IMAGE_URL = 'https://cdn-icons-png.flaticon.com/512/4213/4213642.png'

export function WheelBanner({ wheelPilot, setWheelPilot, setWheelOpen }) {
  const [showSelectorModal, setShowSelectorModal] = useState(false)

  const hasSinglePilot = wheelPilot === 'roma' || wheelPilot === 'kirill'

  const handleBannerClick = () => {
    if (hasSinglePilot) {
      setWheelOpen(true)
    } else {
      setShowSelectorModal(true)
    }
  }

  const handleSelectPilot = (pilotId) => {
    setWheelPilot(pilotId)
    setShowSelectorModal(false)
    setWheelOpen(true)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleBannerClick}
        className={cn(
          'w-full min-h-[96px] sm:min-h-[112px] rounded-xl flex items-center justify-between gap-4 px-4 py-3',
          'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-500',
          'border-2 border-white/20 shadow-[0_0_24px_rgba(168,85,247,0.35)]',
          'hover:shadow-[0_0_32px_rgba(236,72,153,0.5)] hover:border-white/30',
          'transition-all duration-300 touch-manipulation text-left',
          'animate-pulse hover:animate-none'
        )}
        aria-label="Испытать удачу — колесо фортуны"
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-gaming text-base sm:text-lg font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            ИСПЫТАТЬ УДАЧУ
          </span>
          <span className="font-mono text-[10px] sm:text-xs text-white/85 uppercase tracking-wider">
            Ежедневный бонус
          </span>
        </div>
        <div className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center drop-shadow-lg">
          <img
            src={WHEEL_IMAGE_URL}
            alt=""
            className="w-full h-full object-contain"
            width={80}
            height={80}
          />
        </div>
      </button>

      {/* Pilot Selector Modal — when no single pilot selected */}
      {showSelectorModal && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSelectorModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="wheel-selector-title"
        >
          <div
            className="bg-slate-900 border-2 border-slate-600 rounded-2xl shadow-xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="wheel-selector-title"
              className="font-mono text-sm font-bold uppercase tracking-widest text-slate-200 mb-4 text-center"
            >
              Кто испытывает удачу?
            </h2>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleSelectPilot('roma')}
                className="flex items-center gap-4 min-h-[64px] rounded-xl border-2 border-cyan-500/60 bg-cyan-500/15 px-4 py-3 text-cyan-200 hover:bg-cyan-500/25 hover:border-cyan-400 transition touch-manipulation"
              >
                <PilotAvatar pilotId="roma" size="engine" className="shrink-0" />
                <span className="font-gaming text-lg font-bold uppercase tracking-wider">Рома</span>
              </button>
              <button
                type="button"
                onClick={() => handleSelectPilot('kirill')}
                className="flex items-center gap-4 min-h-[64px] rounded-xl border-2 border-purple-500/60 bg-purple-500/15 px-4 py-3 text-purple-200 hover:bg-purple-500/25 hover:border-purple-400 transition touch-manipulation"
              >
                <PilotAvatar pilotId="kirill" size="engine" className="shrink-0" />
                <span className="font-gaming text-lg font-bold uppercase tracking-wider">Кирилл</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSelectorModal(false)}
              className="mt-4 w-full min-h-[40px] rounded-lg font-mono text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:bg-slate-800 transition"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </>
  )
}
