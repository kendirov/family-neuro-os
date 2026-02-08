/** DiceBear pixel-art avatar URLs (no API key). */
const PIXEL_AVATAR = {
  roma: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Roma&backgroundColor=b6e3f4',
  kirill: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Kirill&backgroundColor=c0aede',
}

/**
 * Pixel art avatar for pilot column or engine card.
 * @param {'roma'|'kirill'} pilotId
 * @param {'column'|'engine'} size - column = larger (w-16 h-16), engine = smaller (w-10 h-10)
 */
export function PilotAvatar({ pilotId, size = 'column', className = '' }) {
  const src = PIXEL_AVATAR[pilotId] ?? PIXEL_AVATAR.roma
  const isRoma = pilotId === 'roma'
  const sizeClass = size === 'column' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-10 h-10'
  const borderGlow = isRoma
    ? 'border-4 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)]'
    : 'border-4 border-purple-400 shadow-[0_0_15px_rgba(192,132,252,0.6)]'

  return (
    <img
      src={src}
      alt=""
      className={`rounded-full object-cover ${sizeClass} ${borderGlow} ${className}`.trim()}
      width={size === 'column' ? 80 : 40}
      height={size === 'column' ? 80 : 40}
    />
  )
}

/**
 * Turbo Garage avatars: Blue Racer Helmet (Roma), Purple Space Pilot Helmet (Kirill).
 * Boyish, futuristic placeholder icons.
 */
export function BlueRacerHelmet({ className = 'h-7 w-7' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="blue-racer-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <filter id="blue-glow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Helmet shell */}
      <path
        d="M24 8c-8 0-14 6-14 14v4c0 2 1.5 4 4 4h20c2.5 0 4-2 4-4v-4c0-8-6-14-14-14z"
        fill="url(#blue-racer-shine)"
        stroke="#0e7490"
        strokeWidth="1.2"
        filter="url(#blue-glow)"
      />
      {/* Visor */}
      <path
        d="M16 22h16v6H16z"
        fill="rgba(6, 182, 212, 0.5)"
        stroke="#0e7490"
        strokeWidth="0.8"
      />
      {/* Chin guard */}
      <path
        d="M18 36v4h12v-4"
        fill="#0e7490"
        stroke="#0e7490"
        strokeWidth="0.6"
      />
    </svg>
  )
}

export function PurplePilotHelmet({ className = 'h-7 w-7' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="purple-pilot-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="purple-glow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Helmet shell — more rounded / space-style */}
      <path
        d="M24 6c-10 0-18 8-18 16v2c0 2.5 2 4 4 4h28c2 0 4-1.5 4-4v-2c0-8-8-16-18-16z"
        fill="url(#purple-pilot-shine)"
        stroke="#6b21a8"
        strokeWidth="1.2"
        filter="url(#purple-glow)"
      />
      {/* Visor — curved */}
      <path
        d="M14 22c2 0 6 2 10 2s8-2 10-2v4H14v-4z"
        fill="rgba(147, 51, 234, 0.5)"
        stroke="#6b21a8"
        strokeWidth="0.8"
      />
      {/* Antenna / comms nub */}
      <circle cx="24" cy="12" r="2" fill="#a855f7" stroke="#6b21a8" strokeWidth="0.6" />
    </svg>
  )
}
