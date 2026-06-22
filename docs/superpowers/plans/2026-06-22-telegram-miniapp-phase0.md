# Telegram Mini App Phase 0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Worker auth-bridge that verifies signed Telegram `initData` server-side and issues the existing `session` cookie, plus a web client bridge that auto-authenticates the LMS when it runs as a Telegram Mini App.

**Architecture:** A pure WebCrypto verifier (`verifyTelegramInitData`) is consumed by a handler (`handleTelegramAuth`) that reconciles identity (hybrid: match `telegram_id` → match `telegram_handle`+backfill → create native) and signs the same HS256 JWT cookie as the email flow. On the web, a client component reads `window.Telegram.WebApp.initData` and POSTs it once on load.

**Tech Stack:** Cloudflare Workers (`crypto.subtle` HMAC-SHA256), D1 SQLite, Next.js 16 static export, Vitest (env=node). Spec: `docs/superpowers/specs/2026-06-22-telegram-miniapp-phase0-design.md`.

**Conventions to honor:**
- Worker tests mock D1 via a `prepare().bind().first()/run()` stub (see `workers/src/handlers/auth.test.ts`).
- Worker crypto mirrors `workers/src/lib/jwt.ts` (`crypto.subtle.importKey`/`sign`).
- Session cookie format is **exactly** `handleVerify`'s: `session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`.
- Run worker tests from `workers/`: `cd workers && npx vitest run <file>`.
- Run web tests from `LMS/tochka-sborki/web/`: `npx vitest run <file>`.
- Web files here are web-only (not imported by `workers/`), so the `@/` alias is safe.

---

### Task 1: Worker env var + initData verifier

**Files:**
- Modify: `workers/src/lib/types.ts` (add `TELEGRAM_BOT_TOKEN`)
- Create: `workers/src/lib/telegram-initdata.ts`
- Test: `workers/src/lib/telegram-initdata.test.ts`

- [ ] **Step 1: Add the env var to the `Env` interface**

In `workers/src/lib/types.ts`, add one line inside `interface Env` (after `OWNER_EMAIL: string`):

```ts
  OWNER_EMAIL: string
  TELEGRAM_BOT_TOKEN: string
}
```

- [ ] **Step 2: Write the failing test**

Create `workers/src/lib/telegram-initdata.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { createHmac } from 'node:crypto'
import { verifyTelegramInitData } from './telegram-initdata'

const BOT = 'test-bot-token'

// Independent (node crypto) generator of a VALID initData string, so the test
// does not depend on the Worker's own subtle-crypto implementation.
function buildInitData(opts: {
  botToken?: string
  authDate?: number
  user?: Record<string, unknown>
  tamper?: boolean
  dropUser?: boolean
  dropHash?: boolean
} = {}): string {
  const botToken = opts.botToken ?? BOT
  const authDate = opts.authDate ?? Math.floor(Date.now() / 1000)
  const params: Record<string, string> = {
    auth_date: String(authDate),
    query_id: 'AAA',
  }
  if (!opts.dropUser) {
    params.user = JSON.stringify(
      opts.user ?? { id: 12345, username: 'sasha', first_name: 'A', language_code: 'ru' }
    )
  }
  const dcs = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest()
  let hash = createHmac('sha256', secret).update(dcs).digest('hex')
  if (opts.tamper) hash = hash.slice(0, -1) + (hash.endsWith('0') ? '1' : '0')
  const usp = new URLSearchParams(params)
  if (!opts.dropHash) usp.set('hash', hash)
  return usp.toString()
}

describe('verifyTelegramInitData', () => {
  it('accepts a valid initData and parses the user', async () => {
    const res = await verifyTelegramInitData(buildInitData(), BOT)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.user.id).toBe('12345')
      expect(res.user.username).toBe('sasha')
      expect(res.user.language_code).toBe('ru')
    }
  })

  it('rejects a tampered hash', async () => {
    const res = await verifyTelegramInitData(buildInitData({ tamper: true }), BOT)
    expect(res).toEqual({ ok: false, error: 'bad_hash' })
  })

  it('rejects a stale auth_date (older than maxAgeSec)', async () => {
    const old = Math.floor(Date.now() / 1000) - 1000
    const res = await verifyTelegramInitData(buildInitData({ authDate: old }), BOT, { maxAgeSec: 300 })
    expect(res).toEqual({ ok: false, error: 'stale' })
  })

  it('rejects an auth_date far in the future', async () => {
    const future = Math.floor(Date.now() / 1000) + 1000
    const res = await verifyTelegramInitData(buildInitData({ authDate: future }), BOT)
    expect(res).toEqual({ ok: false, error: 'future' })
  })

  it('rejects missing user', async () => {
    const res = await verifyTelegramInitData(buildInitData({ dropUser: true }), BOT)
    expect(res).toEqual({ ok: false, error: 'malformed' })
  })

  it('rejects missing hash', async () => {
    const res = await verifyTelegramInitData(buildInitData({ dropHash: true }), BOT)
    expect(res).toEqual({ ok: false, error: 'malformed' })
  })

  it('rejects when signed with a different bot token', async () => {
    const res = await verifyTelegramInitData(buildInitData({ botToken: 'other-token' }), BOT)
    expect(res).toEqual({ ok: false, error: 'bad_hash' })
  })

  it('preserves a 64-bit id beyond 2^53 as an exact string', async () => {
    const bigId = '7203685452345678901'
    const initData = buildInitData({ user: { id: Number(bigId), username: 'big' } })
    // The generator's JSON.stringify(Number(bigId)) loses precision, so build the raw user manually:
    const authDate = Math.floor(Date.now() / 1000)
    const userRaw = `{"id":${bigId},"username":"big"}`
    const params: Record<string, string> = { auth_date: String(authDate), user: userRaw }
    const dcs = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('\n')
    const secret = createHmac('sha256', 'WebAppData').update(BOT).digest()
    const hash = createHmac('sha256', secret).update(dcs).digest('hex')
    const usp = new URLSearchParams(params); usp.set('hash', hash)
    const res = await verifyTelegramInitData(usp.toString(), BOT)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.user.id).toBe(bigId)
    void initData
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-initdata.test.ts`
Expected: FAIL — `verifyTelegramInitData` is not exported / module not found.

