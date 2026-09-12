import { describe, expect, it } from 'vitest'
import { ART_SIZES, DETOUR_SCENE_SIZE, FORK_IDS, GATE_PLAQUES, OUTCOME_ART_SIZE, ROAD_PAN, SCENES, SCENE_IDS, detourScene, outcomeArt, sceneAssets } from './scenes'

describe('road scene pan stops (Wave M)', () => {
  it('every fork has one stop per panel (setup, habit road, detour), each a valid object-position fraction', () => {
    for (const f of FORK_IDS) {
      expect(ROAD_PAN[f]).toHaveLength(3)
      for (const v of ROAD_PAN[f]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(1)
      }
    }
  })
  it('#gates never pans the lettered plaques out of a 1440x848 frame', () => {
    // cover-fit of the 848x1264 art at 1440 wide: the frame shows 848 / (1440 * 1264 / 848) of its height
    const visible = 848 / ((1440 * 1264) / 848)
    for (const pan of ROAD_PAN.gates) {
      const top = pan * (1 - visible)
      for (const box of GATE_PLAQUES) {
        expect(box.top / 100).toBeGreaterThanOrEqual(top)
        expect((box.top + box.height) / 100).toBeLessThanOrEqual(top + visible)
      }
    }
  })
})

describe('quest outcome art + detour scenes (L2/L3)', () => {
  it('outcome art is keyed by fork, guide and state (habit road = scroller, detour = builder)', () => {
    expect(outcomeArt('boulder', 'scroller', 'day')).toBe('/quest/outcomes/boulder-scroller-day.webp')
    expect(outcomeArt('gates', 'builder', 'night')).toBe('/quest/outcomes/gates-builder-night.webp')
  })
  it('every fork has a detour scene in both states — a 2K pair, or the 1K file while it waits', () => {
    expect(detourScene('boulder', 'day')).toEqual({ x1: '/quest/detours/boulder-day@1x.webp', x2: '/quest/detours/boulder-day@2x.webp', w1: 848, h1: 1264 })
    expect(detourScene('gates', 'night')).toEqual({ x1: '/quest/detours/gates-night.webp', w1: 848, h1: 1264 })
    for (const f of FORK_IDS) for (const s of ['day', 'night'] as const) expect(detourScene(f, s).x1).toMatch(new RegExp(`^/quest/detours/${f}-${s}(@1x)?\\.webp$`))
  })
  it('outcome art is tall (2:3) and the detour scene shares the chapter scene frame', () => {
    expect(OUTCOME_ART_SIZE).toEqual({ width: 640, height: 960 })
    expect(DETOUR_SCENE_SIZE).toEqual({ width: SCENES['03-boulder'].width, height: SCENES['03-boulder'].height })
  })
})

describe('quest scenes registry', () => {
  it('has seven scenes in narrative order with unique ids', () => {
    expect(SCENE_IDS).toEqual(['01-map', '02-camp', '03-boulder', '04-temple', '05-gates', '06-wall', '07-signs'])
    expect(new Set(SCENE_IDS).size).toBe(7)
  })
  it('every scene has alt text in both locales', () => {
    for (const id of SCENE_IDS) {
      expect(SCENES[id].alt.ru.trim().length, `${id} ru alt`).toBeGreaterThan(10)
      expect(SCENES[id].alt.en.trim().length, `${id} en alt`).toBeGreaterThan(10)
    }
  })
  it('asset paths are under /quest/, keyed by state, and a 2K pair doubles the @1x frame', () => {
    const day = sceneAssets('03-boulder', 'day')
    expect(day.poster).toEqual({ x1: '/quest/scenes/03-boulder-day@1x.webp', x2: '/quest/scenes/03-boulder-day@2x.webp', w1: 848, h1: 1264 })
    expect(day.loop).toEqual({ x1: '/quest/loops/03-boulder-day@1x.mp4', x2: '/quest/loops/03-boulder-day@2x.mp4', w1: 848, h1: 1264 })
    const waiting = sceneAssets('04-temple', 'night')
    expect(waiting.poster).toEqual({ x1: '/quest/scenes/04-temple-night.webp', w1: 848, h1: 1264 })
  })
  it('every sizes string names the drawn width in viewport units (the browser has no layout yet)', () => {
    for (const s of Object.values(ART_SIZES)) expect(s).toMatch(/vw|vh/)
  })
  it('gate plaques sit inside the frame and do not overlap', () => {
    for (const p of GATE_PLAQUES) {
      for (const v of [p.left, p.top, p.width, p.height]) {
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThanOrEqual(100)
      }
      expect(p.left + p.width).toBeLessThanOrEqual(100)
      expect(p.top + p.height).toBeLessThanOrEqual(100)
    }
    const [l, r] = GATE_PLAQUES
    expect(l.left + l.width).toBeLessThan(r.left)
  })
})
