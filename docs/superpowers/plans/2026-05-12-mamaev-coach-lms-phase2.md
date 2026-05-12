# mamaev.coach LMS Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить auth (email magic link через Resend), progress tracking (CF D1) и живой feedback webhook (CF Worker → n8n) к статическому сайту mamaev.coach.

**Architecture:** Весь backend — отдельные Cloudflare Workers в папке `workers/`, роутящиеся через `mamaev.coach/api/*`. Фронтенд остаётся статическим Next.js export на CF Pages. Auth через magic link (нет паролей): email → Resend → JWT в httpOnly cookie. Прогресс хранится в CF D1 (SQLite), два уровня: viewed (авто) и completed (ручная кнопка).

**Tech Stack:** Cloudflare Workers (TypeScript), CF D1 (SQLite), Resend API, Web Crypto API (JWT HS256), Next.js 16 (React context для прогресса), Vitest (unit тесты)

---

## File Map

```
workers/                          ← НОВАЯ папка (весь backend)
├── package.json
├── tsconfig.json
├── wrangler.toml
├── vitest.config.ts
├── migrations/
│   └── 0001_initial.sql
└── src/
    ├── index.ts                  ← router (entry point)
    ├── lib/
    │   ├── types.ts              ← Env interface, JWTPayload
    │   └── jwt.ts                ← sign/verify JWT (Web Crypto)
    ├── middleware.ts             ← requireAuth(request, env)
    └── handlers/
        ├── feedback.ts           ← POST /api/feedback → n8n
        ├── auth.ts               ← send-link, verify, me, logout
        └── progress.ts           ← view, complete, list

workers/src/lib/jwt.test.ts
workers/src/handlers/feedback.test.ts
workers/src/handlers/auth.test.ts
workers/src/handlers/progress.test.ts

web/app/layout.tsx                ← ИЗМЕНИТЬ: добавить <ProgressProvider>
web/app/feedback/page.tsx         ← ИЗМЕНИТЬ: client-side submit
web/components/nav.tsx            ← ИЗМЕНИТЬ: добавить Login/Войти ссылку
web/components/sidebar.tsx        ← ИЗМЕНИТЬ: 'use client', progress иконки
web/components/lesson-layout.tsx  ← ИЗМЕНИТЬ: 'use client', view/complete logic

web/components/progress-provider.tsx  ← НОВЫЙ: 'use client', React context
web/components/feedback-form.tsx      ← НОВЫЙ: 'use client', форма
web/app/login/page.tsx                ← НОВЫЙ: 'use client'
web/app/auth/verify/page.tsx          ← НОВЫЙ: server wrapper
web/app/auth/verify/verify-client.tsx ← НОВЫЙ: 'use client'
web/app/dashboard/page.tsx            ← НОВЫЙ: 'use client'

.github/workflows/deploy.yml      ← ИЗМЕНИТЬ: добавить workers deploy job
```

---

## Task 1: Workers scaffold + D1 migrations

**Files:**
- Create: `workers/package.json`
- Create: `workers/tsconfig.json`
- Create: `workers/wrangler.toml`
- Create: `workers/vitest.config.ts`
- Create: `workers/migrations/0001_initial.sql`

- [ ] **Step 1: Создать папку и `workers/package.json`**

Выполнить из `C:\telo\Efforts\Ongoing\MDS_AI_COURSE`:

```bash
mkdir workers && cd workers && mkdir -p src/lib src/handlers migrations
```

Создать `workers/package.json`:

```json
{
  "name": "tochka-sborki-api",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240524.0",
    "typescript": "^5.4.0",
    "vitest": "^2.0.0",
    "wrangler": "^3.60.0"
  }
}
```

- [ ] **Step 2: Установить зависимости**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npm install
```

Ожидается: `node_modules/` создан, нет ошибок.

- [ ] **Step 3: Создать `workers/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

- [ ] **Step 4: Создать `workers/wrangler.toml`**

```toml
name = "tochka-sborki-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"

[[d1_databases]]
binding = "DB"
database_name = "tochka-sborki-db"
database_id = "FILL_AFTER_D1_CREATE"

[[routes]]
pattern = "mamaev.coach/api/*"
zone_name = "mamaev.coach"
```

- [ ] **Step 5: Создать `workers/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
})
```

- [ ] **Step 6: Создать D1 базу данных**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npx wrangler d1 create tochka-sborki-db
```

Ожидается: вывод содержит `database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"`.

Скопировать этот ID и заменить `FILL_AFTER_D1_CREATE` в `wrangler.toml`.

- [ ] **Step 7: Создать `workers/migrations/0001_initial.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS magic_links (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE TABLE IF NOT EXISTS progress (
  user_id TEXT NOT NULL,
  lesson_slug TEXT NOT NULL,
  viewed_at INTEGER NOT NULL,
  completed_at INTEGER,
  PRIMARY KEY (user_id, lesson_slug)
);
```

- [ ] **Step 8: Применить миграции к remote D1**

```bash
npx wrangler d1 execute tochka-sborki-db --remote --file=migrations/0001_initial.sql
```

Ожидается: `✅ Successfully executed SQL` (без ошибок).

- [ ] **Step 9: Применить миграции к local D1 (для wrangler dev)**

```bash
npx wrangler d1 execute tochka-sborki-db --local --file=migrations/0001_initial.sql
```

