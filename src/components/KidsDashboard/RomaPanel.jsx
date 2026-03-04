/**
 * RomaPanel — панель Ромы. Next-Gen Gaming HUD.
 * Spin Progress → Roulette → Missions.
 */
import { PilotsPanel } from './PilotsPanel'

export function RomaPanel(props) {
  return <PilotsPanel childId="roma" accentColor="cyan" {...props} />
}
