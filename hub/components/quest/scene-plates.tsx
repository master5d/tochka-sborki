'use client'
import { useRef } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { plateGeometry } from '../../lib/quest/plates'
import type { SceneId, SceneState } from '../../lib/quest/scenes'
import { clampProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/**
 * Wave K: the land plane's own upward drift across the chapter, relative to
 * the sky plane, which never moves. The split script's own alpha measurement
 * (see plates/manifest.json's `feather`) showed sky is fully OPAQUE through
 * `horizon_row` and fully TRANSPARENT from `horizon_row + feather` on — land
 * is the exact mirror. Moving land UP (`--px-land` always <= 0, toward the
 * sky) only ever pulls MORE of land's own opaque interior into that seam band
 * — it can only grow the overlap the manifest already guarantees at rest,
 * never shrink it below zero. Moving land DOWN would do the opposite (shrink
 * the overlap toward zero and past it) — never do that here.
 *
 * `LAND_DRIFT_TARGET` sits inside the brief's 40-70px band and is what a
 * measurement of the land plate's own TOP edge should show, start to end of
 * the chapter — which is exactly why the CSS uses `transform-origin: top`
 * (see themes/quest.css): land only ever moves UP, which only ever needs
 * fresh content at the plate's BOTTOM, never its top. Scaling about the
 * default centre origin would have grown the box upward too, on top of the
 * translate, inflating the top edge's own measured displacement well past
 * the target (measured directly: it did, ~150px instead of ~55px, before
 * this was caught) — `transform-origin: top` pins the top edge exactly to
 * the translate value and puts 100% of the surplus at the bottom, where it's
 * actually needed. `LAND_SCALE_Y` is the land plate's own image vertical
 * surplus AT THE END of the chapter (same oversize-and-clip trick as
 * `useHeroDrift`/`GatesRoads` in quest-home.tsx), so translating it never
 * exposes the plate's own bottom edge — but unlike those, the scale here
 * RAMPS WITH PROGRESS (identity at progress 0, `LAND_SCALE_Y` at progress 1)
 * rather than sitting at a constant stretch: `prefers-reduced-motion`/no-JS
 * leave both `--px-land` and `--scale-land` at their unset CSS defaults (0px
 * / 1, i.e. no-op), and the brief requires that state to reproduce the split
 * script's own recompose (byte-exact original still) — a CONSTANT scale
 * would have stretched the land plate even at rest. `amplitude` is capped at
 * 85% of the (bottom-only) surplus available AT THAT PROGRESS (both ramp
 * together, linearly, from 0), same margin `useHeroDrift` uses, so a very
 * short/narrow render of the scene shrinks the drift instead of ever
 * exposing an edge, at every progress value, not just at the end.
 */
const LAND_DRIFT_TARGET = 55
const LAND_SCALE_Y = 1.15

function usePlateDrift() {
  const containerRef = useRef<HTMLDivElement>(null)
  const landImgRef = useRef<HTMLImageElement>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const el = containerRef.current
    const land = landImgRef.current
    if (!el || !land) return
    const rect = el.getBoundingClientRect()
    // transform-origin: top means ALL the surplus from scaling lands at the
    // bottom (no /2 split with the top, unlike the centre-origin hero drift).
    const fullBottomSurplus = rect.height * (LAND_SCALE_Y - 1)
    const amplitude = Math.min(LAND_DRIFT_TARGET, fullBottomSurplus * 0.85)
    const progress = clampProgress(rect.top, rect.height, window.innerHeight)
    const scale = 1 + progress * (LAND_SCALE_Y - 1)
    land.style.setProperty('--px-land', `${-progress * amplitude}px`)
    land.style.setProperty('--scale-land', `${scale}`)
  }, !reducedMotion)
  return { containerRef, landImgRef }
}

interface Props {
  id: SceneId
  state: SceneState
  locale: Locale
  alt: string
  width: number
  height: number
  /** Mirrors `SceneLoop`'s own tracking: once an explicit theme is set, the
   *  night `<source media>` must stop competing with the day/night `src`. */
  explicitTheme: boolean
  eager?: boolean
}

/**
 * Wave K: a split scene's two stacked stills — the sky plate fixed, the land
 * plate drifting up per `usePlateDrift` — positioned by the manifest's own
 * geometry (`plateGeometry`, read from `public/quest/plates/manifest.json`,
 * never retyped into CSS). Day/night follow the reader's theme through the
 * same `<picture>` + media-query mechanism `SceneLoop` uses for the flat
 * scenes. `prefers-reduced-motion` and no-JS both leave `--px-land` at its
 * CSS default (0px, unset) — the two stills then reproduce the original
 * frame exactly, matching the split script's own recompose measurement.
 * `role="img"`/`aria-label` on the wrapper carries the scene's real alt text;
 * the two inner `<img>`s are `alt=""` so assistive tech doesn't announce a
 * composited image twice.
 */
export function ScenePlates({ id, state, locale, alt, width, height, explicitTheme, eager = false }: Props) {
  const geo = plateGeometry(id, state)
  const nightGeo = plateGeometry(id, 'night')
  const { containerRef, landImgRef } = usePlateDrift()
  if (!geo || !nightGeo) return null // caller checks isSplitScene first; this is a same-answer guard
  return (
    <div
      className="quest-scene__plates"
      ref={containerRef}
      role="img"
      aria-label={alt}
      data-locale={locale}
      data-horizon-row={geo.horizonRow}
      data-feather={geo.feather}
    >
      <div className="quest-scene__plate quest-scene__plate--land">
        <picture>
          {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={nightGeo.land} />}
          <img ref={landImgRef} src={geo.land} width={width} height={height} alt="" loading={eager ? 'eager' : 'lazy'} />
        </picture>
      </div>
      <div className="quest-scene__plate quest-scene__plate--sky">
        <picture>
          {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={nightGeo.sky} />}
          <img src={geo.sky} width={width} height={height} alt="" loading={eager ? 'eager' : 'lazy'} />
        </picture>
      </div>
    </div>
  )
}
