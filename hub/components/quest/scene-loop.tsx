'use client'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { SCENES, sceneAssets, type SceneId } from '../../lib/quest/scenes'
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
  /** Mono caption in the bottom-left corner, switches with the active step. */
  caption?: string
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
 */
export function SceneLoop({ id, locale, caption, quip, children, eager = false, className }: Props) {
  const scene = SCENES[id]
  const theme = useThemeState()
  const assets = sceneAssets(id, theme)
  const nightAssets = sceneAssets(id, 'night')
  const reducedMotion = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)

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

  useEffect(() => {
    if (reducedMotion) return
    const video = videoRef.current
    if (!video) return
    const resumeAt = video.currentTime || 0
    const wasStarted = video.readyState > 0
    const onLoaded = () => {
      if (wasStarted) video.currentTime = resumeAt
      video.play().catch(() => {
        // Autoplay can be blocked before the first user gesture; the poster frame
        // (matching this same state) stands in until playback is possible.
      })
      video.removeEventListener('loadedmetadata', onLoaded)
    }
    video.addEventListener('loadedmetadata', onLoaded)
    video.src = assets.loop
    video.load()
    return () => video.removeEventListener('loadedmetadata', onLoaded)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on an actual source change
  }, [assets.loop, reducedMotion])

  return (
    <div className={className ? `quest-scene ${className}` : 'quest-scene'} data-scene={id} data-world={theme}>
      <picture>
        {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={nightAssets.poster} />}
        <img
          src={assets.poster}
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
          poster={assets.poster}
          muted
          loop
          playsInline
          autoPlay
          aria-hidden="true"
          tabIndex={-1}
        />
      ) : null}
      {children}
      {quip ? <div className="quest-scene__quip">{quip}</div> : null}
      {caption ? <div className="quest-scene__caption">{caption}</div> : null}
    </div>
  )
}
