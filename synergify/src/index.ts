import { PAGE_HTML } from './page'

// Public constants — listmonk public subscription API (no secrets; Гейт №0: CORS
// отсутствует у listmonk, поэтому воркер обязан проксировать подписку).
const LISTMONK_URL = 'https://mail.mamaev.coach/api/public/subscription'
const LIST_UUID = 'cf27c05a-a3e2-4ba4-94b8-17a485b8ea95'

// Блог-форма на mamaev.coach ходит на этот же эндпоинт кросс-доменно.
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': 'https://mamaev.coach',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS_HEADERS },
  })
}

type SubscribeBody = { email?: unknown; website?: unknown }

async function handleSubscribe(request: Request): Promise<Response> {
  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400)
  }

  // Honeypot: боты заполняют скрытое поле — молча съедаем без форварда.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email.includes('@') || email.length < 3 || email.length > 254) {
    return json({ ok: false, error: 'invalid_email' }, 400)
  }

  let upstream: Response
  let upstreamText = ''
  try {
    upstream = await fetch(LISTMONK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: '', list_uuids: [LIST_UUID] }),
    })
    upstreamText = await upstream.text()
  } catch {
    return json({ ok: false, error: 'upstream_unreachable' }, 502)
  }

  // listmonk отвечает 409/"already subscribed"-стилем на дубликат — для UX это успех.
  const already = upstream.status === 409 || /already/i.test(upstreamText)
  if (already) return json({ ok: true, already: true })
  if (upstream.ok) return json({ ok: true })
  return json({ ok: false, error: 'upstream_error' }, 502)
}

export default {
  async fetch(request: Request, _env: unknown, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    const path = url.pathname

    if (request.method === 'OPTIONS' && path === '/api/subscribe') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    if (request.method === 'GET' && (path === '/' || path === '/index.html')) {
      return new Response(PAGE_HTML, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'Content-Security-Policy':
            "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'",
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      })
    }

    if (request.method === 'POST' && path === '/api/subscribe') {
      return handleSubscribe(request)
    }

    return new Response('Not found', { status: 404 })
  },
}
