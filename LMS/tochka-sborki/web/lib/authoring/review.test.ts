import { describe, it, expect } from 'vitest'
import { lintReadability } from './review'
import { draftLesson, SAMPLE_NOTES } from './draft'

const clean = draftLesson({
  unitTitle: 'Getting started', unitIndex: 0, moduleIndex: 0,
  objective: 'Understand why this module exists', notes: SAMPLE_NOTES, locale: 'en',
})
const LONG = 'This is an intentionally very long sentence that keeps going and going with many many extra words so that it clearly exceeds the twenty five word maximum threshold set by the readability lint today'

describe('lintReadability', () => {
  it('passes a clean S3 draft', () => {
    expect(lintReadability(clean)).toEqual([])
  })
  it('flags a long sentence in a phase', () => {
    const dirty = clean.replace('Run it in your head — where have you met this before?', LONG + '.')
    expect(lintReadability(dirty).some(e => /long sentence/.test(e))).toBe(true)
  })
  it('flags a leftover TODO in a phase body', () => {
    const dirty = clean.replace('Do this:', 'TODO: Do this:')
    expect(lintReadability(dirty).some(e => /leftover TODO/.test(e))).toBe(true)
  })
  it('flags a too-vague practice step', () => {
    const dirty = clean.replace('Do this: name one real task you want this module to help you finish', 'Do this: go')
    expect(lintReadability(dirty).some(e => /too vague/.test(e))).toBe(true)
  })
})
