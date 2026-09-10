'use client'
import { useEffect, useState, type RefObject } from 'react'
import type { Guide } from '../../lib/quest/content'
import { roadStrip, type ForkId } from '../../lib/quest/scenes'
import { useThemeState } from './use-theme-state'

interface Props {
  forkId: ForkId
  guide: Guide
  /** Wave J1: `#gates`' rail-drift hook writes `--px-y` straight onto this
   *  `<img>` — passed in only by the two `#gates` rails, undefined everywhere
   *  else this component is used (the fork cards' inline strips). */
  imgRef?: RefObject<HTMLImageElement | null>
}

/**
 * A narrow strip of world-v3 art that CONTINUES its fork's path card — same surface,
 * no gap, no border between strip and card (see `.quest-path` in themes/quest.css).
 * Decorative: the fork's scene art already carries the real `alt` text elsewhere on
 * the page, so this is `alt=""`. Same `<picture>` + media-query pattern as SceneLoop:
 * a `<source media="(prefers-color-scheme: dark)">` gives night for free in the
 * system-theme, no-JS case; once mounted, an explicit theme choice overrides it.
 */
export function RoadStrip({ forkId, guide, imgRef }: Props) {
  const theme = useThemeState()
  const src = roadStrip(forkId, guide, theme)
  const nightSrc = roadStrip(forkId, guide, 'night')

  const [explicitTheme, setExplicitTheme] = useState(false)
  useEffect(() => {
    const check = () => setExplicitTheme(!!document.documentElement.dataset.theme)
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <picture className="road-strip-frame">
      {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={nightSrc} />}
      <img ref={imgRef} className="road-strip" src={src} width={768} height={1536} alt="" loading="lazy" data-world={theme} />
    </picture>
  )
}
