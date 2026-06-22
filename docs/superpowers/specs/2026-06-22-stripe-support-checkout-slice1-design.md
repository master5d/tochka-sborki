# Stripe checkout — Slice 1 (Support / pay-what-you-want) — Design Spec

**Date:** 2026-06-22
**Ticket:** `fb_c20c437fe85d` (Batch 3 · TELEGRAM/monetization), Slice **1** of an engine. **Level:** engine
(reusable across all umbrellas). Courses stay 100% free forever — checkout is ONLY for support/tips (this
slice) and later digital/physical goods.

## Goal

Let a supporter "tip the creator" via a Stripe-hosted Checkout Session: pick a preset or custom amount on a
bilingual `/support` page → Worker creates the session → redirect to Stripe → return to a thank-you. No
catalog, no fulfillment, no webhook. Zero PCI (hosted page).

## Decisions (owner-selected / constraints)

- **Stripe-hosted Checkout Sessions** (server-created), not Payment Links, not Telegram Stars. Stripe account
  exists.
- **Amount = presets ($3 / $7 / $15) + custom**, currency **USD** (sole proprietor, Nashville).
- **Framing = "support / tip the creator"** — the entity is an unregistered sole proprietor, so **never**
  "donate to a nonprofit" or "tax-deductible". No scarcity, no vanity/progress-goal, no hard push (authenticity
  boundary).
- **No D1 / no webhook in Slice 1** — a tip needs no delivery; Stripe is the system of record. The webhook +
  `purchases` table arrive in Slice 2 (digital goods).
- **Surfaced from web LMS + the live Telegram bot.**

## Architecture & data flow

```
/support page (presets + custom) → POST /api/checkout/support { cents }
  Worker: validateSupportAmount → buildSupportSessionForm → POST stripe /v1/checkout/sessions
          → { url }
  page: window.location = url → Stripe hosted page
        success_url → /support/thanks/   ·   cancel_url → /support/
Telegram bot /support → web_app button → /support page
```

The Stripe secret lives only in the Worker; the page never sees it. Hosted Checkout = no card data touches us.

## Units (small, isolated, testable)

### Worker (`workers/src/`)

**`lib/checkout.ts` (+`.test.ts`) — pure**

```ts
export const MIN_CENTS = 100        // $1
export const MAX_CENTS = 100_000    // $1000

export type AmountResult = { ok: true; cents: number } | { ok: false; error: 'invalid' | 'too_small' | 'too_large' }
export function validateSupportAmount(raw: unknown): AmountResult
// integer cents only; NaN/non-integer/≤0 → 'invalid'; <MIN → 'too_small'; >MAX → 'too_large'

export function buildSupportSessionForm(opts: { cents: number; locale: 'ru' | 'en' }): URLSearchParams
// mode=payment, submit_type=donate, line_items[0][price_data][currency]=usd,
// line_items[0][price_data][product_data][name]=<localized "Support …">,
// line_items[0][price_data][unit_amount]=cents, line_items[0][quantity]=1,
// success_url=https://ai.mamaev.coach[/en]/support/thanks/, cancel_url=https://ai.mamaev.coach[/en]/support/
```

**`handlers/checkout.ts` (+`.test.ts`)** — `handleSupportCheckout(request, env)`:
- parse `{ amount }` (cents) + `{ locale }` (default 'ru'); bad JSON → 400.
- `!env.STRIPE_SECRET_KEY` → 503 `{ error: 'stripe_not_configured' }`.
- `validateSupportAmount` → `!ok` → 400 `{ error }`.
- `POST https://api.stripe.com/v1/checkout/sessions` — `Authorization: Bearer <key>`,
  `Content-Type: application/x-www-form-urlencoded`, body = `buildSupportSessionForm(...)`. Non-ok → 502.
- success → `{ url: session.url }`.

**`index.ts`** — route `path === '/api/checkout/support' && method === 'POST'`.
**`lib/types.ts`** — add `STRIPE_SECRET_KEY: string`.

### Web (`LMS/tochka-sborki/web/`)

