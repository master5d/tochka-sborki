'use client'

import { useEffect, useState } from 'react'
import {
  prepareWithSegments,
  measureLineStats,
  measureNaturalWidth,
} from '@chenglou/pretext'

export type Measurement = {
  ready: boolean
  naturalWidth: number     // width on a single line (no wrap)
  shrunkWidth: number      // tightest width given maxWidth wrap
  lineCount: number
  lineHeight: number
}

/**
 * Measure text via Pretext. SSR-safe (returns {ready:false} until effect runs).
 * font is a canvas font spec, e.g. "14px 'Geist Mono', monospace".
 */
export function useTextMeasurement(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight = 1.5,
): Measurement {
  const [m, setM] = useState<Measurement>({
    ready: false,
    naturalWidth: 0,
    shrunkWidth: maxWidth,
    lineCount: 1,
    lineHeight: 0,
  })

  useEffect(() => {
    let cancelled = false

    const measure = () => {
      try {
        const prepared = prepareWithSegments(text, font)
        const fontSizeMatch = font.match(/(\d+(?:\.\d+)?)px/)
        const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 16
        const px = fontSize * lineHeight
        const natural = measureNaturalWidth(prepared)
        const stats = measureLineStats(prepared, maxWidth)
        if (!cancelled) {
          setM({
            ready: true,
            naturalWidth: natural,
            shrunkWidth: stats.maxLineWidth,
            lineCount: stats.lineCount,
            lineHeight: px,
          })
        }
      } catch {
        // Pretext failed (e.g. font not loaded yet) — leave previous state
      }
    }

    // First pass immediately; refire after fonts.ready so measurements are accurate
    measure()
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!cancelled) measure() })
    }

    return () => { cancelled = true }
  }, [text, font, maxWidth, lineHeight])

  return m
}