- [ ] **Step 10: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/
git commit -m "chore: workers scaffold + D1 migrations"
```

---

## Task 2: workers/src/lib/types.ts + jwt.ts (TDD)

**Files:**
- Create: `workers/src/lib/types.ts`
- Create: `workers/src/lib/jwt.ts`
- Create: `workers/src/lib/jwt.test.ts`

- [ ] **Step 1: Создать `workers/src/lib/types.ts`**

```typescript
export interface Env {
  DB: D1Database
  WORKER_JWT_SECRET: string
  RESEND_API_KEY: string
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
}

export interface JWTPayload {
  sub: string    // user_id
  email: string
  iat: number
  exp: number
}
```

- [ ] **Step 2: Написать падающие тесты `workers/src/lib/jwt.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { signJWT, verifyJWT } from './jwt'

describe('signJWT', () => {
  it('returns a three-part dot-separated token', async () => {
    const token = await signJWT({ sub: 'u1', email: 'a@b.com', iat: 1000, exp: 2000 }, 'secret')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifyJWT', () => {
  it('returns payload for valid token', async () => {
    const payload = { sub: 'u1', email: 'a@b.com', iat: 1000, exp: 9999999999 }
    const token = await signJWT(payload, 'secret')
    const result = await verifyJWT(token, 'secret')
    expect(result).not.toBeNull()
    expect(result!.sub).toBe('u1')
    expect(result!.email).toBe('a@b.com')
  })

  it('returns null for wrong secret', async () => {
    const token = await signJWT({ sub: 'u1', email: 'a@b.com', iat: 1000, exp: 9999999999 }, 'secret')
    const result = await verifyJWT(token, 'wrong-secret')
    expect(result).toBeNull()
  })

  it('returns null for expired token', async () => {
    const token = await signJWT({ sub: 'u1', email: 'a@b.com', iat: 1000, exp: 1001 }, 'secret')
    const result = await verifyJWT(token, 'secret')
    expect(result).toBeNull()
  })

  it('returns null for malformed token', async () => {
    const result = await verifyJWT('not.a.token', 'secret')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 3: Запустить — убедиться что падает**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npm test
```

Ожидается: `FAIL — Cannot find module './jwt'`

- [ ] **Step 4: Создать `workers/src/lib/jwt.ts`**

```typescript
import type { JWTPayload } from './types'

function b64url(data: string): string {
  return btoa(data).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlDecode(s: string): string {
  return atob(s.replace(/-/g, '+').replace(/_/g, '/'))
}

async function getKey(secret: string, usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usage
  )
}

export async function signJWT(payload: JWTPayload, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const data = `${header}.${body}`
  const key = await getKey(secret, ['sign'])
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sig = b64url(String.fromCharCode(...new Uint8Array(sigBuffer)))
  return `${data}.${sig}`
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const [header, body, sig] = parts
    const data = `${header}.${body}`
    const key = await getKey(secret, ['verify'])
    const sigBytes = Uint8Array.from(b64urlDecode(sig), c => c.charCodeAt(0))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data))
    if (!valid) return null
    const payload: JWTPayload = JSON.parse(b64urlDecode(body))
    if (payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}

export function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}
```

- [ ] **Step 5: Запустить тесты — убедиться что зелёные**

```bash
npm test
```

Ожидается: `4 tests passed`

- [ ] **Step 6: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/src/lib/
git commit -m "feat: JWT sign/verify + token generator (Web Crypto)"
```

---

## Task 3: middleware.ts + handlers/feedback.ts (TDD)

**Files:**
- Create: `workers/src/middleware.ts`
- Create: `workers/src/handlers/feedback.ts`
- Create: `workers/src/handlers/feedback.test.ts`

- [ ] **Step 1: Создать `workers/src/middleware.ts`**

```typescript
import type { Env, JWTPayload } from './lib/types'
import { verifyJWT } from './lib/jwt'

export function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').map(c => {
      const eq = c.indexOf('=')
      return [c.slice(0, eq).trim(), c.slice(eq + 1).trim()]
    })
  )
}

export async function requireAuth(
  request: Request,
  env: Env
): Promise<JWTPayload | Response> {
  const cookieHeader = request.headers.get('Cookie') ?? ''
  const cookies = parseCookies(cookieHeader)
  const token = cookies['session']
  if (!token) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  const payload = await verifyJWT(token, env.WORKER_JWT_SECRET)
  if (!payload) return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 })
  return payload
}
```

- [ ] **Step 2: Написать тест `workers/src/handlers/feedback.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { handleFeedback } from './feedback'
import type { Env } from '../lib/types'

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    WORKER_JWT_SECRET: 'secret',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: 'https://n8n.example.com/webhook/feedback',
    N8N_WEBHOOK_SECRET: 'webhook_secret',
    ...overrides,
  }
}

describe('handleFeedback', () => {
  it('returns 400 if required fields missing', async () => {
    const req = new Request('https://mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: 'Meeting 1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('forwards to n8n with secret header on valid payload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 200 })
    )
    const req = new Request('https://mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: 'Meeting 1', recommend: '5', impact: '4', apply: '5' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://n8n.example.com/webhook/feedback')
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('webhook_secret')
    fetchSpy.mockRestore()
  })
})
```

- [ ] **Step 3: Запустить — убедиться что падает**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npm test
```

Ожидается: `FAIL — Cannot find module './feedback'`

- [ ] **Step 4: Создать `workers/src/handlers/feedback.ts`**

```typescript
import type { Env } from '../lib/types'

interface FeedbackBody {
  lesson: string
  recommend: string
  impact: string
  apply: string
  unclear?: string
  other?: string
}

export async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: FeedbackBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.lesson || !body.recommend || !body.impact || !body.apply) {
    return Response.json({ error: 'Missing required fields: lesson, recommend, impact, apply' }, { status: 400 })
  }

  await fetch(env.N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': env.N8N_WEBHOOK_SECRET,
    },
    body: JSON.stringify({ ...body, submitted_at: new Date().toISOString() }),
  })

  return Response.json({ ok: true })
}
```

- [ ] **Step 5: Запустить — убедиться что зелёные**

```bash
npm test
```

Ожидается: `6 tests passed`

- [ ] **Step 6: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/src/middleware.ts workers/src/handlers/feedback.ts workers/src/handlers/feedback.test.ts
git commit -m "feat: requireAuth middleware + feedback handler"
```

