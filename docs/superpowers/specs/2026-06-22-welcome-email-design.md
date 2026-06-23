# Welcome Email on Registration — Design

**Ticket:** `fb_2319624e38fa` (engine mechanic + Точка Сборки copy).

**Date:** 2026-06-22

## Goal

Send a warm, de-hustled welcome email to a learner the first time they register,
alongside the existing transactional magic-link email — bilingual, best-effort,
honoring the authenticity boundary (no spam/scarcity/upsell).

## Honest-triage note (verified premises)

All ticket premises confirmed against the repo:

- **`handleSendLink`** (`workers/src/handlers/auth.ts`) is the registration entry. It
  detects `const isNewUser = !user`, `INSERT`s the new user with `language`/`source`,
  and already calls `addResendContact(env, newLead)` inside `ctx.waitUntil` for new
  users only. The welcome send hooks in right there.
- **`buildMagicLinkEmail(lang, verifyUrl) → { subject, text, html }`** is the existing
  bilingual Resend pattern to mirror (RU default, EN for `lang === 'en'`).
- **Draft copy exists** at `OneDrive/Точка Сборки/001 welcome package/welcome-email-template.md`
  (bilingual, with placeholders) — transcribed into the builder as course-data.
- Best-effort send pattern proven in `lib/owner-notify.ts` / `lib/purchase-email.ts`
  (never throws, no-op without `RESEND_API_KEY`).

No migration, no new secret (`RESEND_API_KEY` + `OWNER_EMAIL` already exist), no new route.

## Authenticity boundary (inherited)

De-hustled from Cabral's "Welcome Care Package": warm ~3-sentence founder note
(axis-2 trust, `fb_e0529c53`) → "show the menu" orientation → ONE primary CTA = the
intake quest (drives personalization) with magic-link sign-in secondary → cheatsheet
quick-win → anti-fluff "what you won't get" promise (`fb_797eef86`). **Never** add
testimonials, countdowns, income claims, scarcity, or upsell.

## Decisions locked during brainstorming

1. **When to send: on signup, two emails.** New user (`isNewUser`) in `handleSendLink`
   gets BOTH the existing plain transactional magic-link email (best deliverability —
   the sign-in path must always land) AND the welcome email. The welcome also embeds
   the same `verifyUrl` as a convenience. Returning users (`isNewUser === false`) get
   only the magic-link email.
2. **Idempotency via `isNewUser`** — the welcome fires only on the first user `INSERT`.
   No `welcomed_at` column, no migration.
3. **Engine / course-data split (YAGNI):** new `lib/welcome-email.ts` holds the builder
   (Точка Сборки copy = course-data) + a best-effort sender (engine mechanic). One
   course now → one builder; the multi-course template-registry seam is named, not built.
4. **`{{first_name}}` → no name collected** at email-only signup. Use a name-less
   greeting (`Привет!` / `Hi there,`) and a name-less subject (`Добро пожаловать в
   Точку Сборки` / `Welcome to Tochka Sborki`). The draft's name-dependent A/B subjects
   are dropped in favor of one clean subject per locale.
5. **`{{community_url}}` → no community URL exists.** The draft marks step 3 optional;
   omit it for now (email has 2 steps: intake + first module). Easy add later.
6. **`{{unsubscribe_url}}` → List-Unsubscribe header, no route.** See below. The in-body
   anti-fluff line is softened to "unsubscribe with the button in your mail client" so
   it promises nothing the header can't deliver (no dead one-click URL).

## Components

### `workers/src/lib/welcome-email.ts`

```ts
import type { Env } from './types'

export interface WelcomeEmail {
  subject: string
  text: string
  html: string
  listUnsubscribe: string   // value for the List-Unsubscribe header
}

// lang: 'en' → English; anything else → Russian (default), mirroring buildMagicLinkEmail.
export function buildWelcomeEmail(
  lang: string,
  ctx: { verifyUrl: string; ownerEmail: string },
): WelcomeEmail
```

Resolved placeholders (locale-correct, EN gets the `/en` prefix):

| placeholder | value |
|---|---|
| `{{magic_link}}` | `ctx.verifyUrl` (minted in `handleSendLink`) |
| `{{intake_url}}` | `https://ai.mamaev.coach/quest-intake/` · EN `/en/quest-intake/` |
| `{{cheatsheet_url}}` | `https://ai.mamaev.coach/cheatsheet/` · EN `/en/cheatsheet/` |
| `{{first_name}}` | dropped (name-less greeting) |
| `{{community_url}}` | dropped (step 3 omitted) |
| `{{unsubscribe_url}}` | dropped from body; replaced by mail-client unsubscribe wording |
| `listUnsubscribe` | `<mailto:${ctx.ownerEmail}?subject=unsubscribe>` |

Copy is transcribed from the draft: founder note (~3 sentences), 2-step "how to start"
(intake → first module via magic link), cheatsheet quick-win, "what you won't get"
anti-fluff block, signed "Александр Мамаев (Рави Ангад Синх)". `text` (plain) + light
scannable `html`.

```ts
// Best-effort welcome send (mirrors owner-notify.ts / purchase-email.ts). Never throws.
export async function sendWelcomeEmail(
  env: Env,
  p: { email: string; lang: string; verifyUrl: string },
): Promise<boolean>
```

