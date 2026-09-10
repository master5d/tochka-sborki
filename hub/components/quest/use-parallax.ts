'use client'
import { useEffect, useRef, useState } from 'react'

type Frame = () => void

// Wave J1: every parallax layer on the page shares this ONE module-level
// registry — one `scroll`/`resize` listener, one `requestAnimationFrame`
// loop, no matter how many layers register via `useParallaxFrame` below.
// Adding a fourth or fifth layer costs one more Set entry and one more
// `getBoundingClientRect()` inside the shared tick, never another listener.
const frames = new Set<Frame>()
let rafId = 0
let bound = false

function runFrames() {
  rafId = 0
  frames.forEach((fn) => fn())
}

function schedule() {
  if (rafId) return
  rafId = requestAnimationFrame(runFrames)
}

function ensureListening() {
  if (bound || typeof window === 'undefined') return
  bound = true
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
}

/**
 * Registers `frame` into the shared scroll/rAF loop above. `frame` is expected
 * to read whatever DOM rects it needs (via refs closed over by the caller) and
 * write CSS custom properties directly onto the element(s) it holds — never
 * React state, so a parallax tick never triggers a re-render. Runs once on
 * mount (so the layer has a correct position before the reader's first scroll)
 * and again on every scroll/resize while `enabled` is true. Pass
 * `enabled = false` (the caller's own `prefers-reduced-motion` check, or a
 * feature flag like "this chapter has no medallions") to never register at
 * all — the CSS custom property then stays at its unset default and nothing
 * moves, satisfying "reduced motion disables ALL of it".
 */
export function useParallaxFrame(frame: () => void, enabled: boolean): void {
  const frameRef = useRef(frame)
  frameRef.current = frame
  useEffect(() => {
    if (!enabled) return
    const tick: Frame = () => frameRef.current()
    frames.add(tick)
    ensureListening()
    tick()
    return () => {
      frames.delete(tick)
    }
  }, [enabled])
}

/** Shared `prefers-reduced-motion: reduce` flag for the new Wave J1 layers. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}
