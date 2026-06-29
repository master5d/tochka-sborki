import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('is ~21 for black on white', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(20.9)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
  it('is order-independent', () => {
    expect(contrastRatio('#0070c0', '#f4f1ea')).toBeCloseTo(
      contrastRatio('#f4f1ea', '#0070c0'), 5,
    )
  })
})
