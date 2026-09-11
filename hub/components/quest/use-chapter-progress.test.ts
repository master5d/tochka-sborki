import { describe, expect, it } from 'vitest'
import { backdropPan, clampProgress, keyframePan, lagPan, panOffset, panelReveal, pinProgress, wipeReveal } from './use-chapter-progress'

describe('keyframePan (Wave M: a road scene looks at each panel\'s subject in turn)', () => {
  const stops = [0.1, 0.85, 0.3] as const
  it('hits every stop exactly at its evenly spaced progress', () => {
    expect(keyframePan(0, stops)).toBeCloseTo(0.1, 10)
    expect(keyframePan(0.5, stops)).toBeCloseTo(0.85, 10)
    expect(keyframePan(1, stops)).toBeCloseTo(0.3, 10)
  })
  it('interpolates linearly between neighbouring stops (and may turn back)', () => {
    expect(keyframePan(0.25, stops)).toBeCloseTo(0.475, 10)
    expect(keyframePan(0.75, stops)).toBeCloseTo(0.575, 10)
  })
  it('clamps progress and survives degenerate stop lists', () => {
    expect(keyframePan(-1, stops)).toBeCloseTo(0.1, 10)
    expect(keyframePan(2, stops)).toBeCloseTo(0.3, 10)
    expect(keyframePan(0.4, [0.6])).toBe(0.6)
    expect(keyframePan(0.4, [])).toBe(0.5)
  })
})

describe('panelReveal (Wave M: the curtain follows the detour panel into view)', () => {
  it('is 0 while the detour panel is still low in the viewport', () => {
    expect(panelReveal(1200, 900)).toBe(0)
    expect(panelReveal(0.9 * 900, 900)).toBe(0)
  })
  it('is 1 once the panel has climbed to the end line, and stays there', () => {
    expect(panelReveal(0.35 * 900, 900)).toBe(1)
    expect(panelReveal(-2000, 900)).toBe(1)
  })
  it('is monotonic as the panel rises', () => {
    const xs = [900, 800, 700, 600, 500, 400, 300].map((t) => panelReveal(t, 900))
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThanOrEqual(xs[i - 1])
    expect(panelReveal(0.625 * 900, 900)).toBeCloseTo(0.5, 10)
  })
  it('returns 0 for a zero viewport', () => {
    expect(panelReveal(100, 0)).toBe(0)
  })
})

describe('backdropPan (intro backdrop: a portrait scene in a landscape box)', () => {
  it('holds the pan inside the characters band for the whole chapter', () => {
    for (let p = 0; p <= 1; p += 0.05) {
      const v = backdropPan(p)
      expect(v).toBeGreaterThanOrEqual(0.76)
      expect(v).toBeLessThanOrEqual(0.84)
    }
  })
  it('still moves with the chapter (the world is alive), monotonically', () => {
    expect(backdropPan(0)).toBeCloseTo(0.76, 5)
    expect(backdropPan(1)).toBeCloseTo(0.84, 5)
    expect(backdropPan(0.5)).toBeGreaterThan(backdropPan(0.2))
  })
  it('clamps progress outside 0..1', () => {
    expect(backdropPan(-1)).toBeCloseTo(0.76, 5)
    expect(backdropPan(2)).toBeCloseTo(0.84, 5)
  })
})

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
