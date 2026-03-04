/**
 * Слой транзакций Turbo Coins.
 * Все операции идут через store (addPoints/spendPoints) — без прямой мутации UI.
 * Supabase синхронизируется внутри store.
 */
import { useAppStore } from '@/stores/useAppStore'

/**
 * Начислить Turbo Coins пилоту.
 * @param {string} pilotId — id пилота (roma | kirill)
 * @param {number} amount — сумма
 * @param {string} [reason] — описание
 * @param {boolean} [skipBoss] — не учитывать в Raid Boss
 */
export function addTurboCoins(pilotId, amount, reason = 'Начислено', skipBoss = false) {
  useAppStore.getState().addPoints(pilotId, amount, reason, skipBoss)
}

/**
 * Списать Turbo Coins у пилота.
 * @param {string} pilotId
 * @param {number} amount
 * @param {string} [reason]
 */
export function deductTurboCoins(pilotId, amount, reason = 'Списано') {
  useAppStore.getState().spendPoints(pilotId, amount, reason)
}

/**
 * Daily Points → Spins: использовать один спин, записать приз.
 * @param {string} childId — roma | kirill
 * @param {object} prize — { id, label, type, value, icon }
 * @returns {boolean} true если спин использован
 */
export function useRouletteSpin(childId, prize) {
  return useAppStore.getState().useSpin(childId, prize)
}

/** Доступные спины: floor(daily_points_earned/50) - spins_used_today */
export function getAvailableSpins(childId) {
  return useAppStore.getState().getAvailableSpins(childId)
}

/** Очков до следующего спина: 50 - (daily_points_earned % 50) */
export function getPointsToNextSpin(childId) {
  return useAppStore.getState().getPointsToNextSpin(childId)
}
