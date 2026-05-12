import type { Env } from '../lib/types'
import { signJWT, generateToken } from '../lib/jwt'
import { requireAuth } from '../middleware'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function handleSendLink(request: Request, env: Env): Promise<Response> {
  let body: { email?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  if (!user) {
    const id = crypto.randomUUID()
    await env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').bind(id, email, Math.floor(Date.now() / 1000)).run()
    user = { id }
  }

  const token = generateToken()
  const expiresAt = Math.floor(Date.now() / 1000) + 900
  await env.DB.prepare('INSERT INTO magic_links (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expiresAt).run()

  let resendRes: Response
  try {
    resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Точка Сборки <noreply@mamaev.coach>',
        to: [email],
        subject: 'Войти в Точку Сборки',
        html: `
          <p>Нажми, чтобы войти в курс:</p>
          <p><a href="https://mamaev.coach/auth/verify?token=${token}" style="color:#00ff88">Войти →</a></p>
          <p style="color:#666;font-size:12px">Ссылка действует 15 минут. Если ты не запрашивал вход — проигнорируй письмо.</p>
        `,
      }),
    })
  } catch {
    return Response.json({ error: 'Failed to send email' }, { status: 502 })
  }

  if (!resendRes.ok) {
    return Response.json({ error: 'Failed to send email' }, { status: 502 })
  }

  return Response.json({ ok: true })
}

export async function handleVerify(request: Request, env: Env): Promise<Response> {
  let body: { token?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const token = body.token?.trim() ?? ''
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 })

  const now = Math.floor(Date.now() / 1000)
  const link = await env.DB.prepare(
    'SELECT token, user_id, expires_at, used_at FROM magic_links WHERE token = ?'
  ).bind(token).first<{ token: string; user_id: string; expires_at: number; used_at: number | null }>()

  if (!link) return Response.json({ error: 'Invalid token' }, { status: 401 })
  if (link.used_at !== null) return Response.json({ error: 'Token already used' }, { status: 401 })
  if (link.expires_at < now) return Response.json({ error: 'Token expired' }, { status: 401 })

  await env.DB.prepare('UPDATE magic_links SET used_at = ? WHERE token = ?').bind(now, token).run()

  const userRow = await env.DB.prepare('SELECT email FROM users WHERE id = ?').bind(link.user_id).first<{ email: string }>()
  if (!userRow) return Response.json({ error: 'Internal error' }, { status: 500 })
  const email = userRow.email

  const jwt = await signJWT(
    { sub: link.user_id, email, iat: now, exp: now + 2592000 },
    env.WORKER_JWT_SECRET
  )

  const cookie = `session=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`
  return new Response(JSON.stringify({ ok: true, email }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  })
}

export async function handleMe(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth
  return Response.json({ id: auth.sub, email: auth.email })
}

export async function handleLogout(_request: Request, _env: Env): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
    },
  })
}
