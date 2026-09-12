// Core of the Pages Function in functions/_middleware.ts, kept here so vitest can
// drive it with a fake env (a *.test.ts inside functions/ would become a route).
// Config source: KV `SITE_COVER` key `config` when bound (switch in seconds, no
// redeploy); otherwise the `COVER_CONFIG` variable. Neither → `COVER_DEFAULT`
// (set only for preview deployments) → floor.
import { chooseVariant } from './cover-select'
import { FLOOR, coverPath } from './covers'

export interface CoverEnv {
  SITE_COVER?: { get(key: string): Promise<string | null> }
  COVER_CONFIG?: string
  COVER_DEFAULT?: string
  ASSETS: { fetch(input: Request | URL | string): Promise<Response> }
}

const COOKIE = 'mc_variant'
const ROBOTS_META = /<meta name="robots" content="[^"]*"\s*\/?>/g
// The cover's own locale-twin link (header language switch) points at the hidden
// path; served at the home page it must point at the home page.
const COVER_HREF = /href="(\/en)?\/cover\/[a-z0-9-]+\/"/g

function readCookie(header: string | null): string | null {
  if (!header) return null
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === COOKIE) return v.join('=')
  }
  return null
}

async function readConfig(env: CoverEnv): Promise<string | null> {
  if (env.SITE_COVER) {
    try {
      return await env.SITE_COVER.get('config')
    } catch {
      return '{"kv":"unavailable"'
    }
  }
  return env.COVER_CONFIG ?? null
}

// Which home a request belongs to. Besides the documents `/` and `/en/`, the
// client router fetches the home page as RSC files (`/index.txt`,
// `/__next.<segment>.txt`, and their `/en/` twins) when a <Link> navigates
// there. Those files are the floor's; a cover visitor must never be handed them.
export function homeOf(pathname: string): { locale: 'ru' | 'en'; rsc: boolean } | null {
  if (pathname === '/') return { locale: 'ru', rsc: false }
  if (pathname === '/en/') return { locale: 'en', rsc: false }
  const m = /^(\/en)?\/(index\.txt|__next\.[^/]+\.txt)$/.exec(pathname)
  return m ? { locale: m[1] ? 'en' : 'ru', rsc: true } : null
}

export async function handleCover(
  request: Request,
  env: CoverEnv,
  next: () => Promise<Response>,
  rand: () => number = Math.random,
): Promise<Response> {
  // Only reads are served a cover; any other method reaches the assets exactly as
  // it would on the floor (a static site answers them 405).
  if (request.method !== 'GET' && request.method !== 'HEAD') return next()
  const url = new URL(request.url)
  const home = homeOf(url.pathname)
  if (!home) return next()
  const { locale } = home

  const choice = chooseVariant({
    raw: await readConfig(env),
    defaultCover: env.COVER_DEFAULT,
    cookie: readCookie(request.headers.get('cookie')),
    rand: rand(),
  })

  let res: Response
  if (choice.variant === FLOOR) {
    const passthrough = await next()
    res = new Response(passthrough.body, passthrough)
  } else if (home.rsc) {
    // Answer the router's RSC fetch with a redirect to the home document: the
    // followed response is HTML, not a flight payload, so Next falls back to a
    // full page load of `/` or `/en/` — which comes back through this function.
    res = new Response(null, { status: 307, headers: { location: locale === 'en' ? '/en/' : '/' } })
  } else {
    const asset = await env.ASSETS.fetch(new URL(coverPath(choice.variant, locale), url))
    // The cover lives at a noindex path; served at `/` it must not deindex home.
    const html = (await asset.text()).replace(ROBOTS_META, '').replace(COVER_HREF, 'href="$1/"')
    res = new Response(request.method === 'HEAD' ? null : html, asset)
    // The body was rewritten: the asset's validators and length no longer describe it.
    for (const h of ['etag', 'last-modified', 'content-length']) res.headers.delete(h)
  }
  res.headers.set('x-mc-cover', choice.variant)
  res.headers.set('vary', 'Cookie')
  res.headers.set('cache-control', 'private, max-age=0, must-revalidate')
  if (choice.setCookie) {
    res.headers.set('set-cookie', `${COOKIE}=${choice.setCookie}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`)
  }
  return res
}