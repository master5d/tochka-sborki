# Stripe Digital-Goods Slice 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell fixed-price digital goods via Stripe-hosted Checkout and fulfil each purchase automatically (asset link emailed to the buyer) through a signature-verified, idempotent Stripe webhook.

**Architecture:** Extend the existing Slice 1 checkout worker. A static TS catalog (`lib/products.ts`) is the source of truth; a new `POST /api/checkout/product` creates a Session priced from the catalog; a new signed `POST /api/stripe/webhook` records the purchase idempotently (`UNIQUE(stripe_session_id)`) and emails the asset link via Resend. A bilingual web `/store` page surfaces the catalog. Feature ships dark (empty catalog + 503 until secrets set).

**Tech Stack:** Cloudflare Worker (TypeScript, zero deps), D1 (SQLite), WebCrypto HMAC-SHA256, Stripe Checkout Sessions (form-encoded REST), Resend REST, Next.js 16 static export. Tests: vitest `env=node`.

## Global Constraints

- **Working dir:** all worker commands run from `/c/telo/Efforts/Ongoing/mc_hub/workers`; all web commands from `/c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web`. cwd drifts — prefer absolute paths in git commands.
- **Zero runtime deps in the worker** — no SDKs; raw `fetch` to Stripe/Resend, WebCrypto for HMAC.
- **Price is never taken from the client** — always looked up in the catalog by `productId`.
- **Sole-proprietor framing** — copy says goods are sold by the creator (a sole proprietor); **never** "nonprofit" / "tax-deductible". These are sales (`submit_type=pay`), not donations.
- **Worker tests:** vitest `env=node`, pure functions or mocked `D1`/`globalThis.fetch`. No network, no real secrets.
- **Migrations:** the SQL file is committed in this plan; applying `0011` to prod D1 is done by the controller via the `cloudflare-api` MCP `/query` endpoint (zero-token, additive) — **not** a code task, **not** `wrangler migrations apply`.
- **Run a single test file** with: `npx vitest run src/path/to/file.test.ts`.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `workers/src/lib/products.ts` | catalog + `findProduct` + `resolveAssetUrl` | 1 |
| `workers/src/lib/products.test.ts` | catalog invariants + resolver | 1 |
| `workers/src/lib/checkout.ts` | +`buildProductSessionForm` | 2 |
| `workers/src/lib/checkout.test.ts` | +product-form assertions | 2 |
| `workers/src/handlers/checkout.ts` | +`handleProductCheckout` | 3 |
| `workers/src/handlers/checkout.test.ts` | +product-checkout cases | 3 |
| `workers/src/index.ts` | route `/api/checkout/product`, `/api/stripe/webhook` | 3, 6 |
| `workers/src/lib/stripe-webhook.ts` | `verifyStripeSignature` (WebCrypto) | 4 |
| `workers/src/lib/stripe-webhook.test.ts` | signature verify cases | 4 |
| `workers/src/lib/purchase-email.ts` | Resend asset-delivery email | 5 |
| `workers/src/lib/purchase-email.test.ts` | email best-effort cases | 5 |
| `workers/src/handlers/stripe-webhook.ts` | verify → idempotent insert → deliver | 6 |
| `workers/src/handlers/stripe-webhook.test.ts` | webhook fulfilment cases | 6 |
| `workers/src/lib/types.ts` | +`STRIPE_WEBHOOK_SECRET` | 6 |
| `workers/migrations/0011_purchases.sql` | `purchases` table | 6 |
| `web/lib/store/products.data.ts` | web catalog mirror (deliberate dup) | 7 |
| `web/lib/store/products.data.test.ts` | mirror invariants | 7 |
| `web/lib/store/store-content.ts` | bilingual page chrome | 7 |
| `web/components/store/store-grid.tsx` | product cards + buy button | 7 |
| `web/app/store/page.tsx`, `web/app/en/store/page.tsx` | store pages | 8 |
| `web/app/store/thanks/page.tsx`, `web/app/en/store/thanks/page.tsx` | thanks pages | 8 |
| `web/components/nav.tsx`, `web/lib/dictionaries.ts` | nav "Store" link | 8 |

`web/` = `LMS/tochka-sborki/web/` throughout.

---

### Task 1: Product catalog

**Files:**
- Create: `workers/src/lib/products.ts`
- Test: `workers/src/lib/products.test.ts`

**Interfaces:**
- Produces: `Delivery`, `Product`, `PRODUCTS: Product[]`, `findProduct(id: string): Product | undefined`, `resolveAssetUrl(d: Delivery): string`.

- [ ] **Step 1: Write the failing test**

```ts
// workers/src/lib/products.test.ts
import { describe, it, expect } from 'vitest'
import { PRODUCTS, findProduct, resolveAssetUrl, type Product } from './products'

const sample: Product = {
  id: 'sample-kit', priceCents: 900,
  name: { ru: 'Набор', en: 'Kit' }, blurb: { ru: 'описание', en: 'blurb' },
  delivery: { kind: 'url', href: 'https://drive.example.com/file' },
}

describe('catalog invariants', () => {
  it('has unique ids and positive integer prices', () => {
    const ids = PRODUCTS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of PRODUCTS) {
      expect(Number.isInteger(p.priceCents)).toBe(true)
      expect(p.priceCents).toBeGreaterThan(0)
    }
  })
})

describe('findProduct', () => {
  it('returns undefined for an unknown id', () => {
    expect(findProduct('nope')).toBeUndefined()
  })
})

describe('resolveAssetUrl', () => {
  it('returns the href for a url delivery', () => {
    expect(resolveAssetUrl(sample.delivery)).toBe('https://drive.example.com/file')
  })
  it('throws for an r2 delivery (not implemented in Slice 2)', () => {
    expect(() => resolveAssetUrl({ kind: 'r2', key: 'x' })).toThrow(/not implemented/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/products.test.ts`
