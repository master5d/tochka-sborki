import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { handleCover } from './cover-middleware'

// Build-level check over the REAL static export (run by scripts/quest-smoke.mjs
// with COVER_BUILD=1 after `npm run build`): what a visitor receives at `/` when
// the cover is served there. Hand-written HTML in cover-middleware.test.ts cannot
// notice Next changing its robots markup; this can. Without COVER_BUILD it is
// skipped and says so; with it, a missing out/ is a failure, not a skip.
const OUT = join(__dirname, '..', 'out')
const COVER = 'trend-adweek-2026-09'
const build = process.env.COVER_BUILD === '1'

const assets = {
  fetch: async (input: Request | URL | string) => {
    const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
    return new Response(readFileSync(join(OUT, u.pathname, 'index.html'), 'utf8'), { headers: { 'content-type': 'text/html' } })
  },
}

describe.skipIf(!build)('cover served at home, over the built out/', () => {
  it('out/ exists', () => expect(existsSync(join(OUT, 'cover', COVER, 'index.html'))).toBe(true))
  for (const [path, lang] of [['/', 'ru'], ['/en/', 'en']] as const) {
    it(`${path}: no robots meta, no /cover/ link, still the quest`, async () => {
      const res = await handleCover(new Request(`https://x.test${path}`), { ASSETS: assets, COVER_DEFAULT: COVER }, async () => new Response('floor'))
      const html = await res.text()
      expect(res.headers.get('x-mc-cover')).toBe(COVER)
      expect(html).toContain(`lang="${lang}"`)
      expect(html).toContain('quest-')
      expect(html.match(/<meta name="robots"/g) ?? []).toHaveLength(0)
      expect(html.match(/href="(\/en)?\/cover\//g) ?? []).toHaveLength(0)
    })
  }
  it('the hidden cover pages themselves stay noindex', () => {
    for (const f of [join(OUT, 'cover', COVER, 'index.html'), join(OUT, 'en', 'cover', COVER, 'index.html')]) {
      expect(readFileSync(f, 'utf8')).toMatch(/<meta name="robots" content="noindex/)
    }
  })
  it('floor pages carry no robots meta at all', () => {
    for (const f of [join(OUT, 'index.html'), join(OUT, 'en', 'index.html')]) {
      expect(readFileSync(f, 'utf8').match(/<meta name="robots"/g) ?? []).toHaveLength(0)
    }
  })
})