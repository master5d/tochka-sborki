import { describe, expect, it } from 'vitest'
import { GATE_PLAQUES, SCENES, SCENE_IDS, sceneAssets } from './scenes'

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
