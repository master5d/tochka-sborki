# Google OAuth for learner profiles

**Ticket:** fb_25d8fa04c141 (was BLOCKED — unblocked via this brainstorm)
**Date:** 2026-07-04
**Status:** approved

## Goal

Add Google OAuth as a third identity path for learner sign-in, coexisting
with the shipped magic-link and Telegram auth. A browser hits the worker
`/start`, is redirected to Google, returns to the worker `/callback`, which
resolves/links a user row and mints the SAME `session` JWT cookie the other
paths already issue. The session layer (`requireAuth`/`requireOwner`, JWT,
cookie) is unchanged — it is already provider-agnostic.

## Context (grep-verified)

- **Session layer is provider-agnostic and shipped.** `handleVerify`
  (magic-link) and `handleTelegramAuth` both mint
  `signJWT({ sub: user.id, email: user.email, iat, exp: now+2592000 },
  env.WORKER_JWT_SECRET)` and set
  `session=<jwt>; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000; Path=/`.
  `requireAuth` reads the `session` cookie → `verifyJWT` → `{ sub, email }`.
- **`telegram-auth.ts` is the exact precedent** for a second identity
  provider coexisting with magic-link: verify external identity → match by an
  id column (`telegram_id`) → else match by a secondary key → else create a
  synthetic user → mint the same session JWT. OAuth mirrors this shape.
- **users table** (via migrations 0001–0015): `id, email, created_at,
  language, source, telegram_handle, telegram_id, alumni_*, nudge_*,
  last_nudge_at`. Email is the human identity key. Next migration = **0016**.
- **Routes** live under `/api/auth/*` in `workers/src/index.ts`
  (`send-link`, `verify`, `telegram`, `me`, `logout`).
- **Login UI**: `components/login-form.tsx` (`'use client'`) — a magic-link
  email form + an optional telegram-handle field; it stashes a `redirect`
  query param in `sessionStorage` before posting. Dictionary strings via
  `getDictionary(locale).login`.

## Decisions (fixed by precedent — not open forks)

- **Coexist, not replace.** magic-link + Telegram already coexist; replacing
  would regress email users and the owner-email gate.
- **Provider: Google first.** Broadest learner coverage; verified email
  enables clean linking. GitHub is a follow-on on the same pattern.
- **Linking model: one user, multiple identities via a column on `users`**
  (`google_sub`), mirroring `telegram_id`. A normalized `user_identities`
  table is YAGNI at 1–2 providers.

## Architecture

### 1. Migration `workers/migrations/0016_oauth_google.sql`

```sql
-- 0016_oauth_google.sql — Google OAuth identity column (fb_25d8fa04)
-- Additive, nullable. Apply to prod D1 via cloudflare-api MCP /query (NOT wrangler) BEFORE push.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;
```

Partial unique index: two users can never share a Google `sub`, while
existing rows (NULL) are unaffected.

### 2. `workers/src/lib/oauth-google.ts` — pure + thin-network helpers

```ts
// PKCE (S256) — WebCrypto.
export function generateVerifier(): string           // 43+ char base64url random
export async function pkceChallenge(verifier: string): Promise<string>  // base64url(SHA-256(verifier))

// Authorize URL (pure string build).
export function buildAuthorizeUrl(o: {
  clientId: string; redirectUri: string; state: string; codeChallenge: string
}): string
// → https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=…
//    &redirect_uri=…&scope=openid%20email&state=…&code_challenge=…&code_challenge_method=S256

// Token exchange (network) — client_secret stays server-side.
export async function exchangeCode(o: {
  code: string; verifier: string; clientId: string; clientSecret: string; redirectUri: string
}): Promise<{ ok: true; accessToken: string } | { ok: false }>
// POST https://oauth2.googleapis.com/token (application/x-www-form-urlencoded)

// Identity (network).
export async function fetchUserinfo(accessToken: string):
  Promise<{ ok: true; sub: string; email: string; emailVerified: boolean } | { ok: false }>
// GET https://www.googleapis.com/oauth2/v3/userinfo (Bearer)

// Open-redirect guard — only a same-origin absolute path is allowed.
export function safeRedirectPath(raw: string | null): string  // returns '/'-prefixed path or '/'
```

`safeRedirectPath` accepts only values matching `^/(?!/)` (leading slash, not
`//`), stripping anything with a scheme or host; otherwise returns `/`.

### 3. `workers/src/handlers/oauth.ts`

**`handleOAuthStart(request, env)` (GET):**
- If `!env.GOOGLE_OAUTH_CLIENT_ID || !env.GOOGLE_OAUTH_CLIENT_SECRET` →
  `Response.json({ error: 'oauth_not_configured' }, { status: 503 })`.
- `state = generateVerifier()` (reuse the random gen); `verifier =
  generateVerifier()`; `challenge = await pkceChallenge(verifier)`.
- `redirect = safeRedirectPath(new URL(request.url).searchParams.get('redirect'))`.
- Set three short-lived cookies (`Max-Age=600`, `HttpOnly; Secure;
  SameSite=Lax; Path=/`): `oauth_state`, `oauth_verifier`, `oauth_redirect`.
  (SameSite=Lax so they survive the top-level GET redirect back from Google.)
- `redirectUri = \`${new URL(request.url).origin}/api/auth/oauth/google/callback\``.
- 302 to `buildAuthorizeUrl(...)` with the three temp cookies set.

