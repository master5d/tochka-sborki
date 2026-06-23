# Stripe Checkout Slice 2 — Digital-Goods Catalog + Webhook Fulfillment

**Ticket:** `fb_c20c437fe85d` (checkout engine — Slice 2). Continues Slice 1 (support/PWYW, sandbox-LIVE).

**Date:** 2026-06-22

## Goal

Sell fixed-price digital goods through Stripe-hosted Checkout, and fulfil each
purchase automatically (asset link emailed to the buyer) via a signed Stripe
webhook — idempotently, with no PCI surface. Courses stay 100% free forever;
this is the digital-goods arm of the all-umbrella checkout engine.

## Honest-triage note (what existed before this slice)

Verified against the repo on 2026-06-22: **no digital-goods scaffolding existed.**
No store route, no product catalog (data or page), no `purchases` table, no
webhook, no `Stripe-Signature` verification, no asset delivery. The owner's
"заготовки уже есть" refers to the **product files themselves** (on disk / Drive),
not code. Building blocks that DID exist and are reused:

- **Resend infra** — `workers/src/lib/owner-notify.ts` (Bearer `POST /emails`,
  best-effort, never throws, `from noreply@mamaev.coach`). The purchase email
  copies this pattern.
- **Slice 1 checkout** — `lib/checkout.ts` form-builder + `handlers/checkout.ts`
  (Stripe-hosted Checkout Sessions, form-encoded, Bearer). Extended, not replaced.
- **`Env`** already carries `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `OWNER_EMAIL`, `DB`.
- **WebCrypto HMAC-SHA256** — proven in `telegram-initdata.ts` (initData) and
  `jwt.ts`. The webhook signature check reuses the same primitive.

## Framing constraint (inherited from Slice 1)

The "Synergify Institute for AI" nonprofit is **NOT legally registered** — owner
operates as a **sole proprietor**. Purchase-email and store copy say "куплено у
автора (ИП)" framing; **never** "donate to a nonprofit" / "tax-deductible".
These are digital goods being **sold**, not donations — `submit_type=pay`
(Slice 1 support used `submit_type=donate`). No scarcity, no vanity goals.

## Architecture

Five units, each independently testable:

1. **Catalog** (`lib/products.ts`) — static TS config, the single source of truth
   for what's for sale and how each item is delivered.
2. **Product checkout** (`lib/checkout.ts` + `handlers/checkout.ts`) — create a
   Stripe Checkout Session for a *named* product at its configured price.
3. **Webhook verify** (`lib/stripe-webhook.ts`) — pure `Stripe-Signature` HMAC
   verification.
4. **Fulfilment** (`handlers/stripe-webhook.ts` + `lib/purchase-email.ts` +
   `purchases` table) — idempotent record + asset-link email.
5. **Storefront** (web `/store`) — bilingual catalog page with buy buttons.

Feature ships **dark**: empty catalog (`PRODUCTS = []`) + `503` until the owner
sets `STRIPE_WEBHOOK_SECRET` and adds products.

### Decisions locked during brainstorming

- **Catalog = static config, not D1.** Matches repo convention (`course-order.ts`,
  `showcase.ts`). Products change rarely; owner edits the file and redeploys. No
  admin CRUD (YAGNI).
- **Delivery seam = discriminated union** `{ kind:'url' } | { kind:'r2' }`. Slice 2
  **implements only the `url` path** (external Drive/Dropbox/Notion link in config).
  The `r2` branch is declared in the type but throws "not implemented" — R2
  presigning (SigV4 via WebCrypto) becomes its own small slice once the owner
  creates a bucket and adds an R2-hosted product. This keeps Slice 2 from
  bloating or blocking on R2 infra.
- **Guest checkout, email-only.** Stripe collects the buyer email
  (`customer_creation=always`); no LMS account required. `purchases` is keyed by
  `stripe_session_id`.
- **Fulfilment is webhook-driven, not success_url-driven.** `success_url` is only
  a "thanks" page — it is not guaranteed (buyer may close the tab). The webhook is.

## Components

### 1. `workers/src/lib/products.ts`

```ts
export type Delivery =
  | { kind: 'url'; href: string }   // external link (Drive/Dropbox/Notion)
  | { kind: 'r2';  key:  string }   // R2 object key — NOT implemented in Slice 2

export interface Product {
  id: string                        // stable slug, e.g. 'agent-starter-kit'
  priceCents: number                // fixed price, > 0
  name:  { ru: string; en: string }
  blurb: { ru: string; en: string }
  delivery: Delivery
}

