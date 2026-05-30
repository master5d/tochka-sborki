import styles from './diagrams.module.css'

export function TwoCurves() {
  return (
    <svg
      viewBox="0 0 800 400"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Две кривые: централизованный AI выравнивается, локальный узел дешевеет, точка пересечения"
      className={styles.svg}
    >
      {/* axes */}
      <line x1="80" y1="50" x2="80" y2="340" stroke="currentColor" strokeWidth="1" opacity="0.35" />
      <line
        x1="80"
        y1="340"
        x2="740"
        y2="340"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.35"
      />

      {/* x-axis label */}
      <text
        x="740"
        y="362"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="12"
        fill="currentColor"
        opacity="0.5"
        textAnchor="end"
      >
        время →
      </text>

      {/* Curve 1: centralized AI — flattening S-curve */}
      <path
        d="M 80 320 C 280 320, 380 80, 740 80"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Curve 2: personal node cost — declining */}
      <path
        d="M 80 80 C 280 80, 380 320, 740 320"
        stroke="#d4a017"
        strokeWidth="2"
        fill="none"
      />

      {/* crossing point */}
      <line
        x1="410"
        y1="200"
        x2="410"
        y2="340"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="3 3"
        opacity="0.4"
      />
      <circle cx="410" cy="200" r="6" fill="currentColor" />
      <text
        x="410"
        y="383"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="12"
        fill="currentColor"
        opacity="0.65"
        textAnchor="middle"
      >
        точка пересечения
      </text>

      {/* curve labels */}
      <text
        x="740"
        y="38"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="13"
        fill="currentColor"
        opacity="0.75"
        textAnchor="end"
      >
        централизованный AI: стоимость рывка ↑
      </text>
      <text
        x="740"
        y="312"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="13"
        fill="#d4a017"
        textAnchor="end"
      >
        личный узел: стоимость ↓
      </text>
    </svg>
  )
}