---

## Task 4: handlers/auth.ts (TDD)

**Files:**
- Create: `workers/src/handlers/auth.ts`
- Create: `workers/src/handlers/auth.test.ts`

- [ ] **Step 1: Написать тесты `workers/src/handlers/auth.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './auth'
import type { Env } from '../lib/types'

function makeEnv(): Env {
  return {
    DB: {
      prepare: (sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  }
}

describe('handleSendLink', () => {
  it('returns 400 for missing email', async () => {
    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email format', async () => {
    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('returns 200 and calls Resend for valid email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email123' }), { status: 200 })
    )
    const env = makeEnv()
    // mock user lookup returns null (new user), insert runs OK
    const firstMock = vi.fn().mockResolvedValue(null)
    const runMock = vi.fn().mockResolvedValue({ success: true })
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ first: firstMock, run: runMock }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toBe('https://api.resend.com/emails')
    fetchSpy.mockRestore()
  })
})

describe('handleLogout', () => {
  it('clears session cookie', async () => {
    const req = new Request('https://mamaev.coach/api/auth/logout', { method: 'POST' })
    const res = await handleLogout(req, makeEnv())
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('session=;')
  })
})
```

- [ ] **Step 2: Запустить — убедиться что падает**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npm test
```

Ожидается: `FAIL — Cannot find module './auth'`

- [ ] **Step 3: Создать `workers/src/handlers/auth.ts`**

```typescript
import type { Env } from '../lib/types'
import { signJWT, verifyJWT, generateToken } from '../lib/jwt'
import { requireAuth, parseCookies } from '../middleware'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function handleSendLink(request: Request, env: Env): Promise<Response> {
  let body: { email?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Найти или создать пользователя
  let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  if (!user) {
    const id = crypto.randomUUID()
    await env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').bind(id, email, Math.floor(Date.now() / 1000)).run()
    user = { id }
  }

  // Создать magic link token
  const token = generateToken()
  const expiresAt = Math.floor(Date.now() / 1000) + 900 // 15 минут
  await env.DB.prepare('INSERT INTO magic_links (token, user_id, expires_at) VALUES (?, ?, ?)').bind(token, user.id, expiresAt).run()

  // Отправить через Resend
  await fetch('https://api.resend.com/emails', {
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
  const email = userRow?.email ?? ''

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
```

- [ ] **Step 4: Запустить тесты**

```bash
npm test
```

Ожидается: `9 tests passed`

- [ ] **Step 5: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/src/handlers/auth.ts workers/src/handlers/auth.test.ts
git commit -m "feat: auth handlers — send-link, verify, me, logout"
```

---

## Task 5: handlers/progress.ts (TDD)

**Files:**
- Create: `workers/src/handlers/progress.ts`
- Create: `workers/src/handlers/progress.test.ts`

- [ ] **Step 1: Написать тесты `workers/src/handlers/progress.test.ts`**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { handleView, handleComplete, handleList } from './progress'
import type { Env } from '../lib/types'
import { signJWT } from '../lib/jwt'

const SECRET = 'test-secret-32-characters-minimum!!'

async function makeAuthRequest(url: string, method: string, body: unknown): Promise<Request> {
  const now = Math.floor(Date.now() / 1000)
  const jwt = await signJWT({ sub: 'user1', email: 'a@b.com', iat: now, exp: now + 3600 }, SECRET)
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${jwt}`,
    },
  })
}

function makeEnv(): Env {
  const runMock = vi.fn().mockResolvedValue({ success: true })
  const allMock = vi.fn().mockResolvedValue({ results: [] })
  return {
    DB: {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ run: runMock, all: allMock, first: vi.fn().mockResolvedValue(null) }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: SECRET,
    RESEND_API_KEY: '',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  }
}

describe('handleView', () => {
  it('returns 401 without auth', async () => {
    const req = new Request('https://mamaev.coach/api/progress/view', {
      method: 'POST',
      body: JSON.stringify({ lesson_slug: '01-introduction' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleView(req, makeEnv())
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid auth and lesson_slug', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/view', 'POST', { lesson_slug: '01-introduction' })
    const res = await handleView(req, makeEnv())
    expect(res.status).toBe(200)
  })
})

describe('handleComplete', () => {
  it('returns 200 with valid auth and lesson_slug', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/complete', 'POST', { lesson_slug: '01-introduction' })
    const res = await handleComplete(req, makeEnv())
    expect(res.status).toBe(200)
  })
})

describe('handleList', () => {
  it('returns 200 with empty array when no progress', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/list', 'GET', null)
    const res = await handleList(req, makeEnv())
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
  })
})
```

- [ ] **Step 2: Запустить — убедиться что падает**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npm test
```

Ожидается: `FAIL — Cannot find module './progress'`

- [ ] **Step 3: Создать `workers/src/handlers/progress.ts`**

```typescript
import type { Env } from '../lib/types'
import { requireAuth } from '../middleware'

export async function handleView(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  let body: { lesson_slug?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.lesson_slug) return Response.json({ error: 'lesson_slug required' }, { status: 400 })

  const now = Math.floor(Date.now() / 1000)
  await env.DB.prepare(
    'INSERT OR IGNORE INTO progress (user_id, lesson_slug, viewed_at) VALUES (?, ?, ?)'
  ).bind(auth.sub, body.lesson_slug, now).run()

  return Response.json({ ok: true })
}

export async function handleComplete(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  let body: { lesson_slug?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }
  if (!body.lesson_slug) return Response.json({ error: 'lesson_slug required' }, { status: 400 })

  const now = Math.floor(Date.now() / 1000)
  await env.DB.prepare(`
    INSERT INTO progress (user_id, lesson_slug, viewed_at, completed_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (user_id, lesson_slug) DO UPDATE SET completed_at = excluded.completed_at
  `).bind(auth.sub, body.lesson_slug, now, now).run()

  return Response.json({ ok: true })
}

export async function handleList(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth

  const { results } = await env.DB.prepare(
    'SELECT lesson_slug, viewed_at, completed_at FROM progress WHERE user_id = ?'
  ).bind(auth.sub).all<{ lesson_slug: string; viewed_at: number; completed_at: number | null }>()

  return Response.json(results)
}
```

- [ ] **Step 4: Запустить тесты**

```bash
npm test
```

Ожидается: `14 tests passed`

- [ ] **Step 5: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/src/handlers/progress.ts workers/src/handlers/progress.test.ts
git commit -m "feat: progress handlers — view, complete, list"
```

---

## Task 6: workers/src/index.ts (router) + deploy

**Files:**
- Create: `workers/src/index.ts`

- [ ] **Step 1: Создать `workers/src/index.ts`**

```typescript
import type { Env } from './lib/types'
import { handleFeedback } from './handlers/feedback'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './handlers/auth'
import { handleView, handleComplete, handleList } from './handlers/progress'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://mamaev.coach',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true',
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    let response: Response

    if (path === '/api/feedback' && method === 'POST') {
      response = await handleFeedback(request, env)
    } else if (path === '/api/auth/send-link' && method === 'POST') {
      response = await handleSendLink(request, env)
    } else if (path === '/api/auth/verify' && method === 'POST') {
      response = await handleVerify(request, env)
    } else if (path === '/api/auth/me' && method === 'GET') {
      response = await handleMe(request, env)
    } else if (path === '/api/auth/logout' && method === 'POST') {
      response = await handleLogout(request, env)
    } else if (path === '/api/progress/view' && method === 'POST') {
      response = await handleView(request, env)
    } else if (path === '/api/progress/complete' && method === 'POST') {
      response = await handleComplete(request, env)
    } else if (path === '/api/progress/list' && method === 'GET') {
      response = await handleList(request, env)
    } else {
      response = new Response('Not Found', { status: 404 })
    }

    // Добавить CORS заголовки ко всем ответам
    const newHeaders = new Headers(response.headers)
    Object.entries(CORS_HEADERS).forEach(([k, v]) => newHeaders.set(k, v))
    return new Response(response.body, { status: response.status, headers: newHeaders })
  },
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npx tsc --noEmit
```

Ожидается: нет ошибок.

- [ ] **Step 3: Установить secrets через wrangler**

```bash
npx wrangler secret put WORKER_JWT_SECRET
```

Ввести: случайная строка 64+ символов (например `openssl rand -hex 32` в bash или любой генератор паролей).

```bash
npx wrangler secret put RESEND_API_KEY
```

Ввести: API ключ из [resend.com/api-keys](https://resend.com/api-keys).

```bash
npx wrangler secret put N8N_WEBHOOK_URL
```

Ввести: URL вида `https://n8n.mamaev.coach/webhook/xxxxxxxx` (настроишь в Task 16).

```bash
npx wrangler secret put N8N_WEBHOOK_SECRET
```

Ввести: случайная строка 32+ символов.

- [ ] **Step 4: Deploy Worker**

```bash
npx wrangler deploy
```

Ожидается:
```
✅ Deployed tochka-sborki-api to mamaev.coach/api/*
```

- [ ] **Step 5: Проверить feedback endpoint**

```bash
curl -X POST https://mamaev.coach/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"lesson":"Meeting 1","recommend":"5","impact":"4","apply":"5"}'
```

Ожидается: `{"ok":true}` (n8n может вернуть ошибку если ещё не настроен — это нормально, Worker работает).

- [ ] **Step 6: Проверить auth endpoint**

```bash
curl -X POST https://mamaev.coach/api/auth/send-link \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@example.com"}'
```

Ожидается: `{"ok":true}` + письмо на почту.

- [ ] **Step 7: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add workers/src/index.ts
git commit -m "feat: workers router — all API endpoints wired up"
```

---

## Task 7: web/ ProgressProvider + layout update

**Files:**
- Create: `web/components/progress-provider.tsx`
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Создать `web/components/progress-provider.tsx`**

```typescript
'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type ProgressState = 'none' | 'viewed' | 'completed'

interface ProgressRow {
  lesson_slug: string
  viewed_at: number
  completed_at: number | null
}

interface ProgressContextValue {
  getState: (slug: string) => ProgressState
  markViewed: (slug: string) => Promise<void>
  markCompleted: (slug: string) => Promise<void>
}

const ProgressContext = createContext<ProgressContextValue>({
  getState: () => 'none',
  markViewed: async () => {},
  markCompleted: async () => {},
})

export function useProgress(): ProgressContextValue {
  return useContext(ProgressContext)
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progressMap, setProgressMap] = useState<Map<string, ProgressState>>(new Map())

  useEffect(() => {
    fetch('/api/progress/list', { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<ProgressRow[]> : [])
      .then(rows => {
        const map = new Map<string, ProgressState>()
        for (const row of rows) {
          map.set(row.lesson_slug, row.completed_at ? 'completed' : 'viewed')
        }
        setProgressMap(map)
      })
      .catch(() => {})
  }, [])

  const markViewed = useCallback(async (slug: string) => {
    if (progressMap.get(slug)) return
    await fetch('/api/progress/view', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_slug: slug }),
    }).catch(() => {})
    setProgressMap(prev => {
      const next = new Map(prev)
      if (!next.get(slug)) next.set(slug, 'viewed')
      return next
    })
  }, [progressMap])

  const markCompleted = useCallback(async (slug: string) => {
    await fetch('/api/progress/complete', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_slug: slug }),
    }).catch(() => {})
    setProgressMap(prev => {
      const next = new Map(prev)
      next.set(slug, 'completed')
      return next
    })
  }, [])

  const getState = useCallback((slug: string): ProgressState => {
    return progressMap.get(slug) ?? 'none'
  }, [progressMap])

  return (
    <ProgressContext.Provider value={{ getState, markViewed, markCompleted }}>
      {children}
    </ProgressContext.Provider>
  )
}
```

- [ ] **Step 2: Обновить `web/app/layout.tsx`**

Текущее содержимое файла (`web/app/layout.tsx`):
```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { defaultTheme } from '@/lib/themes'
import './globals.css'

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={defaultTheme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
```

Заменить на:
```typescript
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { defaultTheme } from '@/lib/themes'
import { ProgressProvider } from '@/components/progress-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Точка Сборки — курс по vibe-кодингу',
  description: 'Открытый курс по AI-разработке и агентному программированию',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      data-theme={defaultTheme}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body>
        <ProgressProvider>
          {children}
        </ProgressProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: успешный build без ошибок.

- [ ] **Step 4: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add web/components/progress-provider.tsx web/app/layout.tsx
git commit -m "feat: ProgressProvider React context + wrap root layout"
```

---

## Task 8: Sidebar + LessonLayout update (progress icons + complete button)

**Files:**
- Modify: `web/components/sidebar.tsx`
- Modify: `web/components/lesson-layout.tsx`

- [ ] **Step 1: Обновить `web/components/sidebar.tsx`**

Заменить весь файл:

```typescript
'use client'

import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'
import { useProgress, type ProgressState } from './progress-provider'

interface SidebarProps {
  lessons: LessonMeta[]
  currentSlug?: string
}

function ProgressIcon({ state }: { state: ProgressState }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)' }}>●</span>
  if (state === 'viewed') return <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>◐</span>
  return <span style={{ color: 'var(--border-color)' }}>○</span>
}

