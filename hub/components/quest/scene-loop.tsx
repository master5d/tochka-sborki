'use client'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Locale } from '../../lib/dictionaries'
import { SCENES, sceneAssets, type SceneId } from '../../lib/quest/scenes'
import { useThemeState } from './use-theme-state'

interface Props {
  id: SceneId
  locale: Locale
  /** Mono caption in the corner, switches with the active step. */
  caption?: string
  /** Absolutely positioned children over the art (plaques). */
  children?: ReactNode
  /** The hero poster may load eagerly; everything else waits for the viewport. */
  eager?: boolean
  /** Extra class appended to the `.quest-scene` wrapper (e.g. the hero backdrop variant). */
  className?: string
}

/**
 * Poster only this wave (see sceneAssets doc — loops are absent, Wave E regenerates
 * them for the tall frame). Day/night is `<picture>` + a media-query `<source>` for
 * the no-JS case; after mount an explicit theme choice (vs. system) overrides it by
 * dropping the source, since a matching media query always wins over an <img src>
 * set from JS. Frame 0 of the poster is what a loop's frame 0 will equal in Wave E.
 */
export function SceneLoop({ id, locale, caption, children, eager = false, className }: Props) {
  const scene = SCENES[id]
  const theme = useThemeState()
  const assets = sceneAssets(id, theme)
  const nightAssets = sceneAssets(id, 'night')

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
      {children}
      {caption ? <div className="quest-scene__caption">{caption}</div> : null}
    </div>
  )
}
