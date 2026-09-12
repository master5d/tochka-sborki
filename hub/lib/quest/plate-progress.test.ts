import { describe, expect, it } from 'vitest'
import { pageTopProgress } from './drift'

describe('pageTopProgress — the hero plate rests unzoomed at the top of the page', () => {
  it('is 0 at rest', () => {
    expect(pageTopProgress(0, 1000)).toBe(0)
  })
  it('grows with the scroll across the scene’s own height and stops at 1', () => {
    expect(pageTopProgress(250, 1000)).toBe(0.25)
    expect(pageTopProgress(1000, 1000)).toBe(1)
    expect(pageTopProgress(4000, 1000)).toBe(1)
  })
  it('never goes below 0 (overscroll) and survives a zero-height box', () => {
    expect(pageTopProgress(-40, 1000)).toBe(0)
    expect(pageTopProgress(300, 0)).toBe(0)
  })
})