**`lib/checkout/support-content.ts` (+`.test.ts`) — pure** — `buildSupportContent(locale)` →
`{ eyebrow, title, lead, presets:[{label,cents}], customLabel, customPlaceholder, submitLabel, footnote,
thanksTitle, thanksBody }`. Presets: `$3/$7/$15` → 300/700/1500 cents. `@/` alias OK (web-only).

**`components/support/support-form.tsx`** — `'use client'`: preset buttons + a custom $-input (converts
dollars→cents, client-side guard ≥$1). On submit → `POST /api/checkout/support { amount: cents, locale }` →
`window.location.assign(url)`. On non-ok → a calm inline "временно недоступно / try again" (no redirect).

**`app/support/page.tsx`** + **`app/en/support/page.tsx`** — render framing + `<SupportForm locale>`.
**`app/support/thanks/page.tsx`** + **`app/en/support/thanks/page.tsx`** — warm thank-you, no upsell.

**`lib/dictionaries.ts`** — add `nav.support` (RU "Поддержать" / EN "Support").
**`components/nav.tsx`** — a gentle Support link (not visually loud).

### Bot (rides the live webhook)

**`lib/telegram-update.ts`** — add `'support'` to `BotIntent['kind']`; `/support` → support.
**`lib/bot-copy.ts`** — add `supportIntro`, `supportButton` (RU/EN).
**`lib/course-order.ts`** — add `supportUrl(locale)` → `https://ai.mamaev.coach[/en]/support/`.
**`handlers/telegram-webhook.ts`** — handle `kind === 'support'`: `sendMessage(supportIntro, { text:
supportButton, url: supportUrl(locale) })`.

## Error handling

| Condition | Response |
|---|---|
| Bad JSON | 400 |
| `STRIPE_SECRET_KEY` unset | 503 `stripe_not_configured` (dark-ship safe) |
| Amount invalid / out of bounds | 400 `{ error }` |
| Stripe API non-ok | 502 |
| Web: any non-ok | calm inline message, no redirect |

## Security

Amount is validated **server-side** (integer cents, $1–$1000) — the client cannot send $0/negative/absurd.
`STRIPE_SECRET_KEY` is Worker-only (never shipped to the browser). Stripe-hosted page → **no PCI scope**,
no card data on our infra. `success_url`/`cancel_url` are our own first-party pages. No new secret in the
client bundle.

## Testing (TDD, vitest env=node)

- **`checkout.test.ts`** (worker) — `validateSupportAmount`: 700→ok; 0/NaN/'x'/12.5→`invalid`; 50→`too_small`;
  200000→`too_large`. `buildSupportSessionForm`: contains `mode=payment`, `submit_type=donate`,
  `unit_amount=700`; `success_url` differs ru (`/support/thanks/`) vs en (`/en/support/thanks/`).
- **`handlers/checkout.test.ts`** — valid → `fetch` to `api.stripe.com/v1/checkout/sessions` with
  `Authorization: Bearer` + returns the session url; key unset → 503; amount 50 → 400; Stripe 400 → 502.
- **`support-content.test.ts`** (web) — ru vs en `title` differ; `presets` carry cents 300/700/1500 in both
  locales; required fields (`submitLabel`, `thanksTitle`) non-empty.

## Deploy gate (owner)

Owner adds the secret: `cd workers && npx wrangler secret put STRIPE_SECRET_KEY` (I extend
`telegram-go-live.ps1` with a `-StripeKey` path, or it's a one-liner). Until set, `/api/checkout/support`
returns 503 and the page shows the calm message. After the key is set + deploy, support is live. Currency USD;
success/cancel pages are public static.

## Out of scope (Slice 2 / future)

- **Slice 2:** digital-goods catalog + Stripe **webhook** (`Stripe-Signature` HMAC verify via WebCrypto) →
  Resend asset delivery + `purchases` table.
- **Future:** physical goods (shipping/address collection); recording tips in D1 (Stripe is the record now);
  swapping the sole-proprietor framing for nonprofit/tax-deductible once `fb_3dc7f76f5f4e` (legal foundation)
  lands.