- no-op `false` if `RESEND_API_KEY` unset.
- builds via `buildWelcomeEmail(p.lang, { verifyUrl: p.verifyUrl, ownerEmail: strip(env.OWNER_EMAIL) })`.
- `POST https://api.resend.com/emails`, Bearer, `from 'Точка Сборки <noreply@mamaev.coach>'`,
  `to: [p.email]`, `subject/text/html`, plus `headers: { 'List-Unsubscribe': listUnsubscribe }`.
- returns `true` on `res.ok`, `false` on non-OK or thrown (logs without leaking the key).

### `workers/src/handlers/auth.ts` — trigger

In `handleSendLink`, in the existing `if (newLead) { ... }` block (which is non-null
exactly when `isNewUser`), after the `addResendContact` `ctx.waitUntil`, add:

```ts
    ctx.waitUntil(
      sendWelcomeEmail(env, { email, lang, verifyUrl })
        .catch(e => console.error('welcome email failed', e))
    )
```

`email`, `lang` (freshly parsed language for the new user), and `verifyUrl` are all in
scope at that point. The welcome is queued AFTER the critical magic-link email has been
sent and the success response is being returned — it never blocks or fails the signup.

## Data flow

```
POST /api/auth/send-link {email}
  → existing user?  → magic-link email only (unchanged)
  → NEW user (isNewUser):
      INSERT user → mint verifyUrl → send transactional magic-link email (unchanged)
      → ctx.waitUntil(addResendContact)              (existing)
      → ctx.waitUntil(sendWelcomeEmail)              (NEW, best-effort)
      → 200 {ok:true}
```

## List-Unsubscribe + deliverability

- Header `List-Unsubscribe: <mailto:OWNER_EMAIL?subject=unsubscribe>` — points at a real
  deliverable inbox (`env.OWNER_EMAIL`, already used by owner-notify), not a phantom
  `unsubscribe@…` with no MX. Gmail/Apple Mail render a native Unsubscribe button; a
  click emails the owner, who removes the Resend contact (CRM already manages contacts).
- No `List-Unsubscribe-Post: List-Unsubscribe=One-Click` — RFC 8058 one-click needs an
  HTTPS POST endpoint, out of scope for header-only.
- The header is also a deliverability signal (Gmail Primary vs Promotions). Combined with
  plain-text part + light HTML + the domain's existing SPF/DKIM/DMARC (magic-link emails
  already land), the welcome should place well.
- The welcome is a single onboarding email, not a sequence — there is no recurring email
  stream to truly unsubscribe from (the daily nudge lives in Telegram). A full
  unsubscribe route + suppression store is premature; deferred to when recurring email
  campaigns exist. See `reference_resend_deliverability`.

## Error handling

- `sendWelcomeEmail` never throws; failure logs and returns `false`. The signup response
  is already returned regardless (best-effort via `ctx.waitUntil`).
- No new HTTP status codes — the welcome is a side effect, not a request path.
- Dark/quiet: no `RESEND_API_KEY` → no-op (matches how the rest of the worker degrades).

## Testing (vitest env=node)

**`lib/welcome-email.test.ts`:**
- `buildWelcomeEmail('ru', ctx)` — subject `Добро пожаловать в Точку Сборки`; `text` and
  `html` contain `verifyUrl`, `/quest-intake/`, `/cheatsheet/`; contain the anti-fluff
  marker; contain NO unresolved `{{`; `listUnsubscribe` === `<mailto:OWNER?subject=unsubscribe>`.
- `buildWelcomeEmail('en', ctx)` — subject `Welcome to Tochka Sborki`; URLs carry the
  `/en/` prefix (`/en/quest-intake/`, `/en/cheatsheet/`); EN founder note present; no `{{`.
- `sendWelcomeEmail` (mock `globalThis.fetch`): (a) `RESEND_API_KEY` set → `POST
  /emails` Bearer, body carries resolved subject + `List-Unsubscribe` header, returns
  true; (b) no key → no-op false, fetch not called; (c) non-OK → false, never throws.

**`handlers/auth.test.ts` (extended):**
- new user (`SELECT users` → null) → `handleSendLink` queues the welcome: two `/emails`
  POSTs occur (magic-link + welcome). Use a fetch spy counting calls to
  `api.resend.com/emails`; assert one body is the magic-link and one carries the welcome
  subject. Drive `ctx.waitUntil` so the queued send runs (await the passed promises).
- existing user (`SELECT users` → a row) → only ONE `/emails` POST (magic-link); the
  welcome is NOT sent. This is the idempotency test at the trigger level.

## Files

| File | Responsibility |
|---|---|
| `workers/src/lib/welcome-email.ts` | `buildWelcomeEmail` (course-data copy) + `sendWelcomeEmail` (best-effort) |
| `workers/src/lib/welcome-email.test.ts` | builder + sender tests |
| `workers/src/handlers/auth.ts` | `+ ctx.waitUntil(sendWelcomeEmail(...))` in the `newLead`/`isNewUser` block |
| `workers/src/handlers/auth.test.ts` | trigger + idempotency tests |

No migration, no new secret, no new route. ~4 TDD tasks.

## Out of scope (future)

- Multi-course template registry (engine seam named, not built — adds when a 2nd course exists).
- Full unsubscribe route + suppression store (when recurring email campaigns exist).
- Community step (when a community URL exists).
- "Prefer Telegram? continue there" line (when bot deep-link is wired into onboarding — `fb_5e4afe37`).
- Name personalization (would require collecting a name at signup).
