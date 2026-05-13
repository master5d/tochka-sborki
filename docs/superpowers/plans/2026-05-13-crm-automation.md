# CRM Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture every new student signup into a Notion CRM database with language, UTM source, and Telegram handle — via D1 enrichment + n8n webhook.

**Architecture:** Login form sends UTM + Telegram handle to the worker. `handleSendLink` detects language from `Accept-Language`, enriches the D1 `users` row on first signup, then fire-and-forgets a POST to a dedicated n8n webhook. n8n creates a Notion page in the Students CRM database.

**Tech Stack:** Cloudflare Workers (TypeScript), D1 SQLite, n8n (SOVERN), Notion API, Vitest

---

### Task 1: D1 migration + Env types

**Files:**
- Create: `workers/migrations/0002_crm_fields.sql`
- Modify: `workers/src/lib/types.ts`

- [ ] **Step 1: Create migration file**

```sql
-- workers/migrations/0002_crm_fields.sql
ALTER TABLE users ADD COLUMN language TEXT;
ALTER TABLE users ADD COLUMN source TEXT;
ALTER TABLE users ADD COLUMN telegram_handle TEXT;
```

- [ ] **Step 2: Run migration on remote D1**

```bash
cd workers
CLOUDFLARE_API_TOKEN="<your-token>" npx wrangler d1 execute tochka-sborki-db --remote --file=migrations/0002_crm_fields.sql
```

Expected output:
```
🌀 Processed 3 queries.
🚣 Executed 3 queries
```

- [ ] **Step 3: Add new secrets to Env type**

Replace the `Env` interface in `workers/src/lib/types.ts`:

```typescript
export interface Env {
  DB: D1Database
  WORKER_JWT_SECRET: string
  RESEND_API_KEY: string
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
  N8N_CRM_WEBHOOK_URL: string
  N8N_CRM_SECRET: string
}

export interface JWTPayload {
  sub: string    // user_id
  email: string
  iat: number
  exp: number
}
```

- [ ] **Step 4: Update makeEnv() in auth.test.ts to include new secrets**

Open `workers/src/handlers/auth.test.ts` and update the `makeEnv` function:

```typescript
function makeEnv(): Env {
  const first = vi.fn().mockResolvedValue(null)
  const run = vi.fn().mockResolvedValue({ success: true })
  return {
    DB: {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ first, run }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
    N8N_CRM_WEBHOOK_URL: 'https://n8n.synergify.com/webhook/mds-crm',
    N8N_CRM_SECRET: 'test-crm-secret',
  }
}
```

- [ ] **Step 5: Run existing tests to confirm nothing is broken**

```bash
cd workers
npm test
```

Expected: all existing tests pass (18 tests).

- [ ] **Step 6: Commit**

```bash
git add workers/migrations/0002_crm_fields.sql workers/src/lib/types.ts workers/src/handlers/auth.test.ts
git commit -m "feat: D1 crm fields migration + Env types for CRM secrets"
```

---

### Task 2: `handleSendLink` enrichment + tests

**Files:**
- Modify: `workers/src/handlers/auth.ts`
- Modify: `workers/src/handlers/auth.test.ts`

- [ ] **Step 1: Write failing tests for new behaviour**

Add these test cases to `workers/src/handlers/auth.test.ts`, inside a new `describe('handleSendLink enrichment')` block after the existing `describe('handleSendLink')`:

```typescript
describe('handleSendLink enrichment', () => {
  it('calls CRM webhook for new user with detected language', async () => {
    const calls: [string, RequestInit][] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push([url as string, init as RequestInit])
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', telegram_handle: '@sasha' }),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    // fetch called twice: CRM then Resend
    expect(calls.length).toBe(2)
    const [crmUrl, crmInit] = calls[0]
    expect(crmUrl).toBe('https://n8n.synergify.com/webhook/mds-crm')
    const crmBody = JSON.parse(crmInit.body as string)
    expect(crmBody.language).toBe('ru')
    expect(crmBody.telegram_handle).toBe('sasha') // stripped @
    fetchSpy.mockRestore()
  })

  it('does not call CRM webhook for existing user', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue({ id: 'existing-user-id' }), // user exists
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    // only Resend, not CRM
    const crmCall = (fetchSpy.mock.calls as [string, RequestInit][]).find(
      ([url]) => url === 'https://n8n.synergify.com/webhook/mds-crm'
    )
    expect(crmCall).toBeUndefined()
    fetchSpy.mockRestore()
  })

  it('still returns 200 even when CRM webhook fails', async () => {
    let callCount = 0
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      callCount++
      if ((url as string).includes('mds-crm')) throw new Error('n8n down')
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200) // magic link still sent
    fetchSpy.mockRestore()
  })

  it('builds source from UTM params', async () => {
    const calls: [string, RequestInit][] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push([url as string, init as RequestInit])
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'utm@example.com', utm_source: 'telegram', utm_medium: 'post', utm_campaign: 'course1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await handleSendLink(req, env)
    const [, crmInit] = calls[0]
    const crmBody = JSON.parse(crmInit.body as string)
    expect(crmBody.source).toBe('telegram/post/course1')
    fetchSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd workers
npm test -- --reporter=verbose 2>&1 | grep -E "FAIL|PASS|✓|×"
```

