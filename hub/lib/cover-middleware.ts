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

export async function handleCover(
  request: Request,
  env: CoverEnv,
  next: () => Promise<Response>,
  rand: () => number = Math.random,
): Promise<Response> {
  const url = new URL(request.url)
  const locale = url.pathname === '/' ? 'ru' : url.pathname === '/en/' ? 'en' : null
  if (!locale) return next()

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
  } else {
    const asset = await env.ASSETS.fetch(new URL(coverPath(choice.variant, locale), url))
    // The cover lives at a noindex path; served at `/` it must not deindex home.
    const html = (await asset.text()).replace(ROBOTS_META, '')
    res = new Response(html, asset)
  }
  res.headers.set('x-mc-cover', choice.variant)
  res.headers.set('vary', 'Cookie')
  res.headers.set('cache-control', 'private, max-age=0, must-revalidate')
  if (choice.setCookie) {
    res.headers.set('set-cookie', `${COOKIE}=${choice.setCookie}; Path=/; Max-Age=2592000; SameSite=Lax; Secure`)
  }
  return res
}
