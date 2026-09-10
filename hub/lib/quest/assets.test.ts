import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FORK_IDS, GUIDE_ASSETS, SCENE_IDS, roadStrip, sceneAssets } from './scenes'

const PUBLIC = join(process.cwd(), 'public')
const KB = 1024

function sizeOf(webPath: string): number {
  const p = join(PUBLIC, webPath)
  expect(existsSync(p), `missing asset ${webPath}`).toBe(true)
  return statSync(p).size
}

function dirSize(dir: string): number {
  let total = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    total += e.isDirectory() ? dirSize(p) : statSync(p).size
  }
  return total
}

describe('quest assets', () => {
  it('every scene has a day and a night poster, each ≤ 400 KB', () => {
    for (const id of SCENE_IDS) {
      for (const state of ['day', 'night'] as const) {
        const a = sceneAssets(id, state)
        expect(sizeOf(a.poster), `${id} ${state} poster`).toBeLessThanOrEqual(400 * KB)
      }
    }
  })
  it('the old horizontal (stateless) scene posters and loops are gone', () => {
    for (const id of SCENE_IDS) {
      expect(existsSync(join(PUBLIC, 'quest', 'scenes', `${id}.webp`)), `${id}.webp should have been retired`).toBe(false)
      expect(existsSync(join(PUBLIC, 'quest', 'loops', `${id}.mp4`)), `${id}.mp4 should have been retired`).toBe(false)
    }
  })
  it('no loop files exist yet — this wave ships posters only (Wave E regenerates loops)', () => {
    for (const id of SCENE_IDS) {
      for (const state of ['day', 'night'] as const) {
        const a = sceneAssets(id, state)
        expect(existsSync(join(PUBLIC, a.loop)), `${a.loop} should not exist yet`).toBe(false)
      }
    }
  })
  it('both guide cut-outs exist and are ≤ 200 KB', () => {
    for (const p of Object.values(GUIDE_ASSETS)) expect(sizeOf(p)).toBeLessThanOrEqual(200 * KB)
  })
  it('wave D: every fork has twelve road strips (3 forks × 2 guides × 2 states), each ≤ 300 KB', () => {
    for (const forkId of FORK_IDS) {
      for (const guide of ['scroller', 'builder'] as const) {
        for (const state of ['day', 'night'] as const) {
          expect(sizeOf(roadStrip(forkId, guide, state)), `${forkId} ${guide} ${state}`).toBeLessThanOrEqual(300 * KB)
        }
      }
    }
  })
  it('the whole quest folder stays under 24 MB', () => {
    expect(dirSize(join(PUBLIC, 'quest'))).toBeLessThanOrEqual(24 * 1024 * KB)
  })
})