- [ ] **Step 4: Implement the verifier**

Create `workers/src/lib/telegram-initdata.ts`:

```ts
export interface TelegramUser {
  id: string
  username: string | null
  first_name: string | null
  language_code: string | null
}

export type InitDataResult =
  | { ok: true; user: TelegramUser; authDate: number }
  | { ok: false; error: 'malformed' | 'bad_hash' | 'stale' | 'future' }

async function hmac(keyBytes: Uint8Array, msg: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return new Uint8Array(sig)
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// constant-time compare of two equal-length hex strings
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  opts: { maxAgeSec?: number; nowSec?: number } = {}
): Promise<InitDataResult> {
  const maxAgeSec = opts.maxAgeSec ?? 300
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000)

  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  const authDateRaw = params.get('auth_date')
  const userRaw = params.get('user')
  if (!hash || !authDateRaw || !userRaw) return { ok: false, error: 'malformed' }

  // data-check-string: every field except hash, key-sorted, "k=v" joined by \n
  const pairs: string[] = []
  for (const [k, v] of params) {
    if (k === 'hash') continue
    pairs.push(`${k}=${v}`)
  }
  pairs.sort()
  const dataCheckString = pairs.join('\n')

  const secretKey = await hmac(new TextEncoder().encode('WebAppData'), botToken)
  const computed = toHex(await hmac(secretKey, dataCheckString))
  if (!timingSafeEqual(computed, hash)) return { ok: false, error: 'bad_hash' }

  const authDate = Number(authDateRaw)
  if (!Number.isFinite(authDate)) return { ok: false, error: 'malformed' }
  if (nowSec - authDate > maxAgeSec) return { ok: false, error: 'stale' }
  if (authDate - nowSec > 60) return { ok: false, error: 'future' }

  // 64-bit-safe id: pull straight from the raw JSON, never via JSON.parse
  const idMatch = userRaw.match(/"id":\s*(\d+)/)
  if (!idMatch) return { ok: false, error: 'malformed' }
  let username: string | null = null
  let firstName: string | null = null
  let languageCode: string | null = null
  try {
    const u = JSON.parse(userRaw) as Record<string, unknown>
    username = typeof u.username === 'string' ? u.username : null
    firstName = typeof u.first_name === 'string' ? u.first_name : null
    languageCode = typeof u.language_code === 'string' ? u.language_code : null
  } catch {
    return { ok: false, error: 'malformed' }
  }

  return {
    ok: true,
    user: { id: idMatch[1], username, first_name: firstName, language_code: languageCode },
    authDate,
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/telegram-initdata.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/types.ts workers/src/lib/telegram-initdata.ts workers/src/lib/telegram-initdata.test.ts
git commit -m "feat(workers): Telegram initData server-side verifier (HMAC, replay window, 64-bit id)"
```