export function Sidebar({ lessons, currentSlug }: SidebarProps) {
  const { getState } = useProgress()

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Уроки курса
        </span>
      </div>
      {lessons.map(lesson => {
        const active = lesson.slug === currentSlug
        const state = getState(lesson.slug)
        return (
          <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
            background: active ? 'var(--border-accent)' : 'transparent',
            borderLeft: active ? '2px solid var(--text-accent)' : '2px solid transparent',
          }}>
            <ProgressIcon state={state} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              L{lesson.level}
            </span>
            <span style={{ flex: 1 }}>{lesson.title}</span>
          </Link>
        )
      })}
    </aside>
  )
}
```

- [ ] **Step 2: Обновить `web/components/lesson-layout.tsx`**

Заменить весь файл:

```typescript
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { LessonMeta } from '@/lib/content'
import { Nav } from './nav'
import { Sidebar } from './sidebar'
import { AssignmentBlock } from './assignment-block'
import { useProgress } from './progress-provider'

interface LessonLayoutProps {
  meta: LessonMeta
  lessons: LessonMeta[]
  children: React.ReactNode
}

export function LessonLayout({ meta, lessons, children }: LessonLayoutProps) {
  const idx = lessons.findIndex(l => l.slug === meta.slug)
  const prev = lessons[idx - 1]
  const next = lessons[idx + 1]
  const { getState, markViewed, markCompleted } = useProgress()
  const state = getState(meta.slug)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    markViewed(meta.slug)
  }, [meta.slug, markViewed])

  async function handleComplete() {
    setCompleting(true)
    await markCompleted(meta.slug)
    setCompleting(false)
  }

  return (
    <>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar lessons={lessons} currentSlug={meta.slug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <div style={{
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-accent)',
          }}>
            Level {meta.level} · {meta.duration}
          </div>
          {children}
          {meta.assignment && <AssignmentBlock text={meta.assignment} />}

          {/* Complete button */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            {state === 'completed' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--text-accent)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}>
                ● Урок завершён
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: completing ? 'wait' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {completing ? '...' : '○ Отметить как пройденный'}
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
          }}>
            {prev
              ? <Link href={`/lessons/${prev.slug}/`} style={{ fontSize: '0.875rem' }}>← {prev.title}</Link>
              : <span />}
            {next
              ? <Link href={`/lessons/${next.slug}/`} style={{ fontSize: '0.875rem' }}>{next.title} →</Link>
              : <span />}
          </div>
        </main>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: успешный build.

