import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUIDE_ASSETS, SCENE_IDS, sceneAssets } from './scenes'

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
  it('every scene has a poster ≤ 350 KB and a loop ≤ 900 KB', () => {
    for (const id of SCENE_IDS) {
      const a = sceneAssets(id)
      expect(sizeOf(a.poster), `${id} poster`).toBeLessThanOrEqual(350 * KB)
      expect(sizeOf(a.loop), `${id} loop`).toBeLessThanOrEqual(900 * KB)
    }
  })
  it('both guide cut-outs exist and are ≤ 200 KB', () => {
    for (const p of Object.values(GUIDE_ASSETS)) expect(sizeOf(p)).toBeLessThanOrEqual(200 * KB)
  })
  it('the whole quest folder stays under 9 MB', () => {
    expect(dirSize(join(PUBLIC, 'quest'))).toBeLessThanOrEqual(9 * 1024 * KB)
  })
})
