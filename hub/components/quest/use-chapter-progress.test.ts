import { describe, expect, it } from 'vitest'
import { clampProgress, lagPan, panOffset, pinProgress, wipeReveal } from './use-chapter-progress'

describe('pinProgress (how far a sticky child has travelled inside its stage)', () => {
  it('is 0 at pin start and 1 at pin release', () => {
    expect(pinProgress(0, 1200)).toBe(0)
    expect(pinProgress(1200, 1200)).toBe(1)
    expect(pinProgress(600, 1200)).toBeCloseTo(0.5, 10)
  })
  it('clamps outside the pinned span and survives a stage no taller than its child', () => {
    expect(pinProgress(-40, 1200)).toBe(0)
    expect(pinProgress(1300, 1200)).toBe(1)
    expect(pinProgress(10, 0)).toBe(0)
  })
})

describe('wipeReveal (L3 curtain between the two roads)', () => {
  it('is 0 (habit world only) before the window starts', () => {
    expect(wipeReveal(0)).toBe(0)
    expect(wipeReveal(0.3, 0.4, 0.7)).toBe(0)
    expect(wipeReveal(0.4, 0.4, 0.7)).toBe(0)
  })
  it('is 1 (detour world fully drawn) from the window end on', () => {
    expect(wipeReveal(0.7, 0.4, 0.7)).toBe(1)
    expect(wipeReveal(1)).toBe(1)
  })
  it('is linear and monotonic inside the window', () => {
    expect(wipeReveal(0.55, 0.4, 0.7)).toBeCloseTo(0.5, 10)
    const xs = [0.4, 0.45, 0.5, 0.6, 0.65, 0.7].map((p) => wipeReveal(p, 0.4, 0.7))
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1])
  })
  it('clamps garbage input and never divides by a zero-width window', () => {
    expect(wipeReveal(-5)).toBe(0)
    expect(wipeReveal(5)).toBe(1)
    expect(wipeReveal(0.5, 0.5, 0.5)).toBe(1)
    expect(wipeReveal(0.49, 0.5, 0.5)).toBe(0)
  })
})

describe('clampProgress', () => {
  it('is 0 before the chapter enters the viewport', () => {
    expect(clampProgress(900, 2000, 900)).toBe(0)
    expect(clampProgress(1500, 2000, 900)).toBe(0)
  })
  it('is 1 once the chapter has fully left the viewport', () => {
    expect(clampProgress(-2000, 2000, 900)).toBe(1)
    expect(clampProgress(-3000, 2000, 900)).toBe(1)
  })
  it('is monotonic (non-decreasing as top decreases) inside the range', () => {
    const tops = [900, 500, 0, -500, -1000, -1500, -2000]
    const values = tops.map((top) => clampProgress(top, 2000, 900))
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThanOrEqual(values[i - 1])
    expect(values[0]).toBe(0)
    expect(values.at(-1)).toBe(1)
  })
  it('never returns outside 0…1', () => {
    for (const top of [10000, -10000]) {
      const v = clampProgress(top, 2000, 900)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })
})

describe('panOffset', () => {
  it('maps 0 to 0% and 1 to 100%', () => {
    expect(panOffset(0)).toBe('0%')
    expect(panOffset(1)).toBe('100%')
  })
  it('maps the middle to 50%', () => {
    expect(panOffset(0.5)).toBe('50%')
  })
  it('maps the reduced-motion pin to a clean 33%', () => {
    expect(panOffset(0.33)).toBe('33%')
  })
  it('clamps out-of-range input', () => {
    expect(panOffset(-1)).toBe('0%')
    expect(panOffset(2)).toBe('100%')
  })
})

describe('lagPan', () => {
  it('preserves both endpoints — full frame still traversed start to end', () => {
    expect(lagPan(0)).toBe(0)
    expect(lagPan(1)).toBe(1)
  })
  it('lags scroll at the target rate for most of the transit', () => {
    expect(lagPan(0.5)).toBeCloseTo(0.3, 5) // 0.5 * 0.6
    expect(lagPan(0.85)).toBeCloseTo(0.51, 5) // 0.85 * 0.6, the catch-up threshold
  })
  it('is strictly monotonic — never runs the world backwards', () => {
    const steps = Array.from({ length: 21 }, (_, i) => i / 20)
    const values = steps.map((p) => lagPan(p))
    for (let i = 1; i < values.length; i++) expect(values[i]).toBeGreaterThan(values[i - 1])
  })
  it('stays within 0…1 for out-of-range input', () => {
    expect(lagPan(-1)).toBe(0)
    expect(lagPan(2)).toBe(1)
  })
  it('is continuous at the catch-up seam (no visible jump)', () => {
    const before = lagPan(0.85 - 1e-6)
    const after = lagPan(0.85 + 1e-6)
    expect(Math.abs(after - before)).toBeLessThan(1e-4)
  })
})
