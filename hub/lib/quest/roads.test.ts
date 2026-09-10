import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { FORK_IDS, roadStrip } from './scenes'

const PUBLIC = join(process.cwd(), 'public')
const KB = 1024
const GUIDES = ['scroller', 'builder'] as const
const STATES = ['day', 'night'] as const

describe('road strips (wave D)', () => {
  it('three forks × two guides × two states = twelve distinct, non-empty paths', () => {
    const paths = new Set<string>()
    for (const forkId of FORK_IDS) {
      for (const guide of GUIDES) {
        for (const state of STATES) {
          const p = roadStrip(forkId, guide, state)
          expect(p, `${forkId}/${guide}/${state}`).not.toBe('')
          paths.add(p)
        }
      }
    }
    expect(paths.size).toBe(12)
  })

  it('every strip file exists and is ≤ 300 KB', () => {
    for (const forkId of FORK_IDS) {
      for (const guide of GUIDES) {
        for (const state of STATES) {
          const rel = roadStrip(forkId, guide, state)
          const abs = join(PUBLIC, rel)
          expect(existsSync(abs), `missing ${rel}`).toBe(true)
          expect(statSync(abs).size, `${rel} over budget`).toBeLessThanOrEqual(300 * KB)
        }
      }
    }
  })

  it('the roads folder stays inside the 24 MB quest/ ceiling (checked as part of assets.test.ts total)', () => {
    const dir = join(PUBLIC, 'quest', 'roads')
    expect(existsSync(dir)).toBe(true)
    const files = readdirSync(dir)
    expect(files.length).toBeGreaterThanOrEqual(12)
  })
})
