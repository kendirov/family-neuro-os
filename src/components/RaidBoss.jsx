import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

const RAID_TARGET = 1500

export function RaidBoss({ isCommander = false }) {
  const raidProgress = useAppStore((s) => s.raidProgress ?? 0)
  const resetRaidProgress = useAppStore((s) => s.resetRaidProgress)

  const prevProgressRef = useRef(raidProgress)
  const [isTakingDamage, setIsTakingDamage] = useState(false)

  useEffect(() => {
    if (raidProgress > prevProgressRef.current) {
      prevProgressRef.current = raidProgress
      setIsTakingDamage(true)
      const t = setTimeout(() => setIsTakingDamage(false), 500)
      return () => clearTimeout(t)
    }
    prevProgressRef.current = raidProgress
  }, [raidProgress])

  const isWin = raidProgress >= RAID_TARGET
  // CRITICAL: Allow overflow - show actual HP even if negative (boss defeated)
  const currentHP = Math.max(0, RAID_TARGET - raidProgress)
  // Visual bar caps at 100% but we track overflow
  const hpPercent = Math.min(100, Math.max(0, (currentHP / RAID_TARGET) * 100))
  const overflowAmount = raidProgress > RAID_TARGET ? raidProgress - RAID_TARGET : 0

  return (
    <div
      className={cn(
        'raid-boss shrink-0 rounded-xl border-2 overflow-hidden',
        'bg-gradient-to-b from-slate-900/95 via-violet-950/80 to-slate-900/95',
        'border-amber-600/60 shadow-[0_0_28px_rgba(180,83,9,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]'
      )}
    >
      <div className="px-3 pt-3 pb-2 flex flex-col items-center">
        {/* Title + Reset */}
        <div className="w-full flex items-center justify-between gap-2 mb-2">
          <h3
            className={cn(
              'font-mono text-[10px] font-bold uppercase tracking-widest',
              isWin ? 'text-amber-300' : 'text-amber-200/90'
            )}
          >
            {isWin ? 'ПОБЕДА! ЗАКАЗЫВАЕМ РОЛЛЫ! 🍣' : '⚔ БОСС АРЕНА'}
          </h3>
          {isWin && isCommander && (
            <button
              type="button"
              onClick={resetRaidProgress}
              className="shrink-0 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase bg-slate-700/80 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:text-white transition touch-manipulation"
            >
              Сброс
            </button>
          )}
        </div>

        {/* Boss Arena: cage + CSS 3D Sushi Boss (no image) */}
        <div className="flex flex-col items-center w-full">
          <div
            className={cn(
              'w-full max-w-[200px] rounded-lg border-2 border-purple-500/30 bg-gradient-to-b from-slate-800 to-slate-900 shadow-inner p-6 flex items-center justify-center'
            )}
          >
            <div className="relative h-36 w-36 flex items-center justify-center perspective-[800px]">
              <div
                className={cn(
                  'flex items-center justify-center [transform-style:preserve-3d]',
                  !isTakingDamage && !isWin && 'animate-boss-float'
                )}
                style={{
                  transform: 'rotateX(25deg) rotateY(-25deg) rotateZ(-5deg)',
                }}
              >
                <span
                  aria-hidden
                  className={cn(
                    'text-[8rem] leading-none',
                    isTakingDamage && 'animate-boss-damage ring-2 ring-red-500/80'
                  )}
                  style={{
                    filter: 'drop-shadow(10px 15px 15px rgba(0,0,0,0.6))',
                  }}
                >
                  🍣
                </span>
              </div>
            </div>
          </div>

          {/* BOSS HP text - shows overflow if defeated */}
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200/90 mt-2 tabular-nums">
            {isWin ? (
              <>
                BOSS DEFEATED! 🎉 (+{overflowAmount} overflow)
              </>
            ) : (
              <>
                BOSS HP: {currentHP} / {RAID_TARGET}
              </>
            )}
          </p>
          {/* Progress text showing actual progress */}
          <p className="font-mono text-[9px] text-slate-400/80 mt-0.5 tabular-nums">
            Progress: {raidProgress} / {RAID_TARGET}
            {overflowAmount > 0 && ` (+${overflowAmount})`}
          </p>

          {/* Health bar: dark grey bg, red-to-orange fill, thick gold border */}
          <div className="w-full mt-2 h-5 rounded-md border-[3px] border-amber-500/80 bg-slate-800 overflow-hidden shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
            <motion.div
              className="h-full rounded-sm bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 shadow-[0_0_10px_rgba(234,88,12,0.5)]"
              initial={false}
              animate={{ width: `${hpPercent}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 22 }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
