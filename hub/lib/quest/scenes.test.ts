import { describe, expect, it } from 'vitest'
import { DETOUR_SCENE_SIZE, FORK_IDS, GATE_PLAQUES, OUTCOME_ART_SIZE, SCENES, SCENE_IDS, detourScene, outcomeArt, sceneAssets } from './scenes'

describe('quest outcome art + detour scenes (L2/L3)', () => {
  it('outcome art is keyed by fork, guide and state (habit road = scroller, detour = builder)', () => {
    expect(outcomeArt('boulder', 'scroller', 'day')).toBe('/quest/outcomes/boulder-scroller-day.webp')
    expect(outcomeArt('gates', 'builder', 'night')).toBe('/quest/outcomes/gates-builder-night.webp')
  })
  it('every fork has a detour scene in both states', () => {
    for (const f of FORK_IDS) {
      expect(detourScene(f, 'day')).toBe(`/quest/detours/${f}-day.webp`)
      expect(detourScene(f, 'night')).toBe(`/quest/detours/${f}-night.webp`)
    }
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
  it('asset paths are under /quest/ and keyed by state', () => {
    const day = sceneAssets('02-camp', 'day')
    expect(day.poster).toBe('/quest/scenes/02-camp-day.webp')
    expect(day.loop).toBe('/quest/loops/02-camp-day.mp4')
    const night = sceneAssets('02-camp', 'night')
    expect(night.poster).toBe('/quest/scenes/02-camp-night.webp')
    expect(night.loop).toBe('/quest/loops/02-camp-night.mp4')
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
