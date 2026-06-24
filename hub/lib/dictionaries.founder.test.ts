import { describe, it, expect } from 'vitest'
import { getDictionary } from './dictionaries'

describe('founder dictionary block', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: has non-empty eyebrow, heading, and >=3 non-empty paragraphs`, () => {
      const f = getDictionary(locale).founder
      expect(f.eyebrow.length).toBeGreaterThan(0)
      expect(f.heading.length).toBeGreaterThan(0)
      expect(f.paragraphs.length).toBeGreaterThanOrEqual(3)
      for (const p of f.paragraphs) expect(p.trim().length).toBeGreaterThan(0)
    })
  }
  it('ru and en founder copy differ (bilingual)', () => {
    expect(getDictionary('ru').founder.heading).not.toBe(getDictionary('en').founder.heading)
    expect(getDictionary('ru').founder.paragraphs.join('|')).not.toBe(getDictionary('en').founder.paragraphs.join('|'))
  })
})
