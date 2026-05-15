'use client'

import { useEffect, useRef, useState } from 'react'
import { prepareWithSegments } from '@chenglou/pretext'

const COLS = 78
const ROWS = 18
const FONT_SIZE_PX = 12
const LINE_HEIGHT_PX = 13
const TARGET_ROW_W = 720
const CHARSET =
  ' .,:;!+-=*#@%&/\\|()[]{}<>$~^abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' +
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ'
const WEIGHTS = [300, 500, 800] as const
const STYLES = ['normal', 'italic'] as const

type PaletteEntry = {
  char: string
  width: number
  brightness: number
  className: string
}

function escapeHtml(ch: string): string {
  if (ch === '<') return '&lt;'
  if (ch === '>') return '&gt;'
  if (ch === '&') return '&amp;'
  if (ch === '"') return '&quot;'
  return ch
}

export function HeroAscii() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    let cancelled = false

    const build = async () => {
      // Wait for fonts so canvas measureText is accurate
      try { await document.fonts.ready } catch {}

      const propFamily = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-geist-sans').trim() || 'sans-serif'

      // ── 1. brightness estimator on a hidden canvas ────────────
      const bCanvas = document.createElement('canvas')
      bCanvas.width = 28
      bCanvas.height = 28
      const bCtx = bCanvas.getContext('2d', { willReadFrequently: true })
      if (!bCtx) return

      function estimateBrightness(ch: string, font: string): number {
        if (!bCtx) return 0
        const size = 28
        bCtx.clearRect(0, 0, size, size)
        bCtx.font = font
        bCtx.fillStyle = '#fff'
        bCtx.textBaseline = 'middle'
        bCtx.fillText(ch, 1, size / 2)
        const data = bCtx.getImageData(0, 0, size, size).data
        let sum = 0
        for (let i = 3; i < data.length; i += 4) sum += data[i]!
        return sum / (255 * size * size)
      }

      function measureWidth(ch: string, font: string): number {
        const prepared = prepareWithSegments(ch, font)
        return prepared.widths.length > 0 ? (prepared.widths[0] as number) : 0
      }

      // ── 2. build palette ─────────────────────────────────────
      const palette: PaletteEntry[] = []
      for (const style of STYLES) {
        for (const weight of WEIGHTS) {
          const font = `${style === 'italic' ? 'italic ' : ''}${weight} ${FONT_SIZE_PX}px ${propFamily}`
          for (const ch of CHARSET) {
            if (ch === ' ') continue
            const width = measureWidth(ch, font)
            if (width <= 0) continue
            const brightness = estimateBrightness(ch, font)
            const className =
              `pa-w${weight}${style === 'italic' ? ' pa-it' : ''}`
            palette.push({ char: ch, width, brightness, className })
          }
        }
      }
      if (cancelled) return

      const maxB = Math.max(...palette.map(e => e.brightness))
      if (maxB > 0) palette.forEach(e => { e.brightness /= maxB })
      palette.sort((a, b) => a.brightness - b.brightness)
      const targetCellW = TARGET_ROW_W / COLS

      function findBest(t: number): PaletteEntry {
        let lo = 0, hi = palette.length - 1
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if ((palette[mid] as PaletteEntry).brightness < t) lo = mid + 1
          else hi = mid
        }
        let bestScore = Infinity
        let best = palette[lo] as PaletteEntry
        const start = Math.max(0, lo - 12)
        const end = Math.min(palette.length, lo + 12)
        for (let i = start; i < end; i++) {
          const e = palette[i] as PaletteEntry
          const bErr = Math.abs(e.brightness - t) * 2.5
          const wErr = Math.abs(e.width - targetCellW) / targetCellW
          const score = bErr + wErr
          if (score < bestScore) { bestScore = score; best = e }
        }
        return best
      }

      // ── 3. source mask: render «ТОЧКА / СБОРКИ» ─────────────
      const SOURCE_W = 720
      const SOURCE_H = Math.round(SOURCE_W * (ROWS * LINE_HEIGHT_PX) / TARGET_ROW_W)
      const sCanvas = document.createElement('canvas')
      sCanvas.width = SOURCE_W
      sCanvas.height = SOURCE_H
      const sCtx = sCanvas.getContext('2d', { willReadFrequently: true })
      if (!sCtx) return

      sCtx.fillStyle = '#000'
      sCtx.fillRect(0, 0, SOURCE_W, SOURCE_H)
      sCtx.fillStyle = '#fff'
      sCtx.textBaseline = 'middle'
      sCtx.textAlign = 'center'
      const lineH = SOURCE_H / 2
      const fontPx = Math.round(lineH * 1.05)
      sCtx.font = `900 ${fontPx}px ${propFamily}`
      sCtx.fillText('ТОЧКА', SOURCE_W / 2, lineH * 0.5)
      sCtx.fillText('СБОРКИ', SOURCE_W / 2, lineH * 1.5)

      // ── 4. sample grid → pick char per cell ────────────────
      const cellW = SOURCE_W / COLS
      const cellH = SOURCE_H / ROWS
      const html: string[] = []
      for (let row = 0; row < ROWS; row++) {
        let rowHtml = ''
        for (let col = 0; col < COLS; col++) {
          const x = Math.floor(col * cellW)
          const y = Math.floor(row * cellH)
          const w = Math.max(1, Math.ceil(cellW))
          const h = Math.max(1, Math.ceil(cellH))
          const data = sCtx.getImageData(x, y, w, h).data
          let sum = 0
          const pxCount = data.length / 4
          for (let i = 0; i < data.length; i += 4) sum += data[i]!
          const brightness = sum / (pxCount * 255)

          if (brightness < 0.04) {
            rowHtml += '<span class="pa-bg">·</span>'
            continue
          }
          const entry = findBest(brightness)
          const a = Math.max(1, Math.min(10, Math.round(brightness * 10)))
          rowHtml += `<span class="${entry.className} pa-a${a}">${escapeHtml(entry.char)}</span>`
        }
        html.push(`<div class="pa-row">${rowHtml}</div>`)
      }

      if (cancelled || !containerRef.current) return
      containerRef.current.innerHTML = html.join('')
      setReady(true)
    }

    build()
    return () => { cancelled = true }
  }, [])

  return (
    <div
      role="img"
      aria-label="Точка Сборки"
      style={{
        position: 'relative',
        marginBottom: '2rem',
        userSelect: 'none',
      }}
    >
      <style>{`
        .pa-row {
          height: ${LINE_HEIGHT_PX}px;
          line-height: ${LINE_HEIGHT_PX}px;
          font-size: ${FONT_SIZE_PX}px;
          white-space: pre;
          font-family: var(--font-geist-sans), sans-serif;
          letter-spacing: 0;
        }
        .pa-w300 { font-weight: 300; }
        .pa-w500 { font-weight: 500; }
        .pa-w800 { font-weight: 800; }
        .pa-it { font-style: italic; }
        .pa-bg { color: rgba(255,255,255,0.04); }
        .pa-a1  { color: rgba(0,255,136,0.10); }
        .pa-a2  { color: rgba(0,255,136,0.18); }
        .pa-a3  { color: rgba(0,255,136,0.28); }
        .pa-a4  { color: rgba(0,255,136,0.40); }
        .pa-a5  { color: rgba(0,255,136,0.55); }
        .pa-a6  { color: rgba(0,255,136,0.70); }
        .pa-a7  { color: rgba(0,255,136,0.85); }
        .pa-a8  { color: rgba(0,255,136,0.95); }
        .pa-a9  { color: #00ff88; }
        .pa-a10 { color: #00ff88; text-shadow: 0 0 8px rgba(0,255,136,0.6); }
      `}</style>

      {/* SSR fallback / pre-mount placeholder */}
      {!ready && (
        <h1 style={{
          fontSize: 'var(--display-size)',
          fontWeight: 900,
          lineHeight: 0.95,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          margin: 0,
        }}>
          Точка<br />Сборки
        </h1>
      )}

      <div
        ref={containerRef}
        style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 0.7s ease-out',
          minHeight: ready ? 'auto' : 0,
        }}
      />
    </div>
  )
}
