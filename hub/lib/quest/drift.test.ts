import { describe, expect, it } from 'vitest'
import { coverRowY, heroDrift, HERO_DRIFT_TARGET, HERO_SURPLUS, landDrift, LAND_ZOOM_MAX } from './drift'

describe('heroDrift', () => {
  it('is zero at the start and never exceeds 85% of the surplus', () => {
    expect(heroDrift(0, 900)).toBe(0)
    for (const h of [200, 500, 900, 1400]) {
      for (const p of [0.1, 0.5, 1]) expect(heroDrift(p, h)).toBeLessThanOrEqual(HERO_SURPLUS * h * 0.85 + 1e-9)
    }
  })
  it('reaches the target on a tall frame and clamps progress', () => {
    expect(heroDrift(1, 2000)).toBe(HERO_DRIFT_TARGET)
    expect(heroDrift(5, 2000)).toBe(HERO_DRIFT_TARGET)
    expect(heroDrift(-1, 2000)).toBe(0)
  })
})

describe('coverRowY', () => {
  it('maps rows through a width-driven cover crop', () => {
    // 848x1264 in 1440x900: s = 1440/848, content taller than the box.
    const s = 1440 / 848
    expect(coverRowY({ w: 1440, h: 900 }, { w: 848, h: 1264 }, 0, 100)).toBeCloseTo(100 * s)
    expect(coverRowY({ w: 1440, h: 900 }, { w: 848, h: 1264 }, 1, 1264)).toBeCloseTo(900)
  })
  it('is the identity when the box matches the image', () => {
    expect(coverRowY({ w: 848, h: 1264 }, { w: 848, h: 1264 }, 0.78, 500)).toBeCloseTo(500)
  })
})

describe('landDrift', () => {
  const box = { w: 1440, h: 1000 }
  it('is the identity at progress 0', () => {
    expect(landDrift(0, box, 400)).toEqual({ translateY: -0, scale: 1, originY: 400 })
  })
  it('returns ONE scale factor and only ever rises', () => {
    const d = landDrift(0.6, box, 400)
    expect(typeof d.scale).toBe('number')
    expect(d.scale).toBeCloseTo(1 + 0.6 * (LAND_ZOOM_MAX - 1))
    expect(d.translateY).toBeLessThanOrEqual(0)
  })
  it('never lets the plate bottom rise into view', () => {
    for (const oy of [0, 200, 500, 900, 1000, 1200, -50]) {
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        const d = landDrift(p, box, oy)
        const bottom = d.originY + d.scale * (box.h - d.originY) + d.translateY
        expect(bottom).toBeGreaterThanOrEqual(box.h - 1e-9)
      }
    }
  })
  it('keeps the drift near the target on a normal scene and shrinks it when there is no room', () => {
    expect(landDrift(1, { w: 1440, h: 1000 }, 300).translateY).toBeCloseTo(-55)
    expect(landDrift(1, { w: 1440, h: 1000 }, 1000).translateY).toBeCloseTo(0)
  })
})