Expected: the 4 new enrichment tests fail.

- [ ] **Step 3: Update `handleSendLink` in `workers/src/handlers/auth.ts`**

Replace the entire file with:

```typescript
import type { Env } from '../lib/types'
import { signJWT, generateToken } from '../lib/jwt'
import { requireAuth } from '../middleware'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseLanguage(header: string | null): string {
  if (!header) return 'unknown'
  const first = header.split(',')[0].split(';')[0].trim()
  const code = first.split('-')[0].toLowerCase()
  return code || 'unknown'
}

function sanitizeTelegram(handle: string | undefined | null): string | null {
  if (!handle) return null
  const cleaned = handle.replace(/^@/, '').trim().slice(0, 32)
  return cleaned || null
}

function buildSource(body: { utm_source?: string; utm_medium?: string; utm_campaign?: string }): string {
  const parts = [body.utm_source, body.utm_medium, body.utm_campaign].filter(Boolean)
  return parts.length > 0 ? parts.join('/') : 'direct'
}

export async function handleSendLink(request: Request, env: Env): Promise<Response> {
  let body: { email?: string; telegram_handle?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }

  let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>()
  const isNewUser = !user

  if (isNewUser) {
    const id = crypto.randomUUID()
    const language = parseLanguage(request.headers.get('Accept-Language'))
    const source = buildSource(body)
    const telegramHandle = sanitizeTelegram(body.telegram_handle)
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at, language, source, telegram_handle) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, email, Math.floor(Date.now() / 1000), language, source, telegramHandle).run()
    user = { id }

    // fire-and-forget CRM webhook — failure must not block magic link
    fetch(env.N8N_CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': env.N8N_CRM_SECRET },
      body: JSON.stringify({
        email,
        language,
        source,
        telegram_handle: telegramHandle,
        signed_up_at: new Date().toISOString(),
      }),
    }).catch(e => console.error('CRM webhook failed', e))
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
```

- [ ] **Step 4: Fix two existing tests** that break after the change — both need to handle two fetch calls (CRM first, then Resend). Replace both test cases in `auth.test.ts`:

```typescript
it('returns 200 and calls Resend for valid email', async () => {
  let callCount = 0
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    callCount++
    return new Response(JSON.stringify({ id: 'ok' }), { status: 200 })
  })
  const env = makeEnv()
  env.DB = {
    prepare: (_sql: string) => ({
      bind: (..._args: unknown[]) => ({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    }),
  } as unknown as D1Database

  const req = new Request('https://mamaev.coach/api/auth/send-link', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await handleSendLink(req, env)
  expect(res.status).toBe(200)
  // CRM webhook + Resend = 2 calls for new user
  // (fire-and-forget may not have resolved yet — just assert Resend was called)
  const resendCall = (fetchSpy.mock.calls as [string][]).find(([url]) => url === 'https://api.resend.com/emails')
  expect(resendCall).toBeDefined()
  fetchSpy.mockRestore()
})

// Also replace 'returns 502 if Resend fetch fails' — mockRejectedValueOnce would hit CRM (1st call)
// not Resend (2nd call). Fix: explicitly route by URL:
it('returns 502 if Resend fetch fails', async () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
    if ((url as string).includes('mds-crm')) return new Response('ok', { status: 200 })
    throw new Error('network') // Resend fails
  })
  const env = makeEnv()
  env.DB = {
    prepare: (_sql: string) => ({
      bind: (..._args: unknown[]) => ({
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
    }),
  } as unknown as D1Database
  const req = new Request('https://mamaev.coach/api/auth/send-link', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' }),
    headers: { 'Content-Type': 'application/json' },
  })
  const res = await handleSendLink(req, env)
  expect(res.status).toBe(502)
  fetchSpy.mockRestore()
})
```

- [ ] **Step 5: Run all tests**

```bash
cd workers
npm test
```

