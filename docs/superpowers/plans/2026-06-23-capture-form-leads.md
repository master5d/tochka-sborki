# Consent-first CaptureForm + /api/leads/capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A reusable consent-first interest-capture form that persists an anonymous visitor's lead in D1 and mirrors the email to Resend, tagged with the event + city of interest — no n8n.

**Architecture:** A public worker endpoint `POST /api/leads/capture` validates (email + GDPR consent, honeypot), inserts the rich lead into a new additive `event_leads` table, upserts the email into the `users` CRM table (new row only), and best-effort mirrors to Resend. The frontend is a generic `'use client'` `<CaptureForm>` driven by a `CaptureFormConfig`, plus a string-prop MDX wrapper `<CaptureFormBlock id locale/>` that resolves the config from `lib/content/capture-forms.ts` (sidestepping the `next-mdx-remote@6` inline-array prop limitation).

**Tech Stack:** Cloudflare Worker (TypeScript) + D1, Vitest (env=node), Next.js 16 (`output:'export'`, static), React server/client components, CSS variables.

## Global Constraints

- **No n8n.** Use direct D1 + Resend only. `crm.ts` is authoritative: "D1 `users` = source of truth, Resend = secondary mirror."
- **Consent-first / authenticity (sacred):** phone is OPTIONAL with a transparent justification shown beneath it; the form is **inline, never a modal/pop-up**; the GDPR consent checkbox is **required** (submit blocked without it); no scarcity, hype, urgency, or pressure copy.
- **Honeypot** is the only abuse guard (a hidden `company` field); no other rate limiting.
- **Email regex** (reuse verbatim from `auth.ts`): `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`; email is `.trim().toLowerCase()`-normalized before validation.
- **`users` upsert is new-row-only** — never overwrite an existing account holder's row.
- Migration is **additive**; prod application is via the cloudflare-api MCP `/query` (zero-token), not wrangler.
- Bilingual (ru+en); static-export safe.
- Web tests: `cd LMS/tochka-sborki/web && npm test`. Worker tests: `cd workers && npx vitest run src/`. UI verified by `cd LMS/tochka-sborki/web && npm run build`.
- All git commands run from the repo root `C:\telo\Efforts\Ongoing\mc_hub` (use `cd` to the root in each commit step).

---

## File Structure

- `workers/migrations/0012_event_leads.sql` — new additive `event_leads` table (+ indexes).
- `workers/src/handlers/leads-capture.ts` — `handleLeadCapture(request, env)`.
- `workers/src/handlers/leads-capture.test.ts` — handler validation + D1-write assertions.
- `workers/src/index.ts` — register `POST /api/leads/capture` route.
- `LMS/tochka-sborki/web/lib/content/capture-forms.ts` — `CaptureFormConfig`, `CAPTURE_FORMS`, `getCaptureForm`.
- `LMS/tochka-sborki/web/lib/content/capture-forms.test.ts` — config resolution tests.
- `LMS/tochka-sborki/web/components/capture-form.tsx` — `'use client'` inline form.
- `LMS/tochka-sborki/web/components/capture-form-block.tsx` — string-prop MDX wrapper.
- `LMS/tochka-sborki/web/components/mdx-components.tsx` — register `CaptureFormBlock`.
- `LMS/tochka-sborki/web/lib/dictionaries.ts` — shared `capture` field labels (interface + ru + en).

---

## Task 1: Additive `event_leads` migration

**Files:**
- Create: `workers/migrations/0012_event_leads.sql`

**Interfaces:**
- Produces: an `event_leads` table whose columns exactly match the `INSERT` in Task 2:
  `(id, name, email, phone, city, event, message, consent_at, source, language, created_at)`.

- [ ] **Step 1: Write the migration file**

Create `workers/migrations/0012_event_leads.sql`:

```sql
-- workers/migrations/0012_event_leads.sql
-- Rich detail for consent-first interest-capture leads (fb_667daeba55b3).
-- Additive only. Email is also upserted into users (CRM source of truth);
-- this table holds the per-event fields users has no columns for.
CREATE TABLE IF NOT EXISTS event_leads (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  event TEXT,
  message TEXT,
  consent_at INTEGER NOT NULL,
  source TEXT,
  language TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_leads_event ON event_leads(event);
CREATE INDEX IF NOT EXISTS idx_event_leads_email ON event_leads(email);
```

