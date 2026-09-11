'use client'
import { useEffect, useState } from 'react'
import { useThemeState } from './use-theme-state'

interface Props {
  day: string
  night: string
  width: number
  height: number
  alt: string
  className?: string
}

/**
 * L2/L3: the day/night `<picture>` contract of SceneLoop and RoadStrip, for a
 * plain still — a `<source media="(prefers-color-scheme: dark)">` gives night
 * for free in the system-theme, no-JS case; once mounted, an explicit theme
 * choice drops that source (a matching media query would otherwise beat the
 * `<img>`'s own src). Always lazy: nothing that uses it sits in the first screen.
 */
export function ThemedPicture({ day, night, width, height, alt, className }: Props) {
  const theme = useThemeState()
  const [explicitTheme, setExplicitTheme] = useState(false)
  useEffect(() => {
    const check = () => setExplicitTheme(!!document.documentElement.dataset.theme)
    check()
    const observer = new MutationObserver(check)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <picture className={className}>
      {explicitTheme ? null : <source media="(prefers-color-scheme: dark)" srcSet={night} />}
      <img src={theme === 'night' ? night : day} width={width} height={height} alt={alt} loading="lazy" decoding="async" data-world={theme} />
    </picture>
  )
}