- [ ] **Step 4: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add web/components/sidebar.tsx web/components/lesson-layout.tsx
git commit -m "feat: progress icons in sidebar + complete button in lesson"
```

---

## Task 9: web/ /login + /auth/verify страницы

**Files:**
- Create: `web/app/login/page.tsx`
- Create: `web/app/auth/verify/page.tsx`
- Create: `web/app/auth/verify/verify-client.tsx`

- [ ] **Step 1: Создать `web/app/login/page.tsx`**

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Nav } from '@/components/nav'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Вход
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1.5rem',
        }}>
          Войти<br />в курс
        </h1>

        {status === 'sent' ? (
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--text-accent)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}>
            ✓ Ссылка отправлена на {email}. Проверь почту.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="твой@email.com"
              required
              style={{
                padding: '0.875rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
              }}
            />
            {status === 'error' && (
              <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>Что-то пошло не так. Попробуй снова.</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.875rem 2rem',
                background: 'var(--text-accent)',
                color: '#000',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderRadius: 'var(--radius)',
                border: 'none',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Отправляем...' : 'Получить ссылку →'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Без паролей. Получишь ссылку на почту — один клик и ты внутри.
        </p>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Создать `web/app/auth/verify/verify-client.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function VerifyClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    fetch('/api/auth/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => {
        if (r.ok) {
          setStatus('success')
          setTimeout(() => router.push('/dashboard'), 1000)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [searchParams, router])

  if (status === 'loading') return (
    <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Проверяем ссылку...</p>
  )
  if (status === 'success') return (
    <p style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>✓ Вход выполнен. Перенаправляем...</p>
  )
  return (
    <p style={{ color: '#ff4444', fontFamily: 'var(--font-mono)' }}>Ссылка недействительна или истекла. <a href="/login" style={{ color: 'var(--text-accent)' }}>Запросить новую →</a></p>
  )
}
```

- [ ] **Step 3: Создать `web/app/auth/verify/page.tsx`**

```typescript
import { Suspense } from 'react'
import { Nav } from '@/components/nav'
import { VerifyClient } from './verify-client'

