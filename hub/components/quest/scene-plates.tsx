'use client'
import { useRef } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { coverRowY, landDrift, type Box } from '../../lib/quest/drift'
import { plateGeometry } from '../../lib/quest/plates'
import type { SceneId, SceneState } from '../../lib/quest/scenes'
import { clampProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/**
 * Wave K: the land plane's own upward drift across the chapter, relative to
 * the sky plane, which never moves. The split script's alpha measurement (see
 * plates/manifest.json's `feather`) showed sky fully OPAQUE through
 * `horizon_row` and fully TRANSPARENT from `horizon_row + feather` on — land is
 * the mirror. Moving land UP only pulls MORE of its own opaque interior into
 * that seam band, so it can only grow the overlap the manifest guarantees at
 * rest, never shrink it. Never move land down.
 *
 * Pixel-audit fix (2026-09-12): the room for the rise used to come from
 * `scale(1, y)` — a vertical stretch of the plate up to 1.15×. Now it is ONE
 * scale for both axes about the seam line (`landDrift` in lib/quest/drift.ts):
 * the seam row stays put (then rises with the translate), fresh land grows
 * below it, and the zoom's growth under the seam always covers the rise. The
 * seam's box-space y comes from the manifest's `horizon_row` mapped through the
 * plate's own `object-fit: cover` and `object-position` (`coverRowY`), read once
 * per size. `prefers-reduced-motion`/no-JS leave every CSS var unset —
 * identity — so the two stills still reproduce the split's recompose exactly.
 */
function usePlateDrift(horizonRow: number, natural: Box) {
  const containerRef = useRef<HTMLDivElement>(null)
  const landImgRef = useRef<HTMLImageElement>(null)
  const posYRef = useRef<number | null>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const el = containerRef.current
    const land = landImgRef.current
    if (!el || !land) return
    if (posYRef.current === null) {
      const m = /(-?[\d.]+)%\s*$/.exec(getComputedStyle(land).objectPosition)
      posYRef.current = m ? Number(m[1]) / 100 : 0.5
    }
    const rect = el.getBoundingClientRect()
    const box = { w: rect.width, h: rect.height }
    const d = landDrift(clampProgress(rect.top, rect.height, window.innerHeight), box, coverRowY(box, natural, posYRef.current, horizonRow))
    land.style.setProperty('--px-land', `${d.translateY}px`)
    land.style.setProperty('--scale-land', `${d.scale}`)
    land.style.setProperty('--origin-land', `${d.originY}px`)
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
  const { containerRef, landImgRef } = usePlateDrift(geo?.horizonRow ?? 0, { w: geo?.width ?? width, h: geo?.height ?? height })
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
