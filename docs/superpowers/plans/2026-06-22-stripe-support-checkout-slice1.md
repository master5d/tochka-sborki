# Stripe Support Checkout — Slice 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "support / tip the creator" flow: a bilingual `/support` page (presets + custom) → a Worker endpoint that creates a Stripe-hosted Checkout Session → redirect to Stripe → thank-you page; plus a Telegram `/support` command.

**Architecture:** Pure amount-validation + Stripe form builder (`lib/checkout.ts`), a thin handler (`handlers/checkout.ts`) that calls the Stripe API, a static web page with a small client form, and a `/support` bot branch. No D1, no webhook, no PCI (hosted page).

**Tech Stack:** Cloudflare Workers, Stripe Checkout Sessions (form-encoded API), Next.js 16 static export, Vitest (env=node). Spec: `docs/superpowers/specs/2026-06-22-stripe-support-checkout-slice1-design.md`.

**Conventions:** worker tests mock `globalThis.fetch`; run from `workers/`: `cd workers && npx vitest run <file>`. Web tests run from `LMS/tochka-sborki/web/`. Web files use the `@/` alias (web-only). Framing copy: **"support the creator (sole proprietor)"** — never "nonprofit"/"tax-deductible".

---

### Task 1: Worker env + pure checkout helpers

**Files:**
- Modify: `workers/src/lib/types.ts`
- Create: `workers/src/lib/checkout.ts`
- Test: `workers/src/lib/checkout.test.ts`

- [ ] **Step 1: Add the env var**

In `workers/src/lib/types.ts`, inside `interface Env`, after `TELEGRAM_WEBHOOK_SECRET: string` add:
```ts
  TELEGRAM_WEBHOOK_SECRET: string
  STRIPE_SECRET_KEY: string
}
```

- [ ] **Step 2: Write the failing test**

Create `workers/src/lib/checkout.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { validateSupportAmount, buildSupportSessionForm, MIN_CENTS, MAX_CENTS } from './checkout'

describe('validateSupportAmount', () => {
  it('accepts an integer amount within bounds', () => {
    expect(validateSupportAmount(700)).toEqual({ ok: true, cents: 700 })
  })
  it('rejects non-numbers / non-integers / non-positive as invalid', () => {
    expect(validateSupportAmount('700')).toEqual({ ok: false, error: 'invalid' })
    expect(validateSupportAmount(12.5)).toEqual({ ok: false, error: 'invalid' })
    expect(validateSupportAmount(0)).toEqual({ ok: false, error: 'invalid' })
    expect(validateSupportAmount(Number.NaN)).toEqual({ ok: false, error: 'invalid' })
  })
  it('enforces min and max', () => {
    expect(validateSupportAmount(MIN_CENTS - 1)).toEqual({ ok: false, error: 'too_small' })
    expect(validateSupportAmount(MAX_CENTS + 1)).toEqual({ ok: false, error: 'too_large' })
  })
})

describe('buildSupportSessionForm', () => {
  it('builds the Stripe form params with locale-correct URLs', () => {
    const ru = buildSupportSessionForm({ cents: 700, locale: 'ru' })
    expect(ru.get('mode')).toBe('payment')
    expect(ru.get('submit_type')).toBe('donate')
    expect(ru.get('line_items[0][price_data][currency]')).toBe('usd')
    expect(ru.get('line_items[0][price_data][unit_amount]')).toBe('700')
    expect(ru.get('success_url')).toBe('https://ai.mamaev.coach/support/thanks/')
    expect(ru.get('cancel_url')).toBe('https://ai.mamaev.coach/support/')
    const en = buildSupportSessionForm({ cents: 300, locale: 'en' })
    expect(en.get('success_url')).toBe('https://ai.mamaev.coach/en/support/thanks/')
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd workers && npx vitest run src/lib/checkout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement**

Create `workers/src/lib/checkout.ts`:
```ts
export const MIN_CENTS = 100        // $1
export const MAX_CENTS = 100_000    // $1000

