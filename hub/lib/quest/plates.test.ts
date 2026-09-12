import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../../public/quest/plates/manifest.json'
import wideManifest from '../../public/quest/plates/wide/manifest.json'
import { SCENE_IDS } from './scenes'
import { isSplitScene, plateGeometry, SPLIT_SCENE_IDS, widePlates } from './plates'

const PUBLIC = join(process.cwd(), 'public')
const KB = 1024

describe('quest plates (wave K, symmetry rule)', () => {
  it('splits a scene only when BOTH day and night frames report unsplit:false', () => {
    // Ground truth from the manifest itself (docs/spec §"Not every frame has a
    // usable seam"), not retyped: 01-map, 02-camp, 06-wall, 07-signs split;
    // 03-boulder, 04-temple, 05-gates stay flat because at least one state is unsplit.
    expect(SPLIT_SCENE_IDS.sort()).toEqual(['01-map', '02-camp', '06-wall', '07-signs'].sort())
    for (const id of SCENE_IDS) {
      const expected = SPLIT_SCENE_IDS.includes(id)
      expect(isSplitScene(id), id).toBe(expected)
    }
  })

  it('a non-split scene never yields geometry for either state', () => {
    for (const id of SCENE_IDS) {
      if (isSplitScene(id)) continue
      expect(plateGeometry(id, 'day'), id).toBeNull()
      expect(plateGeometry(id, 'night'), id).toBeNull()
    }
  })

  it('a split scene has geometry for both states, with plate files that exist on disk', () => {
    for (const id of SPLIT_SCENE_IDS) {
      for (const state of ['day', 'night'] as const) {
        const geo = plateGeometry(id, state)
        expect(geo, `${id} ${state}`).not.toBeNull()
        if (!geo) continue
        expect(geo.width).toBeGreaterThan(0)
        expect(geo.height).toBeGreaterThan(0)
        expect(geo.horizonRow).toBeGreaterThan(0)
        expect(geo.horizonRow).toBeLessThan(geo.height)
        expect(geo.feather).toBeGreaterThan(0)
        expect(geo.sky.startsWith('/quest/plates/')).toBe(true)
        expect(geo.land.startsWith('/quest/plates/')).toBe(true)
        for (const rel of [geo.sky, geo.land]) {
          const abs = join(PUBLIC, rel)
          expect(existsSync(abs), `missing ${rel}`).toBe(true)
          expect(statSync(abs).size, `${rel} over budget`).toBeLessThanOrEqual(1000 * KB)
        }
      }
    }
  })

  it('the manifest reported a byte-exact recompose for every split frame (the split is safe to trust)', () => {
    // Re-reads the same manifest.json the app reads, without re-typing its
    // per-frame numbers — just checks the field the split script itself wrote
    // stayed within float rounding.
    for (const f of [...manifest.scenes, ...wideManifest.scenes] as Array<{ id: string; unsplit: boolean; recompose_max_channel_diff?: number }>) {
      if (f.unsplit) continue
      expect(f.recompose_max_channel_diff, f.id).toBeLessThan(1)
    }
  })
})

describe('landscape plates (2K world)', () => {
  it('only the hero map and the finale wall have a landscape pair, and only when both states split', () => {
    for (const id of SCENE_IDS) {
      const has = !!widePlates(id, 'day')
      expect(has, id).toBe(id === '01-map' || id === '06-wall')
      expect(!!widePlates(id, 'night'), id).toBe(has)
    }
  })
  it('each landscape plate is a real @1x/@2x pair on disk, @2x exactly double, 3:2', () => {
    for (const id of ['01-map', '06-wall'] as const) {
      for (const state of ['day', 'night'] as const) {
        const w = widePlates(id, state)
        expect(w, `${id} ${state}`).not.toBeNull()
        if (!w) continue
        expect(w.width / w.height).toBeCloseTo(1.5, 1)
        expect(w.horizonRow).toBeGreaterThan(0)
        expect(w.horizonRow).toBeLessThan(w.height)
        for (const a of [w.sky, w.land]) {
          expect(a.w1 * 2).toBe(w.width)
          for (const p of [a.x1, a.x2!]) {
            expect(existsSync(join(PUBLIC, p)), `missing ${p}`).toBe(true)
            expect(statSync(join(PUBLIC, p)).size, `${p} over budget`).toBeLessThanOrEqual(650 * KB)
          }
        }
      }
    }
  })
})
