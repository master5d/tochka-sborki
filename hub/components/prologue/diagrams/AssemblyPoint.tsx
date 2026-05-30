import styles from './diagrams.module.css'

/**
 * Act III — Radar Sunburst.
 * Atomic-age radar scope with sunburst rays and a luminous centre — vintage
 * carrier for "точка сборки как конкретное состояние".
 */
export function AssemblyPoint() {
  return (
    <svg
      viewBox="0 0 800 380"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Радар-санберст — точка сборки в центре концентрических колец и расходящихся лучей"
      className={styles.svg}
    >
      <g transform="translate(400 190)">
        {/* outer technical frame ring */}
        <circle cx="0" cy="0" r="178" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />

        {/* sunburst rays — 24 thin lines at varying lengths */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.45">
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180
            const inner = 32
            const outer = i % 2 === 0 ? 140 : 100
            const x1 = Math.cos(angle) * inner
            const y1 = Math.sin(angle) * inner
            const x2 = Math.cos(angle) * outer
            const y2 = Math.sin(angle) * outer
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
        </g>

        {/* radar concentric rings */}
        <g fill="none" stroke="currentColor">
          <circle cx="0" cy="0" r="155" strokeWidth="0.75" opacity="0.35" />
          <circle cx="0" cy="0" r="118" strokeWidth="0.75" opacity="0.45" />
          <circle cx="0" cy="0" r="82" strokeWidth="0.75" opacity="0.55" />
          <circle cx="0" cy="0" r="50" strokeWidth="1" opacity="0.7" />
          <circle cx="0" cy="0" r="28" strokeWidth="1.25" opacity="0.85" />
        </g>

        {/* cardinal tick marks */}
        <g stroke="currentColor" strokeWidth="1.25" opacity="0.7">
          <line x1="0" y1="-178" x2="0" y2="-160" />
          <line x1="0" y1="178" x2="0" y2="160" />
          <line x1="-178" y1="0" x2="-160" y2="0" />
          <line x1="178" y1="0" x2="160" y2="0" />
        </g>

        {/* secondary tick marks at 45° */}
        <g stroke="currentColor" strokeWidth="0.6" opacity="0.4">
          {[45, 135, 225, 315].map((deg) => {
            const r1 = 170
            const r2 = 178
            const a = (deg * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={Math.cos(a) * r1}
                y1={Math.sin(a) * r1}
                x2={Math.cos(a) * r2}
                y2={Math.sin(a) * r2}
              />
            )
          })}
        </g>

        {/* the moving "blip" — small dot on the outer ring */}
        <circle cx="118" cy="0" r="3.5" fill="#d4a017" transform="rotate(-58)" />
        <circle cx="118" cy="0" r="7" fill="#d4a017" opacity="0.25" transform="rotate(-58)" />

        {/* luminous centre */}
        <circle cx="0" cy="0" r="18" fill="#d4a017" opacity="0.18" />
        <circle cx="0" cy="0" r="10" fill="#d4a017" />
        <circle cx="0" cy="0" r="3.5" fill="currentColor" />
      </g>

      {/* cardinal labels */}
      <g fontFamily="ui-monospace, 'Cascadia Mono', Menlo, monospace" fontSize="10" fill="currentColor" opacity="0.55" letterSpacing="1">
        <text x="400" y="14" textAnchor="middle">N</text>
        <text x="400" y="376" textAnchor="middle">S</text>
        <text x="218" y="195" textAnchor="middle">W</text>
        <text x="582" y="195" textAnchor="middle">E</text>
      </g>

      {/* technical label */}
      <g fontFamily="ui-monospace, 'Cascadia Mono', Menlo, monospace" fontSize="9" fill="currentColor" opacity="0.5" letterSpacing="0.5">
        <text x="30" y="32">SCAN · 0 ° → 360 °</text>
        <text x="770" y="32" textAnchor="end">RANGE 0 — 003</text>
        <text x="400" y="360" textAnchor="middle">точка сборки</text>
      </g>
    </svg>
  )
}
