# Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google OAuth as a third learner sign-in path, coexisting with magic-link and Telegram, minting the same `session` JWT cookie.

**Architecture:** A pure/thin-network helper lib (`lib/oauth-google.ts`: PKCE, authorize URL, token exchange, userinfo, redirect guard), two GET handlers (`handlers/oauth.ts`: `start` redirects to Google; `callback` verifies state, exchanges the code, resolves/links a user mirroring `telegram-auth.ts`, and mints the session cookie), and a "Continue with Google" anchor on the login form. A single additive D1 migration adds `users.google_sub`.

**Tech Stack:** TypeScript, Cloudflare Workers + D1, WebCrypto (no OAuth libs), Vitest; Next.js web (`LMS/tochka-sborki/web`).

## Global Constraints

- **Security invariants:** state-CSRF (callback rejects unless `state` query === `oauth_state` cookie); PKCE S256; open-redirect guard (only same-origin absolute paths); **email_verified gate** (an unverified Google email must NOT link to an existing email account); `client_secret` used only in the worker token exchange; **never log tokens/secrets**.
- **Session parity (verbatim):** `signJWT({ sub: user.id, email: user.email, iat: now, exp: now + 2592000 }, env.WORKER_JWT_SECRET)`; session cookie `session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`.
- Cloudflare Workers + D1, WebCrypto only, no heavy libs.
- Prod D1 migration is additive, applied via **cloudflare-api MCP `/query`** (NOT wrangler), **before** push.
- Trunk-based on `main`; TDD; commit per task. Worker gate: `cd workers && npx tsc --noEmit && npx vitest run src/`.
- Security-sensitive → the final whole-branch review runs on the most capable model (opus).

---

### Task 1: Migration `0016` + `lib/oauth-google.ts` + Env fields

**Files:**
- Create: `workers/migrations/0016_oauth_google.sql`
- Create: `workers/src/lib/oauth-google.ts`
- Test: `workers/src/lib/oauth-google.test.ts`
- Modify: `workers/src/lib/types.ts` (add two Env fields)

**Interfaces:**
- Produces:
  - `pkceChallenge(verifier: string): Promise<string>` (base64url SHA-256)
  - `buildAuthorizeUrl(o: { clientId: string; redirectUri: string; state: string; codeChallenge: string }): string`
  - `exchangeCode(o: { code: string; verifier: string; clientId: string; clientSecret: string; redirectUri: string }): Promise<{ ok: true; accessToken: string } | { ok: false }>`
  - `fetchUserinfo(accessToken: string): Promise<{ ok: true; sub: string; email: string; emailVerified: boolean } | { ok: false }>`
  - `safeRedirectPath(raw: string | null): string`
  - `Env.GOOGLE_OAUTH_CLIENT_ID: string`, `Env.GOOGLE_OAUTH_CLIENT_SECRET: string`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/oauth-google.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pkceChallenge, buildAuthorizeUrl, safeRedirectPath } from './oauth-google'

describe('pkceChallenge', () => {
  it('is deterministic base64url (no + / =) and differs from the verifier', async () => {
    const v = 'abc123-verifier_value.longenough.longenough.longenough'
    const a = await pkceChallenge(v)
    const b = await pkceChallenge(v)
    expect(a).toBe(b)
    expect(a).not.toBe(v)
    expect(a).not.toMatch(/[+/=]/)
  })
})

