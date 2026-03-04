/**
 * confettiUtils — dopamine-triggering reward effects.
 * canvas-confetti: burst from origin (mission card or top of screen).
 */
import confetti from 'canvas-confetti'

/**
 * Запуск конфетти при выполнении миссии.
 * @param {Object} options
 * @param {number} [options.x=0.5] — 0..1, горизонтальная позиция (0.5 = центр)
 * @param {number} [options.y=0.2] — 0..1, вертикальная позиция (0.2 = верх экрана)
 * @param {number} [options.particleCount=80] — количество частиц
 * @param {number} [options.spread=60] — разброс
 */
export function fireMissionCompleteConfetti(options = {}) {
  const { x = 0.5, y = 0.2, particleCount = 80, spread = 60 } = options

  confetti({
    particleCount,
    spread,
    origin: { x, y },
    colors: ['#34d399', '#10b981', '#fbbf24', '#f59e0b', '#f472b6'],
    ticks: 120,
  })

  // Дополнительный маленький burst через 150ms
  setTimeout(() => {
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { x, y },
      colors: ['#34d399', '#10b981'],
      ticks: 80,
    })
  }, 150)
}

/**
 * Конфетти из позиции элемента (например, mission card).
 * @param {HTMLElement} element — DOM-элемент для расчёта origin
 */
export function fireConfettiFromElement(element) {
  if (!element) {
    fireMissionCompleteConfetti()
    return
  }
  const rect = element.getBoundingClientRect()
  const x = (rect.left + rect.width / 2) / window.innerWidth
  const y = (rect.top + rect.height / 2) / window.innerHeight
  fireMissionCompleteConfetti({ x, y })
}
