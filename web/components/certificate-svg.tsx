'use client'

import { forwardRef } from 'react'
import type { Locale } from '@/lib/dictionaries'

interface Props {
  name: string
  date: string
  locale: Locale
}

const COPY = {
  ru: {
    brand: 'ТОЧКА СБОРКИ',
    certLabel: 'СЕРТИФИКАТ',
    stageBefore: '/ before',
    stageWarmup: '/ warming up',
    stagePrompts: '/ prompts',
    stageAfter: '/ after',
    caption1: 'от одной клавиши —',
    caption2: 'к симфонии агентов',
    footer: '28 юнитов · 7 тем',
    url: 'mamaev.coach/certificate',
  },
  en: {
    brand: 'TOCHKA SBORKI',
    certLabel: 'CERTIFICATE',
    stageBefore: '/ before',
    stageWarmup: '/ warming up',
    stagePrompts: '/ prompts',
    stageAfter: '/ after',
    caption1: 'from a single key —',
    caption2: 'to a symphony of agents',
    footer: '28 units · 7 topics',
    url: 'mamaev.coach/certificate',
  },
}

export const CertificateSVG = forwardRef<SVGSVGElement, Props>(
  function CertificateSVG({ name, date, locale }, ref) {
    const t = COPY[locale]
    const W = 800
    const H = 1000
    const ACCENT = '#00ff88'
    const BG = '#0a0a0f'
    const PRIMARY = '#e8e8f0'
    const MUTED = '#9090a8'
    const BORDER = '#2a2a3a'

    // Piano grid for "AFTER" stage — randomized but deterministic
    const pianoCells: { fill: string; opacity: number }[][] = []
    const seed = name.length || 7
    for (let row = 0; row < 4; row++) {
      const cells = []
      for (let col = 0; col < 12; col++) {
        const v = ((row * 31 + col * 17 + seed * 13) % 100) / 100
        const isAccent = v > 0.55
        cells.push({
          fill: isAccent ? ACCENT : PRIMARY,
          opacity: isAccent ? 0.4 + (v - 0.55) * 1.3 : 0.15 + v * 0.45,
        })
      }
      pianoCells.push(cells)
    }

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', maxWidth: '560px', margin: '0 auto' }}
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@500;900&family=Geist+Mono:wght@400;700&display=swap');
            .brand   { font-family: 'Unbounded', system-ui, sans-serif; font-weight: 900; }
            .display { font-family: 'Unbounded', system-ui, sans-serif; font-weight: 900; }
            .mono    { font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 400; }
            .mono-b  { font-family: 'Geist Mono', ui-monospace, monospace; font-weight: 700; }
          `}</style>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width={W} height={H} fill={BG} />

        {/* Subtle grid */}
        <pattern id="cert-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
        </pattern>
        <rect x="0" y="0" width={W} height={H} fill="url(#cert-grid)" />

        {/* Frame */}
        <rect x="40" y="40" width={W - 80} height={H - 80} fill="none" stroke={BORDER} strokeWidth="1" />
        <rect x="48" y="48" width={W - 96} height={H - 96} fill="none" stroke={ACCENT} strokeWidth="0.5" strokeDasharray="2 4" opacity="0.4" />

        {/* Header */}
        <text x="70" y="100" className="brand" fontSize="22" fill={PRIMARY} letterSpacing="-1">
          ⬡ {t.brand}
        </text>
        <text x={W - 70} y="100" textAnchor="end" className="mono-b" fontSize="11" fill={ACCENT} letterSpacing="3">
          {t.certLabel}
        </text>
        <line x1="70" y1="115" x2={W - 70} y2="115" stroke={BORDER} strokeWidth="1" />

        {/* ── Stage 1: BEFORE ─────────────────────────── */}
        <text x="70" y="170" className="mono" fontSize="10" fill={MUTED} letterSpacing="1.5">
          {t.stageBefore}
        </text>
        <circle cx="400" cy="195" r="14" fill="none" stroke={MUTED} strokeWidth="1.5" />
        <text x="400" y="200" textAnchor="middle" className="mono-b" fontSize="13" fill={MUTED}>?</text>

        {/* ── Stage 2: WARMING UP ─────────────────────── */}
        <text x="70" y="270" className="mono" fontSize="10" fill={MUTED} letterSpacing="1.5">
          {t.stageWarmup}
        </text>
        {[340, 400, 460].map((cx, i) => (
          <circle key={i} cx={cx} cy="295" r="12" fill="none" stroke={PRIMARY} strokeWidth="1.5" opacity={0.4 + i * 0.15} />
        ))}

        {/* ── Stage 3: PROMPTS (Hadouken) ─────────────── */}
        <text x="70" y="370" className="mono" fontSize="10" fill={ACCENT} letterSpacing="1.5">
          {t.stagePrompts}
        </text>
        {[260, 310, 360, 410, 460].map((cx, i) => (
          <circle key={i} cx={cx} cy="395" r="13" fill={i === 4 ? ACCENT : 'none'} stroke={ACCENT} strokeWidth="1.5" opacity={0.4 + i * 0.12} />
        ))}
        <text x="500" y="402" className="mono-b" fontSize="20" fill={ACCENT}>▶</text>
        <g transform="translate(560, 395)">
          {[0, 1, 2, 3].map(i => (
            <line key={i} x1="0" y1="0" x2={20 + i * 15} y2={(i - 1.5) * 8} stroke={ACCENT} strokeWidth="1.2" opacity={0.7 - i * 0.15} />
          ))}
          <circle cx="40" cy="0" r="8" fill={ACCENT} opacity="0.6" />
          <circle cx="40" cy="0" r="14" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.3" />
        </g>

        {/* ── Stage 4: AFTER (piano grid) ─────────────── */}
        <text x="70" y="490" className="mono" fontSize="10" fill={ACCENT} letterSpacing="1.5">
          {t.stageAfter}
        </text>
        <g transform="translate(160, 510)">
          {pianoCells.map((row, ri) =>
            row.map((cell, ci) => (
              <rect
                key={`${ri}-${ci}`}
                x={ci * 40}
                y={ri * 32}
                width="32"
                height="24"
                fill={cell.fill}
                opacity={cell.opacity}
                rx="2"
              />
            ))
          )}
        </g>

        {/* Caption */}
        <text x={W / 2} y="700" textAnchor="middle" className="mono" fontSize="13" fill={MUTED} letterSpacing="0.5">
          {t.caption1}
        </text>
        <text x={W / 2} y="720" textAnchor="middle" className="mono-b" fontSize="13" fill={ACCENT} letterSpacing="0.5">
          {t.caption2}
        </text>

        {/* Divider */}
        <line x1="200" y1="770" x2={W - 200} y2="770" stroke={ACCENT} strokeWidth="1" opacity="0.5" />

        {/* Name */}
        <text x={W / 2} y="830" textAnchor="middle" className="display" fontSize="46" fill={PRIMARY} letterSpacing="-2">
          {name.toUpperCase()}
        </text>

        {/* Date + meta */}
        <text x={W / 2} y="875" textAnchor="middle" className="mono" fontSize="12" fill={MUTED} letterSpacing="2">
          {date} · {t.footer}
        </text>

        {/* Footer URL */}
        <text x={W / 2} y={H - 60} textAnchor="middle" className="mono" fontSize="10" fill={MUTED} letterSpacing="2">
          {t.url}
        </text>

        {/* Corner ticks */}
        <g stroke={ACCENT} strokeWidth="1.5" opacity="0.7">
          {/* top-left */}
          <line x1="40" y1="40" x2="60" y2="40" />
          <line x1="40" y1="40" x2="40" y2="60" />
          {/* top-right */}
          <line x1={W - 60} y1="40" x2={W - 40} y2="40" />
          <line x1={W - 40} y1="40" x2={W - 40} y2="60" />
          {/* bottom-left */}
          <line x1="40" y1={H - 40} x2="60" y2={H - 40} />
          <line x1="40" y1={H - 60} x2="40" y2={H - 40} />
          {/* bottom-right */}
          <line x1={W - 60} y1={H - 40} x2={W - 40} y2={H - 40} />
          <line x1={W - 40} y1={H - 60} x2={W - 40} y2={H - 40} />
        </g>
      </svg>
    )
  }
)
