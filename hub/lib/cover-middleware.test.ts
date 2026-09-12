import { describe, it, expect } from 'vitest'
import { handleCover, type CoverEnv } from './cover-middleware'

const COVER = 'trend-adweek-2026-09'
const COVER_HTML = '<html><head><title>q</title><meta name="robots" content="noindex, nofollow"/></head><body>quest <a href="/en/cover/trend-adweek-2026-09/">EN</a> <a href="/cover/trend-adweek-2026-09/">RU</a></body></html>'

function env(opts: { raw?: string | null; throws?: boolean; defaultCover?: string; kv?: boolean } = {}): CoverEnv & { fetched: string[] } {
  const fetched: string[] = []
  const e: CoverEnv & { fetched: string[] } = {
    fetched,
    ASSETS: {
      fetch: async (input: Request | URL | string) => {
        const u = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url)
        fetched.push(u.pathname)
        return new Response(COVER_HTML, { headers: { 'content-type': 'text/html; charset=utf-8' } })
      },
    },
    COVER_DEFAULT: opts.defaultCover,
  }
  if (opts.kv !== false) {
    e.SITE_COVER = {
      get: async () => {
        if (opts.throws) throw new Error('kv down')
        return opts.raw ?? null
      },
    }
  }
  return e
}
const floor = async () => new Response('<html><body>floor</body></html>', { headers: { 'content-type': 'text/html' } })
const req = (path: string, cookie?: string) => new Request(`https://x.test${path}`, { headers: cookie ? { cookie } : {} })

