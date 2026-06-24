import { describe, it, expect } from 'vitest'
import { getEvent, listEvents, EVENTS } from './events'

describe('getEvent', () => {
  it('returns the seeded retreat config in ru and en', () => {
    const ru = getEvent('retreat-inner-evolution', 'ru')
    const en = getEvent('retreat-inner-evolution', 'en')
    expect(ru).not.toBeNull()
    expect(en).not.toBeNull()
    expect(ru!.slug).toBe('retreat-inner-evolution')
    expect(en!.slug).toBe('retreat-inner-evolution')
  })

  it('returns null for an unknown slug', () => {
    expect(getEvent('nope', 'ru')).toBeNull()
  })
})

describe('listEvents', () => {
  it('returns a non-empty array per locale', () => {
    expect(listEvents('ru').length).toBeGreaterThan(0)
    expect(listEvents('en').length).toBeGreaterThan(0)
  })
})

describe('seeded retreat content (both locales)', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: lead tag, consent, cta, expectations are present`, () => {
      const e = getEvent('retreat-inner-evolution', locale)!
      expect(e.capture.event).toBe('retreat-inner-evolution')
      expect(e.capture.consentLabel.length).toBeGreaterThan(0)
      expect(e.capture.cta.length).toBeGreaterThan(0)
      expect(e.whatToExpect.length).toBeGreaterThan(0)
    })
  }
})

describe('EVENTS shape', () => {
  it('every slug key matches its config slug in both locales', () => {
    for (const slug of Object.keys(EVENTS)) {
      expect(EVENTS[slug].ru.slug).toBe(slug)
      expect(EVENTS[slug].en.slug).toBe(slug)
    }
  })
})