Expected: all tests pass (22 tests: 18 existing + 4 new).

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/auth.ts workers/src/handlers/auth.test.ts
git commit -m "feat: handleSendLink CRM enrichment — language, source, telegram"
```

---

### Task 3: Login form — Telegram field + UTM reading

**Files:**
- Modify: `web/app/login/page.tsx`

- [ ] **Step 1: Replace `web/app/login/page.tsx`** with the version below. Key changes: `telegram` state, Telegram input field, UTM reading from `window.location.search`, both included in fetch body.

```typescript
'use client'

import { useState } from 'react'
import { Nav } from '@/components/nav'

const inputStyle = {
  padding: '0.875rem',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  fontFamily: 'var(--font-mono)',
  width: '100%',
  boxSizing: 'border-box' as const,
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [telegram, setTelegram] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const params = new URLSearchParams(window.location.search)
      const body: Record<string, string> = { email }
      if (telegram.trim()) body.telegram_handle = telegram.trim()
      const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign'] as const
      for (const key of utmKeys) {
        const val = params.get(key)
        if (val) body[key] = val
      }
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
              style={inputStyle}
            />
            <input
              type="text"
              value={telegram}
              onChange={e => setTelegram(e.target.value)}
              placeholder="@telegram (необязательно)"
              style={{ ...inputStyle, borderStyle: 'dashed' }}
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

- [ ] **Step 2: Build to confirm no TypeScript errors**

```bash
cd web
npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully` (or similar), 0 errors.

- [ ] **Step 3: Commit**

```bash
git add web/app/login/page.tsx
git commit -m "feat: login form — Telegram handle field + UTM params forwarded to worker"
```

---

### Task 4: Notion CRM database

**Files:** none (Notion MCP call)

- [ ] **Step 1: Find Notion parent page to host the database**

Use the `mcp__notion__notion-search` tool to find a suitable parent page (e.g., search for "SOVERN" or "Точка Сборки"):

```
mcp__notion__notion-search({ query: "Точка Сборки" })
```

Note the `id` of the page that should contain the CRM database.

- [ ] **Step 2: Create Notion database**

Use `mcp__notion__notion-create-database` with this schema:

```json
{
  "parent": { "type": "page_id", "page_id": "<id-from-step-1>" },
  "title": [{ "type": "text", "text": { "content": "Точка Сборки — Students" } }],
  "properties": {
    "Email": { "title": {} },
    "Language": {
      "select": {
        "options": [
          { "name": "ru", "color": "blue" },
          { "name": "en", "color": "green" },
          { "name": "unknown", "color": "gray" }
        ]
      }
    },
    "Source": { "rich_text": {} },
    "Telegram": { "rich_text": {} },
    "Signup Date": { "date": {} },
    "Status": {
      "select": {
        "options": [
          { "name": "New", "color": "yellow" },
          { "name": "Contacted", "color": "orange" },
          { "name": "Converted", "color": "green" }
        ]
      }
    }
  }
}
```

Note the returned **database `id`** — needed for the n8n workflow.

---

### Task 5: n8n workflow + CF secrets

**Files:** none (API calls)

- [ ] **Step 1: Generate CRM webhook secret**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the output as `<CRM_SECRET>` — you'll use it in Steps 2 and 3.

- [ ] **Step 2: Set CF Worker secrets**

```bash
cd workers

printf '%s' "https://n8n.synergify.com/webhook/mds-crm" | \
  CLOUDFLARE_API_TOKEN="<your-token>" npx wrangler secret put N8N_CRM_WEBHOOK_URL

printf '%s' "<CRM_SECRET>" | \
  CLOUDFLARE_API_TOKEN="<your-token>" npx wrangler secret put N8N_CRM_SECRET
```

Both should print `✨ Success! Uploaded secret`.

- [ ] **Step 3: Create n8n workflow via API**

Get the n8n API key from the project memory or run:
```bash
wsl.exe -d Ubuntu -u root -- bash -c "ssh -i /root/.ssh/id_ed25519 root@91.99.62.63 'python3 -c \"import sqlite3; c=sqlite3.connect(\\\"/tmp/n8n.db\\\"); print(c.execute(\\\\\"SELECT apiKey FROM user_api_keys WHERE label=\\\\\\\"ENERV-CLAUDE\\\\\\\"\\\").fetchone())\"'"
```

Then POST the workflow JSON:

```bash
N8N_KEY="<enerv-claude-api-key>"
NOTION_DB_ID="<database-id-from-task-4>"
CRM_SECRET="<CRM_SECRET>"

curl -s -X POST "https://n8n.synergify.com/api/v1/workflows" \
  -H "X-N8N-API-KEY: $N8N_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "MDS CRM → Notion",
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "mds-crm", "responseMode": "responseNode", "options": {} },
      "id": "crm-webhook", "name": "Webhook", "type": "n8n-nodes-base.webhook",
      "typeVersion": 2, "position": [240, 300], "webhookId": "mds-crm"
    },
    {
      "parameters": {
        "conditions": { "options": {}, "conditions": [{ "id": "c1",
          "leftValue": "={{ $json.headers['\''x-webhook-secret'\''] }}",
          "rightValue": "'"$CRM_SECRET"'",
          "operator": { "type": "string", "operation": "equals" } }],
          "combinator": "and" }, "options": {}
      },
      "id": "crm-check", "name": "Check Secret", "type": "n8n-nodes-base.if",
      "typeVersion": 2.2, "position": [460, 300]
    },
    {
      "parameters": {
        "resource": "databasePage", "operation": "create",
        "databaseId": { "__rl": true, "value": "'"$NOTION_DB_ID"'", "mode": "id" },
        "title": "={{ $json.body.email }}",
        "propertiesUi": { "propertyValues": [
          { "key": "Language", "type": "select", "selectValue": "={{ $json.body.language }}" },
          { "key": "Source", "type": "richText", "textContent": "={{ $json.body.source }}" },
          { "key": "Telegram", "type": "richText", "textContent": "={{ $json.body.telegram_handle ?? '\'''\'' }}" },
          { "key": "Signup Date", "type": "date", "date": "={{ $json.body.signed_up_at }}" },
          { "key": "Status", "type": "select", "selectValue": "New" }
        ]}
      },
      "id": "crm-notion", "name": "Create Notion Page", "type": "n8n-nodes-base.notion",
      "typeVersion": 2.2, "position": [680, 220],
      "credentials": { "notionApi": { "id": "<notion-credential-id>", "name": "Notion API" } }
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "{\"ok\":true}", "options": {} },
      "id": "crm-ok", "name": "Respond OK", "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1, "position": [900, 220]
    },
    {
      "parameters": { "respondWith": "json", "responseCode": 401, "responseBody": "{\"error\":\"Unauthorized\"}", "options": {} },
      "id": "crm-401", "name": "Respond 401", "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1, "position": [680, 400]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Check Secret", "type": "main", "index": 0 }]] },
    "Check Secret": { "main": [
      [{ "node": "Create Notion Page", "type": "main", "index": 0 }],
      [{ "node": "Respond 401", "type": "main", "index": 0 }]
    ]},
    "Create Notion Page": { "main": [[{ "node": "Respond OK", "type": "main", "index": 0 }]] }
  },
  "settings": { "executionOrder": "v1" }
}'
```

Note returned workflow `id`.

- [ ] **Step 4: Find Notion credential ID in n8n**

```bash
curl -s "https://n8n.synergify.com/api/v1/credentials?limit=50" \
  -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "
import sys,json
d=json.load(sys.stdin)
for c in d.get('data',[]):
    if 'Notion' in c.get('name','') or 'notion' in c.get('type','').lower():
        print(c['id'], c['name'], c['type'])
"
```

If no Notion credential exists yet, create one in the n8n UI: Settings → Credentials → New → Notion API → paste the Notion integration token.

Then re-run Step 3 substituting the real `<notion-credential-id>`.

- [ ] **Step 5: Activate workflow**

```bash
WORKFLOW_ID="<id-from-step-3>"
curl -s -X POST "https://n8n.synergify.com/api/v1/workflows/$WORKFLOW_ID/activate" \
  -H "X-N8N-API-KEY: $N8N_KEY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('active:', d.get('active'))"
```

Expected: `active: True`

- [ ] **Step 6: End-to-end test**

```bash
curl -s -X POST "https://n8n.synergify.com/webhook/mds-crm" \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: $CRM_SECRET" \
  -d '{"email":"test-crm@example.com","language":"ru","source":"direct","telegram_handle":null,"signed_up_at":"2026-05-13T12:00:00Z"}' \
  -w "\nHTTP %{http_code}"
```

Expected: `{"ok":true}` and `HTTP 200`. Verify a new row appears in the Notion database.

- [ ] **Step 7: Deploy worker with new secrets + push**

```bash
cd workers
CLOUDFLARE_API_TOKEN="<your-token>" npx wrangler deploy

cd ..
git push
```

Expected wrangler output: `Deployed tochka-sborki-api triggers (1.27 sec)` and `mamaev.coach/api/*`.
