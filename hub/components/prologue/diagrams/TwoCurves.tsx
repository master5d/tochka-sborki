import styles from './diagrams.module.css'

/**
 * Act II — Dual Oscilloscope.
 * Vintage scope display with two crossing traces and a crosshair at the
 * intersection. Conceptual carrier for the "S-curve flattens vs personal-node
 * cost falls" argument.
 */
export function TwoCurves() {
  return (
    <svg
      viewBox="0 0 800 420"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="two-curves-title"
      className={styles.svg}
    >
      <title id="two-curves-title">Две S-кривые: централизованный AI выходит на плато, сеть личных узлов растёт</title>
      {/* outer chassis */}
      <rect x="20" y="20" width="760" height="380" rx="6" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.3" />

      {/* screen bezel */}
      <rect x="60" y="50" width="680" height="280" rx="12" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <rect x="68" y="58" width="664" height="264" rx="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />

      {/* internal grid */}
      <g stroke="currentColor" strokeWidth="0.4" opacity="0.18">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <line key={`v${i}`} x1={68 + (664 / 10) * i} y1="58" x2={68 + (664 / 10) * i} y2="322" />
        ))}
        {[1, 2, 3, 4, 5].map((i) => (
          <line key={`h${i}`} x1="68" y1={58 + (264 / 6) * i} x2="732" y2={58 + (264 / 6) * i} />
        ))}
      </g>

      {/* axis center marks */}
      <g stroke="currentColor" strokeWidth="0.6" opacity="0.45">
        <line x1="400" y1="58" x2="400" y2="322" strokeDasharray="2 4" />
        <line x1="68" y1="190" x2="732" y2="190" strokeDasharray="2 4" />
      </g>

      {/* Trace CH1: centralized AI — flattening S-curve */}
      <path
        d="M 68 300 C 260 300, 360 80, 732 78"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Trace CH2: personal node cost — declining */}
      <path
        d="M 68 78 C 260 78, 360 300, 732 302"
        stroke="#d4a017"
        strokeWidth="2"
        fill="none"
      />

      {/* crosshair at intersection */}
      <g stroke="currentColor" strokeWidth="1" opacity="0.85">
        <line x1="392" y1="190" x2="408" y2="190" />
        <line x1="400" y1="182" x2="400" y2="198" />
      </g>
      <circle cx="400" cy="190" r="9" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.5" />

      {/* trace labels at screen edges */}
      <g fontFamily="ui-monospace, 'Cascadia Mono', Menlo, monospace" fontSize="10" letterSpacing="0.5">
        <text x="728" y="72" textAnchor="end" fill="currentColor" opacity="0.75">CH1 · централизованный AI ↑</text>
        <text x="728" y="316" textAnchor="end" fill="#d4a017">CH2 · личный узел ↓</text>
      </g>

      {/* knobs row */}
      <g transform="translate(0 360)">
        {/* knob 1 */}
        <circle cx="120" cy="0" r="18" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
        <line x1="120" y1="-12" x2="120" y2="-6" stroke="currentColor" strokeWidth="1.25" />
        <line x1="120" y1="-22" x2="120" y2="-19" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
        <text x="120" y="32" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8.5" fill="currentColor" opacity="0.5">VOLTS/DIV</text>

        {/* knob 2 */}
        <circle cx="250" cy="0" r="18" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.55" />
        <line x1="240" y1="-7" x2="245" y2="-3" stroke="currentColor" strokeWidth="1.25" />
        <text x="250" y="32" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="8.5" fill="currentColor" opacity="0.5">TIME/DIV</text>

        {/* scale ticks */}
        <g stroke="currentColor" strokeWidth="0.5" opacity="0.4">
          {Array.from({ length: 21 }).map((_, i) => (
            <line key={i} x1={350 + i * 18} y1="-5" x2={350 + i * 18} y2={i % 5 === 0 ? -12 : -8} />
          ))}
        </g>

        {/* LED-style amber indicator */}
        <circle cx="740" cy="-2" r="4" fill="#d4a017" />
        <text x="730" y="32" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="8.5" fill="currentColor" opacity="0.5">CROSSING ⊕</text>
      </g>
    </svg>
  )
}
