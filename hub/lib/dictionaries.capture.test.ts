import { describe, it, expect } from 'vitest'
import { getDictionary } from './dictionaries'

describe('capture dictionary block', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: has all eight non-empty capture labels`, () => {
      const c = getDictionary(locale).capture
      for (const k of [
        'nameLabel', 'emailLabel', 'phoneLabel', 'cityLabel',
        'cityPlaceholder', 'messageLabel', 'submitting', 'errorMessage',
      ] as const) {
        expect(c[k].length).toBeGreaterThan(0)
      }
    })
  }
})
