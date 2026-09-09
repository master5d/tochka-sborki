'use client'
import { useEffect, useState } from 'react'

export type WorldState = 'day' | 'night'

/** Exported for the pure unit test below; the hook is what components use. */
export function readThemeState(): WorldState {
  if (typeof document === 'undefined') return 'day'
  const explicit = document.documentElement.dataset.theme
  if (explicit === 'dark') return 'night'
  if (explicit === 'light') return 'day'
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'day'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
}

/**
 * The world's current light: 'day' or 'night', following the reader's theme
 * (explicit `data-theme` attribute, else system `prefers-color-scheme`), not the
 * wall clock. Returns 'day' before mount (matches the static export's no-JS HTML).
 */
export function useThemeState(): WorldState {
  const [state, setState] = useState<WorldState>('day')

  useEffect(() => {
    setState(readThemeState())

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMediaChange = () => setState(readThemeState())
    mq.addEventListener('change', onMediaChange)

    const observer = new MutationObserver(() => setState(readThemeState()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      mq.removeEventListener('change', onMediaChange)
      observer.disconnect()
    }
  }, [])

  return state
}