**`handleOAuthCallback(request, env)` (GET):**
- 503 if unconfigured (same guard).
- Read `code`, `state` from query; read `oauth_state`, `oauth_verifier`,
  `oauth_redirect` cookies. If `state` missing/≠ cookie, or `code` missing →
  302 to `/login?error=oauth` (CSRF/again). (Locale-agnostic path; the SPA
  login route handles both locales.)
- `exchangeCode({ code, verifier, clientId, clientSecret, redirectUri })`;
  on `{ok:false}` → 302 `/login?error=oauth`.
- `fetchUserinfo(accessToken)`; on `{ok:false}` → 302 `/login?error=oauth`.
- **Linking (mirror `telegram-auth`):**
  1. match by `google_sub` → user.
  2. else if `emailVerified` and a `users` row with that `email` exists →
     `UPDATE users SET google_sub = ? WHERE id = ?` (backfill), use it.
  3. else create: `INSERT INTO users (id, email, created_at, language,
     source, google_sub) VALUES (?, ?, ?, 'unknown', 'google', ?)`.
  - **email_verified gate:** if `!emailVerified`, NEVER link to an existing
    email row (anti-account-takeover) — fall through to create only when no
    `google_sub` match exists AND treat the email as non-authoritative (still
    store it, but do not use it to claim another account).
- Mint `signJWT({ sub: user.id, email: user.email, iat: now, exp:
  now+2592000 }, env.WORKER_JWT_SECRET)`; set the `session` cookie exactly as
  `handleVerify` does.
- Clear the three temp cookies (`Max-Age=0`).
- 302 to `safeRedirectPath(oauth_redirect)` (default `/`), with the `session`
  Set-Cookie.

### 4. Wire in `workers/src/index.ts`

Two GET routes (browser navigations, not JSON POST):
```ts
} else if (path === '/api/auth/oauth/google/start' && method === 'GET') {
  response = await handleOAuthStart(request, env)
} else if (path === '/api/auth/oauth/google/callback' && method === 'GET') {
  response = await handleOAuthCallback(request, env)
```

New `Env` fields: `GOOGLE_OAUTH_CLIENT_ID?: string`,
`GOOGLE_OAUTH_CLIENT_SECRET?: string` in `workers/src/lib/types.ts`.

### 5. Web `components/login-form.tsx` + dictionaries

- Add a "Continue with Google" **anchor** (real navigation, not fetch) above
  the email form:
  `<a href={\`/api/auth/oauth/google/start?redirect=${encodeURIComponent(redirect)}\`}>`
  where `redirect` = the current `?redirect=` param (or `/`). Styled to match
  the existing button vocabulary (CSS vars); a subtle divider ("или" / "or")
  between it and the email form.
- New `dictionaries.ts` `login` strings (ru+en): `google` (button label,
  e.g. "Войти через Google" / "Continue with Google") and `or` ("или" /
  "or").

## Security invariants (the opus-final risk lens)

- **State CSRF:** callback rejects unless `state` query === `oauth_state`
  cookie.
- **PKCE S256:** verifier in a cookie, challenge in authorize; exchange sends
  the verifier.
- **Open-redirect guard:** `safeRedirectPath` allows only same-origin
  absolute paths; everything else → `/`.
- **email_verified gate:** an unverified Google email may NOT link to or
  claim an existing email account.
- **Secrets:** `client_secret` used only in the worker token exchange; never
  logged. No token/secret printed to stdout.
- **Server-side identity:** identity comes from the server-side userinfo call
  on an access token from our own authenticated exchange (no client-supplied
  identity trusted).

## Testing

- `workers/src/lib/oauth-google.test.ts`:
  - `buildAuthorizeUrl` contains all required params incl.
    `code_challenge_method=S256`, `scope=openid email`, the exact endpoint.
  - `pkceChallenge` is deterministic and base64url (no `+/=`); differs from
    the verifier.
  - `safeRedirectPath`: `/course/` → `/course/`; `//evil.com`, `https://x`,
    `javascript:…`, `null` → `/`.
- `workers/src/handlers/oauth.test.ts` (fake D1, mirror
  `telegram-auth.test`):
  - unconfigured env → 503 on start and callback.
  - callback with `state` ≠ cookie → 302 `/login?error=oauth`, no session
    set.
  - linking: match-by-`google_sub` returns existing; verified-email links +
    backfills; no match creates; **unverified email does NOT link** to an
    existing email row.
  - success sets a `session` cookie and 302s to the sanitized redirect.
- Gate: `cd workers && npx tsc --noEmit && npx vitest run src/`; migration
  applied to prod D1 via cloudflare-api MCP `/query` before push.

## Decomposition → SDD tasks (writing-plans finalizes)

1. Migration `0016` + `lib/oauth-google.ts` (PKCE, authorize URL, exchange,
   userinfo, `safeRedirectPath`) + `oauth-google.test.ts` + `Env` fields.
2. `handlers/oauth.ts` (`start` + `callback` with linking + session) + wire
   in `index.ts` + `oauth.test.ts`.
3. `login-form.tsx` Google button + `dictionaries.ts` strings.

## Out of scope

- GitHub / other providers; link/unlink UI in the profile; a normalized
  `user_identities` table.
- Replacing magic-link or Telegram auth.
- Verifying the Google `id_token` JWT signature (we use the server-side
  userinfo endpoint on our own exchanged access token — TLS trust on the
  exchange).
- Owner ops (not code): creating the Google Cloud OAuth client, registering
  the redirect_uri, and setting `GOOGLE_OAUTH_CLIENT_ID` /
  `GOOGLE_OAUTH_CLIENT_SECRET` via `wrangler secret` (silent capture, never
  printed).
