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

type SubscribeOutcome = 'ok' | 'already' | 'honeypot' | 'invalid_email' | 'upstream_error'

// Общая логика honeypot/валидации/форварда — общая для JSON- и form-путей.
async function subscribeCore(body: SubscribeBody): Promise<SubscribeOutcome> {
  // Honeypot: боты заполняют скрытое поле — молча съедаем без форварда.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return 'honeypot'
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email.includes('@') || email.length > 254) {
    return 'invalid_email'
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
    return 'upstream_error'
  }

  // listmonk отвечает 409/"already subscribed"-стилем на дубликат — для UX это успех.
  if (upstream.status === 409 || /already/i.test(upstreamText)) return 'already'
  if (upstream.ok) return 'ok'
  return 'upstream_error'
}

async function handleSubscribe(request: Request): Promise<Response> {
  const contentType = request.headers.get('Content-Type') || ''

  // Нативный no-JS фолбэк: браузерный form-encoded сабмит → 303-редирект на страницу,
  // статус в query-параметре ?subscribed=… (страница показывает сообщение).
  if (contentType.includes('application/x-www-form-urlencoded')) {
    let body: SubscribeBody
    try {
      const form = await request.formData()
      body = { email: form.get('email'), website: form.get('website') }
    } catch {
      body = {}
    }
    const outcome = await subscribeCore(body)
    const param: Record<SubscribeOutcome, string> = {
      ok: '1',
      honeypot: '1', // бота не отличаем — тот же «успех»
      already: 'already',
      invalid_email: 'invalid',
      upstream_error: 'error',
    }
    return new Response(null, {
      status: 303,
      headers: { Location: `/?subscribed=${param[outcome]}` },
    })
  }

  // JSON-путь (fetch со страницы и блог-форма mamaev.coach).
  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return json({ ok: false, error: 'bad_json' }, 400)
  }
  const outcome = await subscribeCore(body)
  switch (outcome) {
    case 'honeypot':
      return json({ ok: true })
    case 'ok':
      return json({ ok: true })
    case 'already':
      return json({ ok: true, already: true })
    case 'invalid_email':
      return json({ ok: false, error: 'invalid_email' }, 400)
    case 'upstream_error':
      return json({ ok: false, error: 'upstream_error' }, 502)
  }
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

    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  },
}
