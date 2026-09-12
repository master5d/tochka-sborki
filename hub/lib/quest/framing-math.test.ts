import { describe, expect, it } from 'vitest'
import boxes from './character-boxes.json'
import { coverDraw, intersect, outsideBy, overlapBy, parseObjectPosition, projectBox } from './framing-math.mjs'

describe('framing math', () => {
  it('parses percent, px and keyword object-position', () => {
    expect(parseObjectPosition('72% 100%')).toEqual({ x: { pct: 0.72 }, y: { pct: 1 } })
    expect(parseObjectPosition('10px 50%')).toEqual({ x: { px: 10 }, y: { pct: 0.5 } })
    expect(parseObjectPosition('right bottom')).toEqual({ x: { pct: 1 }, y: { pct: 1 } })
  })

  it('cover-fits a 3:2 source height-first in a tall box and puts the free space by object-position', () => {
    const d = coverDraw({ w: 1000, h: 1000 }, { w: 1500, h: 1000 }, parseObjectPosition('100% 50%'))
    expect(d.dw).toBe(1500)
    expect(d.dh).toBe(1000)
    expect(d.ox).toBe(-500) // right edge of the art on the box's right edge
    expect(d.oy).toBe(0)
  })

  it('projects a fraction box through cover + a uniformly scaled, translated element', () => {
    const box = { w: 1000, h: 1000 }
    const screen = { left: 10, top: 20, width: 2000, height: 2000 } // scale 2, moved by (10, 20)
    const r = projectBox({ x: [0.8, 1], y: [0.5, 1] }, box, { w: 1500, h: 1000 }, parseObjectPosition('100% 50%'), screen)
    expect(r).toEqual({ left: 10 + (-500 + 1200) * 2, right: 10 + 1000 * 2, top: 20 + 500 * 2, bottom: 20 + 1000 * 2 })
  })

  it('measures how far a rect leaves its frame and how deep it runs into the copy', () => {
    const frame = { left: 0, right: 100, top: 0, bottom: 100 }
    expect(outsideBy({ left: 10, right: 90, top: 10, bottom: 90 }, frame)).toBe(0)
    expect(outsideBy({ left: 10, right: 112, top: 10, bottom: 90 }, frame)).toBe(12)
    expect(overlapBy({ left: 0, right: 50, top: 0, bottom: 50 }, { left: 40, right: 90, top: 10, bottom: 90 })).toBe(10)
    expect(overlapBy({ left: 0, right: 40, top: 0, bottom: 50 }, { left: 40, right: 90, top: 10, bottom: 90 })).toBe(0)
    expect(intersect(frame, { left: -5, right: 60, top: 20, bottom: 200 })).toEqual({ left: 0, right: 60, top: 20, bottom: 100 })
  })

  it('has both guides for both landscape frames, each a proper box inside 0..1', () => {
    for (const id of ['01-map-wide', '06-wall-wide'] as const) {
      const list = boxes[id]
      expect(list.map((b) => b.who).sort()).toEqual(['builder', 'scroller'])
      for (const b of list) {
        expect(0 <= b.x[0] && b.x[0] < b.x[1] && b.x[1] <= 1).toBe(true)
        expect(0 <= b.y[0] && b.y[0] < b.y[1] && b.y[1] <= 1).toBe(true)
      }
    }
  })
})