---

### Task 2: Worker auth-bridge handler

**Files:**
- Create: `workers/src/handlers/telegram-auth.ts`
- Test: `workers/src/handlers/telegram-auth.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/telegram-auth.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { handleTelegramAuth } from './telegram-auth'
import type { Env } from '../lib/types'

const BOT = 'test-bot-token'

function buildInitData(user: Record<string, unknown>, authDate = Math.floor(Date.now() / 1000)): string {
  const params: Record<string, string> = { auth_date: String(authDate), user: JSON.stringify(user) }
  const dcs = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('\n')
  const secret = createHmac('sha256', 'WebAppData').update(BOT).digest()
  const hash = createHmac('sha256', secret).update(dcs).digest('hex')
  const usp = new URLSearchParams(params); usp.set('hash', hash)
  return usp.toString()
}

type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { byId?: unknown; byHandle?: unknown; calls?: DbCall[]; noToken?: boolean } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return {
          first: vi.fn().mockImplementation(async () => {
            if (/WHERE telegram_id = \?/.test(sql)) return opts.byId ?? null
            if (/WHERE telegram_handle = \?/.test(sql)) return opts.byHandle ?? null
            return null
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }
      },
    }),
  } as unknown as D1Database
  return {
    DB,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    TELEGRAM_BOT_TOKEN: opts.noToken ? '' : BOT,
  } as Env
}

function req(body: unknown): Request {
  return new Request('https://ai.mamaev.coach/api/auth/telegram', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const usersInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO users/.test(c.sql))
const usersUpdate = (calls: DbCall[]) => calls.find(c => /UPDATE users SET telegram_id/.test(c.sql))

describe('handleTelegramAuth', () => {
  it('returns 503 when the bot token is not configured', async () => {
    const res = await handleTelegramAuth(req({ initData: buildInitData({ id: 1, username: 'x' }) }), makeEnv({ noToken: true }))
    expect(res.status).toBe(503)
  })

  it('returns 400 for invalid JSON', async () => {
    const bad = new Request('https://ai.mamaev.coach/api/auth/telegram', { method: 'POST', body: 'not json' })
    expect((await handleTelegramAuth(bad, makeEnv())).status).toBe(400)
  })

  it('returns 401 for invalid initData', async () => {
    const res = await handleTelegramAuth(req({ initData: 'auth_date=1&user=%7B%7D&hash=deadbeef' }), makeEnv())
    expect(res.status).toBe(401)
  })

  it('creates a Telegram-native user and sets a session cookie', async () => {
    const calls: DbCall[] = []
    const res = await handleTelegramAuth(req({ initData: buildInitData({ id: 777, username: 'newbie', language_code: 'en' }) }), makeEnv({ calls }))
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('session=')
    const ins = usersInsert(calls)
    expect(ins).toBeDefined()
    // binds: id, email, created_at, language, source, telegram_handle, telegram_id
    expect(ins!.binds[1]).toBe('tg_777@telegram.local')
    expect(ins!.binds[3]).toBe('en')
    expect(ins!.binds[5]).toBe('newbie')
    expect(ins!.binds[6]).toBe('777')
    expect(usersUpdate(calls)).toBeUndefined()
  })

  it('logs in an existing user matched by telegram_id (no insert)', async () => {
    const calls: DbCall[] = []
    const res = await handleTelegramAuth(
      req({ initData: buildInitData({ id: 42, username: 'known' }) }),
      makeEnv({ byId: { id: 'user-42', email: 'known@example.com' }, calls })
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('session=')
    expect(usersInsert(calls)).toBeUndefined()
  })

  it('backfills telegram_id when matched by handle', async () => {
    const calls: DbCall[] = []
    const res = await handleTelegramAuth(
      req({ initData: buildInitData({ id: 99, username: 'sasha' }) }),
      makeEnv({ byHandle: { id: 'user-sasha', email: 'sasha@example.com' }, calls })
    )
    expect(res.status).toBe(200)
    const upd = usersUpdate(calls)
    expect(upd).toBeDefined()
    expect(upd!.binds[0]).toBe('99')          // telegram_id
    expect(upd!.binds[1]).toBe('user-sasha')  // user id
    expect(usersInsert(calls)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/telegram-auth.test.ts`
Expected: FAIL — `handleTelegramAuth` not found.

- [ ] **Step 3: Implement the handler**

Create `workers/src/handlers/telegram-auth.ts`:

```ts
import type { Env } from '../lib/types'
import { signJWT } from '../lib/jwt'
import { verifyTelegramInitData } from '../lib/telegram-initdata'

const SESSION_MAX_AGE = 2592000 // 30 days, matches handleVerify

export async function handleTelegramAuth(request: Request, env: Env): Promise<Response> {
  let body: { initData?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!env.TELEGRAM_BOT_TOKEN) {
    return Response.json({ error: 'telegram_not_configured' }, { status: 503 })
  }

  const initData = body.initData?.trim() ?? ''
  const result = await verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN, { maxAgeSec: 300 })
  if (!result.ok) return Response.json({ error: 'invalid_initData' }, { status: 401 })

  const tgId = result.user.id
  const username = result.user.username
  const now = Math.floor(Date.now() / 1000)

  // 1) match by telegram_id
  let user = await env.DB.prepare('SELECT id, email FROM users WHERE telegram_id = ?')
    .bind(tgId).first<{ id: string; email: string }>()

  // 2) else match by handle (only unlinked rows), then backfill telegram_id
  if (!user && username) {
    const byHandle = await env.DB.prepare(
      'SELECT id, email FROM users WHERE telegram_handle = ? COLLATE NOCASE AND telegram_id IS NULL'
    ).bind(username).first<{ id: string; email: string }>()
    if (byHandle) {
      await env.DB.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').bind(tgId, byHandle.id).run()
      user = byHandle
    }
  }

  // 3) else create a Telegram-native user (synthetic, never-emailed identity)
  if (!user) {
    const id = crypto.randomUUID()
    const email = `tg_${tgId}@telegram.local`
    const language = result.user.language_code ?? 'unknown'
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at, language, source, telegram_handle, telegram_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, email, now, language, 'telegram', username, tgId).run()
    user = { id, email }
  }

  const jwt = await signJWT(
    { sub: user.id, email: user.email, iat: now, exp: now + SESSION_MAX_AGE },
    env.WORKER_JWT_SECRET
  )
  const cookie = `session=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}; Path=/`
  return new Response(JSON.stringify({ ok: true, email: user.email, telegram: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  })
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/telegram-auth.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/handlers/telegram-auth.ts workers/src/handlers/telegram-auth.test.ts
git commit -m "feat(workers): Telegram auth-bridge handler with hybrid identity reconciliation"
```

---

### Task 3: Wire the route + migration

**Files:**
- Modify: `workers/src/index.ts` (import + route branch)
- Create: `workers/migrations/0008_telegram_link.sql`

- [ ] **Step 1: Import the handler**

In `workers/src/index.ts`, extend the auth import on line 3:

```ts
import { handleSendLink, handleVerify, handleMe, handleLogout } from './handlers/auth'
import { handleTelegramAuth } from './handlers/telegram-auth'
```

- [ ] **Step 2: Add the route branch**

In `workers/src/index.ts`, immediately after the `/api/auth/verify` branch (the block ending `response = await handleVerify(request, env)`), add:

```ts
      } else if (path === '/api/auth/telegram' && method === 'POST') {
        response = await handleTelegramAuth(request, env)
```

- [ ] **Step 3: Create the migration**

Create `workers/migrations/0008_telegram_link.sql`:

```sql
-- Stable numeric Telegram id (TEXT to preserve 64-bit precision) linking a user
-- to their Telegram account for the Mini App auth bridge. Additive, idempotent.
ALTER TABLE users ADD COLUMN telegram_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id
  ON users(telegram_id) WHERE telegram_id IS NOT NULL;
```

- [ ] **Step 4: Typecheck the worker**