describe('buildAuthorizeUrl', () => {
  it('builds a Google authorize URL with all required params', () => {
    const url = buildAuthorizeUrl({ clientId: 'cid', redirectUri: 'https://ai.mamaev.coach/api/auth/oauth/google/callback', state: 'st', codeChallenge: 'ch' })
    const u = new URL(url)
    expect(u.origin + u.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth')
    expect(u.searchParams.get('response_type')).toBe('code')
    expect(u.searchParams.get('client_id')).toBe('cid')
    expect(u.searchParams.get('redirect_uri')).toBe('https://ai.mamaev.coach/api/auth/oauth/google/callback')
    expect(u.searchParams.get('scope')).toBe('openid email')
    expect(u.searchParams.get('state')).toBe('st')
    expect(u.searchParams.get('code_challenge')).toBe('ch')
    expect(u.searchParams.get('code_challenge_method')).toBe('S256')
  })
})

describe('safeRedirectPath', () => {
  it('allows a same-origin absolute path', () => {
    expect(safeRedirectPath('/course/')).toBe('/course/')
  })
  it('rejects protocol-relative, absolute-url, scheme, backslash, dotdot, and null', () => {
    expect(safeRedirectPath('//evil.com')).toBe('/')
    expect(safeRedirectPath('https://evil.com')).toBe('/')
    expect(safeRedirectPath('javascript:alert(1)')).toBe('/')
    expect(safeRedirectPath('/a\\b')).toBe('/')
    expect(safeRedirectPath('/a/../../b')).toBe('/')
    expect(safeRedirectPath(null)).toBe('/')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers && npx vitest run src/lib/oauth-google.test.ts`
Expected: FAIL — `Cannot find module './oauth-google'`.

- [ ] **Step 3: Create `lib/oauth-google.ts`**

```ts
// workers/src/lib/oauth-google.ts
// Google OAuth helpers (fb_25d8fa04). Pure where possible (PKCE, authorize URL, redirect guard);
// exchangeCode/fetchUserinfo are thin network wrappers. No OAuth libs — WebCrypto + fetch only.
// client_secret is passed in from the handler (env) and used ONLY here in the token exchange.

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** PKCE S256: base64url(SHA-256(verifier)). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return b64url(new Uint8Array(digest))
}

export function buildAuthorizeUrl(o: {
  clientId: string; redirectUri: string; state: string; codeChallenge: string
}): string {
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: o.clientId,
    redirect_uri: o.redirectUri,
    scope: 'openid email',
    state: o.state,
    code_challenge: o.codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'online',
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`
}

export async function exchangeCode(o: {
  code: string; verifier: string; clientId: string; clientSecret: string; redirectUri: string
}): Promise<{ ok: true; accessToken: string } | { ok: false }> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: o.code,
        code_verifier: o.verifier,
        client_id: o.clientId,
        client_secret: o.clientSecret,
        redirect_uri: o.redirectUri,
      }).toString(),
    })
    if (!res.ok) return { ok: false }
    const j = (await res.json().catch(() => ({}))) as { access_token?: string }
    if (!j.access_token) return { ok: false }
    return { ok: true, accessToken: j.access_token }
  } catch {
    return { ok: false }
  }
}

export async function fetchUserinfo(accessToken: string):
  Promise<{ ok: true; sub: string; email: string; emailVerified: boolean } | { ok: false }> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return { ok: false }
    const j = (await res.json().catch(() => ({}))) as { sub?: string; email?: string; email_verified?: boolean }
    if (!j.sub || !j.email) return { ok: false }
    return { ok: true, sub: j.sub, email: j.email.toLowerCase(), emailVerified: j.email_verified === true }
  } catch {
    return { ok: false }
  }
}

/** Open-redirect guard: allow ONLY a same-origin absolute path (single leading slash,
 *  not protocol-relative), with no backslash or '..'. Anything else → '/'. */
export function safeRedirectPath(raw: string | null): string {
  if (!raw) return '/'
  if (!/^\/(?!\/)/.test(raw)) return '/'
  if (raw.includes('\\') || raw.includes('..')) return '/'
  return raw
}
```

- [ ] **Step 4: Create the migration**

Create `workers/migrations/0016_oauth_google.sql`:

```sql
-- 0016_oauth_google.sql — Google OAuth identity column (fb_25d8fa04)
-- Additive, nullable. Apply to prod D1 via cloudflare-api MCP /query (NOT wrangler) BEFORE push.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
```

- [ ] **Step 5: Add the Env fields**

In `workers/src/lib/types.ts`, add to the `Env` interface after `STRIPE_WEBHOOK_SECRET: string` (matches the existing non-optional style; the handlers guard with `if (!env.X)`):

```ts
  GOOGLE_OAUTH_CLIENT_ID: string
  GOOGLE_OAUTH_CLIENT_SECRET: string
```

- [ ] **Step 6: Run test + typecheck to verify they pass**

Run: `cd workers && npx vitest run src/lib/oauth-google.test.ts && npx tsc --noEmit`
Expected: PASS — all oauth-google tests green; tsc clean.

- [ ] **Step 7: Commit**

```bash
git add workers/migrations/0016_oauth_google.sql workers/src/lib/oauth-google.ts workers/src/lib/oauth-google.test.ts workers/src/lib/types.ts
git commit -m "feat(auth): google oauth lib helpers + migration 0016 + env fields (fb_25d8fa04)"
```

---

### Task 2: `handlers/oauth.ts` (start + callback) + wire

**Files:**
- Create: `workers/src/handlers/oauth.ts`
- Test: `workers/src/handlers/oauth.test.ts`
- Modify: `workers/src/index.ts` (add two GET routes + import)

**Interfaces:**
- Consumes: `pkceChallenge`, `buildAuthorizeUrl`, `exchangeCode`, `fetchUserinfo`, `safeRedirectPath` from `../lib/oauth-google`; `signJWT` from `../lib/jwt`; `generateToken` from `../lib/jwt`; `parseCookies` from `../middleware`.
- Produces: `handleOAuthStart(request: Request, env: Env): Promise<Response>`, `handleOAuthCallback(request: Request, env: Env): Promise<Response>`.

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/oauth.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleOAuthStart, handleOAuthCallback } from './oauth'
import type { Env } from '../lib/types'

type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { bySub?: unknown; byEmail?: unknown; calls?: DbCall[]; unconfigured?: boolean } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return {
          first: vi.fn().mockImplementation(async () => {
            if (/WHERE google_sub = \?/.test(sql)) return opts.bySub ?? null
            if (/WHERE email = \?/.test(sql)) return opts.byEmail ?? null
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
    GOOGLE_OAUTH_CLIENT_ID: opts.unconfigured ? '' : 'cid',
    GOOGLE_OAUTH_CLIENT_SECRET: opts.unconfigured ? '' : 'csecret',
  } as Env
}

function startReq(redirect?: string): Request {
  const u = new URL('https://ai.mamaev.coach/api/auth/oauth/google/start')
  if (redirect) u.searchParams.set('redirect', redirect)
  return new Request(u.toString(), { method: 'GET' })
}

function callbackReq(query: Record<string, string>, cookie: string): Request {
  const u = new URL('https://ai.mamaev.coach/api/auth/oauth/google/callback')
  for (const [k, v] of Object.entries(query)) u.searchParams.set(k, v)
  return new Request(u.toString(), { method: 'GET', headers: { Cookie: cookie } })
}

// Mock the two Google network calls: token exchange then userinfo.
function mockGoogle(userinfo: { sub: string; email: string; email_verified: boolean }) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: any) => {
    const url = typeof input === 'string' ? input : input.url
    if (url.includes('oauth2.googleapis.com/token')) return new Response(JSON.stringify({ access_token: 'at' }), { status: 200 })
    if (url.includes('googleapis.com/oauth2/v3/userinfo')) return new Response(JSON.stringify(userinfo), { status: 200 })
    return new Response('{}', { status: 404 })
  })
}

const usersInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO users/.test(c.sql))
const usersUpdate = (calls: DbCall[]) => calls.find(c => /UPDATE users SET google_sub/.test(c.sql))

afterEach(() => vi.restoreAllMocks())

describe('handleOAuthStart', () => {
  it('returns 503 when unconfigured', async () => {
    expect((await handleOAuthStart(startReq(), makeEnv({ unconfigured: true }))).status).toBe(503)
  })

  it('302-redirects to Google and sets state/verifier/redirect cookies', async () => {
    const res = await handleOAuthStart(startReq('/course/'), makeEnv())
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')!).toContain('accounts.google.com/o/oauth2/v2/auth')
    const setCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('Set-Cookie') ?? '']
    const joined = setCookies.join('\n')
    expect(joined).toContain('oauth_state=')
    expect(joined).toContain('oauth_verifier=')
    expect(joined).toContain('oauth_redirect=')
    expect(joined).toContain('SameSite=Lax')
  })
})

