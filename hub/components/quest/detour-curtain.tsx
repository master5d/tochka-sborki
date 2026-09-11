'use client'
import { useEffect, useRef } from 'react'
import { DETOUR_SCENE_SIZE, detourScene, type ForkId } from '../../lib/quest/scenes'
import { ThemedPicture } from './themed-picture'
import { clampProgress, pinProgress, wipeReveal } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/** Same breakpoint as `.quest-stage__media { position: sticky }` in quest.css. */
const PINNED_MQ = '(min-width: 900px)'

/**
 * L3: the reference's curtain — inside a fork's scene the habit road's world is
 * wiped away right-to-left by the detour's world (`detourScene`, shot from the
 * same camera and horizon, so the frame holds still while its world changes).
 * Rendered as a child of SceneLoop: it shares the scene's box, `object-fit` and
 * `--pan`, and sits over the poster and the loop video (z-index in quest.css).
 *
 * Progress source: where the scene is pinned (≥900px, sticky stage) the curtain
 * follows the pin's own travel (`pinProgress`) and completes at 60% of it, so
 * the detour's world then holds still on screen before the pin releases. Where it is not pinned (the stacked mobile
 * column, and #gates' inline panel at every width) it follows the scene's own
 * box instead — a stage-wide window would sweep while the image is off screen.
 * One shared rAF (useParallaxFrame), a CSS variable, no re-render.
 *
 * `prefers-reduced-motion: reduce`: not rendered — the habit world stays, and
 * the detour's world is still shown, still, in the outcomes band below.
 */
export function DetourCurtain({ forkId }: { forkId: ForkId }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const pinnedRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia(PINNED_MQ)
    const apply = () => { pinnedRef.current = mq.matches }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useParallaxFrame(() => {
    const el = ref.current
    if (!el) return
    const stage = pinnedRef.current ? el.closest<HTMLElement>('.quest-stage') : null
    const media = stage ? el.closest<HTMLElement>('.quest-stage__media') : null
    let reveal: number
    if (stage && media) {
      const s = stage.getBoundingClientRect()
      const m = media.getBoundingClientRect()
      reveal = wipeReveal(pinProgress(m.top - s.top, s.height - m.height), 0.25, 0.6)
    } else {
      const r = (el.parentElement ?? el).getBoundingClientRect()
      reveal = wipeReveal(clampProgress(r.top, r.height, window.innerHeight), 0.35, 0.65)
    }
    el.style.setProperty('--wipe-left', `${((1 - reveal) * 100).toFixed(2)}%`)
  }, !reducedMotion)

  if (reducedMotion) return null
  return (
    <div ref={ref} className="quest-curtain" aria-hidden="true">
      <ThemedPicture
        day={detourScene(forkId, 'day')}
        night={detourScene(forkId, 'night')}
        width={DETOUR_SCENE_SIZE.width}
        height={DETOUR_SCENE_SIZE.height}
        alt=""
      />
    </div>
  )
}
