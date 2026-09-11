'use client'
import { useRef } from 'react'
import { DETOUR_SCENE_SIZE, detourScene, type ForkId } from '../../lib/quest/scenes'
import { ThemedPicture } from './themed-picture'
import { clampProgress, panelReveal, wipeReveal } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/**
 * L3: the reference's curtain — inside a fork's scene the habit road's world is
 * wiped away right-to-left by the detour's world (`detourScene`, shot from the
 * same camera and horizon, so the frame holds still while its world changes).
 * Rendered as a child of SceneLoop: it shares the scene's box, `object-fit` and
 * `--pan`, and sits over the poster and the loop video (z-index in quest.css).
 *
 * Progress source (Wave M): inside a road scene (road-scene.tsx) the curtain
 * follows the detour card — the panel marked `data-curtain-trigger` — into
 * view (`panelReveal`), at every width: the world changes while the reader
 * starts on the other road, then holds under that text. Anywhere else it
 * falls back to the scene's own box crossing the viewport.
 * One shared rAF (useParallaxFrame), a CSS variable, no re-render.
 *
 * `prefers-reduced-motion: reduce`: not rendered — the habit world stays, and
 * the detour's world is still shown, still, in the outcomes band below.
 */
export function DetourCurtain({ forkId }: { forkId: ForkId }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useParallaxFrame(() => {
    const el = ref.current
    if (!el) return
    const trigger = el.closest('.quest-backdrop')?.querySelector<HTMLElement>('[data-curtain-trigger]')
    let reveal: number
    if (trigger) {
      reveal = panelReveal(trigger.getBoundingClientRect().top, window.innerHeight)
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
        eager
      />
    </div>
  )
}