Expected: FAIL — cannot find module `./products`.

- [ ] **Step 3: Write minimal implementation**

```ts
// workers/src/lib/products.ts
export type Delivery =
  | { kind: 'url'; href: string }   // external link (Drive/Dropbox/Notion)
  | { kind: 'r2';  key:  string }   // R2 object key — NOT implemented in Slice 2

export interface Product {
  id: string
  priceCents: number
  name:  { ru: string; en: string }
  blurb: { ru: string; en: string }
  delivery: Delivery
}

// Owner fills this. Empty = the store is dark (coming-soon empty state).
// Keep in sync with web/lib/store/products.data.ts (worker & web don't share imports).
export const PRODUCTS: Product[] = []

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find(p => p.id === id)
}

export function resolveAssetUrl(d: Delivery): string {
  if (d.kind === 'url') return d.href
  throw new Error('r2 delivery not implemented in Slice 2')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/products.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/products.ts workers/src/lib/products.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): digital-goods catalog (products + findProduct + resolveAssetUrl)"
```

---

### Task 2: Product checkout session form builder

**Files:**
- Modify: `workers/src/lib/checkout.ts` (append; do not touch `buildSupportSessionForm`)
- Test: `workers/src/lib/checkout.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `Product` from `./products` (Task 1).
- Produces: `buildProductSessionForm(opts: { product: Product; locale: 'ru' | 'en' }): URLSearchParams`.

- [ ] **Step 1: Write the failing test** (append to `workers/src/lib/checkout.test.ts`)

```ts
import { buildProductSessionForm } from './checkout'
import type { Product } from './products'

const product: Product = {
  id: 'agent-starter-kit', priceCents: 1900,
  name: { ru: 'Стартовый набор', en: 'Starter Kit' },
  blurb: { ru: 'b', en: 'b' },
  delivery: { kind: 'url', href: 'https://drive.example.com/kit' },
}