describe('handleOAuthCallback', () => {
  it('returns 503 when unconfigured', async () => {
    const res = await handleOAuthCallback(callbackReq({ code: 'c', state: 's' }, 'oauth_state=s'), makeEnv({ unconfigured: true }))
    expect(res.status).toBe(503)
  })

  it('rejects a state/cookie mismatch without setting a session', async () => {
    const res = await handleOAuthCallback(callbackReq({ code: 'c', state: 'x' }, 'oauth_state=y; oauth_verifier=v'), makeEnv())
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')!).toContain('/login?error=oauth')
    expect(res.headers.get('Set-Cookie') ?? '').not.toContain('session=')
  })

  it('logs in an existing user matched by google_sub (no insert), sets session', async () => {
    mockGoogle({ sub: 'g-1', email: 'a@example.com', email_verified: true })
    const calls: DbCall[] = []
    const res = await handleOAuthCallback(
      callbackReq({ code: 'c', state: 's' }, 'oauth_state=s; oauth_verifier=v; oauth_redirect=%2Fcourse%2F'),
      makeEnv({ bySub: { id: 'u-1', email: 'a@example.com' }, calls })
    )
    expect(res.status).toBe(302)
    const joined = (res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('Set-Cookie') ?? '']).join('\n')
    expect(joined).toContain('session=')
    expect(res.headers.get('Location')!).toBe('https://ai.mamaev.coach/course/')
    expect(usersInsert(calls)).toBeUndefined()
  })

  it('links a verified email to an existing email user and backfills google_sub', async () => {
    mockGoogle({ sub: 'g-2', email: 'known@example.com', email_verified: true })
    const calls: DbCall[] = []
    const res = await handleOAuthCallback(
      callbackReq({ code: 'c', state: 's' }, 'oauth_state=s; oauth_verifier=v'),
      makeEnv({ byEmail: { id: 'u-known', email: 'known@example.com' }, calls })
    )
    expect(res.status).toBe(302)
    const upd = usersUpdate(calls)
    expect(upd).toBeDefined()
    expect(upd!.binds[0]).toBe('g-2')      // google_sub
    expect(upd!.binds[1]).toBe('u-known')  // user id
    expect(usersInsert(calls)).toBeUndefined()
  })

  it('does NOT link an UNVERIFIED email to an existing email user — creates instead', async () => {
    mockGoogle({ sub: 'g-3', email: 'known@example.com', email_verified: false })
    const calls: DbCall[] = []
    const res = await handleOAuthCallback(
      callbackReq({ code: 'c', state: 's' }, 'oauth_state=s; oauth_verifier=v'),
      makeEnv({ byEmail: { id: 'u-known', email: 'known@example.com' }, calls })
    )
    expect(res.status).toBe(302)
    expect(usersUpdate(calls)).toBeUndefined()   // never backfilled onto the existing account
    expect(usersInsert(calls)).toBeDefined()      // a fresh row instead
  })

  it('creates a new user when no match exists', async () => {
    mockGoogle({ sub: 'g-4', email: 'new@example.com', email_verified: true })
    const calls: DbCall[] = []
    const res = await handleOAuthCallback(
      callbackReq({ code: 'c', state: 's' }, 'oauth_state=s; oauth_verifier=v'),
      makeEnv({ calls })
    )
    const ins = usersInsert(calls)
    expect(ins).toBeDefined()
    // binds: id, email, created_at, language, source, google_sub
    expect(ins!.binds[1]).toBe('new@example.com')
    expect(ins!.binds[4]).toBe('google')
    expect(ins!.binds[5]).toBe('g-4')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/oauth.test.ts`
Expected: FAIL — `Cannot find module './oauth'`.

- [ ] **Step 3: Create `handlers/oauth.ts`**

```ts
import type { Env } from '../lib/types'
import { signJWT, generateToken } from '../lib/jwt'
import { parseCookies } from '../middleware'
import { pkceChallenge, buildAuthorizeUrl, exchangeCode, fetchUserinfo, safeRedirectPath } from '../lib/oauth-google'

const SESSION_MAX_AGE = 2592000 // 30 days, matches handleVerify / handleTelegramAuth
const TEMP_COOKIE = 'HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/'

function unconfigured(env: Env): boolean {
  return !env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET
}

export async function handleOAuthStart(request: Request, env: Env): Promise<Response> {
  if (unconfigured(env)) return Response.json({ error: 'oauth_not_configured' }, { status: 503 })

  const url = new URL(request.url)
  const state = generateToken()
  const verifier = generateToken()
  const challenge = await pkceChallenge(verifier)
  const redirect = safeRedirectPath(url.searchParams.get('redirect'))
  const redirectUri = `${url.origin}/api/auth/oauth/google/callback`
  const authorize = buildAuthorizeUrl({ clientId: env.GOOGLE_OAUTH_CLIENT_ID, redirectUri, state, codeChallenge: challenge })

  const headers = new Headers({ Location: authorize })
  headers.append('Set-Cookie', `oauth_state=${state}; ${TEMP_COOKIE}`)
  headers.append('Set-Cookie', `oauth_verifier=${verifier}; ${TEMP_COOKIE}`)
  headers.append('Set-Cookie', `oauth_redirect=${encodeURIComponent(redirect)}; ${TEMP_COOKIE}`)
  return new Response(null, { status: 302, headers })
}

export async function handleOAuthCallback(request: Request, env: Env): Promise<Response> {
  if (unconfigured(env)) return Response.json({ error: 'oauth_not_configured' }, { status: 503 })

  const url = new URL(request.url)
  const fail = () => Response.redirect(`${url.origin}/login?error=oauth`, 302)

  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookies = parseCookies(request.headers.get('Cookie') ?? '')
  // state-CSRF: query state must match the cookie set at /start
  if (!code || !state || !cookies['oauth_state'] || state !== cookies['oauth_state']) return fail()
  const verifier = cookies['oauth_verifier']
  if (!verifier) return fail()

  const redirectUri = `${url.origin}/api/auth/oauth/google/callback`
  const tok = await exchangeCode({ code, verifier, clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET, redirectUri })
  if (!tok.ok) return fail()
  const info = await fetchUserinfo(tok.accessToken)
  if (!info.ok) return fail()

  const now = Math.floor(Date.now() / 1000)

  // Linking (mirror telegram-auth): 1) by google_sub  2) verified-email link+backfill  3) create.
  let user = await env.DB.prepare('SELECT id, email FROM users WHERE google_sub = ?')
    .bind(info.sub).first<{ id: string; email: string }>()

  if (!user && info.emailVerified) {
    const byEmail = await env.DB.prepare('SELECT id, email FROM users WHERE email = ?')
      .bind(info.email).first<{ id: string; email: string }>()
    if (byEmail) {
      await env.DB.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(info.sub, byEmail.id).run()
      user = byEmail
    }
  }

  if (!user) {
    const id = crypto.randomUUID()
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at, language, source, google_sub) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, info.email, now, 'unknown', 'google', info.sub).run()
    user = { id, email: info.email }
  }

  const jwt = await signJWT({ sub: user.id, email: user.email, iat: now, exp: now + SESSION_MAX_AGE }, env.WORKER_JWT_SECRET)
  const redirect = safeRedirectPath(cookies['oauth_redirect'] ? decodeURIComponent(cookies['oauth_redirect']) : '/')

  const headers = new Headers({ Location: `${url.origin}${redirect}` })
  headers.append('Set-Cookie', `session=${jwt}; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE}; Path=/`)
  headers.append('Set-Cookie', 'oauth_state=; Max-Age=0; Path=/')
  headers.append('Set-Cookie', 'oauth_verifier=; Max-Age=0; Path=/')
  headers.append('Set-Cookie', 'oauth_redirect=; Max-Age=0; Path=/')
  return new Response(null, { status: 302, headers })
}
```

- [ ] **Step 4: Wire the routes in `index.ts`**

In `workers/src/index.ts`, add the import near the other auth imports (e.g. after `import { handleTelegramAuth } from './handlers/telegram-auth'`):

```ts
import { handleOAuthStart, handleOAuthCallback } from './handlers/oauth'
```

Add two GET routes in the router chain, right after the `'/api/auth/telegram'` branch (the block that calls `handleTelegramAuth`):

```ts
      } else if (path === '/api/auth/oauth/google/start' && method === 'GET') {
        response = await handleOAuthStart(request, env)
      } else if (path === '/api/auth/oauth/google/callback' && method === 'GET') {
        response = await handleOAuthCallback(request, env)
```

- [ ] **Step 5: Run tests + typecheck to verify they pass**

Run: `cd workers && npx vitest run src/handlers/oauth.test.ts && npx tsc --noEmit`
Expected: PASS — all oauth handler tests green; tsc clean.

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/oauth.ts workers/src/handlers/oauth.test.ts workers/src/index.ts
git commit -m "feat(auth): google oauth start+callback handlers, mirror telegram-auth linking (fb_25d8fa04)"
```

---

### Task 3: Web "Continue with Google" button

**Files:**
- Modify: `LMS/tochka-sborki/web/components/login-form.tsx`
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts` (add `login.google` + `login.or` to ru + en)

**Interfaces:**
- Consumes: the worker route `/api/auth/oauth/google/start?redirect=…`.
- Produces: nothing downstream. Build-validated (no unit test — mirrors the existing login UI precedent).

- [ ] **Step 1: Add the dictionary strings**

In `LMS/tochka-sborki/web/lib/dictionaries.ts`, find the `login:` object inside BOTH the Russian and English dictionaries. In the **Russian** `login` object add:

```ts
    google: 'Войти через Google',
    or: 'или',
```

In the **English** `login` object add:

```ts
    google: 'Continue with Google',
    or: 'or',
```

- [ ] **Step 2: Add the Google anchor + divider to the login form**

In `LMS/tochka-sborki/web/components/login-form.tsx`:

First, extend the React import (line 3) to include `useEffect`:

```ts
import { useState, useEffect } from 'react'
```

Add an `oauthHref` state after the existing `errorMsg` state (line ~26):

```ts
  const [oauthHref, setOauthHref] = useState('/api/auth/oauth/google/start')
```

Add a `useEffect` that carries the current `?redirect=` param into the OAuth start URL (after the state declarations, before `handleSubmit`):

```ts
  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    setOauthHref(redirect ? `/api/auth/oauth/google/start?redirect=${encodeURIComponent(redirect)}` : '/api/auth/oauth/google/start')
  }, [])
