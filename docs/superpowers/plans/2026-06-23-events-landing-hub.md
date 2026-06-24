# Events Landing on Hub (slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up a public events surface on the hub (`mamaev.coach`) — an events index plus one per-event landing (`retreat-inner-evolution`) hosting a lead-capture form that posts to the existing `/api/leads/capture` worker.

**Architecture:** The hub is a Next.js static export (`output: 'export'`, `trailingSlash: true`). Event content is a typed bilingual config in `hub/lib/events.ts`; pages read it. A self-contained client capture form posts a relative `/api/leads/capture`, reaching the worker via a new additive apex route `mamaev.coach/api/*`. `SiteHeader` is rendered globally in `app/layout.tsx`, so pages are just `<main>` shells.

**Tech Stack:** Next.js 16 (App Router, static export), React, TypeScript, vitest 4. Cloudflare Worker `tochka-sborki-api` (D1) — unchanged except a wrangler route.

## Global Constraints

- **Authenticity boundary (binding):** NO countdown timers, NO scarcity copy ("only N seats left"), NO artificial urgency, NO fabricated/glossy testimonials. Dates are prose ("осень 2026, даты уточняются" / "Fall 2026, dates TBA"), never a ticking deadline.
- **Consent required; honeypot retained.** The capture form's consent checkbox gates submit; the off-screen `company` honeypot field is posted and dropped server-side.
- **Static export:** every dynamic route (`[slug]`) MUST export `generateStaticParams()`. No server-only APIs in pages.
- **Lead tag stability:** the seeded event's `capture.event` MUST be the string `'retreat-inner-evolution'` so hub leads share the existing `event_leads` taxonomy.
- **Bilingual:** every user-facing string exists in `ru` and `en`.
- **hub idiom:** pages render a bare `<main>` (the global `SiteHeader` from `app/layout.tsx` supplies the header — do NOT import a `Nav`). Tests use `import { describe, it, expect } from 'vitest'`.
- **Worker migrations/secrets are out of scope** — this slice touches only `workers/wrangler.toml` (a route), no worker source, no D1 schema.
- All git commands run from the repo root `/c/telo/Efforts/Ongoing/mc_hub`. Trunk-based on `main`.

---

### Task 1: Apex worker route

**Files:**
- Modify: `workers/wrangler.toml`

**Interfaces:**
- Consumes: nothing.
- Produces: a second worker route so `mamaev.coach/api/*` (the hub apex) reaches `tochka-sborki-api`. No code symbol; downstream tasks rely on the relative `/api/leads/capture` resolving from the hub origin at runtime (activated on the next worker deploy — an ops step, not part of this task).

This task is infra-only: no worker source changes, so the worker test suite must stay green unchanged. We verify that adding the route did not break parsing or tests.

- [ ] **Step 1: Read the current routes block**

Run: `grep -nA3 "\[\[routes\]\]" workers/wrangler.toml`
Expected: one route block:
```toml
[[routes]]
pattern = "ai.mamaev.coach/api/*"
zone_name = "mamaev.coach"
```

- [ ] **Step 2: Add the additive apex route**

In `workers/wrangler.toml`, immediately after the existing `[[routes]]` block, add a second one. The file should then contain both:

```toml
[[routes]]
pattern = "ai.mamaev.coach/api/*"
zone_name = "mamaev.coach"

[[routes]]
pattern = "mamaev.coach/api/*"
zone_name = "mamaev.coach"
```

Do not change any other line.

- [ ] **Step 3: Confirm the worker suite is unaffected**

Run: `cd workers && npx vitest run src/`
Expected: PASS — the full suite green (no test references the route table; this confirms the edit broke nothing).

- [ ] **Step 4: Commit**

```bash
git add workers/wrangler.toml
git commit -m "feat(workers): add apex mamaev.coach/api/* route for hub capture POST"
```

---

### Task 2: Event data layer (`hub/lib/events.ts`)

**Files:**
- Create: `hub/lib/events.ts`
- Test: `hub/lib/events.test.ts`

