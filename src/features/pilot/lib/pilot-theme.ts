import type { FuelStateKind, PilotAccent } from './pilot-ui-model'

export interface AccentTheme {
  accent: PilotAccent
  glowCyan: string
  glowPurple: string
  border: string
  text: string
  bgGlow: string
  hudChip: string
}

export const ACCENT_THEMES: Record<PilotAccent, AccentTheme> = {
  cyan: {
    accent: 'cyan',
    glowCyan: 'shadow-[0_0_24px_rgba(34,211,238,0.45)]',
    glowPurple: 'shadow-[0_0_24px_rgba(168,85,247,0.25)]',
    border: 'border-cyan-500/50',
    text: 'text-cyan-200',
    bgGlow: 'bg-cyan-500/10',
    hudChip: 'border-cyan-500/60 bg-cyan-500/15 text-cyan-200',
  },
  purple: {
    accent: 'purple',
    glowCyan: 'shadow-[0_0_24px_rgba(34,211,238,0.25)]',
    glowPurple: 'shadow-[0_0_24px_rgba(168,85,247,0.45)]',
    border: 'border-purple-500/50',
    text: 'text-purple-200',
    bgGlow: 'bg-purple-500/10',
    hudChip: 'border-purple-500/60 bg-purple-500/15 text-purple-200',
  },
}

export interface FuelTheme {
  kind: FuelStateKind
  label: string
  description: string
  border: string
  glowClass: string
  text: string
  fillClass: string
}

export const FUEL_THEMES: Record<FuelStateKind, FuelTheme> = {
  empty_low: {
    kind: 'empty_low',
    label: 'EMPTY / LOW',
    description: 'Гараж на минимальном топливе. Меньше ускорения дня.',
    border: 'border-rose-500/55',
    glowClass: 'fuel-tank-glow-low fuel-tank-flicker',
    text: 'text-rose-200',
    fillClass: 'bg-gradient-to-t from-rose-600/50 via-amber-600/10 to-amber-500/10',
  },
  normal: {
    kind: 'normal',
    label: 'NORMAL FUEL',
    description: 'Стабильный режим. Ровный прирост XP дня.',
    border: 'border-amber-500/40',
    glowClass: '',
    text: 'text-amber-200',
    fillClass: 'bg-gradient-to-t from-amber-500/30 via-cyan-400/10 to-transparent',
  },
  premium_fuel: {
    kind: 'premium_fuel',
    label: 'PREMIUM FUEL',
    description: 'Полный заряд. Бонус XP дня увеличен.',
    border: 'border-amber-400/55',
    glowClass: 'fuel-tank-glow-high',
    text: 'text-amber-100',
    fillClass: 'bg-gradient-to-t from-amber-400/50 via-amber-300/20 to-transparent',
  },
  overheat: {
    kind: 'overheat',
    label: 'OVERHEAT',
    description: 'Слишком сладко/перегрев. Бонус XP дня снижен.',
    border: 'border-red-500/60',
    glowClass: 'animate-burn-pulse reactor-core-overheat',
    text: 'text-red-200',
    fillClass: 'bg-gradient-to-t from-red-500/45 via-amber-500/10 to-transparent',
  },
}

// Turbo-Garage visual tokens for Pilot Home (Stage 2A).