Run: `cd workers && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full worker test suite**

Run: `cd workers && npx vitest run`
Expected: PASS (all existing + new tests green).

- [ ] **Step 6: Commit**

```bash
git add workers/src/index.ts workers/migrations/0008_telegram_link.sql
git commit -m "feat(workers): route POST /api/auth/telegram + 0008 telegram_id migration"
```

---

### Task 4: Web — Telegram WebApp detection helper

**Files:**
- Create: `LMS/tochka-sborki/web/lib/telegram/webapp.ts`
- Test: `LMS/tochka-sborki/web/lib/telegram/webapp.test.ts`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/telegram/webapp.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { getTelegramWebApp, isInsideTelegram } from './webapp'

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
})

function setWindow(value: unknown) {
  ;(globalThis as Record<string, unknown>).window = value
}

describe('getTelegramWebApp', () => {
  it('returns null when window is undefined', () => {
    expect(getTelegramWebApp()).toBeNull()
  })

  it('returns null when Telegram is absent', () => {
    setWindow({})
    expect(getTelegramWebApp()).toBeNull()
  })

  it('returns the WebApp object when present', () => {
    const webApp = { initData: 'auth_date=1&hash=x', ready() {}, expand() {} }
    setWindow({ Telegram: { WebApp: webApp } })
    expect(getTelegramWebApp()).toBe(webApp)
  })
})

describe('isInsideTelegram', () => {
  it('is false without a WebApp', () => {
    setWindow({})
    expect(isInsideTelegram()).toBe(false)
  })

  it('is false when initData is empty', () => {
    setWindow({ Telegram: { WebApp: { initData: '', ready() {}, expand() {} } } })
    expect(isInsideTelegram()).toBe(false)
  })

  it('is true when initData is present', () => {
    setWindow({ Telegram: { WebApp: { initData: 'auth_date=1&hash=x', ready() {}, expand() {} } } })
    expect(isInsideTelegram()).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/telegram/webapp.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

Create `LMS/tochka-sborki/web/lib/telegram/webapp.ts`:

```ts
export interface TelegramWebApp {
  initData: string
  ready(): void
  expand(): void
}

interface TelegramGlobal {
  Telegram?: { WebApp?: TelegramWebApp }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null
  const tg = (window as unknown as TelegramGlobal).Telegram?.WebApp
  return tg ?? null
}

export function isInsideTelegram(): boolean {
  const app = getTelegramWebApp()
  return !!app && typeof app.initData === 'string' && app.initData.length > 0
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/telegram/webapp.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/telegram/webapp.ts LMS/tochka-sborki/web/lib/telegram/webapp.test.ts
git commit -m "feat(lms): Telegram WebApp detection helper"
```

---

### Task 5: Web — auth bridge component, dictionary string, layout wiring

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts` (type + ru + en `telegram.signingIn`)
- Create: `LMS/tochka-sborki/web/components/telegram/telegram-auth-bridge.tsx`
- Modify: `LMS/tochka-sborki/web/app/layout.tsx` (SDK script + mount bridge)

- [ ] **Step 1: Add the dictionary type**

In `LMS/tochka-sborki/web/lib/dictionaries.ts`, in the `Dictionary` type, after the `onboarding { … }` block closes (the `}` on the line before the type's outer closing `}` at ~line 176), add:

```ts
    changeLater: string
  }
  telegram: {
    signingIn: string
  }
}
```

- [ ] **Step 2: Add the Russian string**

In the `ru:` object, after the `onboarding: { … }` block closes (`changeLater: 'Можно изменить позже в настройках',` then `},`), add:

```ts
      changeLater: 'Можно изменить позже в настройках',
    },
    telegram: {
      signingIn: 'Входим через Telegram…',
    },
```

- [ ] **Step 3: Add the English string**

In the `en:` object, after the `onboarding: { … }` block closes (`changeLater: 'You can change this later in settings',` then `},`), add:

```ts
      changeLater: 'You can change this later in settings',
    },
    telegram: {
      signingIn: 'Signing in via Telegram…',
    },
```

- [ ] **Step 4: Typecheck to confirm both locales satisfy the type**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit`
Expected: no errors (a missing locale key would fail here).

- [ ] **Step 5: Create the bridge component**

Create `LMS/tochka-sborki/web/components/telegram/telegram-auth-bridge.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import { getTelegramWebApp, isInsideTelegram } from '@/lib/telegram/webapp'

// Auto-authenticates the LMS when it runs inside Telegram as a Mini App.
// Outside Telegram it renders nothing and does nothing.
export function TelegramAuthBridge() {
  const pathname = usePathname() || '/'
  const locale: Locale = pathname.startsWith('/en') ? 'en' : 'ru'
  const t = getDictionary(locale)
  const [bridging, setBridging] = useState(false)

  useEffect(() => {
    if (!isInsideTelegram()) return
    const app = getTelegramWebApp()
    if (!app) return
    app.ready()
    app.expand()

    let cancelled = false
    ;(async () => {
      // Already signed in? Then nothing to do.
      try {
        const me = await fetch('/api/auth/me', { credentials: 'include' })
        if (me.ok) return
      } catch { /* fall through to bridge attempt */ }

      if (cancelled) return
      setBridging(true)
      try {
        const res = await fetch('/api/auth/telegram', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: app.initData }),
        })
        if (res.ok && !cancelled) {
          // Re-render the app with the fresh session cookie applied.
          window.location.reload()
          return
        }
      } catch { /* fall through — show the normal LMS (email login) */ }
      if (!cancelled) setBridging(false)
    })()

    return () => { cancelled = true }
  }, [])

  if (!bridging) return null
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', color: 'var(--text-secondary)',
        fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
      }}
    >
      {t.telegram.signingIn}
    </div>
  )
}
```

- [ ] **Step 6: Wire the SDK script + bridge into the layout**

In `LMS/tochka-sborki/web/app/layout.tsx`:

(a) Add imports near the other component imports (after the `ThemeProvider` import, line 9):

```ts
import { ThemeProvider } from '@/components/theme-provider'
import { TelegramAuthBridge } from '@/components/telegram/telegram-auth-bridge'
import Script from 'next/script'
```

(b) In `<head>`, after the two existing `<script …>` tags (line 63), add the Telegram SDK:

```tsx
        <script dangerouslySetInnerHTML={{ __html: langScript }} />
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
```

(c) In `<body>`, mount the bridge as the first child inside `<ThemeProvider>` (before `<ProgressProvider>`):

```tsx
        <ThemeProvider>
          <TelegramAuthBridge />
          <ProgressProvider>