export const PRODUCTS: Product[] = []   // owner fills; empty = feature dark

export function findProduct(id: string): Product | undefined

// url -> href. r2 -> throws 'r2 delivery not implemented' (no R2 products exist yet).
export function resolveAssetUrl(d: Delivery): string
```

### 2. Product checkout

`lib/checkout.ts` gains `buildProductSessionForm({ product, locale })`:

- `mode=payment`, `submit_type=pay`, `customer_creation=always`
- one line item: `price_data` with `product.priceCents`, currency `usd`,
  `product_data[name]` = `product.name[locale]`
- `metadata[product_id]` = `product.id`, `metadata[locale]` = locale
  (the webhook reads these to know what to deliver)
- `success_url` = `${BASE}${prefix}/store/thanks/`, `cancel_url` = `${BASE}${prefix}/store/`

`handlers/checkout.ts` gains `handleProductCheckout(request, env)`:

- body `{ productId, locale }` — **price is never taken from the client**
- `503` if no `STRIPE_SECRET_KEY`
- `400` on invalid JSON
- `404` if `findProduct(productId)` is undefined
- POST `https://api.stripe.com/v1/checkout/sessions` (Bearer, form-encoded)
- `502` if Stripe throws or returns non-OK or no `url`
- `{ url }` on success

### 3. `workers/src/lib/stripe-webhook.ts`

```ts
export type WebhookResult =
  | { ok: true;  event: StripeEvent }
  | { ok: false; error: 'bad_format' | 'bad_signature' | 'too_old' }

// rawBody is the exact text() of the request body — never re-serialized JSON.
export async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,         // "t=<unix>,v1=<hex>"
  secret: string,                   // STRIPE_WEBHOOK_SECRET (whsec_...)
  opts?: { nowSec?: number; toleranceSec?: number },  // default tolerance 300s
): Promise<WebhookResult>
```

- parse `t` and `v1` from the header; missing/garbled → `bad_format`
- `signedPayload = "${t}.${rawBody}"`, expected = `HMAC-SHA256(secret, signedPayload)` hex
- constant-time hex compare vs `v1`; mismatch → `bad_signature`
- `|nowSec - t| > toleranceSec` → `too_old`
- on success, `event = JSON.parse(rawBody)`

`StripeEvent` minimal shape: `{ type: string; data: { object: { id, customer_details?:{email}, metadata?:{product_id,locale}, amount_total? } } }`.

### 4. Fulfilment

`workers/migrations/0011_purchases.sql`:

```sql
CREATE TABLE IF NOT EXISTS purchases (
  id                TEXT PRIMARY KEY,        -- uuid (crypto.randomUUID)
  stripe_session_id TEXT NOT NULL UNIQUE,    -- idempotency key
  product_id        TEXT NOT NULL,
  email             TEXT NOT NULL,
  amount_cents      INTEGER NOT NULL,
  locale            TEXT NOT NULL,
  delivered_at      INTEGER,                 -- null = email not yet sent
  created_at        INTEGER NOT NULL
);
```
Applied to prod via the `cloudflare-api` MCP `/query` endpoint (zero-token,
additive — same path as 0008–0010). See `reference_tochka_d1_account`.

`workers/src/lib/purchase-email.ts` — `sendPurchaseEmail(env, { email, product, assetUrl, locale })`:
best-effort Resend `POST /emails` (copies `owner-notify.ts`); bilingual subject +
body with the asset link and the sole-prop footer. Returns `boolean` (sent), never throws.

`workers/src/handlers/stripe-webhook.ts` — `handleStripeWebhook(request, env)`:

1. `503` if no `STRIPE_WEBHOOK_SECRET`
2. `rawBody = await request.text()` **before any parse**
3. `verifyStripeSignature(...)` → `400` on any non-ok result
4. if `event.type !== 'checkout.session.completed'` → `200` (ack, no-op)
5. extract `session.id`, `email`, `metadata.product_id`, `metadata.locale`, `amount_total`
6. `INSERT INTO purchases (...) ON CONFLICT(stripe_session_id) DO NOTHING` —
   if no row was inserted (duplicate retry) → `200`, **send nothing**
