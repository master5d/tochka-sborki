import { describe, expect, it, vi } from 'vitest'
import awaiting from './awaiting-2k.json'
import { AWAITING_2K, art, pickDensity, srcSetOf, srcSetOrSrc } from './art'

/** The list is empty once the world is complete; the waiting path is still a contract, exercised on a mocked list. */
async function withWaiting(paths: string[]) {
  vi.resetModules()
  vi.doMock('./awaiting-2k.json', () => ({ default: { note: 'test', paths } }))
  const mod = await import('./art')
  vi.doUnmock('./awaiting-2k.json')
  return mod
}

describe('art pairs (2K world)', () => {
  it('a 2K frame ships @1x and @2x, the srcset carries both widths', () => {
    const a = art('/quest/scenes/03-boulder-day', 'webp', 848, 1264)
    expect(a).toEqual({ x1: '/quest/scenes/03-boulder-day@1x.webp', x2: '/quest/scenes/03-boulder-day@2x.webp', w1: 848, h1: 1264 })
    expect(srcSetOf(a)).toBe('/quest/scenes/03-boulder-day@1x.webp 848w, /quest/scenes/03-boulder-day@2x.webp 1696w')
  })
  it('a frame waiting for its 2K pair keeps its 1K file as the only candidate', async () => {
    const w = await withWaiting(['/quest/scenes/04-temple-night.webp'])
    const a = w.art('/quest/scenes/04-temple-night', 'webp', 848, 1264)
    expect(a).toEqual({ x1: '/quest/scenes/04-temple-night.webp', w1: 848, h1: 1264 })
    expect(w.srcSetOf(a)).toBeUndefined()
    expect(w.srcSetOrSrc(a)).toBe('/quest/scenes/04-temple-night.webp')
  })
  it('the waiting list is the JSON the pixel guard reads, and says why', () => {
    expect(AWAITING_2K).toEqual(awaiting.paths)
    expect(awaiting.note).toMatch(/ждёт генерации, баланс Google/)
  })
  it('the 2K world is complete (2026-09-30): nothing waits, the last frames ship as pairs', () => {
    expect(AWAITING_2K).toEqual([])
    expect(art('/quest/scenes/04-temple-night', 'webp', 848, 1264).x2).toBe('/quest/scenes/04-temple-night@2x.webp')
    expect(srcSetOrSrc(art('/quest/outcomes/gates-builder-night', 'webp', 640, 960))).toBe('/quest/outcomes/gates-builder-night@1x.webp 640w, /quest/outcomes/gates-builder-night@2x.webp 1280w')
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
  it('a waiting frame has one file whatever the box', async () => {
    const w = await withWaiting(['/quest/loops/04-temple-night.mp4'])
    const waiting = w.art('/quest/loops/04-temple-night', 'mp4', 848, 1264)
    expect(w.pickDensity(waiting, { w: 1440, h: 2146 }, 2)).toBe('/quest/loops/04-temple-night.mp4')
  })
})
