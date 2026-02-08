/**
 * Kiosk Mode layout: Turbo Garage — Cyber-racing / GTA / Roblox style.
 * Carbon fiber / dark asphalt background with radial gradient focus on center.
 */
export function KioskLayout({ children, className = '' }) {
  return (
    <div
      className={[
        'min-h-screen w-full flex flex-col relative bg-turbo-garage',
        'md:max-w-[1920px] md:mx-auto md:shadow-2xl md:shadow-cyan-500/10',
        className,
      ].filter(Boolean).join(' ')}
    >
      {/* Carbon fiber / asphalt texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 bg-turbo-garage-mesh opacity-90"
        aria-hidden
      />
      {/* Subtle radial gradient to focus on center */}
      <div
        className="pointer-events-none absolute inset-0 bg-turbo-garage-radial"
        aria-hidden
      />
      {/* Optional grid line overlay (very subtle) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(34,211,238,.15)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.15)_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />
      <div className="relative flex flex-col min-h-screen font-sans-data">
        {children}
      </div>
    </div>
  )
}