```

Then, inside the `{status === 'sent' ? (...) : (...)}` else-branch, immediately BEFORE the `<form ...>` element, insert the Google anchor + a divider:

```tsx
            <a
              href={oauthHref}
              style={{
                display: 'block',
                textAlign: 'center',
                padding: '0.875rem 2rem',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border-color)',
                textDecoration: 'none',
                marginBottom: '1rem',
              }}
            >
              {t.google}
            </a>
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginBottom: '1rem' }}>
              {t.or}
            </div>
```

(Note: the `<form>` currently sits directly inside the else-branch `(...)`. Since the else-branch renders a single element today, wrap the new anchor, the divider, and the existing `<form>` in a `<>...</>` fragment so JSX stays valid.)

- [ ] **Step 3: Typecheck + build**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx next build`
Expected: PASS — no type errors, build succeeds, `/login` + `/en/login` render.

- [ ] **Step 4: Commit**

```bash
git add LMS/tochka-sborki/web/components/login-form.tsx LMS/tochka-sborki/web/lib/dictionaries.ts
git commit -m "feat(auth): Continue-with-Google button on the login form (fb_25d8fa04)"
```

---

## Notes for the controller

- **Migration before push:** after Task 1, apply `0016_oauth_google.sql` to prod D1 via cloudflare-api MCP `/query` (NOT wrangler); confirm `google_sub` column + index exist before the branch is pushed.
- **Final gates** (whole branch): `cd workers && npx tsc --noEmit && npx vitest run src/`; `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx next build`.
- **Security-sensitive:** the final whole-branch review runs on opus. Point it at the security invariants (state-CSRF, PKCE, open-redirect guard, email_verified gate, secret handling).
- **Owner ops (not code, out of scope):** create the Google Cloud OAuth client, register redirect_uri `https://ai.mamaev.coach/api/auth/oauth/google/callback`, set `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` via `wrangler secret put` (silent capture, never printed). Until set, the endpoints return 503 (dark-ship safe).
