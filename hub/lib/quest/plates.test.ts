import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../../public/quest/plates/manifest.json'
import { SCENE_IDS } from './scenes'
import { isSplitScene, plateGeometry, SPLIT_SCENE_IDS } from './plates'

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
    for (const f of manifest.scenes as Array<{ id: string; unsplit: boolean; recompose_max_channel_diff?: number }>) {
      if (f.unsplit) continue
      expect(f.recompose_max_channel_diff, f.id).toBeLessThan(1)
    }
  })
})
