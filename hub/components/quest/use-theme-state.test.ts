import { afterEach, describe, expect, it, vi } from 'vitest'
import { readThemeState } from './use-theme-state'

function stubDom({ theme, prefersDark }: { theme?: string; prefersDark?: boolean }) {
  vi.stubGlobal('document', { documentElement: { dataset: theme ? { theme } : {} } })
  vi.stubGlobal('window', {
    matchMedia: (q: string) => ({ matches: q.includes('dark') ? !!prefersDark : false }),
  })
}

describe('readThemeState', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('returns day when there is no document (pre-mount / no JS)', () => {
    vi.stubGlobal('document', undefined)
    expect(readThemeState()).toBe('day')
  })

  it('honours an explicit dark theme regardless of system preference', () => {
    stubDom({ theme: 'dark', prefersDark: false })
    expect(readThemeState()).toBe('night')
  })

  it('honours an explicit light theme regardless of system preference', () => {
    stubDom({ theme: 'light', prefersDark: true })
    expect(readThemeState()).toBe('day')
  })

  it('falls back to prefers-color-scheme when no explicit theme is set', () => {
    stubDom({ prefersDark: true })
    expect(readThemeState()).toBe('night')
    stubDom({ prefersDark: false })
    expect(readThemeState()).toBe('day')
  })
})