```

- [ ] **Step 7: Typecheck + build the static export**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npm run build`
Expected: tsc clean; `next build` completes the static export with no errors.

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/lib/dictionaries.ts LMS/tochka-sborki/web/components/telegram/telegram-auth-bridge.tsx LMS/tochka-sborki/web/app/layout.tsx
git commit -m "feat(lms): Telegram Mini App auth bridge (silent auto-login on WebApp launch)"
```

---

### Task 6: Apply migration 0008 to prod D1 + full verification

**Files:** none (ops)

- [ ] **Step 1: Verify users has no telegram_id column yet**

Use the Cloudflare-api MCP plugin `execute`: `PRAGMA table_info(users)` against D1 `c904db4d-a900-4ff1-80ae-6056c150ca53` (account `252b28b0ef2e1866c532e2622060c809`). Confirm `telegram_id` is absent.

- [ ] **Step 2: Apply the migration**

Via the same plugin `/query` endpoint, run the two statements from `workers/migrations/0008_telegram_link.sql` (ALTER then CREATE UNIQUE INDEX). Expect `meta.ok: true` for each.

- [ ] **Step 3: Verify the column + index landed**

`PRAGMA table_info(users)` → `telegram_id` present. `PRAGMA index_list(users)` → `idx_users_telegram_id` present.

- [ ] **Step 4: Run both full test suites once more**

Run: `cd workers && npx vitest run` (all green) and `cd LMS/tochka-sborki/web && npx vitest run` (all green).

- [ ] **Step 5: Report the owner go-live checklist**

Surface to the owner (these require their action; the code ships dark until done):
1. Create the bot in **BotFather**, copy the token.
2. `cd workers && npx wrangler secret put TELEGRAM_BOT_TOKEN` (paste token; watch for BOM).
3. In BotFather, set the Mini App / WebApp URL to `https://ai.mamaev.coach/`.

---

## Self-Review

**Spec coverage:**
- initData verifier (HMAC, replay window, 64-bit id, constant-time) → Task 1 ✓
- handler + hybrid reconciliation + session cookie + 503/401/400 errors → Task 2 ✓
- migration 0008 (TEXT + partial unique index) → Task 3 (file) + Task 6 (apply) ✓
- route wiring + `TELEGRAM_BOT_TOKEN` env → Task 1 (env) + Task 3 (route) ✓
- web detection helper → Task 4 ✓
- bridge component + SDK script + layout + dictionary string → Task 5 ✓
- deploy gate (owner steps, dark ship) → Task 6 ✓
- All tests described with real code → Tasks 1,2,4 ✓

**Placeholder scan:** none — every code step contains full code; commands have expected output.

**Type consistency:** `verifyTelegramInitData(initData, botToken, opts)` and `InitDataResult` used identically in Task 1 (def) and Task 2 (consumer). `TelegramUser.id` is a `string` everywhere. Cookie string identical to `handleVerify`. INSERT bind order `(id, email, created_at, language, source, telegram_handle, telegram_id)` matches the Task 2 test's bind-index assertions (`binds[1]=email`, `binds[3]=language`, `binds[5]=telegram_handle`, `binds[6]=telegram_id`). `getTelegramWebApp`/`isInsideTelegram` consistent between Task 4 (def) and Task 5 (consumer).