describe('buildProductSessionForm', () => {
  it('prices from the product and carries fulfilment metadata', () => {
    const f = buildProductSessionForm({ product, locale: 'ru' })
    expect(f.get('mode')).toBe('payment')
    expect(f.get('submit_type')).toBe('pay')
    expect(f.get('customer_creation')).toBe('always')
    expect(f.get('line_items[0][price_data][unit_amount]')).toBe('1900')
    expect(f.get('line_items[0][price_data][product_data][name]')).toBe('Стартовый набор')
    expect(f.get('metadata[product_id]')).toBe('agent-starter-kit')
    expect(f.get('metadata[locale]')).toBe('ru')
    expect(f.get('success_url')).toBe('https://ai.mamaev.coach/store/thanks/')
    expect(f.get('cancel_url')).toBe('https://ai.mamaev.coach/store/')
  })
  it('uses the en prefix and en product name', () => {
    const f = buildProductSessionForm({ product, locale: 'en' })
    expect(f.get('success_url')).toBe('https://ai.mamaev.coach/en/store/thanks/')
    expect(f.get('line_items[0][price_data][product_data][name]')).toBe('Starter Kit')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/checkout.test.ts`
Expected: FAIL — `buildProductSessionForm` is not exported.

- [ ] **Step 3: Write minimal implementation** (append to `workers/src/lib/checkout.ts`; `BASE` already exists)

```ts
import type { Product } from './products'

export function buildProductSessionForm(opts: { product: Product; locale: 'ru' | 'en' }): URLSearchParams {
  const prefix = opts.locale === 'en' ? '/en' : ''
  const f = new URLSearchParams()
  f.set('mode', 'payment')
  f.set('submit_type', 'pay')
  f.set('customer_creation', 'always')
  f.set('line_items[0][quantity]', '1')
  f.set('line_items[0][price_data][currency]', 'usd')
  f.set('line_items[0][price_data][product_data][name]', opts.product.name[opts.locale])
  f.set('line_items[0][price_data][unit_amount]', String(opts.product.priceCents))
  f.set('metadata[product_id]', opts.product.id)
  f.set('metadata[locale]', opts.locale)
  f.set('success_url', `${BASE}${prefix}/store/thanks/`)
  f.set('cancel_url', `${BASE}${prefix}/store/`)
  return f
}
```

Note: the `import type { Product }` line goes at the top of `checkout.ts` with any other imports. `BASE` is the existing `const BASE = 'https://ai.mamaev.coach'`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/checkout.test.ts`
Expected: PASS (existing support tests + 2 new).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/checkout.ts workers/src/lib/checkout.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): buildProductSessionForm — fixed-price product Checkout Session"
```

---

### Task 3: Product checkout handler + route

**Files:**
- Modify: `workers/src/handlers/checkout.ts` (append `handleProductCheckout`)
- Modify: `workers/src/index.ts` (import + route `/api/checkout/product`)
- Test: `workers/src/handlers/checkout.test.ts` (append)

**Interfaces:**
- Consumes: `findProduct` (Task 1), `buildProductSessionForm` (Task 2).
- Produces: `handleProductCheckout(request: Request, env: Env): Promise<Response>`.

- [ ] **Step 1: Write the failing test** (append to `workers/src/handlers/checkout.test.ts`)

```ts
import { handleProductCheckout } from './checkout'
import { PRODUCTS } from '../lib/products'

function preq(body: unknown): Request {
  return new Request('https://ai.mamaev.coach/api/checkout/product', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  })
}

describe('handleProductCheckout', () => {
  // seed an in-memory product for the duration of these tests
  const seeded = { id: 'test-kit', priceCents: 1900,
    name: { ru: 'Набор', en: 'Kit' }, blurb: { ru: 'b', en: 'b' },
    delivery: { kind: 'url' as const, href: 'https://x/y' } }
  beforeEach(() => { PRODUCTS.push(seeded) })
  afterEach(() => { const i = PRODUCTS.indexOf(seeded); if (i >= 0) PRODUCTS.splice(i, 1) })

  it('creates a Stripe session for a known product and returns its url', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/p' }), { status: 200 }))
    const res = await handleProductCheckout(preq({ productId: 'test-kit', locale: 'ru' }), { STRIPE_SECRET_KEY: 'sk_test' } as Env)
    expect(res.status).toBe(200)
    expect((await res.json() as { url: string }).url).toBe('https://checkout.stripe.com/c/p')
    const body = (spy.mock.calls[0][1] as RequestInit).body as string
    expect(body).toContain('unit_amount=1900')
    expect(body).toContain('metadata%5Bproduct_id%5D=test-kit')
  })

  it('returns 503 when the key is not configured', async () => {
    const res = await handleProductCheckout(preq({ productId: 'test-kit' }), {} as Env)
    expect(res.status).toBe(503)
  })

  it('returns 404 for an unknown product', async () => {
    const res = await handleProductCheckout(preq({ productId: 'ghost' }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(404)
  })

  it('returns 502 when Stripe responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad', { status: 400 }))
    const res = await handleProductCheckout(preq({ productId: 'test-kit' }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(502)
  })
})
```

Add `beforeEach` to the existing vitest import at the top of the file: `import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/handlers/checkout.test.ts`
Expected: FAIL — `handleProductCheckout` is not exported.

- [ ] **Step 3: Write minimal implementation** (append to `workers/src/handlers/checkout.ts`)

```ts
import { findProduct } from '../lib/products'
import { buildProductSessionForm } from '../lib/checkout'

export async function handleProductCheckout(request: Request, env: Env): Promise<Response> {
  let body: { productId?: unknown; locale?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!env.STRIPE_SECRET_KEY) return Response.json({ error: 'stripe_not_configured' }, { status: 503 })

  const product = typeof body.productId === 'string' ? findProduct(body.productId) : undefined
  if (!product) return Response.json({ error: 'unknown_product' }, { status: 404 })

  const locale: 'ru' | 'en' = body.locale === 'en' ? 'en' : 'ru'
  const form = buildProductSessionForm({ product, locale })

  let res: Response
  try {
    res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  } catch (e) {
    console.error('stripe product session threw', e)
    return Response.json({ error: 'stripe_error' }, { status: 502 })
  }
  if (!res.ok) {
    console.error('stripe product session non-OK', res.status, await res.text())
    return Response.json({ error: 'stripe_error' }, { status: 502 })
  }
  const session = (await res.json().catch(() => ({}))) as { url?: string }
  if (!session.url) return Response.json({ error: 'stripe_error' }, { status: 502 })
  return Response.json({ url: session.url })
}
```

The `import type { Env }` and `validateSupportAmount`/`buildSupportSessionForm` imports already exist at the top of the file; add the two new imports there.

- [ ] **Step 4: Wire the route in `workers/src/index.ts`**

Change the import line:
```ts
import { handleSupportCheckout, handleProductCheckout } from './handlers/checkout'
```
Add the route directly after the existing `/api/checkout/support` branch:
```ts
      } else if (path === '/api/checkout/product' && method === 'POST') {
        response = await handleProductCheckout(request, env)
```

- [ ] **Step 5: Run tests + typecheck**

Run: `npx vitest run src/handlers/checkout.test.ts && npx tsc --noEmit`
Expected: PASS (existing support cases + 4 new); tsc clean.

- [ ] **Step 6: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/handlers/checkout.ts workers/src/handlers/checkout.test.ts workers/src/index.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): POST /api/checkout/product — priced from catalog"
```

---

### Task 4: Stripe webhook signature verification

**Files:**
- Create: `workers/src/lib/stripe-webhook.ts`
- Test: `workers/src/lib/stripe-webhook.test.ts`

**Interfaces:**
- Produces: `StripeEvent`, `WebhookResult`, `verifyStripeSignature(rawBody, sigHeader, secret, opts?)`.

- [ ] **Step 1: Write the failing test**

The test computes a *real* signature with WebCrypto (mirrors how Stripe signs), so we never hardcode a brittle hash.

```ts
// workers/src/lib/stripe-webhook.ts test
import { describe, it, expect } from 'vitest'
import { verifyStripeSignature } from './stripe-webhook'

const SECRET = 'whsec_test'

async function sign(payload: string, t: number, secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `t=${t},v1=${hex}`
}

const NOW = 1_800_000_000
const body = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_1' } } })

describe('verifyStripeSignature', () => {
  it('accepts a valid signature and returns the parsed event', async () => {
    const header = await sign(body, NOW)
    const r = await verifyStripeSignature(body, header, SECRET, { nowSec: NOW })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.event.type).toBe('checkout.session.completed')
  })
  it('rejects a tampered signature', async () => {
    const header = (await sign(body, NOW)).replace(/v1=./, 'v1=0')
    const r = await verifyStripeSignature(body, header, SECRET, { nowSec: NOW })
    expect(r).toEqual({ ok: false, error: 'bad_signature' })
  })
  it('rejects a stale timestamp', async () => {
    const header = await sign(body, NOW - 1000)
    const r = await verifyStripeSignature(body, header, SECRET, { nowSec: NOW })
    expect(r).toEqual({ ok: false, error: 'too_old' })
  })
  it('rejects a far-future timestamp', async () => {
    const header = await sign(body, NOW + 1000)
    const r = await verifyStripeSignature(body, header, SECRET, { nowSec: NOW })
    expect(r).toEqual({ ok: false, error: 'too_old' })
  })
  it('rejects a garbled header', async () => {
    const r = await verifyStripeSignature(body, 'nonsense', SECRET, { nowSec: NOW })
    expect(r).toEqual({ ok: false, error: 'bad_format' })
  })
  it('rejects a null header', async () => {
    const r = await verifyStripeSignature(body, null, SECRET, { nowSec: NOW })
    expect(r).toEqual({ ok: false, error: 'bad_format' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/stripe-webhook.test.ts`
Expected: FAIL — cannot find module `./stripe-webhook`.

- [ ] **Step 3: Write minimal implementation**

```ts
// workers/src/lib/stripe-webhook.ts
export interface StripeEvent {
  type: string
  data: {
    object: {
      id: string
      customer_details?: { email?: string | null } | null
      metadata?: { product_id?: string; locale?: string } | null
      amount_total?: number | null
    }
  }
}

export type WebhookResult =
  | { ok: true;  event: StripeEvent }
  | { ok: false; error: 'bad_format' | 'bad_signature' | 'too_old' }

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg))
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string | null,
  secret: string,
  opts: { nowSec?: number; toleranceSec?: number } = {},
): Promise<WebhookResult> {
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000)
  const toleranceSec = opts.toleranceSec ?? 300

  if (!sigHeader) return { ok: false, error: 'bad_format' }
  let t: string | undefined
  let v1: string | undefined
  for (const part of sigHeader.split(',')) {
    const [k, val] = part.split('=')
    if (k === 't') t = val
    else if (k === 'v1') v1 = val
  }
  if (!t || !v1) return { ok: false, error: 'bad_format' }
  const ts = Number(t)
  if (!Number.isFinite(ts)) return { ok: false, error: 'bad_format' }

  const expected = await hmacHex(secret, `${ts}.${rawBody}`)
  if (!timingSafeEqual(expected, v1)) return { ok: false, error: 'bad_signature' }

  if (Math.abs(nowSec - ts) > toleranceSec) return { ok: false, error: 'too_old' }

  let event: StripeEvent
  try { event = JSON.parse(rawBody) as StripeEvent } catch { return { ok: false, error: 'bad_format' } }
  return { ok: true, event }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/stripe-webhook.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/stripe-webhook.ts workers/src/lib/stripe-webhook.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): verifyStripeSignature — Stripe-Signature HMAC check (WebCrypto)"
```

---

### Task 5: Purchase-delivery email

**Files:**
- Create: `workers/src/lib/purchase-email.ts`
- Test: `workers/src/lib/purchase-email.test.ts`

**Interfaces:**
- Consumes: `Product` (Task 1), `Env`.
- Produces: `sendPurchaseEmail(env: Env, p: { email: string; product: Product; assetUrl: string; locale: 'ru' | 'en' }): Promise<boolean>`.

- [ ] **Step 1: Write the failing test**

```ts
// workers/src/lib/purchase-email.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendPurchaseEmail } from './purchase-email'
import type { Product } from './products'
import type { Env } from './types'

afterEach(() => vi.restoreAllMocks())

const product: Product = {
  id: 'kit', priceCents: 1900, name: { ru: 'Набор', en: 'Kit' }, blurb: { ru: 'b', en: 'b' },
  delivery: { kind: 'url', href: 'https://x/y' },
}
const env = { RESEND_API_KEY: 're_x' } as Env

describe('sendPurchaseEmail', () => {
  it('sends via Resend with the asset link and returns true', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const ok = await sendPurchaseEmail(env, { email: 'b@e.com', product, assetUrl: 'https://dl/file', locale: 'ru' })
    expect(ok).toBe(true)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body as string)
    expect(body.to).toEqual(['b@e.com'])
    expect(body.text).toContain('https://dl/file')
  })
  it('is a no-op (returns false) when RESEND_API_KEY is unset', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const ok = await sendPurchaseEmail({} as Env, { email: 'b@e.com', product, assetUrl: 'https://dl/f', locale: 'en' })
    expect(ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
  it('returns false (never throws) when Resend responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 422 }))
    const ok = await sendPurchaseEmail(env, { email: 'b@e.com', product, assetUrl: 'https://dl/f', locale: 'ru' })
    expect(ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/purchase-email.test.ts`
Expected: FAIL — cannot find module `./purchase-email`.

- [ ] **Step 3: Write minimal implementation**

```ts
// workers/src/lib/purchase-email.ts
import type { Env } from './types'
import type { Product } from './products'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// Best-effort asset delivery email (mirrors owner-notify.ts). Never throws; returns whether it sent.
export async function sendPurchaseEmail(
  env: Env,
  p: { email: string; product: Product; assetUrl: string; locale: 'ru' | 'en' },
): Promise<boolean> {
  const apiKey = strip(env.RESEND_API_KEY)
  if (!apiKey) return false

  const name = p.product.name[p.locale]
  const subject = p.locale === 'en' ? `Your download: ${name}` : `Твоя ссылка на скачивание: ${name}`
  const text = p.locale === 'en'
    ? `Thank you for your purchase — ${name}.\n\nDownload it here:\n${p.assetUrl}\n\nThis is a sale by the creator (a sole proprietor), not a nonprofit donation.`
    : `Спасибо за покупку — ${name}.\n\nСкачать можно здесь:\n${p.assetUrl}\n\nЭто покупка у автора (ИП), а не пожертвование в нонпрофит.`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Точка Сборки <noreply@mamaev.coach>', to: [p.email], subject, text }),
    })
    if (!res.ok) { console.error('purchase-email non-OK', res.status, await res.text()); return false }
    return true
  } catch (e) {
    console.error('purchase-email failed', e)
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/purchase-email.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/purchase-email.ts workers/src/lib/purchase-email.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): purchase-email — best-effort Resend asset delivery"
```

---

### Task 6: Webhook handler + purchases table + route + Env

**Files:**
- Create: `workers/src/handlers/stripe-webhook.ts`
- Create: `workers/migrations/0011_purchases.sql`
- Modify: `workers/src/lib/types.ts` (add `STRIPE_WEBHOOK_SECRET`)
- Modify: `workers/src/index.ts` (import + route `/api/stripe/webhook`)
- Test: `workers/src/handlers/stripe-webhook.test.ts`

**Interfaces:**
- Consumes: `verifyStripeSignature` (Task 4), `findProduct` + `resolveAssetUrl` (Task 1), `sendPurchaseEmail` (Task 5).
- Produces: `handleStripeWebhook(request: Request, env: Env): Promise<Response>`.

- [ ] **Step 1: Create the migration file** `workers/migrations/0011_purchases.sql`

```sql
-- 0011_purchases.sql — digital-goods purchase ledger (idempotency + delivery state)
CREATE TABLE IF NOT EXISTS purchases (
  id                TEXT PRIMARY KEY,
  stripe_session_id TEXT NOT NULL UNIQUE,
  product_id        TEXT NOT NULL,
  email             TEXT NOT NULL,
  amount_cents      INTEGER NOT NULL,
  locale            TEXT NOT NULL,
  delivered_at      INTEGER,
  created_at        INTEGER NOT NULL
);
```

- [ ] **Step 2: Add the Env field** in `workers/src/lib/types.ts` (after `STRIPE_SECRET_KEY`)

```ts
  STRIPE_WEBHOOK_SECRET: string
```

- [ ] **Step 3: Write the failing test**

```ts
// workers/src/handlers/stripe-webhook.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleStripeWebhook } from './stripe-webhook'
import { PRODUCTS } from '../lib/products'
import type { Env } from '../lib/types'

const SECRET = 'whsec_test'
const NOW = 1_800_000_000

async function sign(payload: string, t = NOW, secret = SECRET): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${payload}`))
  const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `t=${t},v1=${hex}`
}