- [ ] **Step 2: Verify the column list matches the handler contract**

Run: `grep -E "id|name|email|phone|city|event|message|consent_at|source|language|created_at" workers/migrations/0012_event_leads.sql`
Expected: the `CREATE TABLE` lists exactly these 11 columns, in this order (the Task 2 `INSERT` binds them positionally in the same order).

- [ ] **Step 3: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add workers/migrations/0012_event_leads.sql
git commit -m "feat(workers): additive event_leads table for capture-form leads"
```

> **Note for the controller (not a code step):** this migration must be applied to the prod D1 via the cloudflare-api MCP `/query` before the endpoint is live. Local Vitest mocks the DB and does not need it.

---

## Task 2: `handleLeadCapture` worker handler + route

**Files:**
- Create: `workers/src/handlers/leads-capture.ts`
- Create: `workers/src/handlers/leads-capture.test.ts`
- Modify: `workers/src/index.ts` (import + route branch)

**Interfaces:**
- Consumes: `event_leads` table (Task 1); `addResendContact(env, { email, language?, source? })` from `workers/src/lib/crm.ts`; `Env` from `workers/src/lib/types.ts`.
- Produces: `export async function handleLeadCapture(request: Request, env: Env): Promise<Response>`.

- [ ] **Step 1: Write the failing tests**

Create `workers/src/handlers/leads-capture.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { handleLeadCapture } from './leads-capture'
import type { Env } from '../lib/types'

type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { existing?: boolean; calls?: DbCall[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return {
          first: async () => (opts.existing ? { id: 'existing-user-id' } : null),
          run: async () => ({ success: true }),
        }
      },
    }),
  } as unknown as D1Database
  return {
    DB,
    WORKER_JWT_SECRET: 'test-secret',
    RESEND_API_KEY: '', // empty → addResendContact no-ops, no network in tests
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  } as Env
}

function req(body: unknown) {
  return new Request('https://ai.mamaev.coach/api/leads/capture', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const eventLeadsInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO event_leads/.test(c.sql))
const usersInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO users/.test(c.sql))

const validBody = {
  name: 'Sasha', email: 'Lead@Example.com ', phone: '+1 615 555 0100',
  city: 'Nashville', event: 'retreat-inner-evolution', message: 'interested', consent: true,
}

