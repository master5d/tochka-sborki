'use client'
import { useEffect, useRef, useState } from 'react'
import { useThemeState } from './use-theme-state'

interface Props {
  day: string
  night: string
  width: number
  height: number
  alt: string
  className?: string
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
 */
export function ThemedPicture({ day, night, width, height, alt, className, eager = false }: Props) {
  const theme = useThemeState()
  const target = theme === 'night' ? night : day
  const [shown, setShown] = useState(target)
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
    if (target === shown) return
    const img = imgRef.current
    if (!img || !img.complete || img.naturalWidth === 0) { setShown(target); return }
    let live = true
    const probe = new Image()
    probe.src = target
    probe.decode().catch(() => undefined).then(() => { if (live) setShown(target) })
    return () => { live = false }
  }, [target, shown])

  return (
    <picture className={className}>
      {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={night} />}
      <img ref={imgRef} src={shown} width={width} height={height} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" data-world={theme} />
    </picture>
  )
}
