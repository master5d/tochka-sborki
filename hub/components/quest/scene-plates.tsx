'use client'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { srcSetOrSrc, type Art } from '../../lib/quest/art'
import { coverRowY, landDrift, pageTopProgress, type Box } from '../../lib/quest/drift'
import { plateGeometry, widePlates, type PlateGeometry, type WidePlates } from '../../lib/quest/plates'
import type { SceneId, SceneState } from '../../lib/quest/scenes'
import { clampProgress } from './use-chapter-progress'
import { useParallaxFrame, useReducedMotion } from './use-parallax'

/** Where the landscape (2K) plates take over from the tall ones — same edge as quest.css's hero/finale rules. */
const WIDE_MEDIA = '(min-width: 901px)'

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
 *
 * 2K world: on desktop the plates are the landscape pair (a different frame,
 * seam row and object-position), so the geometry follows whichever variant the
 * `<picture>` is showing — keyed on the same media query as its `<source>`.
 */
function usePlateDrift(tall: PlateGeometry, wide: WidePlates | null, progressMode: 'viewport' | 'page-top') {
  const containerRef = useRef<HTMLDivElement>(null)
  const landImgRef = useRef<HTMLImageElement>(null)
  const posY = useRef<{ variant: string; y: number } | null>(null)
  const wideMq = useRef<MediaQueryList | null>(null)
  const reducedMotion = useReducedMotion()
  useParallaxFrame(() => {
    const el = containerRef.current
    const land = landImgRef.current
    if (!el || !land) return
    if (!wideMq.current) wideMq.current = window.matchMedia(WIDE_MEDIA)
    const useWide = !!wide && wideMq.current.matches
    const variant = useWide ? 'wide' : 'tall'
    const geo: { row: number; natural: Box } = useWide && wide
      ? { row: wide.horizonRow, natural: { w: wide.width, h: wide.height } }
      : { row: tall.horizonRow, natural: { w: tall.width, h: tall.height } }
    if (!posY.current || posY.current.variant !== variant) {
      const m = /(-?[\d.]+)%\s*$/.exec(getComputedStyle(land).objectPosition)
      posY.current = { variant, y: m ? Number(m[1]) / 100 : 0.5 }
    }
    const rect = el.getBoundingClientRect()
    const box = { w: rect.width, h: rect.height }
    const progress = progressMode === 'page-top' ? pageTopProgress(window.scrollY, rect.height) : clampProgress(rect.top, rect.height, window.innerHeight)
    const d = landDrift(progress, box, coverRowY(box, geo.natural, posY.current.y, geo.row))
    land.style.setProperty('--px-land', `${d.translateY}px`)
    land.style.setProperty('--scale-land', `${d.scale}`)
    land.style.setProperty('--origin-land', `${d.originY}px`)
  }, !reducedMotion)
  return { containerRef, landImgRef }
}

interface PlateProps {
  tall: string
  tallNight: string
  wide: Art | null
  wideNight: Art | null
  explicitTheme: boolean
  sizes: string
  width: number
  height: number
  eager: boolean
  imgRef?: RefObject<HTMLImageElement | null>
}

/**
 * One plate as an art-directed `<picture>`: the landscape 2K pair on desktop (a
 * `min-width` source, with its own night twin for the no-JS system-dark case),
 * the tall plate below that width. Sources are tried in order, so the first
 * match wins and exactly one file is fetched. An explicit theme choice drops both
 * dark-media sources (as everywhere else) and the src/srcset follow the state.
 */
function PlatePicture({ tall, tallNight, wide, wideNight, explicitTheme, sizes, width, height, eager, imgRef }: PlateProps) {
  return (
    <picture>
      {wideNight && !explicitTheme ? <source media={`${WIDE_MEDIA} and (prefers-color-scheme: dark)`} srcSet={srcSetOrSrc(wideNight)} sizes={sizes} /> : null}
      {wide ? <source media={WIDE_MEDIA} srcSet={srcSetOrSrc(wide)} sizes={sizes} /> : null}
      {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={tallNight} />}
      <img ref={imgRef} src={tall} width={width} height={height} alt="" loading={eager ? 'eager' : 'lazy'} />
    </picture>
  )
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
  /** `sizes` for the landscape plates (ART_SIZES.heroWide / .full). */
  wideSizes?: string
  /** `page-top` for the hero: progress = scrollY / height, so the land plate rests UNzoomed at the top of the page (the viewport-relative rule starts the hero ~50% through, and its 5% zoom pushed the Builder out of the frame — quest-framing.mjs). */
  progress?: 'viewport' | 'page-top'
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
 * composited image twice. 2K world: 01-map and 06-wall also carry a landscape
 * pair (`widePlates`) served on desktop — see PlatePicture.
 */
export function ScenePlates({ id, state, locale, alt, width, height, explicitTheme, eager = false, wideSizes = '100vw', progress = 'viewport' }: Props) {
  const geo = plateGeometry(id, state)
  const nightGeo = plateGeometry(id, 'night')
  const wide = widePlates(id, state)
  const wideNight = widePlates(id, 'night')
  const fallback: PlateGeometry = geo ?? { horizonRow: 0, feather: 0, width, height, sky: '', land: '' }
  const { containerRef, landImgRef } = usePlateDrift(fallback, wide, progress)
  // The wrapper exposes which frame the picture is showing (tests, the pixel guard).
  const [variant, setVariant] = useState<'tall' | 'wide'>('tall')
  useEffect(() => {
    if (!wide) return
    const mq = window.matchMedia(WIDE_MEDIA)
    const apply = () => setVariant(mq.matches ? 'wide' : 'tall')
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [wide])
  if (!geo || !nightGeo) return null // caller checks isSplitScene first; this is a same-answer guard
  return (
    <div
      className="quest-scene__plates"
      ref={containerRef}
      role="img"
      aria-label={alt}
      data-locale={locale}
      data-horizon-row={variant === 'wide' && wide ? wide.horizonRow : geo.horizonRow}
      data-feather={variant === 'wide' && wide ? wide.feather : geo.feather}
      data-frame={variant}
    >
      <div className="quest-scene__plate quest-scene__plate--land">
        <PlatePicture
          tall={geo.land}
          tallNight={nightGeo.land}
          wide={wide?.land ?? null}
          wideNight={wideNight?.land ?? null}
          explicitTheme={explicitTheme}
          sizes={wideSizes}
          width={width}
          height={height}
          eager={eager}
          imgRef={landImgRef}
        />
      </div>
      <div className="quest-scene__plate quest-scene__plate--sky">
        <PlatePicture
          tall={geo.sky}
          tallNight={nightGeo.sky}
          wide={wide?.sky ?? null}
          wideNight={wideNight?.sky ?? null}
          explicitTheme={explicitTheme}
          sizes={wideSizes}
          width={width}
          height={height}
          eager={eager}
        />
      </div>
    </div>
  )
}
