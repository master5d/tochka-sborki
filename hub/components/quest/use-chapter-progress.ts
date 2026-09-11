'use client'
import { useEffect, useState, type RefObject } from 'react'

/**
 * 0 before the chapter enters the frame (its top is still at/below the bottom of
 * the viewport), 1 once it has fully left (its bottom has crossed the top of the
 * viewport), monotonic in between. `top` is the chapter's `getBoundingClientRect().top`.
 */
export function clampProgress(top: number, height: number, viewport: number): number {
  if (viewport <= 0) return 0
  const total = height + viewport
  if (total <= 0) return 0
  const raw = (viewport - top) / total
  return Math.min(1, Math.max(0, raw))
}

/** Maps 0…1 progress to a CSS percentage string, rounded to avoid float noise. */
export function panOffset(progress: number): string {
  const clamped = Math.min(1, Math.max(0, progress))
  return `${Math.round(clamped * 10000) / 100}%`
}

/**
 * Wave J1: the sticky stage's own internal pan used to equal scroll progress
 * 1:1 — everything on screen moved at the same rate, which is what reads as
 * FLAT rather than deep. This makes the pan lag the reader's scroll at `rate`
 * (default 0.6, per the reference measurement) for most of the chapter, then
 * catch up over the final `1 - catchupAt` of the transit so the endpoints
 * still hold exactly: `lagPan(0) === 0` and `lagPan(1) === 1` — the full frame
 * is still traversed from the chapter's start to its end, only the SHAPE of
 * how it gets there changes (a slow lag, then a brief catch-up), never the
 * guarantee that it completes.
 */
export function lagPan(progress: number, rate = 0.6, catchupAt = 0.85): number {
  const p = Math.min(1, Math.max(0, progress))
  const lagEnd = catchupAt * rate
  if (p <= catchupAt) return p * rate
  const remaining = 1 - catchupAt
  if (remaining <= 0) return 1
  return lagEnd + ((p - catchupAt) / remaining) * (1 - lagEnd)
}

/**
 * `#intro`'s pan through its pinned camp. On desktop the landscape frame
 * (`campWide`, 1264×848) is cover-fit, so only a thin vertical margin is
 * cropped (~13% of its height at 1440×848, ~26% at 1920×1000); 0.65→1 keeps
 * both characters (rows ~0.46–0.9 of the art) whole at every width while the
 * world still drifts with the chapter. The same range holds for the portrait
 * scene in a portrait tablet box; a phone's box crops only the sides, so the
 * pan is moot there. (Retires audit4's temporary 0.76–0.84 band.)
 */
export function backdropPan(progress: number, from = 0.65, to = 1): number {
  const p = Math.min(1, Math.max(0, progress))
  return from + (to - from) * p
}

/**
 * L3: 0…1 through the span a sticky child stays pinned inside its stage —
 * `offset` is the child's top minus the stage's top (0 at pin start, grows
 * while pinned), `travel` is stage height minus child height (the offset at
 * release). Unlike `clampProgress` it ignores the entry/exit screens, so a
 * window on it always lands while the child is actually on screen and still.
 */
export function pinProgress(offset: number, travel: number): number {
  if (travel <= 0) return 0
  return Math.min(1, Math.max(0, offset / travel))
}

/**
 * L3: how far the detour's world has been drawn over the habit world, 0…1,
 * from scroll progress. 0 until `start`, 1 from `end` on, linear between — the
 * curtain (detour-curtain.tsx) turns it into `clip-path: inset(0 0 0 X%)`, so
 * the new world enters from the right edge and sweeps left.
 */
export function wipeReveal(progress: number, start = 0.4, end = 0.7): number {
  if (progress >= end) return 1
  if (progress <= start) return 0
  return (progress - start) / (end - start)
}

/**
 * Wave M: a fork's road scene is pinned full-bleed for the whole chapter and
 * three panels (setup, habit road, detour) travel over it. The art is portrait
 * in a landscape frame, so only ~40% of its height is on screen — the pan
 * "looks at" each panel's subject in turn: `stops` are object-position
 * fractions spaced evenly over pin progress, linear between neighbours. It may
 * turn back (the detour's figure can sit higher than the habit road's).
 * Empty stops → centred (0.5), one stop → held.
 */
export function keyframePan(progress: number, stops: readonly number[]): number {
  if (stops.length === 0) return 0.5
  if (stops.length === 1) return stops[0]
  const p = Math.min(1, Math.max(0, progress)) * (stops.length - 1)
  const i = Math.min(stops.length - 2, Math.floor(p))
  return stops[i] + (stops[i + 1] - stops[i]) * (p - i)
}

/**
 * Wave M: the curtain inside a road scene follows the DETOUR panel into view —
 * 0 while its top is below `start` of the viewport, 1 once it has climbed to
 * `end`, linear between. The world changes exactly while the reader starts
 * reading about the other road, and then holds still under that text.
 */
export function panelReveal(panelTop: number, viewport: number, start = 0.9, end = 0.35): number {
  if (viewport <= 0) return 0
  return wipeReveal(1 - panelTop / viewport, 1 - start, 1 - end)
}

/** Scroll progress of `ref`'s element through the viewport, 0…1. SSR/no-observer default: 0. */
export function useChapterProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const measure = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      setProgress(clampProgress(rect.top, rect.height, window.innerHeight))
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [ref])
  return progress
}
