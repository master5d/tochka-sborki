import { describe, expect, it } from 'vitest'
import { clampProgress, lagPan, panOffset } from './use-chapter-progress'

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
