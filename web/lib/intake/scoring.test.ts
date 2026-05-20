import { describe, it, expect } from 'vitest'
import { computeAttributes } from './scoring'

describe('computeAttributes', () => {
  it('sums MC/Likert points and normalizes to range', () => {
    const answers = { C1: 'tier4', C3: 'used', C4: 'comfortable', C8: 'very', D3: 'absorb', D7: 'many' }
    const a = computeAttributes(answers)
    expect(a.int).toBe(30)
  })
  it('returns 0 for an attribute with no answers', () => {
    const a = computeAttributes({})
    expect(a.int).toBe(0)
    expect(a.cha).toBe(0)
  })
  it('ignores open-text answers', () => {
    const a = computeAttributes({ A1: 'I am a massage therapist', C1: 'tier0' })
    expect(a.int).toBe(0)
  })
})
