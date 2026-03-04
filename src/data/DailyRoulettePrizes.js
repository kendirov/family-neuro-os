/**
 * Daily Roulette — призы для "Quantum Decrypter".
 * Компактный набор: игры, сладости, XP, рубли, фрукты.
 */
export const DAILY_ROULETTE_PRIZES = [
  { id: 'games_5', label: '+5 мин Игры', type: 'time', value: 5, icon: '🎮', color: '#06b6d4' },
  { id: 'kinder', label: 'Киндер Сюрприз', type: 'item', value: 'Kinder Surprise', icon: '🥚', color: '#ec4899' },
  { id: 'xp_10', label: '+10 ⚡', type: 'xp', value: 10, icon: '⚡', color: '#22c55e' },
  { id: 'rubles_10', label: '10 ₽', type: 'money', value: 10, icon: '💰', color: '#f59e0b' },
  { id: 'apple', label: 'Яблоко', type: 'item', value: 'Apple', icon: '🍎', color: '#10b981' },
  { id: 'games_10', label: '+10 мин Игры', type: 'time', value: 10, icon: '🎮', color: '#3b82f6' },
  { id: 'xp_5', label: '+5 ⚡', type: 'xp', value: 5, icon: '⚡', color: '#8b5cf6' },
  { id: 'candy', label: 'Конфета', type: 'item', value: 'Candy', icon: '🍬', color: '#f472b6' },
]

/** Weighted random — равные шансы для простоты. */
export function pickRandomPrize(prizes = DAILY_ROULETTE_PRIZES) {
  return prizes[Math.floor(Math.random() * prizes.length)]
}
