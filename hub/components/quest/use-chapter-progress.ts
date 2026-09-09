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