describe('handleCover', () => {
  it('no binding (production today) → floor passthrough, labelled', async () => {
    const res = await handleCover(req('/'), env({ kv: false }), floor)
    expect(await res.text()).toContain('floor')
    expect(res.headers.get('x-mc-cover')).toBe('floor')
  })
  it('preview default → cover HTML at /, noindex stripped', async () => {
    const e = env({ defaultCover: COVER })
    const res = await handleCover(req('/'), e, floor)
    const html = await res.text()
    expect(e.fetched).toEqual([`/cover/${COVER}/`])
    expect(html).toContain('quest')
    expect(html).not.toMatch(/name="robots"/)
    expect(html).not.toMatch(/\/cover\//)
    expect(html).toContain('href="/en/"')
    expect(html).toContain('href="/"')
    expect(res.headers.get('x-mc-cover')).toBe(COVER)
    expect(res.headers.get('vary')).toMatch(/cookie/i)
  })
  it('/en/ maps to the EN cover path', async () => {
    const e = env({ defaultCover: COVER })
    await handleCover(req('/en/'), e, floor)
    expect(e.fetched).toEqual([`/en/cover/${COVER}/`])
  })
  it('KV throwing → floor', async () => {
    const res = await handleCover(req('/'), env({ throws: true, defaultCover: COVER }), floor)
    expect(res.headers.get('x-mc-cover')).toBe('floor')
  })
  it('broken config → floor', async () => {
    const res = await handleCover(req('/'), env({ raw: '{bad', defaultCover: COVER }), floor)
    expect(res.headers.get('x-mc-cover')).toBe('floor')
  })
  it('without KV, COVER_CONFIG is the config source (and still fails to floor)', async () => {
    const promoted = { ...env({ kv: false }), COVER_CONFIG: `{"active":"${COVER}"}` }
    expect((await handleCover(req('/'), promoted, floor)).headers.get('x-mc-cover')).toBe(COVER)
    const broken = { ...env({ kv: false, defaultCover: COVER }), COVER_CONFIG: '{bad' }
    expect((await handleCover(req('/'), broken, floor)).headers.get('x-mc-cover')).toBe('floor')
  })
  it('paths other than / and /en/ are untouched', async () => {
    const e = env({ defaultCover: COVER })
    const res = await handleCover(req('/store/'), e, floor)
    expect(e.fetched).toEqual([])
    expect(res.headers.get('x-mc-cover')).toBeNull()
  })
  it('A/B sets a sticky cookie', async () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":100}}`
    const res = await handleCover(req('/'), env({ raw }), floor, () => 0.5)
    expect(res.headers.get('set-cookie')).toMatch(new RegExp(`^mc_variant=${COVER}\\.100;`))
    expect(res.headers.get('x-mc-cover')).toBe(COVER)
  })
  it('sticky cookie is read back', async () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":20}}`
    const res = await handleCover(req('/', `a=1; mc_variant=${COVER}.20`), env({ raw }), floor, () => 0.99)
    expect(res.headers.get('x-mc-cover')).toBe(COVER)
    expect(res.headers.get('set-cookie')).toBeNull()
  })
  it('forged or unknown-cover cookie is re-rolled, never trusted', async () => {
    const raw = `{"active":"floor","ab":{"cover":"${COVER}","share":50}}`
    for (const c of ['mc_variant=bogus.50', 'mc_variant=removed-cover.50', `mc_variant=${COVER}.99`, 'mc_variant=']) {
      const res = await handleCover(req('/', c), env({ raw }), floor, () => 0.9)
      expect(res.headers.get('x-mc-cover')).toBe('floor')
      expect(res.headers.get('set-cookie')).toMatch(/^mc_variant=floor\.50;/)
    }
  })
  it('HEAD on a cover home: cover headers, empty body', async () => {
    const res = await handleCover(new Request('https://x.test/', { method: 'HEAD' }), env({ defaultCover: COVER }), floor)
    expect(res.headers.get('x-mc-cover')).toBe(COVER)
    expect(await res.text()).toBe('')
  })
  it('query string does not change the decision', async () => {
    const e = env({ defaultCover: COVER })
    const res = await handleCover(req('/?utm_source=x'), e, floor)
    expect(res.headers.get('x-mc-cover')).toBe(COVER)
    expect(e.fetched).toEqual([`/cover/${COVER}/`])
  })
  it('rewritten cover body drops the asset validators and length', async () => {
    const e = env({ defaultCover: COVER })
    e.ASSETS.fetch = async () =>
      new Response(COVER_HTML, { headers: { 'content-type': 'text/html', etag: '"abc"', 'last-modified': 'x', 'content-length': '999' } })
    const res = await handleCover(req('/'), e, floor)
    expect(res.headers.get('etag')).toBeNull()
    expect(res.headers.get('last-modified')).toBeNull()
    expect(res.headers.get('content-length')).toBeNull()
  })
  // Client-side <Link> navigation to home fetches RSC files, not the document.
  // Before the fix these bypassed the choice and handed a cover visitor the floor.
  it('cover visitor: home RSC fetches redirect to the home document (both locales)', async () => {
    for (const [path, target] of [
      ['/index.txt', '/'], ['/__next._tree.txt', '/'], ['/__next.__PAGE__.txt', '/'],
      ['/en/index.txt', '/en/'], ['/en/__next._tree.txt', '/en/'],
    ]) {
      const e = env({ defaultCover: COVER })
      const res = await handleCover(req(path), e, floor)
      expect(res.status, path).toBe(307)
      expect(res.headers.get('location'), path).toBe(target)
      expect(res.headers.get('x-mc-cover')).toBe(COVER)
      expect(res.headers.get('cache-control')).toMatch(/private/)
      expect(e.fetched).toEqual([])
    }
  })
  it('floor visitor: home RSC fetches pass through untouched', async () => {
    const rsc = async () => new Response('0:rsc', { headers: { 'content-type': 'text/x-component' } })
    const res = await handleCover(req('/en/__next._tree.txt'), env({ kv: false }), rsc)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('0:rsc')
    expect(res.headers.get('x-mc-cover')).toBe('floor')
  })
  it('RSC files of other pages are untouched', async () => {
    const e = env({ defaultCover: COVER })
    const res = await handleCover(req('/store/__next._tree.txt'), e, floor)
    expect(res.headers.get('x-mc-cover')).toBeNull()
  })
})