import { describe, expect, it } from 'vitest'
import awaiting from './awaiting-2k.json'
import { AWAITING_2K, art, pickDensity, srcSetOf, srcSetOrSrc } from './art'

describe('art pairs (2K world)', () => {
  it('a 2K frame ships @1x and @2x, the srcset carries both widths', () => {
    const a = art('/quest/scenes/03-boulder-day', 'webp', 848, 1264)
    expect(a).toEqual({ x1: '/quest/scenes/03-boulder-day@1x.webp', x2: '/quest/scenes/03-boulder-day@2x.webp', w1: 848, h1: 1264 })
    expect(srcSetOf(a)).toBe('/quest/scenes/03-boulder-day@1x.webp 848w, /quest/scenes/03-boulder-day@2x.webp 1696w')
  })
  it('a frame waiting for its 2K pair keeps its 1K file as the only candidate', () => {
    const a = art('/quest/scenes/04-temple-night', 'webp', 848, 1264)
    expect(a).toEqual({ x1: '/quest/scenes/04-temple-night.webp', w1: 848, h1: 1264 })
    expect(srcSetOf(a)).toBeUndefined()
    expect(srcSetOrSrc(a)).toBe('/quest/scenes/04-temple-night.webp')
  })
  it('the waiting list is the JSON the pixel guard reads, and says why', () => {
    expect(AWAITING_2K).toEqual(awaiting.paths)
    expect(awaiting.note).toMatch(/ждёт генерации, баланс Google/)
  })
})

describe('pickDensity — the loop follows the poster srcset rule', () => {
  const road = art('/quest/loops/03-boulder-day', 'mp4', 848, 1264)
  const camp = art('/quest/loops/02-camp-wide-day', 'mp4', 1264, 848)
  it('a desktop road at 1440@2x draws the 848-wide frame at 1440 css px → @2x', () => {
    expect(pickDensity(road, { w: 1440, h: 2146 }, 2)).toBe(road.x2)
  })
  it('the same box at dpr 1 still needs 1440 px > 848 → @2x', () => {
    expect(pickDensity(road, { w: 1440, h: 2146 }, 1)).toBe(road.x2)
  })
  it('a small dpr-1 box within the @1x width → @1x', () => {
    expect(pickDensity(road, { w: 600, h: 894 }, 1)).toBe(road.x1)
  })
  it('cover math: a box taller than the art aspect draws wider than itself', () => {
    // 390×787 box, art 848/1264: drawn width 528 css px; at dpr 2 that is 1056 > 848
    expect(pickDensity(road, { w: 390, h: 787 }, 1)).toBe(road.x1)
    expect(pickDensity(road, { w: 390, h: 787 }, 2)).toBe(road.x2)
  })
  it('landscape camp: a 1440×848 box at dpr 1 draws 1440 > 1264 → @2x; 1100×700 → @1x', () => {
    expect(pickDensity(camp, { w: 1440, h: 848 }, 1)).toBe(camp.x2)
    expect(pickDensity(camp, { w: 1100, h: 700 }, 1)).toBe(camp.x1)
  })
  it('an unmeasured (0×0) box takes @2x rather than risk the soft frame', () => {
    expect(pickDensity(road, { w: 0, h: 0 }, 1)).toBe(road.x2)
  })
  it('a waiting frame has one file whatever the box', () => {
    const waiting = art('/quest/loops/04-temple-night', 'mp4', 848, 1264)
    expect(pickDensity(waiting, { w: 1440, h: 2146 }, 2)).toBe('/quest/loops/04-temple-night.mp4')
  })
})
