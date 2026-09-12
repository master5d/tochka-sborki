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
})