export type AmountResult =
  | { ok: true; cents: number }
  | { ok: false; error: 'invalid' | 'too_small' | 'too_large' }

export function validateSupportAmount(raw: unknown): AmountResult {
  if (typeof raw !== 'number' || !Number.isInteger(raw) || raw <= 0) return { ok: false, error: 'invalid' }
  if (raw < MIN_CENTS) return { ok: false, error: 'too_small' }
  if (raw > MAX_CENTS) return { ok: false, error: 'too_large' }
  return { ok: true, cents: raw }
}

const BASE = 'https://ai.mamaev.coach'

export function buildSupportSessionForm(opts: { cents: number; locale: 'ru' | 'en' }): URLSearchParams {
  const prefix = opts.locale === 'en' ? '/en' : ''
  const name = opts.locale === 'en' ? 'Support — Tochka Sborki' : 'Поддержка — Точка Сборки'
  const f = new URLSearchParams()
  f.set('mode', 'payment')
  f.set('submit_type', 'donate')
  f.set('line_items[0][quantity]', '1')
  f.set('line_items[0][price_data][currency]', 'usd')
  f.set('line_items[0][price_data][product_data][name]', name)
  f.set('line_items[0][price_data][unit_amount]', String(opts.cents))
  f.set('success_url', `${BASE}${prefix}/support/thanks/`)
  f.set('cancel_url', `${BASE}${prefix}/support/`)
  return f
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd workers && npx vitest run src/lib/checkout.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/types.ts workers/src/lib/checkout.ts workers/src/lib/checkout.test.ts
git commit -m "feat(workers): Stripe support checkout — amount validation + session form builder"
```

---

### Task 2: Worker checkout handler + route

**Files:**
- Create: `workers/src/handlers/checkout.ts`
- Test: `workers/src/handlers/checkout.test.ts`
- Modify: `workers/src/index.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/checkout.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleSupportCheckout } from './checkout'
import type { Env } from '../lib/types'

afterEach(() => vi.restoreAllMocks())

function req(body: unknown): Request {
  return new Request('https://ai.mamaev.coach/api/checkout/support', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  })
}

