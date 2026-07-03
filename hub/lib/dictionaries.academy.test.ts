import { describe, it, expect } from 'vitest'
import { getDictionary } from './dictionaries'

const BANNED = /скидк|осталось всего|только сегодня|отзыв|testimonial|discount|hurry|limited/i

describe('academy dictionary block', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: all keys filled, >=2 positioning paragraphs`, () => {
      const a = getDictionary(locale).academy
      expect(a.eyebrow.length).toBeGreaterThan(0)
      expect(a.wordmark).toBe('S.A.S.H.A')
      expect(a.fullName.length).toBeGreaterThan(0)
      expect(a.positioning.length).toBeGreaterThanOrEqual(2)
      for (const p of a.positioning) expect(p.trim().length).toBeGreaterThan(0)
      expect(a.coursesLabel.length).toBeGreaterThan(0)
      expect(a.comingSoon.length).toBeGreaterThan(0)
      expect(a.metaTitle.length).toBeGreaterThan(0)
      expect(a.metaDescription.length).toBeGreaterThan(0)
    })

    it(`${locale}: authenticity — no hustle lexicon`, () => {
      expect(JSON.stringify(getDictionary(locale).academy)).not.toMatch(BANNED)
    })
  }

  it('ru and en positioning differ (bilingual)', () => {
    expect(getDictionary('ru').academy.positioning.join('|'))
      .not.toBe(getDictionary('en').academy.positioning.join('|'))
  })
})
