import styles from './diagrams.module.css'

export function AssemblyPoint() {
  return (
    <svg
      viewBox="0 0 800 320"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Точка сборки — концентрические кольца, сходящиеся к одному центру"
      className={styles.svg}
    >
      <g transform="translate(400 160)">
        {/* outer rings — fading inward */}
        <circle cx="0" cy="0" r="140" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" />
        <circle cx="0" cy="0" r="110" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.14" />
        <circle cx="0" cy="0" r="85" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.22" />
        <circle cx="0" cy="0" r="62" fill="none" stroke="currentColor" strokeWidth="1.25" opacity="0.36" />
        <circle cx="0" cy="0" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.55" />
        <circle cx="0" cy="0" r="24" fill="none" stroke="currentColor" strokeWidth="1.75" opacity="0.8" />

        {/* glow + center */}
        <circle cx="0" cy="0" r="16" fill="#d4a017" opacity="0.18" />
        <circle cx="0" cy="0" r="9" fill="#d4a017" />
        <circle cx="0" cy="0" r="3" fill="currentColor" />
      </g>

      {/* label */}
      <text
        x="400"
        y="297"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="13"
        fill="currentColor"
        opacity="0.55"
        textAnchor="middle"
        letterSpacing="0.4"
      >
        точка сборки
      </text>
    </svg>
  )
}
