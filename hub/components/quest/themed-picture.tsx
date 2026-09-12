'use client'
import { useEffect, useRef, useState } from 'react'
import { srcSetOf, srcSetOrSrc, type Art } from '../../lib/quest/art'
import { useThemeState } from './use-theme-state'

interface Props {
  /** A plain path (one file) or an `Art` pair (@1x/@2x, served through srcset). */
  day: string | Art
  night: string | Art
  width: number
  height: number
  alt: string
  className?: string
  /** `sizes` for the srcset — the CSS width the frame is drawn at (ART_SIZES). */
  sizes?: string
  /** Wave M: load at once instead of `lazy` — for a still that must be ready
   *  BEFORE it is uncovered (the curtain: a lazy image inside a fully clipped
   *  box never loads until the wipe starts, so the new world came in blank). */
  eager?: boolean
}

/**
 * L2/L3: the day/night `<picture>` contract of SceneLoop, for a
 * plain still — a `<source media="(prefers-color-scheme: dark)">` gives night
 * for free in the system-theme, no-JS case; once mounted, an explicit theme
 * choice drops that source (a matching media query would otherwise beat the
 * `<img>`'s own src). Lazy by default; `eager` for a still hidden behind a clip.
 *
 * Fix round (audit4 minor): swapping `src` on a lazy, async-decoded `<img>`
 * painted one empty frame (~15 ms) on an explicit theme flip — SceneLoop never
 * showed it because its loop video covers the poster. The new state's still is
 * now decoded off-screen first and swapped in only once it can paint; an image
 * that never loaded yet (still below the fold) swaps immediately — there is
 * nothing on screen to blank, and forcing its download would defeat `lazy`.
 * 2K world: the probe carries the same srcset/sizes, so it decodes the very
 * candidate the browser will then paint.
 */
export function ThemedPicture({ day, night, width, height, alt, className, sizes, eager = false }: Props) {
  const theme = useThemeState()
  const toArt = (a: string | Art): Art => (typeof a === 'string' ? { x1: a, w1: width, h1: height } : a)
  const dayArt = toArt(day)
  const nightArt = toArt(night)
  const target = theme === 'night' ? nightArt : dayArt
  const [shownKey, setShownKey] = useState(target.x1)
  const shown = shownKey === nightArt.x1 ? nightArt : dayArt
  const imgRef = useRef<HTMLImageElement>(null)
  const [explicitTheme, setExplicitTheme] = useState(false)
  useEffect(() => {
    const check = () => setExplicitTheme(!!document.documentElement.dataset.theme)
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (target.x1 === shownKey) return
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) { setShownKey(target.x1); return }
    let live = true
    const probe = new Image()
    const set = srcSetOf(target)
    if (set) { probe.sizes = sizes ?? '100vw'; probe.srcset = set }
    probe.src = target.x1
    probe.decode().catch(() => undefined).then(() => { if (live) setShownKey(target.x1) })
    return () => { live = false }
  }, [target, shownKey, sizes])

  return (
    <picture className={className}>
      {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={srcSetOrSrc(nightArt)} sizes={srcSetOf(nightArt) ? sizes : undefined} />}
      <img
        ref={imgRef}
        src={shown.x1}
        srcSet={srcSetOf(shown)}
        sizes={srcSetOf(shown) ? sizes : undefined}
        width={width}
        height={height}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        data-world={theme}
      />
    </picture>
  )
}
