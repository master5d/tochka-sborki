import { describe, it, expect } from 'vitest'
import { mentorFirmness, mentorFirmnessCompact } from './mentor-persona'

describe('mentorFirmness', () => {
  it('returns a non-empty anti-flattery contract in both locales', () => {
    expect(mentorFirmness('ru')).toMatch(/льст/)
    expect(mentorFirmness('en')).toMatch(/flatter/)
    expect(mentorFirmness('ru').length).toBeGreaterThan(0)
    expect(mentorFirmness('en').length).toBeGreaterThan(0)
  })

  it('reads as caring-firmness, not coldness (warm marker present)', () => {
    expect(mentorFirmness('ru')).toMatch(/тёплым|поддерживай/)
    expect(mentorFirmness('en')).toMatch(/warm|support/)
  })
})

describe('mentorFirmnessCompact', () => {
  it('returns a short anti-flattery clause in both locales', () => {
    expect(mentorFirmnessCompact('ru')).toMatch(/льст/)
    expect(mentorFirmnessCompact('en')).toMatch(/flatter/)
  })

  it('is shorter than the full contract and distinct from it', () => {
    for (const l of ['ru', 'en'] as const) {
      expect(mentorFirmnessCompact(l).length).toBeLessThan(mentorFirmness(l).length)
      expect(mentorFirmnessCompact(l)).not.toBe(mentorFirmness(l))
    }
  })
})
