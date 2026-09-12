import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homeOf } from './cover-middleware'

// public/_routes.json decides which requests wake the cover Function. Every path
// homeOf() claims must be routed there, or a cover visitor gets the floor's file.
const routes = JSON.parse(readFileSync(join(__dirname, '..', 'public', '_routes.json'), 'utf8')) as {
  include: string[]
  exclude: string[]
}
const matches = (rule: string, path: string) =>
  new RegExp('^' + rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$').test(path)

describe('_routes.json', () => {
  it('routes every home document and home RSC file to the Function', () => {
    for (const path of ['/', '/en/', '/index.txt', '/__next._tree.txt', '/__next.__PAGE__.txt', '/en/index.txt', '/en/__next._full.txt']) {
      expect(homeOf(path), path).not.toBeNull()
      expect(routes.include.some((r) => matches(r, path)), path).toBe(true)
    }
  })
  it('keeps assets and other pages static', () => {
    for (const path of ['/_next/static/chunks/a.js', '/quest/scenes/01-map-day.webp', '/store/', '/store/index.txt', '/blog/x/']) {
      expect(routes.include.some((r) => matches(r, path)), path).toBe(false)
    }
  })
})