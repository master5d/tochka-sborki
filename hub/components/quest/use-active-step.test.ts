import { describe, expect, it } from 'vitest'
import { pickActive } from './use-active-step'

describe('pickActive', () => {
  it('returns the step with the largest visible ratio', () => {
    expect(pickActive([0, 0.3, 0.8, 0.1])).toBe(2)
  })
  it('keeps the first step when nothing is visible yet', () => {
    expect(pickActive([0, 0, 0])).toBe(0)
  })
  it('prefers the earlier step on ties', () => {
    expect(pickActive([0.5, 0.5])).toBe(0)
  })
})
