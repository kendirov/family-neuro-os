/**
 * Kiosk Mode layout: Turbo Garage — High-Tech Racing Garage.
 * Dark blue + carbon fiber / hexagon mesh background.
 */
export function KioskLayout({ children, className = '' }) {
  return (
    <div
      className={[
        'min-h-screen w-full flex flex-col relative bg-turbo-garage',
        'md:max-w-7xl md:mx-auto md:shadow-2xl md:shadow-cyan-500/10',
        className,
      ].filter(Boolean).join(' ')}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-turbo-garage-mesh opacity-80"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(34,211,238,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.12)_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />
      <div className="relative flex flex-col min-h-screen">{children}</div>
    </div>
  )
}
