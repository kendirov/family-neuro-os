/**
 * ArchitectAdmin — вид архитектора/админа.
 * Полный контроль, аналитика, God Mode.
 * Пока использует Dashboard с mode="commander".
 */
import { Dashboard } from '@/pages/Dashboard'

export function ArchitectAdmin() {
  return <Dashboard mode="commander" />
}