**Interfaces:**
- Consumes: `Locale` from `hub/lib/dictionaries.ts` (existing — `export type Locale = 'ru' | 'en'`).
- Produces:
  - `interface CaptureFormConfig { event: string; heading: string; blurb: string; cities: string[]; phoneJustification: string; consentLabel: string; cta: string; successMessage: string }`
  - `interface EventConfig { slug: string; format: string; eyebrow: string; title: string; summary: string; locationLabel: string; whenLabel: string; facilitator: string; whatToExpect: string[]; capture: CaptureFormConfig }`
  - `const EVENTS: Record<string, Record<Locale, EventConfig>>` (exported, so pages can call `Object.keys(EVENTS)` for `generateStaticParams`)
  - `function getEvent(slug: string, locale: Locale): EventConfig | null`
  - `function listEvents(locale: Locale): EventConfig[]`

- [ ] **Step 1: Write the failing test**

Create `hub/lib/events.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getEvent, listEvents, EVENTS } from './events'

describe('getEvent', () => {
  it('returns the seeded retreat config in ru and en', () => {
    const ru = getEvent('retreat-inner-evolution', 'ru')
    const en = getEvent('retreat-inner-evolution', 'en')
    expect(ru).not.toBeNull()
    expect(en).not.toBeNull()
    expect(ru!.slug).toBe('retreat-inner-evolution')
    expect(en!.slug).toBe('retreat-inner-evolution')
  })

  it('returns null for an unknown slug', () => {
    expect(getEvent('nope', 'ru')).toBeNull()
  })
})

describe('listEvents', () => {
  it('returns a non-empty array per locale', () => {
    expect(listEvents('ru').length).toBeGreaterThan(0)
    expect(listEvents('en').length).toBeGreaterThan(0)
  })
})

describe('seeded retreat content (both locales)', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: lead tag, consent, cta, expectations are present`, () => {
      const e = getEvent('retreat-inner-evolution', locale)!
      expect(e.capture.event).toBe('retreat-inner-evolution')
      expect(e.capture.consentLabel.length).toBeGreaterThan(0)
      expect(e.capture.cta.length).toBeGreaterThan(0)
      expect(e.whatToExpect.length).toBeGreaterThan(0)
    })
  }
})

