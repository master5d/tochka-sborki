import { describe, it, expect } from 'vitest'
import { COVERS, COVER_IDS, FLOOR, coverPath, isKnownCover, trendCovers } from './covers'

describe('covers registry', () => {
  it('has exactly one floor, and it is the floor id', () => {
    const floors = COVERS.filter((c) => c.kind === 'floor')
    expect(floors).toHaveLength(1)
    expect(floors[0].id).toBe(FLOOR)
  })

  it('ids are unique kebab-case', () => {
    expect(new Set(COVER_IDS).size).toBe(COVER_IDS.length)
    for (const id of COVER_IDS) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('every trend cover names its trend source (provenance, not a clone)', () => {
    expect(trendCovers().length).toBeGreaterThan(0)
    for (const c of trendCovers()) expect(c.trend).toMatch(/^trend-[a-z0-9]+(-[a-z0-9]+)*-\d{4}-\d{2}$/)
  })

  it('coverPath is hidden under /cover/ for both locales', () => {
    expect(coverPath('trend-adweek-2026-09', 'ru')).toBe('/cover/trend-adweek-2026-09/')
    expect(coverPath('trend-adweek-2026-09', 'en')).toBe('/en/cover/trend-adweek-2026-09/')
  })

  it('isKnownCover rejects anything outside the registry', () => {
    expect(isKnownCover('trend-adweek-2026-09')).toBe(true)
    expect(isKnownCover(FLOOR)).toBe(true)
    expect(isKnownCover('trend-unknown-2030-01')).toBe(false)
    expect(isKnownCover(42)).toBe(false)
  })
})