export default function VerifyPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '2rem',
        }}>
          ⬡ Верификация
        </div>
        <Suspense fallback={<p style={{ color: 'var(--text-secondary)' }}>Загрузка...</p>}>
          <VerifyClient />
        </Suspense>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: `out/login/`, `out/auth/verify/` созданы.

- [ ] **Step 5: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add web/app/login/ web/app/auth/
git commit -m "feat: /login and /auth/verify pages"
```

---

## Task 10: web/ /dashboard + Nav update

**Files:**
- Create: `web/app/dashboard/page.tsx`
- Modify: `web/components/nav.tsx`

- [ ] **Step 1: Создать `web/app/dashboard/page.tsx`**

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import { getAllLessons } from '@/lib/content'

interface UserInfo {
  id: string
  email: string
}

const lessons = getAllLessons()

export default function DashboardPage() {
  const router = useRouter()
  const { getState } = useProgress()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<UserInfo> : null)
      .then(u => {
        if (!u) { router.push('/login'); return }
        setUser(u)
        setLoading(false)
      })
      .catch(() => { router.push('/login') })
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
  }

  const completed = lessons.filter(l => getState(l.slug) === 'completed').length
  const viewed = lessons.filter(l => getState(l.slug) !== 'none').length

  if (loading) return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Загрузка...</p>
      </main>
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Дашборд
        </div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '0.5rem',
        }}>
          Привет
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          {user?.email}
        </p>

        {/* Progress stats */}
        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-accent)' }}>{completed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>завершено</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{viewed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>просмотрено</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--border-color)' }}>{lessons.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>всего уроков</div>
          </div>
        </div>

        {/* Lesson list */}
        <div style={{ marginBottom: '3rem' }}>
          {lessons.map(lesson => {
            const state = getState(lesson.slug)
            return (
              <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border-color)',
                color: 'inherit',
              }}>
                <span style={{ color: state === 'completed' ? 'var(--text-accent)' : state === 'viewed' ? 'var(--text-secondary)' : 'var(--border-color)' }}>
                  {state === 'completed' ? '●' : state === 'viewed' ? '◐' : '○'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>L{lesson.level}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{lesson.title}</span>
              </Link>
            )
          })}
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Выйти
        </button>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Обновить `web/components/nav.tsx`**

Добавить ссылку на дашборд/логин:

```typescript
import Link from 'next/link'

