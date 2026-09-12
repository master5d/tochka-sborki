'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { pickDensity, srcSetOf, srcSetOrSrc } from '../../lib/quest/art'
import { useLoopPlayback } from './use-loop-playback'
import { isSplitScene } from '../../lib/quest/plates'
import { ART_SIZES, SCENES, sceneAssets, type SceneId } from '../../lib/quest/scenes'
import { ScenePlates } from './scene-plates'
import { useThemeState } from './use-theme-state'

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

interface Props {
  id: SceneId
  locale: Locale
  /**
   * Wave F: the Scroller's one-line remark on a fast scroll, shown near this
   * scene while `active` is true. Caller (QuestHome) decides which chapter's
   * scene is "current" and passes the quip only there.
   */
  quip?: string
  /** Absolutely positioned children over the art (plaques). */
  children?: ReactNode
  /** The hero poster may load eagerly; everything else waits for the viewport. */
  eager?: boolean
  /** Extra class appended to the `.quest-scene` wrapper (e.g. the hero backdrop variant). */
  className?: string
  /** `sizes` for a flat scene's poster srcset (ART_SIZES.road inside a road's cover box). */
  sizes?: string
  /** `sizes` for a split scene's landscape plates on desktop (hero / finale). */
  wideSizes?: string
  /** How a split scene's land drift measures progress — see ScenePlates. */
  plateProgress?: 'viewport' | 'page-top'
}

/**
 * Poster via `<picture>` + a media-query `<source>` for the no-JS case; after
 * mount an explicit theme choice (vs. system) overrides it by dropping the
 * source, since a matching media query always wins over an <img src> set from
 * JS. Frame 0 of the poster equals frame 0 of the loop (Wave E, both baked from
 * the same still art).
 *
 * Wave E: the loop plays over the poster as a muted, autoplaying, looping
 * `<video>` whose `src` is set by code (never a static attribute) so day/night
 * switches and reduced-motion both go through the same path. On a state switch
 * the new track is loaded and, once its metadata is ready, seeks to the old
 * track's `currentTime` before playing — so the world's motion doesn't jump to
 * zero when the reader flips the theme mid-loop. `prefers-reduced-motion:
 * reduce` never renders the `<video>` at all — the poster is what shows.
 *
 * 2K world: the poster is a srcset (@1x/@2x, `sizes` = the drawn width) and the
 * loop's density is picked by `pickDensity` from the video's own box — the same
 * rule — so still and motion carry the same sharpness. The `<video>` has no
 * `poster` attribute: it would fetch a second copy of the still; until the first
 * frame paints, the transparent video shows the `<picture>` underneath.
 */
export function SceneLoop({ id, locale, quip, children, eager = false, className, sizes = ART_SIZES.full, wideSizes = ART_SIZES.full, plateProgress = 'viewport' }: Props) {
  const scene = SCENES[id]
  const theme = useThemeState()
  const assets = sceneAssets(id, theme)
  const nightAssets = sceneAssets(id, 'night')
  const reducedMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const split = isSplitScene(id)

  // Once mounted with an explicit (non-system) theme, the day/night source must stop
  // competing with the <img>'s own src — otherwise a system-dark reader who explicitly
  // chose day would still get night from the matching media query.
  const [explicitTheme, setExplicitTheme] = useState(false)
  useEffect(() => {
    const check = () => setExplicitTheme(!!document.documentElement.dataset.theme)
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  // Wave K: a split scene renders two still plates instead (ScenePlates below) —
  // there's no loop video for it to drive, so this effect is a no-op for it.
  // Cover motion: a loop runs only while its scene is on screen and the tab is
  // visible (shouldPlayLoop). Before this, all three road loops kept decoding
  // off screen for the whole page. `playAllowed` is what the loader below
  // consults, so a day/night switch off screen loads the track without starting it.
  // Pixel/perf round (2026-09-12): the pause of a loop that left the screen waits for the scroll to go still (use-loop-playback.ts).
  const playAllowed = useLoopPlayback(videoRef, !split && !reducedMotion, reducedMotion)

  useEffect(() => {
    if (split) return
    if (reducedMotion) return
    const video = videoRef.current
    if (!video) return
    const resumeAt = video.currentTime || 0
    const wasStarted = video.readyState > 0
    const onLoaded = () => {
      if (wasStarted) video.currentTime = resumeAt
      if (playAllowed.current) {
        video.play().catch(() => {
          // Autoplay can be blocked before the first user gesture; the poster frame
          // (matching this same state) stands in until playback is possible.
        })
      }
      video.removeEventListener('loadedmetadata', onLoaded)
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.src = pickDensity(assets.loop, { w: video.clientWidth, h: video.clientHeight }, window.devicePixelRatio || 1)
    video.load()
    return () => video.removeEventListener('loadedmetadata', onLoaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on an actual source change
  }, [assets.loop.x1, reducedMotion, split])

  const posterSet = srcSetOf(assets.poster)
  return (
    <div className={className ? `quest-scene ${className}` : 'quest-scene'} data-scene={id} data-world={theme}>
      {split ? (
        <ScenePlates
          id={id}
          state={theme}
          locale={locale}
          alt={scene.alt[locale]}
          width={scene.width}
          height={scene.height}
          explicitTheme={explicitTheme}
          eager={eager}
          wideSizes={wideSizes}
          progress={plateProgress}
        />
      ) : (
        <>
          <picture>
            {explicitTheme ? null : (
              <source media="(prefers-color-scheme: dark)" srcSet={srcSetOrSrc(nightAssets.poster)} sizes={srcSetOf(nightAssets.poster) ? sizes : undefined} />
            )}
            <img
              src={assets.poster.x1}
              srcSet={posterSet}
              sizes={posterSet ? sizes : undefined}
              width={scene.width}
              height={scene.height}
              alt={scene.alt[locale]}
              loading={eager ? 'eager' : 'lazy'}
            />
          </picture>
          {!reducedMotion ? (
            <video
              ref={videoRef}
              className="quest-scene__video"
              width={scene.width}
              height={scene.height}
              muted
              loop
              playsInline
              autoPlay
              aria-hidden="true"
              tabIndex={-1}
            />
          ) : null}
        </>
      )}
      {children}
      {quip ? <div className="quest-scene__quip">{quip}</div> : null}
    </div>
  )
}