describe('handleLeadCapture', () => {
  it('400 on missing email', async () => {
    const res = await handleLeadCapture(req({ consent: true }), makeEnv())
    expect(res.status).toBe(400)
  })

  it('400 on malformed email', async () => {
    const res = await handleLeadCapture(req({ email: 'nope', consent: true }), makeEnv())
    expect(res.status).toBe(400)
  })

  it('400 on missing consent', async () => {
    const res = await handleLeadCapture(req({ email: 'a@b.co' }), makeEnv())
    expect(res.status).toBe(400)
  })

  it('honeypot filled → 200 with no DB writes', async () => {
    const calls: DbCall[] = []
    const res = await handleLeadCapture(req({ ...validBody, company: 'spam-bot' }), makeEnv({ calls }))
    expect(res.status).toBe(200)
    expect(eventLeadsInsert(calls)).toBeUndefined()
    expect(usersInsert(calls)).toBeUndefined()
  })

  it('valid new lead → 200, inserts event_leads + upserts users (normalized email)', async () => {
    const calls: DbCall[] = []
    const res = await handleLeadCapture(req(validBody), makeEnv({ existing: false, calls }))
    expect(res.status).toBe(200)
    const el = eventLeadsInsert(calls)
    expect(el).toBeDefined()
    expect(el!.binds).toContain('lead@example.com') // trimmed + lowercased
    expect(usersInsert(calls)).toBeDefined()
  })

  it('existing user → 200, inserts event_leads but NOT a second users row', async () => {
    const calls: DbCall[] = []
    const res = await handleLeadCapture(req(validBody), makeEnv({ existing: true, calls }))
    expect(res.status).toBe(200)
    expect(eventLeadsInsert(calls)).toBeDefined()
    expect(usersInsert(calls)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd workers && npx vitest run src/handlers/leads-capture.test.ts`
Expected: FAIL — `Cannot find module './leads-capture'` (handler not created yet).

- [ ] **Step 3: Implement the handler**

Create `workers/src/handlers/leads-capture.ts`:

```ts
import type { Env } from '../lib/types'
import { addResendContact } from '../lib/crm'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

interface LeadCaptureBody {
  name?: string
  email?: string
  phone?: string
  city?: string
  event?: string
  message?: string
  consent?: boolean
  company?: string // honeypot — real users never fill this
  locale?: string
}

export async function handleLeadCapture(request: Request, env: Env): Promise<Response> {
  let body: LeadCaptureBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot: a bot filled the hidden field. Look successful, write nothing.
  if (body.company && body.company.trim() !== '') {
    return Response.json({ ok: true })
  }

  const email = body.email?.trim().toLowerCase() ?? ''
  if (!email || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Valid email required' }, { status: 400 })
  }
  if (body.consent !== true) {
    return Response.json({ error: 'Consent required' }, { status: 400 })
  }

  const now = Math.floor(Date.now() / 1000)
  const event = body.event?.trim() || null
  const source = 'capture:' + (event ?? 'general')
  const language = body.locale === 'en' ? 'en' : 'ru'

  await env.DB.prepare(
    `INSERT INTO event_leads
       (id, name, email, phone, city, event, message, consent_at, source, language, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    body.name?.trim() || null,
    email,
    body.phone?.trim() || null,
    body.city?.trim() || null,
    event,
    body.message?.trim() || null,
    now,
    source,
    language,
    now,
  ).run()

  // Upsert into users (CRM source of truth) — new row only; never overwrite an account holder.
  const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
    .bind(email).first<{ id: string }>()
  if (!existing) {
    await env.DB.prepare(
      'INSERT INTO users (id, email, created_at, language, source, telegram_handle) VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(crypto.randomUUID(), email, now, language, source, null).run()
  }

  // Resend mirror is best-effort (it swallows its own errors and no-ops without a key).
  await addResendContact(env, { email, language, source })

  return Response.json({ ok: true })
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd workers && npx vitest run src/handlers/leads-capture.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Register the route in `index.ts`**

In `workers/src/index.ts`, add the import next to the other handler imports (after the `handleFeedback` import line):

```ts
import { handleLeadCapture } from './handlers/leads-capture'
```

And add the route branch immediately after the existing `/api/feedback` branch:

```ts
      if (path === '/api/feedback' && method === 'POST') {
        response = await handleFeedback(request, env)
      } else if (path === '/api/leads/capture' && method === 'POST') {
        response = await handleLeadCapture(request, env)
      } else if (path === '/api/auth/send-link' && method === 'POST') {
```

- [ ] **Step 6: Run the full worker suite to confirm nothing broke**

Run: `cd workers && npx vitest run src/`
Expected: PASS (all suites green, including the new leads-capture tests).

- [ ] **Step 7: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add workers/src/handlers/leads-capture.ts workers/src/handlers/leads-capture.test.ts workers/src/index.ts
git commit -m "feat(workers): /api/leads/capture consent-first handler (D1 + Resend, no n8n)"
```

---

## Task 3: `capture-forms.ts` content config + resolver

**Files:**
- Create: `LMS/tochka-sborki/web/lib/content/capture-forms.ts`
- Create: `LMS/tochka-sborki/web/lib/content/capture-forms.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/dictionaries`.
- Produces:
  - `export interface CaptureFormConfig { event: string; heading: string; blurb: string; cities: string[]; phoneJustification: string; consentLabel: string; cta: string; successMessage: string }`
  - `export function getCaptureForm(id: string, locale: Locale): CaptureFormConfig | null`

- [ ] **Step 1: Write the failing tests**

Create `LMS/tochka-sborki/web/lib/content/capture-forms.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getCaptureForm } from './capture-forms'

describe('getCaptureForm', () => {
  it('returns a fully-populated config for the seeded retreat (ru + en)', () => {
    for (const locale of ['ru', 'en'] as const) {
      const c = getCaptureForm('retreat-inner-evolution', locale)
      expect(c).not.toBeNull()
      expect(c!.event).toBe('retreat-inner-evolution')
      expect(c!.heading.length).toBeGreaterThan(0)
      expect(c!.blurb.length).toBeGreaterThan(0)
      expect(c!.consentLabel.length).toBeGreaterThan(0)
      expect(c!.cta.length).toBeGreaterThan(0)
      expect(c!.successMessage.length).toBeGreaterThan(0)
      expect(c!.phoneJustification.length).toBeGreaterThan(0)
      expect(Array.isArray(c!.cities)).toBe(true)
    }
  })

  it('returns null for an unknown id', () => {
    expect(getCaptureForm('does-not-exist', 'ru')).toBeNull()
  })

  it('localizes — ru heading differs from en', () => {
    const ru = getCaptureForm('retreat-inner-evolution', 'ru')!
    const en = getCaptureForm('retreat-inner-evolution', 'en')!
    expect(ru.heading).not.toBe(en.heading)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/capture-forms.test.ts`
Expected: FAIL — `Cannot find module './capture-forms'`.

- [ ] **Step 3: Implement the config + resolver**

Create `LMS/tochka-sborki/web/lib/content/capture-forms.ts`:

```ts
import type { Locale } from '@/lib/dictionaries'

export interface CaptureFormConfig {
  /** Tag stored on the lead; also the `id` used by getCaptureForm. */
  event: string
  heading: string
  blurb: string
  /** City <select> options. Empty array → the form renders a free-text city input. */
  cities: string[]
  /** Transparent reason the optional phone field is asked (shown beneath it). */
  phoneJustification: string
  /** GDPR consent checkbox copy. */
  consentLabel: string
  cta: string
  successMessage: string
}

const CAPTURE_FORMS: Record<string, Record<Locale, CaptureFormConfig>> = {
  'retreat-inner-evolution': {
    ru: {
      event: 'retreat-inner-evolution',
      heading: 'Интерес к ретриту «Внутренняя эволюция»',
      blurb: 'Оставь контакты — расскажем о ближайших датах и городах, без спама и давления. Отпишешься в один клик в любой момент.',
      cities: ['Нашвилл', 'Остин', 'Сан-Франциско', 'Онлайн'],
      phoneJustification: 'Телефон по желанию — для ретритов и когорт нужен личный контакт, не только письмо. Можно оставить только email.',
      consentLabel: 'Согласен(на) на обработку контактов, чтобы получать информацию об этом событии.',
      cta: 'Оставить заявку',
      successMessage: '✓ Спасибо! Мы на связи — напишем о датах и деталях.',
    },
    en: {
      event: 'retreat-inner-evolution',
      heading: 'Interest in the "Inner Evolution" retreat',
      blurb: 'Leave your details — we will share upcoming dates and cities. No spam, no pressure. Unsubscribe anytime in one click.',
      cities: ['Nashville', 'Austin', 'San Francisco', 'Online'],
      phoneJustification: 'Phone is optional — retreats and cohorts need personal contact, not just email. You can leave email only.',
      consentLabel: 'I consent to my contact details being processed to receive information about this event.',
      cta: 'Register interest',
      successMessage: '✓ Thank you! We will be in touch with dates and details.',
    },
  },
}

export function getCaptureForm(id: string, locale: Locale): CaptureFormConfig | null {
  return CAPTURE_FORMS[id]?.[locale] ?? null
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/capture-forms.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add "LMS/tochka-sborki/web/lib/content/capture-forms.ts" "LMS/tochka-sborki/web/lib/content/capture-forms.test.ts"
git commit -m "feat(lms): capture-form config + getCaptureForm (seed retreat-inner-evolution ru/en)"
```

---

## Task 4: shared `capture` dictionary labels

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/dictionaries.ts` (interface block + ru + en)

**Interfaces:**
- Produces: `getDictionary(locale).capture` with keys
  `{ nameLabel, emailLabel, phoneLabel, cityLabel, cityPlaceholder, messageLabel, submitting, errorMessage }`
  (all `string`), consumed by `<CaptureForm>` in Task 5.

- [ ] **Step 1: Add the `capture` block to the `Dictionary` interface**

In `LMS/tochka-sborki/web/lib/dictionaries.ts`, immediately after the `feedback: { … }` interface block closes (the `}` on the line before `wizard: {`), insert:

```ts
  capture: {
    nameLabel: string
    emailLabel: string
    phoneLabel: string
    cityLabel: string
    cityPlaceholder: string
    messageLabel: string
    submitting: string
    errorMessage: string
  }
```

- [ ] **Step 2: Add the ru `capture` values**

In the ru dictionary, immediately after the ru `feedback: { … },` block closes, insert:

```ts
    capture: {
      nameLabel: 'Имя',
      emailLabel: 'Email',
      phoneLabel: 'Телефон / WhatsApp (по желанию)',
      cityLabel: 'Город',
      cityPlaceholder: 'Выбери город...',
      messageLabel: 'Вопрос или комментарий (по желанию)',
      submitting: 'Отправляем...',
      errorMessage: 'Что-то пошло не так, попробуй снова.',
    },
```

- [ ] **Step 3: Add the en `capture` values**

In the en dictionary, immediately after the en `feedback: { … },` block closes, insert:

```ts
    capture: {
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone / WhatsApp (optional)',
      cityLabel: 'City',
      cityPlaceholder: 'Choose a city...',
      messageLabel: 'Question or comment (optional)',
      submitting: 'Sending...',
      errorMessage: 'Something went wrong, please try again.',
    },
```

- [ ] **Step 4: Verify the dictionary compiles (type-check via build is in Task 5; quick check here)**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit -p tsconfig.json`
Expected: PASS — no type errors (both ru and en now satisfy the `capture` interface). If your repo's `tsc` is slow or unconfigured for this, skip and rely on the Task 5 build.

- [ ] **Step 5: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add "LMS/tochka-sborki/web/lib/dictionaries.ts"
git commit -m "feat(lms): shared capture-form field labels (ru+en)"
```

---

## Task 5: `<CaptureForm>` + `<CaptureFormBlock>` + MDX registration

**Files:**
- Create: `LMS/tochka-sborki/web/components/capture-form.tsx`
- Create: `LMS/tochka-sborki/web/components/capture-form-block.tsx`
- Modify: `LMS/tochka-sborki/web/components/mdx-components.tsx`

**Interfaces:**
- Consumes: `CaptureFormConfig` + `getCaptureForm` (Task 3); `getDictionary`, `Locale` (Task 4); `POST /api/leads/capture` (Task 2).
- Produces: `<CaptureForm config locale/>` and `<CaptureFormBlock id locale/>` (the latter registered as an MDX component).

- [ ] **Step 1: Implement `<CaptureForm>`**

Create `LMS/tochka-sborki/web/components/capture-form.tsx`. It mirrors the `feedback-form.tsx` styling idiom (mono labels, surface inputs, accent submit). The honeypot `company` input is visually hidden; the consent checkbox is required and gates submit.

```tsx
'use client'

import { useState } from 'react'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import type { CaptureFormConfig } from '@/lib/content/capture-forms'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600,
}

export function CaptureForm({ config, locale = 'ru' }: { config: CaptureFormConfig; locale?: Locale }) {
  const t = getDictionary(locale).capture
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [company, setCompany] = useState('') // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, city, message, consent, company,
          event: config.event, locale,
        }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        padding: '2rem',
        border: '1px solid var(--text-accent)',
        borderRadius: 'var(--radius)',
        color: 'var(--text-accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem',
      }}>
        {config.successMessage}
      </div>
    )
  }

  return (
    <section style={{
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius)',
      background: 'var(--bg-secondary)',
      padding: '1.5rem',
    }}>
      <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>{config.heading}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{config.blurb}</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>{t.nameLabel}</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>{t.emailLabel}</label>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>{t.phoneLabel}</label>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.4rem' }}>
            {config.phoneJustification}
          </p>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>{t.cityLabel}</label>
          {config.cities.length > 0 ? (
            <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
              <option value="">{t.cityPlaceholder}</option>
              {config.cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : (
            <input type="text" value={city} onChange={e => setCity(e.target.value)} style={inputStyle} />
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={labelStyle}>{t.messageLabel}</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        {/* Honeypot — hidden from real users; bots fill it and get silently dropped server-side. */}
        <input
          type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
          value={company} onChange={e => setCompany(e.target.value)}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
        />

        <label style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', marginBottom: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          <input type="checkbox" required checked={consent} onChange={e => setConsent(e.target.checked)}
            style={{ marginTop: '0.2rem' }} />
          <span>{config.consentLabel}</span>
        </label>

        {status === 'error' && (
          <p style={{ color: 'var(--crit)', marginBottom: '1rem', fontSize: '0.875rem' }}>{t.errorMessage}</p>
        )}

        <button type="submit" disabled={status === 'loading' || !consent}
          style={{
            padding: '0.875rem 2rem',
            background: 'var(--text-accent)',
            color: 'var(--text-on-accent)',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: status === 'loading' || !consent ? 'not-allowed' : 'pointer',
            opacity: !consent ? 0.5 : 1,
            alignSelf: 'flex-start',
          }}>
          {status === 'loading' ? t.submitting : config.cta}
        </button>
      </form>
    </section>
  )
}
```

- [ ] **Step 2: Implement the `<CaptureFormBlock>` wrapper**

Create `LMS/tochka-sborki/web/components/capture-form-block.tsx`:

```tsx
import { getCaptureForm } from '@/lib/content/capture-forms'
import type { Locale } from '@/lib/dictionaries'
import { CaptureForm } from './capture-form'

/** MDX-safe wrapper: string props only (next-mdx-remote@6 drops inline array/object props). */
export function CaptureFormBlock({ id, locale = 'ru' }: { id: string; locale?: Locale }) {
  const config = getCaptureForm(id, locale)
  if (!config) return null
  return <CaptureForm config={config} locale={locale} />
}
```

- [ ] **Step 3: Register `CaptureFormBlock` in the MDX registry**

In `LMS/tochka-sborki/web/components/mdx-components.tsx`, add the import alongside the other component imports:

```tsx
import { CaptureFormBlock } from './capture-form-block'
```

and add `CaptureFormBlock,` to the `mdxComponents` object (next to the other registered block components such as `ModuleSurvey`).

- [ ] **Step 4: Verify the production build is green**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: build succeeds (compiles `capture-form.tsx`, `capture-form-block.tsx`, the registry, and the `capture` dictionary keys with no type errors).

- [ ] **Step 5: Run the full web suite to confirm nothing broke**

Run: `cd LMS/tochka-sborki/web && npm test`
Expected: PASS (all suites green, including `capture-forms.test.ts`).

- [ ] **Step 6: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add "LMS/tochka-sborki/web/components/capture-form.tsx" "LMS/tochka-sborki/web/components/capture-form-block.tsx" "LMS/tochka-sborki/web/components/mdx-components.tsx"
git commit -m "feat(lms): inline consent-first CaptureForm + MDX CaptureFormBlock wrapper"
```

---

## Self-Review (completed by plan author)

**1. Spec coverage:**
- `event_leads` additive table → Task 1. ✅
- `/api/leads/capture` handler (honeypot noop, email+consent 400s, event_leads insert, users new-row-only upsert, Resend mirror, no n8n) → Task 2. ✅
- Route registration → Task 2 Step 5. ✅
- `CaptureFormConfig` + `getCaptureForm` + seed retreat ru/en → Task 3. ✅
- Shared `capture` dictionary labels → Task 4. ✅
- `<CaptureForm>` (inline, honeypot `company`, phone-optional+justification, required consent gating submit, city select/free-text) → Task 5. ✅
- `<CaptureFormBlock>` string-prop wrapper + MDX registration → Task 5. ✅
- Consent-first / authenticity guards → enforced in Task 2 (server consent check) + Task 5 (required checkbox, no hype copy, inline section) + Task 3 (de-hustled seed copy). ✅
- Tests: worker handler (6 cases) + config resolution (3 cases) + build verification. ✅

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step carries complete code. ✅

**3. Type consistency:**
- `CaptureFormConfig` fields (`event, heading, blurb, cities, phoneJustification, consentLabel, cta, successMessage`) are identical across Task 3 (definition), Task 3 tests, and Task 5 (consumption). ✅
- `getCaptureForm(id, locale)` signature identical in Task 3 and Task 5. ✅
- `handleLeadCapture(request, env)` identical in Task 2 definition, test, and `index.ts` route. ✅
- `event_leads` 11-column order in Task 1 DDL matches the positional `INSERT … VALUES (?×11)` in Task 2. ✅
- `getDictionary(locale).capture` keys defined in Task 4 match exactly the keys read by `<CaptureForm>` in Task 5 (`nameLabel, emailLabel, phoneLabel, cityLabel, cityPlaceholder, messageLabel, submitting, errorMessage`). ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-23-capture-form-leads.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?