export function Nav() {
  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '0 1.5rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ Точка Сборки
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
        <Link href="/roadmap/" style={{ color: 'var(--text-secondary)' }}>Roadmap</Link>
        <Link href="/cheatsheet/" style={{ color: 'var(--text-secondary)' }}>Шпаргалка</Link>
        <Link href="/feedback/" style={{ color: 'var(--text-secondary)' }}>Фидбек</Link>
        <Link href="/dashboard/" style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>→ Войти</Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: `out/dashboard/` создан.

- [ ] **Step 4: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add web/app/dashboard/ web/components/nav.tsx
git commit -m "feat: /dashboard page + Nav login link"
```

---

## Task 11: web/ feedback форма → client-side

**Files:**
- Create: `web/components/feedback-form.tsx`
- Modify: `web/app/feedback/page.tsx`

- [ ] **Step 1: Создать `web/components/feedback-form.tsx`**

```typescript
'use client'

import { useState } from 'react'

const LIKERT = ['1', '2', '3', '4', '5']
const MEETINGS = [
  'Meeting 0: Kickstart', 'Meeting 1: Знакомство', 'Meeting 2: Сетап',
  'Meeting 3: Промпты', 'Meeting 4: Контекст', 'Meeting 5: Pipeline',
  'Meeting 6: Инструменты',
]

function LikertScale({ name, label, value, onChange }: {
  name: string; label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <fieldset style={{ border: 'none', marginBottom: '2rem' }}>
      <legend style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '5rem' }}>Не согласен</span>
        {LIKERT.map(v => (
          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input
              type="radio" name={name} value={v} required
              checked={value === v}
              onChange={() => onChange(v)}
              style={{ accentColor: 'var(--text-accent)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>
          </label>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '4rem' }}>Согласен</span>
      </div>
    </fieldset>
  )
}

export function FeedbackForm() {
  const [fields, setFields] = useState({
    lesson: '', recommend: '', impact: '', apply: '', unclear: '', other: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  function set(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') return (
    <div style={{
      padding: '2rem',
      border: '1px solid var(--text-accent)',
      borderRadius: 'var(--radius)',
      color: 'var(--text-accent)',
      fontFamily: 'var(--font-mono)',
    }}>
      ✓ Спасибо! Фидбек отправлен. Курс станет лучше.
    </div>
  )

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
          Какую встречу ты только что прошёл?
        </label>
        <select
          value={fields.lesson}
          onChange={e => set('lesson', e.target.value)}
          required
          style={{
            width: '100%', padding: '0.75rem',
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', borderRadius: 'var(--radius)', fontSize: '0.9rem',
          }}
        >
          <option value="">— выбери встречу —</option>
          {MEETINGS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <LikertScale name="recommend" label='"Я бы порекомендовал этот курс другим."'
        value={fields.recommend} onChange={v => set('recommend', v)} />
      <LikertScale name="impact" label='"То, что я узнал, положительно повлияет на мою работу."'
        value={fields.impact} onChange={v => set('impact', v)} />
      <LikertScale name="apply" label='"Я смогу применить это на практике уже сейчас."'
        value={fields.apply} onChange={v => set('apply', v)} />

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
          Что было непонятно или что стоит улучшить?
        </label>
        <textarea
          value={fields.unclear}
          onChange={e => set('unclear', e.target.value)}
          rows={4}
          style={{
            width: '100%', padding: '0.75rem',
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', borderRadius: 'var(--radius)',
            fontSize: '0.9rem', resize: 'vertical',
          }}
        />
      </div>

      <div style={{ marginBottom: '2.5rem' }}>
        <label style={{ display: 'block', color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
          Любые другие мысли (опционально)
        </label>
        <textarea
          value={fields.other}
          onChange={e => set('other', e.target.value)}
          rows={3}
          style={{
            width: '100%', padding: '0.75rem',
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', borderRadius: 'var(--radius)',
            fontSize: '0.9rem', resize: 'vertical',
          }}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Что-то пошло не так. Попробуй снова.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '0.875rem 2.5rem',
          background: 'var(--text-accent)', color: '#000',
          fontWeight: 900, fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem', textTransform: 'uppercase',
          letterSpacing: '0.08em', borderRadius: 'var(--radius)',
          border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {status === 'loading' ? 'Отправляем...' : 'Отправить →'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Обновить `web/app/feedback/page.tsx`**

Заменить весь файл:

```typescript
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { FeedbackForm } from '@/components/feedback-form'

export const metadata: Metadata = {
  title: 'Фидбек — Точка Сборки',
  description: 'Оставь отзыв о курсе',
}

export default function FeedbackPage() {
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Фидбек
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
        }}>
          Оцени<br />курс
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', lineHeight: 1.75 }}>
          Твой отзыв помогает курсу самообновляться. 2 минуты — и урок станет лучше для следующего студента.
        </p>
        <FeedbackForm />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Build check**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\web"
npm run build
```

Ожидается: успешный build.

- [ ] **Step 4: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add web/components/feedback-form.tsx web/app/feedback/page.tsx
git commit -m "feat: feedback form → client-side fetch to /api/feedback"
```

---

## Task 12: CI/CD workers deploy job + n8n setup

**Files:**
- Modify: `.github/workflows/deploy.yml`

- [ ] **Step 1: Обновить `.github/workflows/deploy.yml`**

Читать текущий файл (`.github/workflows/deploy.yml`) и заменить на:

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - 'workers/**'
      - '.github/workflows/deploy.yml'

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.modified, 'web/') ||
      contains(github.event.head_commit.added, 'web/')
    permissions:
      contents: read
      deployments: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        working-directory: web
        run: npm ci

      - name: Build
        working-directory: web
        run: npm run build

      - name: Deploy to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: 252b28b0ef2e1866c532e2622060c809
        run: npx wrangler pages deploy web/out --project-name=tochka-sborki --branch=main

  deploy-workers:
    runs-on: ubuntu-latest
    if: |
      contains(github.event.head_commit.modified, 'workers/') ||
      contains(github.event.head_commit.added, 'workers/')
    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: workers/package-lock.json

      - name: Install dependencies
        working-directory: workers
        run: npm ci

      - name: Deploy Worker
        working-directory: workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: 252b28b0ef2e1866c532e2622060c809
        run: npx wrangler deploy
```

- [ ] **Step 2: Настроить n8n HTTP Trigger на SOVERN**

В n8n (SOVERN Hetzner, localhost:5678):
1. Открыть существующий feedback workflow (или создать новый)
2. Добавить node: **HTTP Request** trigger
3. Настройки:
   - Method: POST
   - Path: `/webhook/tochka-feedback`
   - Authentication: Header Auth
   - Header name: `X-Webhook-Secret`
   - Header value: значение `N8N_WEBHOOK_SECRET` (тот же что задал в wrangler secret)
4. Сохранить и активировать workflow
5. Скопировать URL вида `https://n8n.mamaev.coach/webhook/tochka-feedback`

- [ ] **Step 3: Обновить N8N_WEBHOOK_URL в Worker**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE\workers"
npx wrangler secret put N8N_WEBHOOK_URL
```

Ввести: `https://n8n.mamaev.coach/webhook/tochka-feedback` (или твой реальный URL).

```bash
npx wrangler deploy
```

- [ ] **Step 4: Коммит**

```bash
cd "C:\telo\Efforts\Ongoing\MDS_AI_COURSE"
git add .github/workflows/deploy.yml
git commit -m "feat: CI/CD workers deploy job + workers path trigger"
```

- [ ] **Step 5: Push и проверить CI**

```bash
git push origin main
```

Открыть GitHub Actions → убедиться что оба job'а запускаются и проходят.

---

## Task 13: End-to-end verification

- [ ] **Step 1: Проверить magic link flow**

```bash
curl -X POST https://mamaev.coach/api/auth/send-link \
  -H "Content-Type: application/json" \
  -d '{"email":"YOUR_EMAIL@gmail.com"}'
```

Ожидается: `{"ok":true}` + письмо приходит на почту.

- [ ] **Step 2: Проверить verify endpoint с реальным токеном**

Кликнуть ссылку из письма → открывается `/auth/verify?token=xxx` → редирект на `/dashboard`.

- [ ] **Step 3: Проверить /api/auth/me с cookie**

В браузере (после логина):

```javascript
// Открыть DevTools Console на mamaev.coach
fetch('/api/auth/me', { credentials: 'include' }).then(r => r.json()).then(console.log)
```

Ожидается: `{ id: "...", email: "YOUR_EMAIL@gmail.com" }`

- [ ] **Step 4: Проверить progress tracking**

Открыть урок → через 1-2 секунды выполнить в консоли:

```javascript
fetch('/api/progress/list', { credentials: 'include' }).then(r => r.json()).then(console.log)
```

Ожидается: массив с одним элементом `{ lesson_slug: "01-introduction", viewed_at: ..., completed_at: null }`.

- [ ] **Step 5: Проверить кнопку "Пройден"**

Кликнуть "○ Отметить как пройденный" → кнопка меняется на "● Урок завершён" → в sidebar иконка меняется на `●` (neon green).

- [ ] **Step 6: Проверить feedback форму**

Открыть `/feedback/` → заполнить форму → нажать "Отправить" → появляется "✓ Спасибо! Фидбек отправлен."

Проверить в n8n: webhook получил данные.

- [ ] **Step 7: Проверить logout**

На `/dashboard/` нажать "Выйти" → редирект на `/` → повторный заход на `/dashboard/` редиректит на `/login`.

---

## Self-review — покрытие спека

| Требование из спека | Task |
|---------------------|------|
| CF D1: users, magic_links, progress таблицы | 1 |
| JWT sign/verify (Web Crypto HS256) | 2 |
| Token generation (32 байта hex) | 2 |
| requireAuth middleware | 3 |
| POST /api/feedback → n8n с X-Webhook-Secret | 3 |
| POST /api/auth/send-link → Resend magic link | 4 |
| POST /api/auth/verify → JWT cookie | 4 |
| GET /api/auth/me | 4 |
| POST /api/auth/logout | 4 |
| POST /api/progress/view | 5 |
| POST /api/progress/complete | 5 |
| GET /api/progress/list | 5 |
| Workers router index.ts | 6 |
| Secrets setup + wrangler deploy | 6 |
| ProgressProvider React context | 7 |
| layout.tsx wraps with ProgressProvider | 7 |
| Sidebar: ○ ◐ ● иконки прогресса | 8 |
| LessonLayout: markViewed on mount | 8 |
| LessonLayout: "Урок пройден" кнопка | 8 |
| /login страница с email input | 9 |
| /auth/verify страница → редирект /dashboard | 9 |
| /dashboard: прогресс + logout | 10 |
| Nav: ссылка войти/дашборд | 10 |
| Feedback форма: client-side fetch | 11 |
| CI/CD: workers deploy job | 12 |
| n8n HTTP trigger с secret | 12 |