describe('EVENTS shape', () => {
  it('every slug key matches its config slug in both locales', () => {
    for (const slug of Object.keys(EVENTS)) {
      expect(EVENTS[slug].ru.slug).toBe(slug)
      expect(EVENTS[slug].en.slug).toBe(slug)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd hub && npx vitest run lib/events.test.ts`
Expected: FAIL — `Failed to resolve import './events'`.

- [ ] **Step 3: Write the implementation**

Create `hub/lib/events.ts`. The `capture` sub-config ports the de-hustled copy from `LMS/tochka-sborki/web/lib/content/capture-forms.ts`; the landing prose (`eyebrow`/`title`/`summary`/`locationLabel`/`whenLabel`/`facilitator`/`whatToExpect`) is authored here, honoring the authenticity boundary (prose dates, no scarcity).

```ts
import type { Locale } from '@/lib/dictionaries'

export interface CaptureFormConfig {
  /** Lead tag stored on the row; matches the LMS-web capture id so both surfaces share the taxonomy. */
  event: string
  heading: string
  blurb: string
  /** City <select> options. Empty array → free-text city input. */
  cities: string[]
  /** Transparent reason the optional phone field is asked (shown beneath it). */
  phoneJustification: string
  consentLabel: string
  cta: string
  successMessage: string
}

export interface EventConfig {
  slug: string
  /** A label, e.g. "Ретрит" — never a countdown. */
  format: string
  eyebrow: string
  title: string
  summary: string
  /** Prose location, e.g. "Нашвилл · Остин · онлайн". */
  locationLabel: string
  /** Prose timing, e.g. "Осень 2026, даты уточняются" — NOT a deadline. */
  whenLabel: string
  facilitator: string
  /** Prose bullets — what the event offers. */
  whatToExpect: string[]
  capture: CaptureFormConfig
}

const EVENTS: Record<string, Record<Locale, EventConfig>> = {
  'retreat-inner-evolution': {
    ru: {
      slug: 'retreat-inner-evolution',
      format: 'Ретрит',
      eyebrow: 'Оффлайн-ретрит',
      title: 'Внутренняя эволюция',
      summary:
        'Несколько дней вдали от шума — чтобы собрать себя и свою практику с ИИ заново, в кругу тех, кто идёт тем же путём.',
      locationLabel: 'Нашвилл · Остин · Сан-Франциско · онлайн-формат',
      whenLabel: 'Осень 2026, даты уточняются',
      facilitator: 'Александр Мамаев',
      whatToExpect: [
        'Тихое пространство и время подумать — без спешки и инфошума.',
        'Практика с ИИ-инструментами руками, а не в теории.',
        'Маленькая группа единомышленников: живой разговор и обратная связь.',
        'Личный план: с чем ты приходишь и с чем уезжаешь.',
      ],
      capture: {
        event: 'retreat-inner-evolution',
        heading: 'Интерес к ретриту «Внутренняя эволюция»',
        blurb:
          'Оставь контакты — расскажем о ближайших датах и городах, без спама и давления. Отпишешься в один клик в любой момент.',
        cities: ['Нашвилл', 'Остин', 'Сан-Франциско', 'Онлайн'],
        phoneJustification:
          'Телефон по желанию — для ретритов и когорт нужен личный контакт, не только письмо. Можно оставить только email.',
        consentLabel:
          'Согласен(на) на обработку контактов, чтобы получать информацию об этом событии.',
        cta: 'Оставить заявку',
        successMessage: '✓ Спасибо! Мы на связи — напишем о датах и деталях.',
      },
    },
    en: {
      slug: 'retreat-inner-evolution',
      format: 'Retreat',
      eyebrow: 'Offline retreat',
      title: 'Inner Evolution',
      summary:
        'A few days away from the noise — to reassemble yourself and your AI practice, among people walking the same path.',
      locationLabel: 'Nashville · Austin · San Francisco · online format',
      whenLabel: 'Fall 2026, dates TBA',
      facilitator: 'Alexander Mamaev',
      whatToExpect: [
        'Quiet space and time to think — no rush, no information noise.',
        'Hands-on practice with AI tools, not theory.',
        'A small group of peers: real conversation and feedback.',
        'A personal plan: what you arrive with and what you leave with.',
      ],
      capture: {
        event: 'retreat-inner-evolution',
        heading: 'Interest in the "Inner Evolution" retreat',
        blurb:
          'Leave your details — we will share upcoming dates and cities. No spam, no pressure. Unsubscribe anytime in one click.',
        cities: ['Nashville', 'Austin', 'San Francisco', 'Online'],
        phoneJustification:
          'Phone is optional — retreats and cohorts need personal contact, not just email. You can leave email only.',
        consentLabel:
          'I consent to my contact details being processed to receive information about this event.',
        cta: 'Register interest',
        successMessage: '✓ Thank you! We will be in touch with dates and details.',
      },
    },
  },
}

export { EVENTS }

export function getEvent(slug: string, locale: Locale): EventConfig | null {
  return EVENTS[slug]?.[locale] ?? null
}

export function listEvents(locale: Locale): EventConfig[] {
  return Object.keys(EVENTS).map((slug) => EVENTS[slug][locale])
}
```

> Note on the `@/lib/...` import: confirm `hub/tsconfig.json` maps `@/*` to the hub root (the existing `capture-form.tsx` you port in Task 4 and other hub files use `@/`). If hub uses relative imports instead, use `import type { Locale } from './dictionaries'`. Check with: `grep -n '"@/\*"\|paths' hub/tsconfig.json`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd hub && npx vitest run lib/events.test.ts`
Expected: PASS — all four describe blocks green.

- [ ] **Step 5: Commit**

```bash
git add hub/lib/events.ts hub/lib/events.test.ts
git commit -m "feat(hub): event data layer + seeded retreat-inner-evolution"
```

---

### Task 3: `capture` dictionary block (`hub/lib/dictionaries.ts`)

**Files:**
- Modify: `hub/lib/dictionaries.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: a `capture` block on the hub `Dictionary` so the ported form (Task 4) can call `getDictionary(locale).capture`. Eight keys: `nameLabel`, `emailLabel`, `phoneLabel`, `cityLabel`, `cityPlaceholder`, `messageLabel`, `submitting`, `errorMessage`. Values mirror `LMS/tochka-sborki/web/lib/dictionaries.ts`.

- [ ] **Step 1: Write the failing test**

Create `hub/lib/dictionaries.capture.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getDictionary } from './dictionaries'

describe('capture dictionary block', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: has all eight non-empty capture labels`, () => {
      const c = getDictionary(locale).capture
      for (const k of [
        'nameLabel', 'emailLabel', 'phoneLabel', 'cityLabel',
        'cityPlaceholder', 'messageLabel', 'submitting', 'errorMessage',
      ] as const) {
        expect(c[k].length).toBeGreaterThan(0)
      }
    })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd hub && npx vitest run lib/dictionaries.capture.test.ts`
Expected: FAIL — TypeScript/runtime error: `capture` does not exist on the dictionary.

- [ ] **Step 3: Add the `capture` block**

In `hub/lib/dictionaries.ts`:

First, extend the `Dictionary` interface (add this member alongside the existing ones):

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

Then add the block to the **ru** dictionary object:

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

And to the **en** dictionary object:

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

> If the hub dictionary objects are built differently (e.g. one `Record<Locale, Dictionary>` literal), place each `capture` block inside the matching locale object. Locate the two locale objects with: `grep -n "tagline:" hub/lib/dictionaries.ts` (each locale block sets `tagline`).

- [ ] **Step 4: Run test to verify it passes**

Run: `cd hub && npx vitest run lib/dictionaries.capture.test.ts`
Expected: PASS — both locales green.

- [ ] **Step 5: Commit**

```bash
git add hub/lib/dictionaries.ts hub/lib/dictionaries.capture.test.ts
git commit -m "feat(hub): capture dictionary block (ru + en)"
```

---

### Task 4: Ported capture form (`hub/components/capture-form.tsx`)

**Files:**
- Create: `hub/components/capture-form.tsx`

**Interfaces:**
- Consumes: `CaptureFormConfig` from `@/lib/events` (Task 2); `getDictionary`, `Locale` from `@/lib/dictionaries`; the `capture` dict block (Task 3).
- Produces: `export function CaptureForm({ config, locale }: { config: CaptureFormConfig; locale?: Locale }): JSX.Element` — a `'use client'` component that POSTs a relative `/api/leads/capture`.

This is a behavior-preserving port of `LMS/tochka-sborki/web/components/capture-form.tsx`. The form is presentational + a single fetch; it has no unit test (the data layer carries the logic tests, mirroring how LMS web left this component untested). Verification is a typecheck/build.

- [ ] **Step 1: Create the component**

Create `hub/components/capture-form.tsx` with the exact content below (the import paths point at the hub's `@/lib/events` and `@/lib/dictionaries`):

```tsx
'use client'

import { useState } from 'react'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import type { CaptureFormConfig } from '@/lib/events'

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

- [ ] **Step 2: Verify it typechecks (suite stays green)**

Run: `cd hub && npx vitest run`
Expected: PASS — the full hub suite (site, events, capture-dict) stays green; the new file compiles under vitest's esbuild transform (imports resolve).

- [ ] **Step 3: Commit**

```bash
git add hub/components/capture-form.tsx
git commit -m "feat(hub): port capture form (relative /api/leads/capture POST)"
```

---

### Task 5: Events index pages + home entry-point

**Files:**
- Create: `hub/app/events/page.tsx`
- Create: `hub/app/en/events/page.tsx`
- Modify: `hub/components/home-page.tsx` (add the `/events/` link)

**Interfaces:**
- Consumes: `listEvents`, `EventConfig` from `@/lib/events` (Task 2).
- Produces: static routes `/events/` (ru) and `/en/events/` (en); a hero link from the home page to events.

The `SiteHeader` is global (in `app/layout.tsx`), so these pages render a bare `<main>`. No `Nav` import. The index lists events as cards linking to `/events/<slug>/` (en: `/en/events/<slug>/`). No scarcity copy.

- [ ] **Step 1: Create the ru index page**

Create `hub/app/events/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { listEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'События — Александр Мамаев',
  description: 'Оффлайн-ретриты, буткемпы и воркшопы.',
}

export default function Page() {
  const events = listEvents('ru')
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        События
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>Живые встречи</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Оффлайн-ретриты и воркшопы — небольшие группы, живой разговор, прикладная практика.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {events.map((e) => (
          <li key={e.slug}>
            <Link href={`/events/${e.slug}/`} style={{
              display: 'block',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              padding: '1.5rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-accent)' }}>
                {e.format}
              </span>
              <h2 style={{ margin: '0.4rem 0', color: 'var(--text-primary)' }}>{e.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>{e.summary}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: 0 }}>
                {e.locationLabel} · {e.whenLabel}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Create the en index page**

Create `hub/app/en/events/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { listEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'Events — Alexander Mamaev',
  description: 'Offline retreats, bootcamps, and workshops.',
}

export default function Page() {
  const events = listEvents('en')
  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        Events
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>Live gatherings</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
        Offline retreats and workshops — small groups, real conversation, hands-on practice.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {events.map((e) => (
          <li key={e.slug}>
            <Link href={`/en/events/${e.slug}/`} style={{
              display: 'block',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-secondary)',
              padding: '1.5rem',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-accent)' }}>
                {e.format}
              </span>
              <h2 style={{ margin: '0.4rem 0', color: 'var(--text-primary)' }}>{e.title}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0 }}>{e.summary}</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.75rem', marginBottom: 0 }}>
                {e.locationLabel} · {e.whenLabel}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 3: Add the home-page entry-point link**

In `hub/components/home-page.tsx`, the hero (around line 64) has a `<p style={{ marginTop: '2rem' }}>` wrapping a single blog anchor:

```tsx
        <p style={{ marginTop: '2rem' }}>
          <a href="/blog/" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--text-accent)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            → Блог
          </a>
        </p>
```

**Leave the blog anchor exactly as-is** — its `href="/blog/"` and `→ Блог` label are intentionally shared across locales (the blog is Russian-first, served at `mamaev.coach/blog/*`; there is no `/en/blog/`). Only two changes: add `display: 'flex', gap: '1.5rem'` to the wrapping `<p>`, and add a second, locale-aware events anchor after the blog one (events routes ARE locale-split, so this one uses the `locale` ternary). Result:

```tsx
        <p style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
          <a href="/blog/" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--text-accent)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            → Блог
          </a>
          <a href={locale === 'en' ? '/en/events/' : '/events/'} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--text-accent)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            {locale === 'en' ? '→ Events' : '→ События'}
          </a>
        </p>
```

The `locale` prop is already in scope (`HomePage({ locale })`). Do not change the blog anchor's href or label.

- [ ] **Step 4: Verify the suite + static build**

Run: `cd hub && npx vitest run && npm run build`
Expected: vitest PASS; `next build` succeeds and emits `out/events/index.html` and `out/en/events/index.html`.

Confirm with: `ls hub/out/events/index.html hub/out/en/events/index.html`
Expected: both files exist.

- [ ] **Step 5: Commit**

```bash
git add hub/app/events/page.tsx hub/app/en/events/page.tsx hub/components/home-page.tsx
git commit -m "feat(hub): events index pages + home entry-point link"
```

---

### Task 6: Per-event landing pages

**Files:**
- Create: `hub/app/events/[slug]/page.tsx`
- Create: `hub/app/en/events/[slug]/page.tsx`

**Interfaces:**
- Consumes: `getEvent`, `EVENTS` from `@/lib/events` (Task 2); `CaptureForm` from `@/components/capture-form` (Task 4).
- Produces: static routes `/events/<slug>/` (ru) and `/en/events/<slug>/` (en), pre-rendered for every key in `EVENTS`.

`generateStaticParams()` is mandatory (static export). Unknown slug → `notFound()`. The page renders hero + details + "what to expect" + the capture form.

- [ ] **Step 1: Create the ru landing page**

Create `hub/app/events/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaptureForm } from '@/components/capture-form'
import { getEvent, EVENTS } from '@/lib/events'

export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEvent(slug, 'ru')
  if (!e) return { title: 'Событие — Александр Мамаев' }
  return { title: `${e.title} — ${e.format}`, description: e.summary }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEvent(slug, 'ru')
  if (!e) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        {e.eyebrow}
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>{e.title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>{e.summary}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: '2rem 0', fontSize: '0.9rem' }}>
        <dt style={{ color: 'var(--text-secondary)' }}>Формат</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.format}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Где</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.locationLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Когда</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.whenLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Ведёт</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.facilitator}</dd>
      </dl>

      <h2 style={{ fontSize: '1.1rem' }}>Что будет</h2>
      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', marginBottom: '2.5rem' }}>
        {e.whatToExpect.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <CaptureForm config={e.capture} locale="ru" />
    </main>
  )
}
```

- [ ] **Step 2: Create the en landing page**

Create `hub/app/en/events/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CaptureForm } from '@/components/capture-form'
import { getEvent, EVENTS } from '@/lib/events'

export function generateStaticParams() {
  return Object.keys(EVENTS).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEvent(slug, 'en')
  if (!e) return { title: 'Event — Alexander Mamaev' }
  return { title: `${e.title} — ${e.format}`, description: e.summary }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e = getEvent(slug, 'en')
  if (!e) notFound()

  return (
    <main style={{ maxWidth: '42rem', margin: '0 auto', padding: '4rem 1.5rem' }}>
      <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0, fontSize: '0.75rem' }}>
        {e.eyebrow}
      </p>
      <h1 style={{ marginTop: '0.5rem' }}>{e.title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', lineHeight: 1.6 }}>{e.summary}</p>

      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem 1.5rem', margin: '2rem 0', fontSize: '0.9rem' }}>
        <dt style={{ color: 'var(--text-secondary)' }}>Format</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.format}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Where</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.locationLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>When</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.whenLabel}</dd>
        <dt style={{ color: 'var(--text-secondary)' }}>Host</dt><dd style={{ margin: 0, color: 'var(--text-primary)' }}>{e.facilitator}</dd>
      </dl>

      <h2 style={{ fontSize: '1.1rem' }}>What to expect</h2>
      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.2rem', marginBottom: '2.5rem' }}>
        {e.whatToExpect.map((item, i) => <li key={i}>{item}</li>)}
      </ul>

      <CaptureForm config={e.capture} locale="en" />
    </main>
  )
}
```

> Next.js 16 App Router passes `params` as a Promise — the `await params` form above is correct for this codebase. If the hub's other dynamic routes (if any) use the sync `params` shape, match them instead: `grep -rn "params" hub/app --include=page.tsx`.

- [ ] **Step 3: Verify the suite + static build emits both landings**

Run: `cd hub && npx vitest run && npm run build`
Expected: vitest PASS; `next build` succeeds.

Confirm with: `ls hub/out/events/retreat-inner-evolution/index.html hub/out/en/events/retreat-inner-evolution/index.html`
Expected: both files exist (proves `generateStaticParams` pre-rendered the route in both locales).

- [ ] **Step 4: Commit**

```bash
git add hub/app/events/[slug]/page.tsx hub/app/en/events/[slug]/page.tsx
git commit -m "feat(hub): per-event landing pages with capture form"
```

---

## Ops (post-merge, gated on owner)

- Push to `main` → CI deploys hub (Cloudflare Pages `mamaev-coach-hub`) and the worker. The worker deploy activates the new `mamaev.coach/api/*` route.
- Smoke: `POST https://mamaev.coach/api/leads/capture` with a consented test payload (`{ email, consent: true, event: 'retreat-inner-evolution', locale: 'ru' }`) → expect `200 { ok: true }` and a new row in D1 `event_leads`. Verify via the cloudflare-bindings MCP `d1_database_query` (`SELECT * FROM event_leads WHERE event = 'retreat-inner-evolution' ORDER BY created_at DESC LIMIT 1`).
- Visit `https://mamaev.coach/events/` and `https://mamaev.coach/events/retreat-inner-evolution/` to confirm the surface renders.

## Out of scope (epic, later slices)

- Structured schedule schema (Day-0 kickoff, sessions/objectives/break-outs).
- Paid ticketing / checkout (`fb_c20c437f`) and booking bridge (`fb_57c6302d436f`).
- Multi-umbrella / S.A.S.H.A reuse of the events surface.
- Additional event instances beyond the seeded retreat.
- Admin view for event landings (mirror `/admin/leads` later).
