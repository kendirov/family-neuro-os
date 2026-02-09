/**
 * Wheel of Fortune Loot Table Configuration
 *
 * Structure per item:
 * - id: unique string identifier
 * - label: Text to display (e.g. "50 XP", "Конфета")
 * - type: 'xp' (auto-add) | 'item' (manual reward/inventory) | 'penalty' (fun/joke)
 * - value: Numerical amount (for XP) or description string (for items/penalties)
 * - color: Hex code or CSS color (used for segment background)
 * - weight: Integer chance weight (higher = more likely)
 * - icon: Emoji or icon identifier
 */

export const WHEEL_ITEMS = [
  // --- COMMON (Weight 50 - High Chance) ---
  {
    id: 'xp_50',
    label: '50 XP',
    type: 'xp',
    value: 50,
    weight: 50,
    color: '#3b82f6', // blue-500
    icon: '⚡',
  },
  {
    id: 'candy',
    label: 'Конфета',
    type: 'item',
    value: 'Сладкий приз',
    weight: 50,
    color: '#10b981', // green-500
    icon: '🍬',
  },
  {
    id: 'game_15',
    label: '15 мин Игры',
    type: 'item', // Treated as manual reward (bonus time)
    value: 'Bonus Time',
    weight: 50,
    color: '#f59e0b', // amber-500
    icon: '🎮',
  },

  // --- RARE (Weight 20 - Medium Chance) ---
  {
    id: 'xp_100',
    label: '100 XP',
    type: 'xp',
    value: 100,
    weight: 20,
    color: '#8b5cf6', // violet-500
    icon: '⚡',
  },
  {
    id: 'kinder',
    label: 'Киндер',
    type: 'item',
    value: 'Шоколадное яйцо',
    weight: 20,
    color: '#ec4899', // pink-500
    icon: '🥚',
  },
  {
    id: 'cartoons_60',
    label: 'Час Мультиков',
    type: 'item',
    value: '1 час бесплатных мультиков',
    weight: 20,
    color: '#6366f1', // indigo-500
    icon: '📺',
  },

  // --- EPIC (Weight 5 - Low Chance) ---
  {
    id: 'xp_500',
    label: '500 XP',
    type: 'xp',
    value: 500,
    weight: 5,
    color: '#ef4444', // red-500
    icon: '🔥',
  },
  {
    id: 'pizza',
    label: 'Пицца',
    type: 'item',
    value: 'Заказ пиццы',
    weight: 5,
    color: '#f97316', // orange-500
    icon: '🍕',
  },
  {
    id: 'new_game',
    label: 'Новая Игра',
    type: 'item',
    value: 'Выбор новой игры',
    weight: 5,
    color: '#22c55e', // green-500
    icon: '🎮',
  },

  // --- LEGENDARY (Weight 1 - Very Low Chance) ---
  {
    id: 'xp_1000',
    label: '1000 XP',
    type: 'xp',
    value: 1000,
    weight: 1,
    color: '#fbbf24', // amber-400 (Gold)
    icon: '🏆',
  },
  {
    id: 'cinema',
    label: 'Поход в Кино',
    type: 'item',
    value: 'Поход в кинотеатр',
    weight: 1,
    color: '#a855f7', // purple-500
    icon: '🎬',
  },

  // --- FUN / JOKE (Weight 10) ---
  {
    id: 'hug',
    label: 'Обними Папу',
    type: 'penalty', // fun/joke action
    value: 'Free Hug',
    weight: 10,
    color: '#6366f1', // indigo-500
    icon: '🤗',
  },
  {
    id: 'squats',
    label: '10 Приседаний',
    type: 'penalty',
    value: 'Sport',
    weight: 10,
    color: '#64748b', // slate-500
    icon: '🏋️',
  },
]

/**
 * Calculate total weight for weighted random selection
 */
export function getTotalWeight(items = WHEEL_ITEMS) {
  return items.reduce((sum, item) => sum + item.weight, 0)
}

/**
 * Weighted random selection algorithm
 * 
 * Algorithm:
 * 1. Calculate totalWeight (sum of all item weights)
 * 2. Generate random number r between 0 and totalWeight
 * 3. Iterate through items, subtracting their weight from r
 * 4. The item where r drops below zero is the winner
 * 
 * @param {Array} items - Array of wheel items (defaults to WHEEL_ITEMS)
 * @returns {Object} Selected wheel item
 */
export function spinWheel(items = WHEEL_ITEMS) {
  const totalWeight = getTotalWeight(items)
  let r = Math.random() * totalWeight
  
  for (const item of items) {
    r -= item.weight
    if (r <= 0) {
      return item
    }
  }
  
  // Fallback to last item (should never happen, but safety)
  return items[items.length - 1]
}

/**
 * Generate wheel segments for visual display
 * Selects representative items from different tiers to show variety
 * 
 * @param {Array} items - Array of wheel items (defaults to WHEEL_ITEMS)
 * @param {Number} segmentCount - Number of segments on wheel (default: 6)
 * @returns {Array} Array of segment objects with color, label, emoji
 */
export function generateWheelSegments(items = WHEEL_ITEMS, segmentCount = 6) {
  // Group items by weight tier for better distribution
  const common = items.filter(item => item.weight >= 40)
  const rare = items.filter(item => item.weight >= 15 && item.weight < 40)
  const epic = items.filter(item => item.weight >= 3 && item.weight < 15)
  const legendary = items.filter(item => item.weight < 3)
  
  const segments = []
  const usedIndices = new Set()
  
  // Distribute segments: try to show variety from different tiers
  for (let i = 0; i < segmentCount; i++) {
    let item = null
    let itemIndex = 0
    
    // Select from different tiers based on segment position
    if (i === 0 && common.length > 0) {
      itemIndex = Math.floor(Math.random() * common.length)
      item = common[itemIndex]
    } else if (i === 1 && rare.length > 0) {
      itemIndex = Math.floor(Math.random() * rare.length)
      item = rare[itemIndex]
    } else if (i === 2 && epic.length > 0) {
      itemIndex = Math.floor(Math.random() * epic.length)
      item = epic[itemIndex]
    } else if (i === 3 && legendary.length > 0) {
      itemIndex = Math.floor(Math.random() * legendary.length)
      item = legendary[itemIndex]
    } else {
      // Fallback: pick any unused item
      const available = items.filter((_, idx) => !usedIndices.has(idx))
      if (available.length > 0) {
        item = available[Math.floor(Math.random() * available.length)]
        itemIndex = items.indexOf(item)
      } else {
        // Last resort: cycle through items
        item = items[i % items.length]
        itemIndex = i % items.length
      }
    }
    
    if (item) {
      usedIndices.add(itemIndex)
      
      // Create short label for wheel display
      let shortLabel = item.label
      if (item.label.length > 10) {
        // Truncate long labels
        shortLabel = item.label.substring(0, 8) + '...'
      }
      
      segments.push({
        color: item.color,
        label: `${item.icon} ${shortLabel}`,
        emoji: item.icon,
        item: item, // Keep reference to full item
      })
    }
  }
  
  return segments
}
