'use client'
import { nodePositions, snakePath } from '@/lib/rpg/map-layout'
import type { ZoneVM } from '@/lib/rpg/types'

const VB = 100
const COLS = 3

export function WorldMap({ zones, accent, glyph }: { zones: ZoneVM[]; accent: string; glyph: string }) {
  const pts = nodePositions(zones.length, VB, VB, COLS)
  const path = snakePath(pts)
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        @keyframes wm-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .wm-cur { animation: wm-pulse 1.8s infinite; }
        @media (prefers-reduced-motion: reduce){ .wm-cur{ animation:none } }
      `}</style>
      <svg viewBox={`0 0 ${VB} ${VB}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="World map">
        <path d={path} fill="none" stroke="var(--border-color)" strokeWidth={1.2} strokeDasharray="2 2" />
        {zones.map((z, i) => {
          const p = pts[i]
          const done = z.status === 'completed', cur = z.status === 'current'
          const fill = (done || cur) ? accent : 'var(--bg-surface)'
          const opacity = z.status === 'todo' ? 0.5 : 1
          return (
            <g key={z.slug} className={cur ? 'wm-cur' : undefined} opacity={opacity}
               style={{ cursor: 'pointer' }} onClick={() => {
                 document.getElementById(`quest-${z.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
               }}>
              <circle cx={p.x} cy={p.y} r={6} fill={fill}
                      stroke={accent} strokeWidth={cur ? 1.5 : done ? 1 : 0.6} />
              <text x={p.x} y={p.y + 2.2} textAnchor="middle" fontSize={5}>{glyph}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
