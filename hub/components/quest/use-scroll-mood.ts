'use client'
import { useEffect, useRef, useState } from 'react'

/** Sustained scroll speed (px/s) above which the Scroller notices the reader. */
export const SCROLL_MOOD_FIRE_SPEED = 1500
/** Speed must drop below this before a chapter change can re-arm the remark. */
export const SCROLL_MOOD_REARM_SPEED = 300
/** How long the speed must stay above the fire threshold before it counts as
 *  "sustained" rather than a single flick. */
export const SCROLL_MOOD_SUSTAIN_MS = 200
/** How long the remark stays on screen once it fires. */
export const SCROLL_MOOD_VISIBLE_MS = 5000

export interface ScrollMoodState {
  /** Can this state fire again? Goes false on fire, true again once the speed
   *  has dropped AND the reader has entered a different chapter. */
  armed: boolean
  /** Timestamp the speed first crossed the fire threshold, reset on any drop
   *  below it — used to measure "sustained", not just "instantaneous". */
  hotSince: number | null
  /** Chapter the remark last fired in (or null before the first fire). */
  chapterId: string | null
}

export interface ScrollMoodSample {
  speed: number
  chapterId: string
  now: number
}

export function initScrollMoodState(): ScrollMoodState {
  return { armed: true, hotSince: null, chapterId: null }
}

/**
 * One pure step of the hysteresis. A brief spike never fires (it drops back
 * below the fire threshold before SUSTAIN_MS elapses, so `hotSince` resets).
 * Sustained fast scrolling fires exactly once, then disarms. Disarmed state
 * re-arms only once BOTH conditions hold: speed has fallen under the (lower)
 * re-arm threshold, AND the reader is in a different chapter than the one the
 * remark last fired in — so leaving and re-entering the same chapter fast
 * doesn't retrigger every frame, but a new chapter can.
 */
export function evaluateScrollMood(
  state: ScrollMoodState,
  sample: ScrollMoodSample,
): { state: ScrollMoodState; fire: boolean } {
  const { speed, chapterId, now } = sample
  let armed = state.armed
  if (!armed && speed < SCROLL_MOOD_REARM_SPEED && chapterId !== state.chapterId) {
    armed = true
  }
  if (speed < SCROLL_MOOD_FIRE_SPEED) {
    return { state: { ...state, armed, hotSince: null }, fire: false }
  }
  const hotSince = state.hotSince ?? now
  const sustained = now - hotSince >= SCROLL_MOOD_SUSTAIN_MS
  if (sustained && armed) {
    return { state: { armed: false, hotSince, chapterId }, fire: true }
  }
  return { state: { ...state, armed, hotSince }, fire: false }
}

function useReducedMotion(): boolean {
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

/** Current chapter: the `.hub-section[id]` most visible in the viewport. */
function useCurrentChapterId(): string | null {
  const [chapterId, setChapterId] = useState<string | null>(null)
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const sections = Array.from(document.querySelectorAll<HTMLElement>('.hub-section[id]'))
    const ratios = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).id
          ratios.set(id, e.isIntersecting ? e.intersectionRatio : 0)
        }
        let bestId: string | null = null
        let best = 0
        for (const [id, ratio] of ratios) if (ratio > best) { best = ratio; bestId = id }
        if (bestId) setChapterId(bestId)
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])
  return chapterId
}

/**
 * Measures scroll speed via `requestAnimationFrame` and reports whether the
 * Scroller's remark should show right now. Disabled entirely under
 * `prefers-reduced-motion: reduce` (returns `showQuip: false` always, and never
 * starts the rAF loop). `chapterId` is exposed so the caller can render the
 * remark "near the current scene" (the chapter it belongs to).
 */
export function useScrollMood(): { chapterId: string | null; showQuip: boolean } {
  const reducedMotion = useReducedMotion()
  const chapterId = useCurrentChapterId()
  const [showQuip, setShowQuip] = useState(false)
  const stateRef = useRef<ScrollMoodState>(initScrollMoodState())
  const lastRef = useRef<{ y: number; t: number } | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (reducedMotion || !chapterId) return
    let raf = 0
    const tick = (now: number) => {
      const y = window.scrollY
      const last = lastRef.current
      lastRef.current = { y, t: now }
      if (last) {
        const dt = now - last.t
        const speed = dt > 0 ? (Math.abs(y - last.y) / dt) * 1000 : 0
        const { state, fire } = evaluateScrollMood(stateRef.current, { speed, chapterId, now })
        stateRef.current = state
        if (fire) {
          setShowQuip(true)
          clearTimeout(hideTimerRef.current)
          hideTimerRef.current = setTimeout(() => setShowQuip(false), SCROLL_MOOD_VISIBLE_MS)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hideTimerRef.current)
    }
  }, [reducedMotion, chapterId])

  return { chapterId: reducedMotion ? null : chapterId, showQuip: reducedMotion ? false : showQuip }
}
