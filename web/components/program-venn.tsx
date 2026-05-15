const WILL_BE = [
  { color: '#fbbf24', shape: 'diamond', text: 'Claude Code с нуля до продакшна — первый деплой уже на M2' },
  { color: '#f97316', shape: 'square',  text: 'MCP-серверы: подключить реальный инструмент за 20 минут' },
  { color: '#ef4444', shape: 'circle',  text: 'Pipeline URL → скрапинг → анализ → инсайты' },
  { color: '#22c55e', shape: 'circle',  text: 'Промпты, которые работают — не «попробуй переформулировать»' },
  { color: '#3b82f6', shape: 'square',  text: 'Агенты, которые пашут пока ты спишь' },
  { color: '#a855f7', shape: 'diamond', text: 'CLAUDE.md — агент, который помнит твой контекст' },
]

const WONT_BE = [
  'теории без практики',
  'обзор 50 нейросетей',
  'ChatGPT-туториалы из 2023',
  'домашки без смысла',
]

function Shape({ color, shape }: { color: string; shape: string }) {
  const base: React.CSSProperties = {
    display: 'inline-block',
    width: 13,
    height: 13,
    background: color,
    flexShrink: 0,
    marginTop: 3,
  }
  if (shape === 'circle')  return <span style={{ ...base, borderRadius: '50%' }} />
  if (shape === 'diamond') return <span style={{ ...base, transform: 'rotate(45deg)', marginTop: 2 }} />
  return <span style={{ ...base, borderRadius: 2 }} />
}

export function ProgramVenn() {
  const cx1 = 140, cy = 150, r = 112, cx2 = 272
  // overlap center x: midpoint of [cx1+r, cx2-r] where cx1+r=252, cx2-r=160 → (252+160)/2=206?
  // Actually overlap zone: from max(cx1-r, cx2-r)=160 to min(cx1+r, cx2+r)=252 → center=206
  const overlapCx = (cx1 + r + cx2 - r) / 2  // = (252 + 160) / 2 = 206
  const rightExclCx = (cx2 - r + cx2 + r) / 2  // but only non-overlap: from cx1+r=252 to cx2+r=384 → center=318
  const rightTextX = (cx1 + r + cx2 + r) / 2   // center of right non-overlap = (252+384)/2 = 318

  return (
    <section style={{
      padding: 'var(--section-gap) 2rem',
      borderTop: '1px solid var(--border-color)',
      overflow: 'hidden',
    }}>
      <style>{`
        @media (max-width: 640px) {
          .venn-grid { grid-template-columns: 1fr !important; }
          .venn-svg-wrap { display: none; }
          .venn-mobile-list { display: flex !important; }
        }
      `}</style>

      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>

        {/* Header — lowercase, letter-spaced like the reference */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          color: 'var(--text-primary)',
          letterSpacing: '0.18em',
          fontWeight: 300,
          marginBottom: '3rem',
        }}>
          программа:
        </div>

        <div className="venn-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'center',
        }}>

          {/* ── Left: scattered bubbles ────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            {WILL_BE.map((item, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginLeft: [0, 24, 8, 18, 0, 12][i],
              }}>
                <Shape color={item.color} shape={item.shape} />
                <span style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* ── Right: SVG Venn ────────────────────────────────── */}
          <div className="venn-svg-wrap">
            <svg
              viewBox={`0 0 ${cx2 + r + 20} ${cy * 2 + 20}`}
              width="100%"
              style={{ display: 'block', overflow: 'visible' }}
            >
              <defs>
                <radialGradient id="venn-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor="#00ff88" stopOpacity="0.10" />
                  <stop offset="100%" stopColor="#00aaff" stopOpacity="0.04" />
                </radialGradient>
                <clipPath id="venn-overlap">
                  <circle cx={cx2} cy={cy} r={r} />
                </clipPath>
              </defs>

              {/* Left circle fill */}
              <circle cx={cx1} cy={cy} r={r}
                fill="url(#venn-glow)"
                stroke="none" />

              {/* Overlap fill — slightly more opaque */}
              <circle cx={cx1} cy={cy} r={r}
                fill="rgba(0,255,136,0.06)"
                stroke="none"
                clipPath="url(#venn-overlap)" />

              {/* Left circle border — dashed */}
              <circle cx={cx1} cy={cy} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1.5"
                strokeDasharray="7 5" />

              {/* Right circle — solid border, no fill */}
              <circle cx={cx2} cy={cy} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1.5" />

              {/* Label: "то, что будет" — at overlap center */}
              <text x={overlapCx} y={cy - 8}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="rgba(255,255,255,0.9)"
                fontFamily="var(--font-mono)">
                то, что
              </text>
              <text x={overlapCx} y={cy + 8}
                textAnchor="middle"
                fontSize="10.5"
                fontWeight="700"
                fill="rgba(255,255,255,0.9)"
                fontFamily="var(--font-mono)">
                будет
              </text>

              {/* Label: "то, чего не будет" — right circle, non-overlap half */}
              <text x={rightTextX} y={cy - 22}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="rgba(255,255,255,0.7)"
                fontFamily="var(--font-mono)">
                то, чего
              </text>
              <text x={rightTextX} y={cy - 8}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="rgba(255,255,255,0.7)"
                fontFamily="var(--font-mono)">
                не будет
              </text>
              <text x={rightTextX} y={cy + 6}
                textAnchor="middle"
                fontSize="9.5"
                fontWeight="600"
                fill="rgba(255,255,255,0.7)"
                fontFamily="var(--font-mono)">
                на курсе
              </text>

              {/* WONT_BE list — below label, inside right circle */}
              {WONT_BE.map((item, i) => (
                <text key={i}
                  x={rightTextX}
                  y={cy + 28 + i * 14}
                  textAnchor="middle"
                  fontSize="8"
                  fill="rgba(255,255,255,0.35)"
                  fontFamily="var(--font-mono)">
                  — {item}
                </text>
              ))}

              {/* Provocative text — bottom right, outside circle */}
              <text x={cx2 + r + 10} y={cy * 2 + 10}
                textAnchor="end"
                fontSize="10"
                fill="rgba(255,255,255,0.35)"
                fontFamily="var(--font-mono)"
                fontStyle="italic">
                хуйни не будет. и воды тоже.
              </text>
            </svg>

            {/* Mobile fallback (hidden on desktop via CSS above) */}
            <div className="venn-mobile-list" style={{
              display: 'none',
              flexDirection: 'column',
              gap: '0.5rem',
              marginTop: '1rem',
            }}>
              {WONT_BE.map((item, i) => (
                <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  — {item}
                </div>
              ))}
              <div style={{
                marginTop: '1rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}>
                хуйни не будет. и воды тоже.
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