type DbCall = { sql: string; binds: unknown[] }
function makeEnv(opts: { inserted?: boolean; calls?: DbCall[]; resendKey?: string } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return {
          run: vi.fn().mockResolvedValue({ success: true, meta: { changes: opts.inserted === false ? 0 : 1 } }),
        }
      },
    }),
  } as unknown as D1Database
  return { DB, STRIPE_WEBHOOK_SECRET: SECRET, RESEND_API_KEY: opts.resendKey ?? 're_x' } as Env
}

function evt(over: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'checkout.session.completed',
    data: { object: { id: 'cs_1', amount_total: 1900,
      customer_details: { email: 'b@e.com' }, metadata: { product_id: 'wh-kit', locale: 'ru' }, ...over } },
  })
}

function req(body: string, header: string | null): Request {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (header) h['Stripe-Signature'] = header
  return new Request('https://ai.mamaev.coach/api/stripe/webhook', { method: 'POST', body, headers: h })
}

const seeded = { id: 'wh-kit', priceCents: 1900, name: { ru: 'Набор', en: 'Kit' },
  blurb: { ru: 'b', en: 'b' }, delivery: { kind: 'url' as const, href: 'https://dl/file' } }

afterEach(() => vi.restoreAllMocks())

describe('handleStripeWebhook', () => {
  it('records a purchase and emails the asset on a fresh completed session', async () => {
    PRODUCTS.push(seeded)
    try {
      const calls: DbCall[] = []
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
      const body = evt()
      const res = await handleStripeWebhook(req(body, await sign(body)), makeEnv({ inserted: true, calls }))
      expect(res.status).toBe(200)
      // emailed
      expect((spy.mock.calls[0][0] as string)).toBe('https://api.resend.com/emails')
      // stamped delivered_at
      expect(calls.find(c => /UPDATE purchases SET delivered_at/.test(c.sql))).toBeDefined()
    } finally { PRODUCTS.splice(PRODUCTS.indexOf(seeded), 1) }
  })

  it('is idempotent: a duplicate session sends no second email', async () => {
    PRODUCTS.push(seeded)
    try {
      const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
      const body = evt()
      const res = await handleStripeWebhook(req(body, await sign(body)), makeEnv({ inserted: false }))
      expect(res.status).toBe(200)
      expect(spy).not.toHaveBeenCalled()
    } finally { PRODUCTS.splice(PRODUCTS.indexOf(seeded), 1) }
  })

  it('acks (200) and does nothing for a non-matching event type', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const body = JSON.stringify({ type: 'payment_intent.created', data: { object: { id: 'pi_1' } } })
    const res = await handleStripeWebhook(req(body, await sign(body)), makeEnv())
    expect(res.status).toBe(200)
    expect(spy).not.toHaveBeenCalled()
  })

  it('returns 400 for a bad signature', async () => {
    const body = evt()
    const res = await handleStripeWebhook(req(body, 't=1,v1=deadbeef'), makeEnv())
    expect(res.status).toBe(400)
  })

  it('returns 503 when the webhook secret is unset', async () => {
    const body = evt()
    const res = await handleStripeWebhook(req(body, await sign(body)), { DB: {} as D1Database } as Env)
    expect(res.status).toBe(503)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/handlers/stripe-webhook.test.ts`
Expected: FAIL — cannot find module `./stripe-webhook`.

- [ ] **Step 5: Write minimal implementation**

```ts
// workers/src/handlers/stripe-webhook.ts
import type { Env } from '../lib/types'
import { verifyStripeSignature } from '../lib/stripe-webhook'
import { findProduct, resolveAssetUrl } from '../lib/products'
import { sendPurchaseEmail } from '../lib/purchase-email'

export async function handleStripeWebhook(request: Request, env: Env): Promise<Response> {
  if (!env.STRIPE_WEBHOOK_SECRET) return new Response('stripe_webhook_not_configured', { status: 503 })

  const rawBody = await request.text()
  const verified = await verifyStripeSignature(rawBody, request.headers.get('Stripe-Signature'), env.STRIPE_WEBHOOK_SECRET)
  if (!verified.ok) return new Response(verified.error, { status: 400 })

  const event = verified.event
  if (event.type !== 'checkout.session.completed') return new Response('ignored', { status: 200 })

  const s = event.data.object
  const productId = s.metadata?.product_id
  const email = s.customer_details?.email ?? undefined
  const locale: 'ru' | 'en' = s.metadata?.locale === 'en' ? 'en' : 'ru'
  if (!productId || !email) { console.error('webhook missing product_id/email', s.id); return new Response('ok', { status: 200 }) }

  // Idempotent insert — duplicate Stripe retries hit the UNIQUE(stripe_session_id) and write nothing.
  const now = Math.floor(Date.now() / 1000)
  const ins = await env.DB.prepare(
    `INSERT INTO purchases (id, stripe_session_id, product_id, email, amount_cents, locale, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(stripe_session_id) DO NOTHING`
  ).bind(crypto.randomUUID(), s.id, productId, email, s.amount_total ?? 0, locale, now).run()
  if (!ins.meta || ins.meta.changes === 0) return new Response('duplicate', { status: 200 })

  const product = findProduct(productId)
  if (!product) { console.error('webhook unknown product', productId); return new Response('ok', { status: 200 }) }

  let assetUrl: string
  try { assetUrl = resolveAssetUrl(product.delivery) } catch (e) { console.error('asset resolve failed', e); return new Response('ok', { status: 200 }) }

  const sent = await sendPurchaseEmail(env, { email, product, assetUrl, locale })
  if (sent) await env.DB.prepare('UPDATE purchases SET delivered_at = ? WHERE stripe_session_id = ?').bind(now, s.id).run()
  return new Response('ok', { status: 200 })
}
```

- [ ] **Step 6: Wire the route in `workers/src/index.ts`**

Add the import:
```ts
import { handleStripeWebhook } from './handlers/stripe-webhook'
```
Add the route after the `/api/checkout/product` branch:
```ts
      } else if (path === '/api/stripe/webhook' && method === 'POST') {
        response = await handleStripeWebhook(request, env)
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run src/handlers/stripe-webhook.test.ts && npx tsc --noEmit`
Expected: PASS (5 tests); tsc clean.

- [ ] **Step 8: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/handlers/stripe-webhook.ts workers/src/handlers/stripe-webhook.test.ts workers/migrations/0011_purchases.sql workers/src/lib/types.ts workers/src/index.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): POST /api/stripe/webhook — signed, idempotent digital-goods fulfilment"
```

---

### Task 7: Web catalog mirror + store content + grid component

**Files:**
- Create: `web/lib/store/products.data.ts`
- Create: `web/lib/store/products.data.test.ts`
- Create: `web/lib/store/store-content.ts`
- Create: `web/components/store/store-grid.tsx`

`web/` = `LMS/tochka-sborki/web/`. All web commands run from that dir.

**Interfaces:**
- Produces: `StoreProduct`, `STORE_PRODUCTS: StoreProduct[]`, `buildStoreContent(locale): StoreContent`, `<StoreGrid locale />`.

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/store/products.data.test.ts
import { describe, it, expect } from 'vitest'
import { STORE_PRODUCTS } from './products.data'

describe('STORE_PRODUCTS', () => {
  it('has unique ids and positive integer prices', () => {
    const ids = STORE_PRODUCTS.map(p => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of STORE_PRODUCTS) {
      expect(Number.isInteger(p.priceCents)).toBe(true)
      expect(p.priceCents).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run lib/store/products.data.test.ts`
Expected: FAIL — cannot find module `./products.data`.

- [ ] **Step 3: Write the data file + content + grid**

```ts
// web/lib/store/products.data.ts
// CANONICAL FOR THE WEB SIDE — keep in sync with workers/src/lib/products.ts.
// Worker and web do not share imports (separate build roots); this is a deliberate copy.
// The worker prices the Checkout Session from ITS copy; these fields are display-only.
export interface StoreProduct {
  id: string
  priceCents: number
  name:  { ru: string; en: string }
  blurb: { ru: string; en: string }
}

export const STORE_PRODUCTS: StoreProduct[] = []   // owner fills; empty = coming-soon
```

```ts
// web/lib/store/store-content.ts
import type { Locale } from '@/lib/dictionaries'

export interface StoreContent {
  eyebrow: string
  title: string
  lead: string
  priceFmt: (cents: number) => string
  buyLabel: string
  emptyMsg: string
  errorMsg: string
  footnote: string
  thanksTitle: string
  thanksBody: string
}

export function buildStoreContent(locale: Locale): StoreContent {
  const priceFmt = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
  if (locale === 'en') {
    return {
      eyebrow: 'Store',
      title: 'Digital goods',
      lead: 'Practical kits and templates. The course itself stays free — these are optional extras.',
      priceFmt,
      buyLabel: 'Buy →',
      emptyMsg: 'Nothing here yet — new items are on the way.',
      errorMsg: 'Temporarily unavailable — please try again.',
      footnote: 'These are digital goods sold by the creator (a sole proprietor), not a nonprofit.',
      thanksTitle: 'Thank you 🙏',
      thanksBody: 'A download link is on its way to your email. Check your inbox (and spam, just in case).',
    }
  }
  return {
    eyebrow: 'Магазин',
    title: 'Цифровые товары',
    lead: 'Практичные наборы и шаблоны. Сам курс остаётся бесплатным — это опциональные дополнения.',
    priceFmt,
    buyLabel: 'Купить →',
    emptyMsg: 'Пока пусто — новые материалы уже в пути.',
    errorMsg: 'Временно недоступно — попробуй ещё раз.',
    footnote: 'Это цифровые товары от автора (ИП), не нонпрофит.',
    thanksTitle: 'Спасибо 🙏',
    thanksBody: 'Ссылка на скачивание уже летит тебе на почту. Загляни во входящие (и в спам на всякий случай).',
  }
}
```

```tsx
// web/components/store/store-grid.tsx
'use client'

import { useState } from 'react'
import { STORE_PRODUCTS } from '@/lib/store/products.data'
import { buildStoreContent } from '@/lib/store/store-content'
import type { Locale } from '@/lib/dictionaries'

export function StoreGrid({ locale }: { locale: Locale }) {
  const c = buildStoreContent(locale)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState(false)

  async function buy(productId: string) {
    if (busy) return
    setError(false)
    setBusy(productId)
    try {
      const res = await fetch('/api/checkout/product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, locale }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) { window.location.assign(data.url); return }
      setError(true)
    } catch {
      setError(true)
    }
    setBusy(null)
  }

  if (STORE_PRODUCTS.length === 0) {
    return <p style={{ color: 'var(--text-secondary)', marginTop: '1.5rem' }}>{c.emptyMsg}</p>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '40rem', marginTop: '1.5rem' }}>
      {STORE_PRODUCTS.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{p.name[locale]}</p>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{p.blurb[locale]}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', whiteSpace: 'nowrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{c.priceFmt(p.priceCents)}</span>
            <button onClick={() => buy(p.id)} disabled={busy !== null}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--text-accent)', color: 'var(--text-on-accent)', cursor: 'pointer', fontWeight: 600 }}>
              {c.buyLabel}
            </button>
          </div>
        </div>
      ))}
      {error && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.errorMsg}</p>}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.footnote}</p>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run lib/store/products.data.test.ts`
Expected: PASS (1 test — vacuously true on empty array, but guards future entries).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add LMS/tochka-sborki/web/lib/store LMS/tochka-sborki/web/components/store
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(lms): store catalog mirror + content + product grid"
```

---

### Task 8: Store pages + thanks + nav link

**Files:**
- Create: `web/app/store/page.tsx`, `web/app/en/store/page.tsx`
- Create: `web/app/store/thanks/page.tsx`, `web/app/en/store/thanks/page.tsx`
- Modify: `web/lib/dictionaries.ts` (add `nav.store` to interface + ru + en)
- Modify: `web/components/nav.tsx` (add the Store link)

**Interfaces:**
- Consumes: `StoreGrid` (Task 7), `buildStoreContent` (Task 7), `Nav`, `t.nav.store` (this task).

- [ ] **Step 1: Add `nav.store` to the dictionary** in `web/lib/dictionaries.ts`

In the `nav: { ... }` **interface** block (near the other nav fields), add:
```ts
    store: string
```
In the **ru** `nav` block (after `support: 'Поддержать',`):
```ts
      store: 'Магазин',
```
In the **en** `nav` block (after `support: 'Support',`):
```ts
      store: 'Store',
```

- [ ] **Step 2: Add the nav link** in `web/components/nav.tsx`

Directly after the existing `/support/` link line (line ~103), add:
```tsx
        {(() => { const h = `${locale === 'en' ? '/en' : ''}/store/`; return <Link href={h} style={navLinkStyle(h)}>{t.nav.store}</Link> })()}
```

- [ ] **Step 3: Create the store pages**

```tsx
// web/app/store/page.tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { StoreGrid } from '@/components/store/store-grid'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Магазин — Точка Сборки', description: 'Цифровые товары от автора курса.' }

export default function Page() {
  const c = buildStoreContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', margin: 0 }}>{c.eyebrow}</p>
        <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
        <StoreGrid locale="ru" />
      </main>
    </>
  )
}
```

```tsx
// web/app/en/store/page.tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { StoreGrid } from '@/components/store/store-grid'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Store — Tochka Sborki', description: 'Digital goods from the course creator.' }

export default function Page() {
  const c = buildStoreContent('en')
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', margin: 0 }}>{c.eyebrow}</p>
        <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
        <StoreGrid locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Create the thanks pages**

```tsx
// web/app/store/thanks/page.tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Спасибо — Точка Сборки' }

export default function Page() {
  const c = buildStoreContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>{c.thanksTitle}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
      </main>
    </>
  )
}
```

```tsx
// web/app/en/store/thanks/page.tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { buildStoreContent } from '@/lib/store/store-content'

export const metadata: Metadata = { title: 'Thank you — Tochka Sborki' }

export default function Page() {
  const c = buildStoreContent('en')
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>{c.thanksTitle}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
      </main>
    </>
  )
}
```

- [ ] **Step 5: Typecheck + build the static export**

Run (from `web/`): `npx tsc --noEmit && npm run build`
Expected: tsc clean; build succeeds and emits `/store/`, `/en/store/`, `/store/thanks/`, `/en/store/thanks/` routes.

- [ ] **Step 6: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add LMS/tochka-sborki/web/app/store LMS/tochka-sborki/web/app/en/store LMS/tochka-sborki/web/lib/dictionaries.ts LMS/tochka-sborki/web/components/nav.tsx
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(lms): /store + /en/store pages, thanks pages, nav Store link"
```

---

## Post-implementation (controller, not a code task)

1. **Apply migration 0011 to prod D1** via the `cloudflare-api` MCP `/query` endpoint (zero-token, additive):
   `POST /accounts/252b28b0ef2e1866c532e2622060c809/d1/database/c904db4d-a900-4ff1-80ae-6056c150ca53/query`
   with the `CREATE TABLE` from `0011_purchases.sql`. Verify with `PRAGMA table_info(purchases)`.
2. **Push** `main` → CI deploys web + workers by path filter.
3. Feature is **dark**: catalog empty, `/api/checkout/product` returns 404 (no products),
   `/api/stripe/webhook` returns 503 (no `STRIPE_WEBHOOK_SECRET`). Owner go-live (separate, owner-run):
   add products to **both** `products.ts` files, register the Stripe webhook endpoint
   (`https://ai.mamaev.coach/api/stripe/webhook`, event `checkout.session.completed`), and set
   `STRIPE_WEBHOOK_SECRET` (wrangler secret) from the endpoint's signing secret.

## Self-Review

- **Spec coverage:** catalog (T1) ✓, product checkout + 404/503/502 (T2,T3) ✓, signature verify incl. replay window + raw-body + constant-time (T4) ✓, Resend delivery best-effort (T5) ✓, idempotent insert + always-200 + delivered_at + purchases table + Env + routes (T6) ✓, storefront + dup data file + empty state + nav + thanks (T7,T8) ✓, migration via CF-MCP (post-impl) ✓, R2 deferred (T1 throws) ✓, bot `/store` out of scope ✓.
- **Type consistency:** `Product`/`Delivery` (T1) reused by T2/T5/T6; `StripeEvent`/`WebhookResult` (T4) consumed by T6; `handleProductCheckout`/`handleStripeWebhook` names match routes in T3/T6; `StoreProduct` (web) distinct from worker `Product` by design; `buildStoreContent`/`StoreGrid` names match T8 consumers. Idempotency detection uses `ins.meta.changes === 0`, and the test mock returns `meta.changes` accordingly.
- **Placeholder scan:** none — every code step carries full code.
