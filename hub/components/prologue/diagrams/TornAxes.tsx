import styles from './diagrams.module.css'

/**
 * Act I — Shattered Horizon.
 * Outrun-style perspective grid fractured by three jagged tears emanating from
 * the vanishing point, with drift-shard geometry above the horizon. Visual
 * metaphor for "карта рвётся по трём осям".
 */
export function TornAxes() {
  return (
    <svg
      viewBox="0 0 800 380"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="torn-axes-title"
      className={styles.svg}
    >
      <title id="torn-axes-title">Порванная карта смысла: оси старых институтов расходятся</title>
      {/* outer frame — technical-drawing border */}
      <rect x="20" y="20" width="760" height="340" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.25" />

      {/* horizon line */}
      <line x1="20" y1="170" x2="780" y2="170" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />

      {/* sun disc on horizon */}
      <circle cx="400" cy="170" r="48" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.5" />
      <line x1="352" y1="170" x2="448" y2="170" stroke="currentColor" strokeWidth="0.5" opacity="0.4" />
      {/* sun bands */}
      <g stroke="#d4a017" strokeWidth="1.25" opacity="0.85">
        <line x1="372" y1="156" x2="428" y2="156" />
        <line x1="362" y1="146" x2="438" y2="146" />
        <line x1="380" y1="138" x2="420" y2="138" />
      </g>

      {/* perspective grid — floor */}
      <g stroke="currentColor" strokeWidth="0.5" opacity="0.35">
        {/* horizontal grid lines, denser as they approach horizon */}
        <line x1="20" y1="350" x2="780" y2="350" />
        <line x1="50" y1="320" x2="750" y2="320" />
        <line x1="90" y1="290" x2="710" y2="290" />
        <line x1="135" y1="260" x2="665" y2="260" />
        <line x1="180" y1="232" x2="620" y2="232" />
        <line x1="225" y1="208" x2="575" y2="208" />
        <line x1="265" y1="188" x2="535" y2="188" />
        <line x1="305" y1="178" x2="495" y2="178" />

        {/* radial vanishing lines */}
        <line x1="400" y1="170" x2="20" y2="350" />
        <line x1="400" y1="170" x2="120" y2="350" />
        <line x1="400" y1="170" x2="220" y2="350" />
        <line x1="400" y1="170" x2="320" y2="350" />
        <line x1="400" y1="170" x2="400" y2="350" />
        <line x1="400" y1="170" x2="480" y2="350" />
        <line x1="400" y1="170" x2="580" y2="350" />
        <line x1="400" y1="170" x2="680" y2="350" />
        <line x1="400" y1="170" x2="780" y2="350" />
      </g>

      {/* three jagged fracture lines from vanishing point */}
      <g stroke="#d4a017" strokeWidth="1.5" fill="none" strokeLinejoin="round">
        {/* fracture 1: left, into floor */}
        <path d="M 400 170 L 380 200 L 360 215 L 330 245 L 290 275 L 240 320" />
        {/* fracture 2: down-center */}
        <path d="M 400 170 L 405 205 L 395 235 L 410 270 L 398 310 L 415 355" />
        {/* fracture 3: right, into floor */}
        <path d="M 400 170 L 425 195 L 445 220 L 480 250 L 525 280 L 590 320" />
      </g>

      {/* drift shards above horizon */}
      <g stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.6">
        <polygon points="140,80 210,95 200,140 130,120" />
        <polygon points="600,60 685,72 700,108 615,118" />
        <polygon points="335,50 395,55 390,90 330,85" transform="rotate(-8 362 70)" />
      </g>
      {/* one shard with amber inner edge — the "fall" suggestion */}
      <line x1="200" y1="140" x2="130" y2="120" stroke="#d4a017" strokeWidth="1.25" opacity="0.85" />
      <line x1="700" y1="108" x2="615" y2="118" stroke="#d4a017" strokeWidth="1.25" opacity="0.85" />

      {/* technical labels — vintage instrument feel */}
      <g fontFamily="ui-monospace, 'Cascadia Mono', Menlo, monospace" fontSize="9" fill="currentColor" opacity="0.55" letterSpacing="0.5">
        <text x="30" y="36">PHASE SHIFT · 01</text>
        <text x="770" y="36" textAnchor="end">N — 003</text>
        <text x="30" y="352">∠ 22°</text>
        <text x="770" y="352" textAnchor="end">∠ 22°</text>
      </g>
    </svg>
  )
}
