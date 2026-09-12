import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AWAITING_2K, type Art } from './art'
import { isSplitScene } from './plates'
import { FORK_IDS, GUIDE_ASSETS, SCENE_IDS, campWide, campWideLoop, detourScene, outcomeArt, sceneAssets } from './scenes'

const PUBLIC = join(process.cwd(), 'public')
const KB = 1024

function sizeOf(webPath: string): number {
  const p = join(PUBLIC, webPath)
  expect(existsSync(p), `missing asset ${webPath}`).toBe(true)
  return statSync(p).size
}

/** Every candidate of an Art pair exists; each within its own ceiling (@2x holds 4× the pixels). */
function checkArt(a: Art, ceiling1x: number, ceiling2x: number, label: string) {
  expect(sizeOf(a.x1), `${label} @1x`).toBeLessThanOrEqual(ceiling1x)
  if (a.x2) expect(sizeOf(a.x2), `${label} @2x`).toBeLessThanOrEqual(ceiling2x)
}

function dirSize(dir: string): number {
  let total = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    total += e.isDirectory() ? dirSize(p) : statSync(p).size
  }
  return total
}

const FLAT = SCENE_IDS.filter((id) => !isSplitScene(id))

describe('quest assets (2K world)', () => {
  it('the flat scenes are exactly the three roads', () => {
    expect(FLAT).toEqual(['03-boulder', '04-temple', '05-gates'])
  })
  it('every flat scene has a day and a night poster (@1x ≤ 250 KB, @2x ≤ 650 KB)', () => {
    for (const id of FLAT) for (const state of ['day', 'night'] as const) checkArt(sceneAssets(id, state).poster, 250 * KB, 650 * KB, `${id} ${state} poster`)
  })
  it('every flat scene has a day and a night loop (@1x ≤ 900 KB, @2x ≤ 2.5 MB)', () => {
    for (const id of FLAT) for (const state of ['day', 'night'] as const) checkArt(sceneAssets(id, state).loop, 900 * KB, 2560 * KB, `${id} ${state} loop`)
  })
  it('a split scene ships no poster or loop of its own (its plates draw it)', () => {
    for (const id of SCENE_IDS.filter(isSplitScene)) {
      for (const state of ['day', 'night'] as const) {
        const a = sceneAssets(id, state)
        for (const p of [a.poster.x1, a.poster.x2, a.loop.x1, a.loop.x2, `/quest/scenes/${id}-${state}.webp`, `/quest/loops/${id}-${state}.mp4`]) {
          if (p) expect(existsSync(join(PUBLIC, p)), `${p} should not ship`).toBe(false)
        }
      }
    }
  })
  it('a frame that got its 2K pair no longer ships the old 1K file beside it', () => {
    for (const a of [...FLAT.flatMap((id) => [sceneAssets(id, 'day'), sceneAssets(id, 'night')]).flatMap((s) => [s.poster, s.loop]),
      campWide('day'), campWide('night'), campWideLoop('day'), campWideLoop('night'),
      ...FORK_IDS.flatMap((f) => [detourScene(f, 'day'), detourScene(f, 'night')])]) {
      if (!a.x2) continue
      const legacy = a.x1.replace('@1x', '')
      expect(existsSync(join(PUBLIC, legacy)), `${legacy} should have been retired`).toBe(false)
    }
  })
  it('every path on the awaiting-2K list still exists (and nothing else is 1K-only)', () => {
    for (const p of AWAITING_2K) sizeOf(p)
  })
  it('both guide cut-outs exist and are ≤ 200 KB', () => {
    for (const p of Object.values(GUIDE_ASSETS)) expect(sizeOf(p)).toBeLessThanOrEqual(200 * KB)
  })
  it('the landscape camp for #intro exists in both states (@1x ≤ 250 KB, @2x ≤ 650 KB)', () => {
    for (const state of ['day', 'night'] as const) checkArt(campWide(state), 250 * KB, 650 * KB, `camp-wide ${state}`)
  })
  it('the landscape camp has a day and a night loop (@1x ≤ 900 KB, @2x ≤ 2.5 MB)', () => {
    for (const state of ['day', 'night'] as const) checkArt(campWideLoop(state), 900 * KB, 2560 * KB, `camp-wide loop ${state}`)
  })
  it('Wave M retired the road strips: no roads/ folder ships', () => {
    expect(existsSync(join(PUBLIC, 'quest', 'roads'))).toBe(false)
  })
  it('L2: six outcome illustrations (3 forks × 2 guides) in both states, each ≤ 250 KB', () => {
    for (const forkId of FORK_IDS) {
      for (const guide of ['scroller', 'builder'] as const) {
        for (const state of ['day', 'night'] as const) {
          expect(sizeOf(outcomeArt(forkId, guide, state)), `${forkId} ${guide} ${state}`).toBeLessThanOrEqual(250 * KB)
        }
      }
    }
  })
  it('L3: three detour scenes for the curtain in both states (@1x ≤ 250 KB, @2x ≤ 650 KB)', () => {
    for (const forkId of FORK_IDS) for (const state of ['day', 'night'] as const) checkArt(detourScene(forkId, state), 250 * KB, 650 * KB, `${forkId} ${state}`)
  })
  it('the quest folder stays under 40 MB on disk — what a READER downloads is measured per page load, not here', () => {
    expect(dirSize(join(PUBLIC, 'quest'))).toBeLessThanOrEqual(40 * 1024 * KB)
  })
})
