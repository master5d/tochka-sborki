# Telegram Mini App wrapper (Phase 0) — Design Spec

**Date:** 2026-06-22
**Ticket:** `fb_1d87217b78f7` (Batch 3 · TELEGRAM, Phase 0). Architecture decided by research
ticket `fb_53ed0f17` = **hybrid** (Mini App embeds existing LMS + companion bot later), NOT a port.
**Level:** engine (reused by any future course under the LMS scaffold).

## Goal

Let the existing Next.js static-export LMS run as a **Telegram Mini App**: embed it unchanged at
`ai.mamaev.coach` inside Telegram's WebView, and add a Worker auth-bridge route that **verifies
signed Telegram `initData` strictly server-side** and maps the Telegram user to the existing
magic-link / D1 identity — issuing the same `session` cookie the email flow already issues. Single
codebase serves web + Telegram.

## Decisions (owner-selected)

- **Identity reconciliation = hybrid match→else native.** Match an existing account by `telegram_id`,
  else by `telegram_handle` (==username), else auto-create a Telegram-native account. Instant entry
  for everyone; the one edge (an email-user who never listed their handle gets a duplicate account)
  is solved later by an opt-in "link email" button (out of scope here).
- **Wrapper UX = minimal silent bridge.** Auto-auth via `initData` + `WebApp.ready()/expand()` only.
  No theme bridge, no BackButton/MainButton. The LMS renders with its own chrome/theme/nav.
- **Session issuance = direct cookie.** `/api/auth/telegram` issues the same HS256 `session` JWT
  cookie as `handleVerify`. (Rejected: ephemeral magic-link exchange — no email to deliver, extra
  moving parts; per-request initData auth — couples every API call to Telegram, breaks web/JWT parity.)

## Architecture & data flow

```
Telegram → opens ai.mamaev.coach (registered WebApp)
  → <TelegramAuthBridge> mounts in layout: WebApp.ready(); WebApp.expand()
  → GET /api/auth/me        (already signed in? → stop, render LMS)
  → POST /api/auth/telegram { initData }
        Worker: verifyTelegramInitData(initData, TELEGRAM_BOT_TOKEN, { maxAgeSec: 300 })
                → reconcile identity (hybrid) → signJWT → Set-Cookie: session=…
  → bridge dismisses overlay → LMS/RPG runs unchanged
```

The Mini App loads `ai.mamaev.coach` directly, so the bridge POST is **same-origin** — existing CORS
(`ALLOWED_ORIGINS` already includes `ai.mamaev.coach`) and the `SameSite=Strict` first-party cookie
both apply without change.

## Units (each small, isolated, testable)

### Worker (`workers/src/`)

**`lib/telegram-initdata.ts` (+`.test.ts`) — pure verifier**

```ts
export interface TelegramUser {
  id: string                 // numeric id as string (64-bit safe), extracted via regex
  username: string | null
  first_name: string | null
  language_code: string | null
}
export type InitDataResult =
  | { ok: true; user: TelegramUser; authDate: number }
  | { ok: false; error: string }

export async function verifyTelegramInitData(
  initData: string,
  botToken: string,
  opts?: { maxAgeSec?: number; nowSec?: number }   // defaults: maxAgeSec 300, nowSec = Date.now()/1000
): Promise<InitDataResult>
```

Algorithm (Telegram WebApp spec):
1. Parse `initData` as `URLSearchParams`. Pull out `hash`; require `hash`, `auth_date`, `user`
   present (else `{ ok:false, error:'malformed' }`).
2. `data_check_string` = every remaining param as `key=value`, **sorted by key**, joined by `\n`.
3. `secret_key = HMAC_SHA256(key="WebAppData", msg=botToken)`.
4. `computed = HMAC_SHA256(key=secret_key, msg=data_check_string)` as lowercase hex.
5. **Constant-time** compare `computed` vs supplied `hash`; mismatch → `{ ok:false, error:'bad_hash' }`.
6. Freshness: `authDate = Number(auth_date)`. Reject if `nowSec - authDate > maxAgeSec`
   (`error:'stale'`) or `authDate - nowSec > 60` (clock-skew guard, `error:'future'`).
7. Extract `id` via regex `/"id":(\d+)/` on the **raw decoded `user`** string (avoids `JSON.parse`
   >2^53 precision loss); `username`/`first_name`/`language_code` via `JSON.parse(user)`.
8. Return `{ ok:true, user, authDate }`.

**`handlers/telegram-auth.ts` (+`.test.ts`) — `handleTelegramAuth(request, env)`**

- Parse `{ initData }` (bad JSON → 400 `Invalid JSON`).
- If `!env.TELEGRAM_BOT_TOKEN` → 503 `{ error:'telegram_not_configured' }` (ships dark safely).
- `verifyTelegramInitData(initData, env.TELEGRAM_BOT_TOKEN, { maxAgeSec: 300 })`; `!ok` → 401
  `{ error:'invalid_initData' }`.
