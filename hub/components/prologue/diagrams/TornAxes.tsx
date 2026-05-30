import styles from './diagrams.module.css'

export function TornAxes() {
  return (
    <svg
      viewBox="0 0 800 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Карта рвётся по трём осям — институты, карта мира, базовый вопрос"
      className={styles.svg}
    >
      {/* axis 1: leftward — institutions */}
      <line x1="400" y1="160" x2="220" y2="160" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="200"
        y1="160"
        x2="60"
        y2="160"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        opacity="0.4"
      />

      {/* axis 2: upper-right — map of meaning */}
      <line x1="400" y1="160" x2="540" y2="100" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="560"
        y1="90"
        x2="700"
        y2="30"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        opacity="0.4"
      />

      {/* axis 3: lower-right — base question */}
      <line x1="400" y1="160" x2="540" y2="220" stroke="currentColor" strokeWidth="1.5" />
      <line
        x1="560"
        y1="230"
        x2="700"
        y2="290"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="5 5"
        opacity="0.4"
      />

      {/* origin point */}
      <circle cx="400" cy="160" r="4" fill="currentColor" />

      {/* tear marks at each break */}
      <g stroke="#d4a017" strokeWidth="2.5" strokeLinecap="round">
        <line x1="215" y1="151" x2="205" y2="169" />
        <line x1="548" y1="106" x2="554" y2="92" />
        <line x1="554" y1="228" x2="548" y2="214" />
      </g>

      {/* axis labels */}
      <g
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="13"
        fill="currentColor"
        opacity="0.6"
        letterSpacing="0.4"
      >
        <text x="50" y="184">институты</text>
        <text x="630" y="20">карта</text>
        <text x="630" y="295">вопрос</text>
      </g>
    </svg>
  )
}