7. `findProduct(product_id)`; if missing → log, `200` (can't deliver an unknown product)
8. `resolveAssetUrl(product.delivery)` → `sendPurchaseEmail(...)`
9. on send success → `UPDATE purchases SET delivered_at = now WHERE id = ?`
10. always `200` on a legitimate (signed) event, even if Resend failed
    (`delivered_at IS NULL` = manual/cron retry queue)

### 5. `Env` + router + secret

- `lib/types.ts` — add `STRIPE_WEBHOOK_SECRET: string`
- `index.ts` — route `POST /api/checkout/product` → `handleProductCheckout`,
  `POST /api/stripe/webhook` → `handleStripeWebhook`
- owner sets `STRIPE_WEBHOOK_SECRET` (wrangler secret) from the Stripe Dashboard
  webhook-endpoint signing secret after registering the endpoint

### 6. Storefront (web, Next.js static export)

- `LMS/tochka-sborki/web/lib/store/products.data.ts` — canonical product list for
  the web side. **Deliberately duplicated** from the worker catalog (worker and web
  do not share imports — see `project_mc_hub_monorepo`). A header comment marks it
  "single source — keep in sync with workers/src/lib/products.ts". Only a handful of
  items, edited rarely; runtime fetch-on-static and shared-import were both rejected.
- `LMS/tochka-sborki/web/lib/store/store-content.ts` — bilingual page chrome.
- `components/store/store-grid.tsx` — product cards (name/blurb/price + "Купить"
  button → POST `/api/checkout/product` → `window.location.assign(url)`). Mirrors
  `support-form.tsx`.
- `app/store/page.tsx` + `app/en/store/page.tsx` + `/store/thanks/` (ru + en).
- Empty catalog → polite "скоро / coming soon" empty state.
- nav link "Магазин" / "Store" added to the dictionary next to `nav.support`.
- Bot `/store` command is **out of scope** for Slice 2 (follow-up once catalog fills).

## Data flow

```
Buyer on /store → click Buy → POST /api/checkout/product {productId,locale}
  → worker looks up price in catalog → Stripe Checkout Session (metadata=product_id,locale)
  → redirect to Stripe → buyer pays → Stripe returns to /store/thanks/ (cosmetic)
                                     ↓ (async, guaranteed)
  Stripe → POST /api/stripe/webhook (signed)
    → verify signature → checkout.session.completed
    → INSERT purchases ON CONFLICT DO NOTHING (idempotent)
    → resolve asset url → Resend email with link → mark delivered_at
```

## Error handling

| Code | When |
|---|---|
| 400 | invalid JSON (checkout); bad/old/garbled signature (webhook) |
| 404 | unknown `productId` (checkout) |
| 502 | Stripe down / non-OK / no url (checkout) |
| 503 | `STRIPE_SECRET_KEY` unset (checkout) or `STRIPE_WEBHOOK_SECRET` unset (webhook) — dark mode |
| 200 | webhook ack on any legitimate signed event, even when Resend failed or product unknown |

**Accepted trade-off:** after a Resend failure, the Stripe retry hits
`ON CONFLICT DO NOTHING` and will *not* re-attempt delivery. Idempotency is valued
over auto-retry for Slice 2. Undelivered rows (`delivered_at IS NULL`) are visible
in D1 and handled by a future retry-cron slice.

## Testing (vitest, env=node, pure functions + mocked D1/fetch)

- `products.test.ts` — `findProduct` hit/miss; catalog invariants (unique ids,
  positive prices); `resolveAssetUrl` url-path returns href, r2-path throws.
- `checkout.test.ts` (extended) — `buildProductSessionForm`: price from product,
  `metadata[product_id]`/`[locale]` set, `submit_type=pay`, locale-correct URLs.
- `stripe-webhook.test.ts` — `verifyStripeSignature`: valid (precomputed HMAC) ok;
  tampered `v1` → bad_signature; stale `t` (>300s) → too_old; future `t` → too_old;
  garbled header → bad_format.
- `handlers/checkout.test.ts` (extended) — `handleProductCheckout`: 503 no key,
  404 unknown product, 200+url (mocked Stripe fetch), 502 on Stripe error.
- `handlers/stripe-webhook.test.ts` — mocked D1 + fetch: valid
  `checkout.session.completed` → insert + Resend call + `delivered_at`; duplicate
  (ON CONFLICT, no row) → no second email; non-matching event type → 200 no-op;
  bad signature → 400; missing webhook secret → 503.

## Out of scope (future slices)

- R2 presigned delivery (SigV4 via WebCrypto) — when first R2 product is added.
- Retry-cron for `delivered_at IS NULL` rows.
- Bot `/store` command + deep-link.
- Physical goods (shipping address, fulfilment) — seam preserved by not assuming
  digital-only in the schema, but not built.
- Owner `/admin/purchases` view.