- **Reconcile (in order):**
  1. `SELECT id, email FROM users WHERE telegram_id = ?` (the verified id) → found ⇒ use it.
  2. else, if `username` present: `SELECT id, email FROM users WHERE telegram_handle = ? COLLATE
     NOCASE AND telegram_id IS NULL` → found ⇒ `UPDATE users SET telegram_id = ? WHERE id = ?`
     (backfill), use it.
  3. else **create**: `id = crypto.randomUUID()`, `email = 'tg_' + id_tg + '@telegram.local'`,
     `telegram_id`, `telegram_handle = username`, `language = language_code ?? 'unknown'`,
     `source = 'telegram'`, `created_at = now`. (Synthetic email satisfies `UNIQUE NOT NULL` and is
     **never emailed** — this handler does not call Resend.)
- Issue session exactly like `handleVerify`: `signJWT({ sub:user.id, email, iat:now, exp:now+2592000 },
  env.WORKER_JWT_SECRET)`; `Set-Cookie: session=…; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000;
  Path=/`. Body `{ ok:true, email, telegram:true }`.

**`migrations/0008_telegram_link.sql`**

```sql
ALTER TABLE users ADD COLUMN telegram_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_telegram_id
  ON users(telegram_id) WHERE telegram_id IS NOT NULL;
```
Partial unique index so many `NULL`s coexist while linked ids stay unique.

**`index.ts`** — add one branch: `path === '/api/auth/telegram' && method === 'POST'` →
`handleTelegramAuth(request, env)`.

**`lib/types.ts`** — add `TELEGRAM_BOT_TOKEN: string` to `Env`.

### Web (`LMS/tochka-sborki/web/`)

**`lib/telegram/webapp.ts` (+`.test.ts`)**

```ts
export interface TelegramWebApp {
  initData: string
  ready(): void
  expand(): void
}
export function getTelegramWebApp(): TelegramWebApp | null   // window.Telegram?.WebApp ?? null
export function isInsideTelegram(): boolean                  // !!getTelegramWebApp()?.initData
```
Pure over an injectable global (test injects `globalThis.window`). `@/`-alias OK — web-only file,
not consumed by `workers/` (Gotcha 2 not triggered).

**`components/telegram/telegram-auth-bridge.tsx`** — `'use client'`, mounted once in `app/layout`.
On mount: if `!isInsideTelegram()` → render nothing. Else `WebApp.ready(); WebApp.expand()`;
`GET /api/auth/me` → if authed, render nothing; else `POST /api/auth/telegram { initData }`. While the
POST is in flight, show a small centered overlay with `t.telegram.signingIn`. On `ok` → dismiss (the
existing `/api/auth/me`-driven nav picks up the session). On any failure → dismiss silently and let
the normal LMS (email login) show. Never hard-block.

**`app/layout`** — load the SDK via `next/script`
(`src="https://telegram.org/js/telegram-web-app.js"`, `strategy="beforeInteractive"`; harmless
outside Telegram) and mount `<TelegramAuthBridge>` once. Works under `output:'export'`.

**`lib/dictionaries.ts`** — add `telegram.signingIn` (RU "Входим через Telegram…" / EN "Signing in
via Telegram…").

## Error handling

| Condition | Response |
|---|---|
| Bad JSON body | 400 `Invalid JSON` |
| `TELEGRAM_BOT_TOKEN` unset | 503 `telegram_not_configured` (dark-ship safe) |
| Bad hash / stale / future / malformed | 401 `invalid_initData` |
| Bridge: any non-ok | dismiss overlay, fall through to normal LMS (email login) |

## Testing (TDD)

- **`telegram-initdata.test.ts`** — a helper builds **valid** `initData` using node's `crypto`
  (independent impl vs the Worker's `subtle`): assert accept; tampered hash → `bad_hash`; `auth_date`
  older than `maxAgeSec` → `stale`; `auth_date` far future → `future`; missing `user`/`hash` →
  `malformed`; a >2^53 id round-trips as an exact string.
- **`telegram-auth.test.ts`** — mock D1 (mirror `auth.test.ts`): (1) unknown TG user → INSERT + Set-Cookie;
  (2) `telegram_id` match → no INSERT, Set-Cookie; (3) handle match (`telegram_id IS NULL`) → UPDATE
  backfills id + Set-Cookie; (4) bad initData → 401; (5) token unset → 503.
- **`webapp.test.ts`** — `isInsideTelegram()`/`getTelegramWebApp()` with and without injected global.
- No React-render tests (vitest env=node, per project convention).

## Deploy gate (ships dark until owner flips on)

No nav/UI links point at the bridge; it only activates when launched as a Telegram WebApp **and** the
token secret is set — so the code is safe to merge/deploy dark.

Owner go-live steps:
1. Create the bot in **BotFather**; get the bot token.
2. `cd workers && wrangler secret put TELEGRAM_BOT_TOKEN` (paste token — watch for BOM).
3. In BotFather, set the Mini App / WebApp URL to `https://ai.mamaev.coach/`.

I apply **migration 0008** myself via the Cloudflare-api MCP plugin `execute` (D1 `/query` endpoint,
additive ALTER + index — same zero-token path used for 0007). `PRAGMA table_info(users)` before/after
to verify idempotency.

## Out of scope (follow-on tickets)

- Companion bot (`fb_5e4afe37ca6b`), KB Q&A (`fb_a13b15a54835`), checkout (`fb_c20c437fe85d`).
- Telegram theme/BackButton bridge; nav-display polish for Telegram-native accounts (show
  `@username` instead of synthetic email); opt-in "link email" to merge a duplicate.