describe('handleSupportCheckout', () => {
  it('creates a Stripe session and returns its url', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/xyz' }), { status: 200 }))
    const res = await handleSupportCheckout(req({ amount: 700, locale: 'ru' }), { STRIPE_SECRET_KEY: 'sk_test' } as Env)
    expect(res.status).toBe(200)
    expect((await res.json() as { url: string }).url).toBe('https://checkout.stripe.com/c/xyz')
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk_test')
  })

  it('returns 503 when the key is not configured', async () => {
    const res = await handleSupportCheckout(req({ amount: 700 }), {} as Env)
    expect(res.status).toBe(503)
  })

  it('returns 400 for an out-of-bounds amount', async () => {
    const res = await handleSupportCheckout(req({ amount: 50 }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(400)
  })

  it('returns 502 when Stripe responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad', { status: 400 }))
    const res = await handleSupportCheckout(req({ amount: 700 }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(502)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd workers && npx vitest run src/handlers/checkout.test.ts`
Expected: FAIL — handler not found.

- [ ] **Step 3: Implement**

Create `workers/src/handlers/checkout.ts`:
```ts
import type { Env } from '../lib/types'
import { validateSupportAmount, buildSupportSessionForm } from '../lib/checkout'

export async function handleSupportCheckout(request: Request, env: Env): Promise<Response> {
  let body: { amount?: unknown; locale?: string }
  try { body = await request.json() } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }) }

  if (!env.STRIPE_SECRET_KEY) return Response.json({ error: 'stripe_not_configured' }, { status: 503 })

  const amt = validateSupportAmount(body.amount)
  if (!amt.ok) return Response.json({ error: amt.error }, { status: 400 })

  const locale: 'ru' | 'en' = body.locale === 'en' ? 'en' : 'ru'
  const form = buildSupportSessionForm({ cents: amt.cents, locale })

  let res: Response
  try {
    res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  } catch (e) {
    console.error('stripe session create threw', e)
    return Response.json({ error: 'stripe_error' }, { status: 502 })
  }
  if (!res.ok) {
    console.error('stripe session non-OK', res.status, await res.text())
    return Response.json({ error: 'stripe_error' }, { status: 502 })
  }
  const session = (await res.json().catch(() => ({}))) as { url?: string }
  if (!session.url) return Response.json({ error: 'stripe_error' }, { status: 502 })
  return Response.json({ url: session.url })
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd workers && npx vitest run src/handlers/checkout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Wire the route**

In `workers/src/index.ts`, add after the existing `runDailyNudge` import:
```ts
import { runDailyNudge } from './handlers/nudge-cron'
import { handleSupportCheckout } from './handlers/checkout'
```
And add a route branch after the `/api/telegram/webhook` branch:
```ts
      } else if (path === '/api/telegram/webhook' && method === 'POST') {
        response = await handleTelegramWebhook(request, env)
      } else if (path === '/api/checkout/support' && method === 'POST') {
        response = await handleSupportCheckout(request, env)
```

- [ ] **Step 6: Typecheck + full worker suite + commit**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all pass.
```bash
git add workers/src/handlers/checkout.ts workers/src/handlers/checkout.test.ts workers/src/index.ts
git commit -m "feat(workers): POST /api/checkout/support — create Stripe Checkout Session"
```

---

### Task 3: Web support content (pure)

**Files:**
- Create: `LMS/tochka-sborki/web/lib/checkout/support-content.ts`
- Test: `LMS/tochka-sborki/web/lib/checkout/support-content.test.ts`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/checkout/support-content.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildSupportContent } from './support-content'

describe('buildSupportContent', () => {
  it('differs by locale and carries the preset cents', () => {
    const ru = buildSupportContent('ru')
    const en = buildSupportContent('en')
    expect(ru.title).not.toBe(en.title)
    expect(ru.presets.map(p => p.cents)).toEqual([300, 700, 1500])
    expect(en.presets.map(p => p.cents)).toEqual([300, 700, 1500])
    expect(ru.submitLabel.length).toBeGreaterThan(0)
    expect(en.thanksTitle.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/checkout/support-content.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `LMS/tochka-sborki/web/lib/checkout/support-content.ts`:
```ts
import type { Locale } from '@/lib/dictionaries'

export interface SupportPreset { label: string; cents: number }
export interface SupportContent {
  eyebrow: string
  title: string
  lead: string
  presets: SupportPreset[]
  customLabel: string
  customPlaceholder: string
  submitLabel: string
  footnote: string
  errorMsg: string
  thanksTitle: string
  thanksBody: string
}

const PRESETS: SupportPreset[] = [
  { label: '$3', cents: 300 },
  { label: '$7', cents: 700 },
  { label: '$15', cents: 1500 },
]

export function buildSupportContent(locale: Locale): SupportContent {
  if (locale === 'en') {
    return {
      eyebrow: 'Support',
      title: 'Support the work',
      lead: 'The course is free and stays free. If it helped, you can chip in to support the creator — no pressure, no strings.',
      presets: PRESETS,
      customLabel: 'Custom amount',
      customPlaceholder: 'Amount in $',
      submitLabel: 'Support →',
      footnote: 'This supports the creator (a sole proprietor) — it is not a tax-deductible nonprofit donation.',
      errorMsg: 'Temporarily unavailable — please try again.',
      thanksTitle: 'Thank you 🙏',
      thanksBody: 'Your support helps keep the course open and free. Come back anytime.',
    }
  }
  return {
    eyebrow: 'Поддержать',
    title: 'Поддержать проект',
    lead: 'Курс был и останется бесплатным. Если он оказался полезным — можешь поддержать автора. Без обязательств и давления.',
    presets: PRESETS,
    customLabel: 'Своя сумма',
    customPlaceholder: 'Сумма в $',
    submitLabel: 'Поддержать →',
    footnote: 'Это поддержка автора (ИП), а не пожертвование в нонпрофит с налоговым вычетом.',
    errorMsg: 'Временно недоступно — попробуй ещё раз.',
    thanksTitle: 'Спасибо 🙏',
    thanksBody: 'Твоя поддержка помогает держать курс открытым и бесплатным. Возвращайся в любой момент.',
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/checkout/support-content.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/checkout/support-content.ts LMS/tochka-sborki/web/lib/checkout/support-content.test.ts
git commit -m "feat(lms): bilingual support-page content (sole-proprietor framing)"
```

---

### Task 4: Web support form, pages, nav link

**Files:**
- Create: `LMS/tochka-sborki/web/components/support/support-form.tsx`
- Create: `LMS/tochka-sborki/web/app/support/page.tsx`
- Create: `LMS/tochka-sborki/web/app/en/support/page.tsx`
- Create: `LMS/tochka-sborki/web/app/support/thanks/page.tsx`
- Create: `LMS/tochka-sborki/web/app/en/support/thanks/page.tsx`
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts`
- Modify: `LMS/tochka-sborki/web/components/nav.tsx`

- [ ] **Step 1: Create the client form**

Create `LMS/tochka-sborki/web/components/support/support-form.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { buildSupportContent } from '@/lib/checkout/support-content'
import type { Locale } from '@/lib/dictionaries'

export function SupportForm({ locale }: { locale: Locale }) {
  const c = buildSupportContent(locale)
  const [custom, setCustom] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  async function checkout(cents: number) {
    if (busy) return
    setError(false)
    setBusy(true)
    try {
      const res = await fetch('/api/checkout/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cents, locale }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.url) { window.location.assign(data.url); return }
      setError(true)
    } catch {
      setError(true)
    }
    setBusy(false)
  }

  function onCustom() {
    const cents = Math.round(parseFloat(custom) * 100)
    if (!Number.isFinite(cents) || cents < 100) { setError(true); return }
    checkout(cents)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '28rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {c.presets.map(p => (
          <button key={p.cents} onClick={() => checkout(p.cents)} disabled={busy}
            style={{ padding: '0.6rem 1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <input value={custom} onChange={e => setCustom(e.target.value)} inputMode="decimal" placeholder={c.customPlaceholder} aria-label={c.customLabel}
          style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
        <button onClick={onCustom} disabled={busy}
          style={{ padding: '0.6rem 1.1rem', borderRadius: '8px', border: 'none', background: 'var(--text-accent)', color: 'var(--text-on-accent)', cursor: 'pointer', fontWeight: 600 }}>
          {c.submitLabel}
        </button>
      </div>
      {error && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.errorMsg}</p>}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{c.footnote}</p>
    </div>
  )
}
```

- [ ] **Step 2: Create the RU + EN support pages**

Create `LMS/tochka-sborki/web/app/support/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SupportForm } from '@/components/support/support-form'
import { buildSupportContent } from '@/lib/checkout/support-content'

export const metadata: Metadata = { title: 'Поддержать — Точка Сборки', description: 'Поддержать автора курса.' }

export default function Page() {
  const c = buildSupportContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', margin: 0 }}>{c.eyebrow}</p>
        <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
        <SupportForm locale="ru" />
      </main>
    </>
  )
}
```
Create `LMS/tochka-sborki/web/app/en/support/page.tsx` (identical but EN):
```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SupportForm } from '@/components/support/support-form'
import { buildSupportContent } from '@/lib/checkout/support-content'

export const metadata: Metadata = { title: 'Support — Tochka Sborki', description: 'Support the course creator.' }

export default function Page() {
  const c = buildSupportContent('en')
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', margin: 0 }}>{c.eyebrow}</p>
        <h1 style={{ marginTop: '0.5rem' }}>{c.title}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.lead}</p>
        <SupportForm locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the thank-you pages**

Create `LMS/tochka-sborki/web/app/support/thanks/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { buildSupportContent } from '@/lib/checkout/support-content'

export const metadata: Metadata = { title: 'Спасибо — Точка Сборки' }

export default function Page() {
  const c = buildSupportContent('ru')
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>{c.thanksTitle}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
        <Link href="/" style={{ color: 'var(--text-accent)' }}>← На главную</Link>
      </main>
    </>
  )
}
```
Create `LMS/tochka-sborki/web/app/en/support/thanks/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { buildSupportContent } from '@/lib/checkout/support-content'

export const metadata: Metadata = { title: 'Thank you — Tochka Sborki' }

export default function Page() {
  const c = buildSupportContent('en')
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <h1>{c.thanksTitle}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{c.thanksBody}</p>
        <Link href="/en/" style={{ color: 'var(--text-accent)' }}>← Home</Link>
      </main>
    </>
  )
}
```

- [ ] **Step 4: Add the nav dictionary key**

In `LMS/tochka-sborki/web/lib/dictionaries.ts`, add `support: string` to the `nav` type (in `type Dictionary`, after `synergems: string`), and add the value to both locales' `nav` objects: RU `support: 'Поддержать',` and EN `support: 'Support',` (place each right after the existing `synergems:` line in the respective `nav` block).

- [ ] **Step 5: Add the nav link**

In `LMS/tochka-sborki/web/components/nav.tsx`, inside the `.nav-secondary-links` div, add a Support link right after the `feedback` link line:
```tsx
        {(() => { const h = `${locale === 'en' ? '/en' : ''}/support/`; return <Link href={h} style={navLinkStyle(h)}>{t.nav.support}</Link> })()}
```

- [ ] **Step 6: Typecheck + build**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npm run build`
Expected: tsc clean; static export builds with `/support`, `/support/thanks`, `/en/support`, `/en/support/thanks`.

- [ ] **Step 7: Commit**

```bash
git add LMS/tochka-sborki/web/components/support/support-form.tsx LMS/tochka-sborki/web/app/support LMS/tochka-sborki/web/app/en/support LMS/tochka-sborki/web/lib/dictionaries.ts LMS/tochka-sborki/web/components/nav.tsx
git commit -m "feat(lms): /support page (presets + custom) + nav link"
```

---

### Task 5: Telegram /support command

**Files:**
- Modify: `workers/src/lib/telegram-update.ts`
- Modify: `workers/src/lib/telegram-update.test.ts`
- Modify: `workers/src/lib/bot-copy.ts`
- Modify: `workers/src/lib/course-order.ts`
- Modify: `workers/src/handlers/telegram-webhook.ts`
- Modify: `workers/src/handlers/telegram-webhook.test.ts`

- [ ] **Step 1: Add the parser test + impl**

In `workers/src/lib/telegram-update.test.ts`, add inside the `describe('parseUpdate', …)` block:
```ts
  it('parses /support', () => {
    const r = parseUpdate({ message: { text: '/support', from: { id: 4 }, chat: { id: 4 } } })
    expect(r.kind).toBe('support')
  })
```
In `workers/src/lib/telegram-update.ts`, add `'support'` to the `BotIntent['kind']` union, and add a branch after the `/stop` case (and before the `/ask` case):
```ts
    } else if (/^\/stop(\b|@|$)/.test(text)) {
      kind = 'stop'
    } else if (/^\/support(\b|@|$)/.test(text)) {
      kind = 'support'
    } else if (/^\/ask(\b|@|$)/.test(text)) {
```

- [ ] **Step 2: Add the bot copy**

In `workers/src/lib/bot-copy.ts`, add to `interface BotCopy` (after `askButton: string`): `supportIntro: string` and `supportButton: string`. Add to RU (after `askButton: '...',`):
```ts
  supportIntro: 'Курс бесплатный и таким останется. Если хочешь поддержать автора — вот здесь:',
  supportButton: '❤️ Поддержать',
```
Add to EN (after its `askButton: '...',`):
```ts
  supportIntro: 'The course is free and stays free. If you’d like to support the creator — here:',
  supportButton: '❤️ Support',
```

- [ ] **Step 3: Add the support URL helper**

In `workers/src/lib/course-order.ts`, add at the end:
```ts
export function supportUrl(locale: 'ru' | 'en'): string {
  return locale === 'en' ? 'https://ai.mamaev.coach/en/support/' : 'https://ai.mamaev.coach/support/'
}
```

- [ ] **Step 4: Add the webhook test + branch**

In `workers/src/handlers/telegram-webhook.test.ts`, add inside the `describe('handleTelegramWebhook', …)` block:
```ts
  it('/support sends a button to the support page', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/support', from: { id: 700 }, chat: { id: 700 } } }),
      makeEnv({ user: { id: 'u-700', language: 'ru', nudge_optout: 0 } })
    )
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/support/')
  })
```
In `workers/src/handlers/telegram-webhook.ts`, add the `supportUrl` import to the existing course-order import (e.g. `import { nextLesson, lessonUrl, homeUrl, supportUrl } from '../lib/course-order'`), and add a branch after the `stop` branch (before `ask`):
```ts
    } else if (intent.kind === 'support') {
      await sendMessage(env, intent.chatId, copy.supportIntro, { text: copy.supportButton, url: supportUrl(locale) })
```

- [ ] **Step 5: Run worker suite + typecheck**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all pass (parser /support + webhook /support green).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/telegram-update.ts workers/src/lib/telegram-update.test.ts workers/src/lib/bot-copy.ts workers/src/lib/course-order.ts workers/src/handlers/telegram-webhook.ts workers/src/handlers/telegram-webhook.test.ts
git commit -m "feat(workers): Telegram /support command (deep-link to support page)"
```

---

### Task 6: Deploy + go-live (ops)

**Files:** none

- [ ] **Step 1: Owner sets the Stripe secret**

Surface to the owner: `cd C:\telo\Efforts\Ongoing\mc_hub\workers && npx wrangler secret put STRIPE_SECRET_KEY`
(paste the Stripe **secret** key `sk_live_…` or `sk_test_…`; watch for a trailing BOM/space). Until set,
`/api/checkout/support` returns 503 and the page shows the calm message.

- [ ] **Step 2: Deploy**

Push to `main`; confirm CI `deploy-web` and `deploy-workers` both green.

- [ ] **Step 3: Smoke**

Visit `https://ai.mamaev.coach/support/`, pick a preset → should redirect to a Stripe Checkout page for that
amount (use a Stripe test card `4242 4242 4242 4242` if the key is `sk_test`). In Telegram, `/support` → a
button to the support page.

---

## Self-Review

**Spec coverage:**
- amount validation + Stripe form builder → Task 1 (`checkout.ts`) ✓
- handler: 503 unset / 400 bad amount / 502 Stripe / `{url}` → Task 2 ✓
- route `/api/checkout/support` + `STRIPE_SECRET_KEY` env → Task 1 (env) + Task 2 (route) ✓
- bilingual support content (sole-prop framing) → Task 3 ✓
- support form (presets + custom, graceful error) + pages + nav → Task 4 ✓
- bot `/support` (parser + copy + url + webhook) → Task 5 ✓
- deploy gate (owner key) → Task 6 ✓
- no D1 / no webhook → consistent (none added) ✓

**Placeholder scan:** none — full code in every step; commands have expected output.

**Type consistency:** `validateSupportAmount`/`buildSupportSessionForm` (Task 1) consumed in Task 2 with matching
shapes; `AmountResult` error union (`invalid`/`too_small`/`too_large`) returned as `{error}` in the handler.
`buildSupportContent(locale)`/`SupportContent`/`SupportPreset` (Task 3) consumed by Task 4's form + pages.
`supportUrl(locale)` (Task 5) used in the webhook branch + its test asserts `https://ai.mamaev.coach/support/`
(= `supportUrl('ru')`). `BotIntent.kind` gains `'support'` (Task 5 parser) handled in the same task's webhook
branch. Bot copy fields `supportIntro`/`supportButton` defined + used in Task 5. `nav.support` dict key added
(Task 4) and read in nav.tsx.
