import { describe, it, expect } from 'vitest'
import { dictionaries } from './dictionaries'

describe('hero badges', () => {
  const vanity = /\d{3,}|★|студент|клиент|подписчик|students|clients|followers|users|\d+\s*\+/i
  for (const loc of ['ru', 'en'] as const) {
    it(`${loc}: present, non-empty, >= 3`, () => {
      const b = dictionaries[loc].heroBadges
      expect(Array.isArray(b)).toBe(true)
      expect(b.length).toBeGreaterThanOrEqual(3)
      for (const x of b) expect(x.trim().length).toBeGreaterThan(0)
    })
    it(`${loc}: no vanity-metric framing`, () => {
      for (const x of dictionaries[loc].heroBadges) {
        expect(vanity.test(x), `vanity framing: ${x}`).toBe(false)
      }
    })
  }
})
