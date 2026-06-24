# Events landing on hub (slice 1) — Design

**Ticket:** `fb_8d2e32ceff62` (Events calendar + per-event landing page — retreats,
bootcamps, workshops). This design carves **slice 1** of that epic.

**Date:** 2026-06-23

## Goal

Stand up a public event-landing surface on the hub (`mamaev.coach`): an events index
plus one per-event landing page (the already-seeded `retreat-inner-evolution` retreat).
The landing hosts a lead-capture form that posts to the existing
`/api/leads/capture` worker endpoint, giving that endpoint a live home on the hub and
giving the retreat a real page. Courses stay free; the retreat is a paid service, but
slice 1 captures *interest* (a lead), not payment.

## Scope decisions (these carve the slice out of the epic)

- **Placement: hub (`mamaev.coach`), per the ticket** ("the public surface lives on
  hub", reusable across umbrellas). The hub is currently a minimal landing (home only,
  no MDX, no capture form), so this slice ports a self-contained capture form and an
  event-data config into the hub. The LMS-web `<CaptureFormBlock>` stays registered for
  future in-course MDX use; this slice does not consume it.
- **Capture POST: apex worker route.** The worker `tochka-sborki-api` is routed only on
  `ai.mamaev.coach/api/*`. The hub is `mamaev.coach` (apex), so a relative
  `POST /api/leads/capture` from the hub would not reach the worker. We add an additive
  worker route `mamaev.coach/api/*` (zone `mamaev.coach`). The capture form then uses the
  **same relative path** as LMS web — no form change, no CORS, no preflight. The worker
  code is unchanged; only `wrangler.toml` gains a route, and the worker is redeployed.
  hub and blog do not use `/api/*`, so the additive route does not collide.
- **Slice 1 = events index (a list) + one per-event landing + a ported capture form.**
  One seeded event: `retreat-inner-evolution`.
- **Schedule is prose, not a structured schema.** A short "what to expect" bullet list
  only. The Day-0 / sessions / objectives / break-out structured schedule is epic
  slice 3, out of scope here.
- **No paid ticketing in slice 1.** Interest capture (a lead) only. Checkout
  (`fb_c20c437f`) and the booking bridge (`fb_57c6302d436f`) are deferred.

## Authenticity boundary (binding, verbatim constraint)

Event landings MUST NOT use countdown timers, scarcity copy ("only N seats left"),
artificial urgency, or fabricated/glossy testimonials. Dates are stated as prose
("осень 2026, даты уточняются" / "Fall 2026, dates TBA"), not as a ticking deadline.
The consent checkbox is required; the honeypot field is retained.

## Architecture

The hub is a static export (`output: 'export'`, `trailingSlash: true`,
`images.unoptimized`). It has no MDX, so event content is a typed bilingual config in
`hub/lib/events.ts`; pages read it the way `app/store/page.tsx` reads
`buildStoreContent`. The capture form is a self-contained client component that posts a
relative `/api/leads/capture`, which reaches the worker via the new apex route. All
colors come from existing hub CSS variables (`themes/model-kit.css` already defines
`--bg-primary/secondary/surface`, `--text-primary/secondary/accent/on-accent`,
`--border-color`, `--crit`, `--font-mono`, `--radius` in dark + light).

## Components

### `workers/wrangler.toml` (modified)

Add an additive route beside the existing one:

```toml
[[routes]]
pattern = "ai.mamaev.coach/api/*"
zone_name = "mamaev.coach"

[[routes]]
pattern = "mamaev.coach/api/*"
zone_name = "mamaev.coach"
```

No worker source change. Worker test suite is unaffected. Validated at deploy by a
smoke `POST mamaev.coach/api/leads/capture`.

### `hub/lib/events.ts` (new)

Types and data. `CaptureFormConfig` mirrors the LMS-web shape so the ported form is a
drop-in:

```ts
import type { Locale } from '@/lib/dictionaries'

export interface CaptureFormConfig {
  event: string                 // lead tag; matches getCaptureForm id in LMS web
  heading: string
  blurb: string
  cities: string[]              // [] → free-text city input
  phoneJustification: string
  consentLabel: string
  cta: string
  successMessage: string
}

export interface EventConfig {
  slug: string
  format: string                // "Ретрит" / "Retreat" — a label, not a countdown
  eyebrow: string
  title: string
  summary: string
  locationLabel: string         // "Нашвилл · Остин · онлайн" prose
  whenLabel: string             // "Осень 2026, даты уточняются" prose, NOT a deadline
  facilitator: string
  whatToExpect: string[]        // prose bullets
  capture: CaptureFormConfig
}

const EVENTS: Record<string, Record<Locale, EventConfig>> = {
  'retreat-inner-evolution': {
    ru: { /* seeded — ported de-hustled copy from LMS web capture-forms.ts + landing prose */ },
    en: { /* … */ },
  },
}

export function getEvent(slug: string, locale: Locale): EventConfig | null {
  return EVENTS[slug]?.[locale] ?? null
}

export function listEvents(locale: Locale): EventConfig[] {
  return Object.keys(EVENTS).map((slug) => EVENTS[slug][locale])
}
```

The `capture` sub-config reuses the existing de-hustled retreat copy (heading, blurb,
cities `['Нашвилл','Остин','Сан-Франциско','Онлайн']`, phoneJustification, consentLabel,
cta, successMessage) so leads land with the same `event: 'retreat-inner-evolution'` tag.

### `hub/components/capture-form.tsx` (new, `'use client'`)

Ported verbatim-in-behavior from `LMS/tochka-sborki/web/components/capture-form.tsx`:
name/email(required)/phone(optional + justification)/city(select-or-free-text)/message,
required consent gating submit, off-screen honeypot `company`, POST relative
`/api/leads/capture` with `{ name, email, phone, city, message, consent, company,
event: config.event, locale }`, success/error states. Imports `CaptureFormConfig` from
`@/lib/events` and the `capture` dictionary block. Uses the hub CSS variables (all
present).

### `hub/lib/dictionaries.ts` (modified)

Add a `capture` block to `Dictionary` and to both locales:

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

ru + en values mirror the LMS-web `capture` block.

### `hub/app/events/page.tsx` + `hub/app/en/events/page.tsx` (new)

Events index. `metadata` (title/description). Renders eyebrow + title + lead, then a
list of cards from `listEvents(locale)`: format badge, title, summary, location/when
prose, link to `/events/<slug>/` (en: `/en/events/<slug>/`). Same `<Nav>`/`<main>`
shell and inline-style idiom as `app/store/page.tsx`. No scarcity copy.

### `hub/app/events/[slug]/page.tsx` + `hub/app/en/events/[slug]/page.tsx` (new)

Per-event landing.

- `export function generateStaticParams()` → `Object.keys(EVENTS).map((slug) => ({ slug }))`
  (required for `output: 'export'` dynamic routes).
- `export function generateMetadata({ params })` → title/description from the event
  (calls `getEvent`; falls back to a generic title if missing).
- Page: `getEvent(slug, locale)`; if `null` → `notFound()`. Otherwise hero (eyebrow,
  title, summary), a details block (format, locationLabel, whenLabel, facilitator), a
  "what to expect" list (`whatToExpect`), and `<CaptureForm config={event.capture}
  locale={locale} />`.

### hub home page Events entry point (modified)

Add a single locale-aware link to `/events/` (en: `/en/events/`) from the hub **home
page** (`app/page.tsx` / `app/en/page.tsx`, or the `home-page.tsx` component they
render). The `site-header.tsx` is logo-only; adding nav there would change its layout,
so the entry point lives on the home page. Minimal — one anchor following the home
page's existing link idiom.

## Data flow

```
GET  mamaev.coach/events/                          → index (static)
GET  mamaev.coach/events/retreat-inner-evolution/  → landing (static) + CaptureForm
POST mamaev.coach/api/leads/capture { name?, email, phone?, city?, message?, consent,
                                      company(honeypot), event, locale }
   → apex worker route → handleLeadCapture (existing)
   → D1 event_leads insert + users upsert + ctx.waitUntil(addResendContact) → 200
```

The worker handler is unchanged; it already validates email + consent, drops honeypot
hits, and mirrors to Resend.

## Error handling

- Unknown event slug → `notFound()` (static 404).
- Capture POST non-2xx or network failure → the form shows its error state (existing
  behavior); no data assumed saved.
- Worker-side validation (bad email, missing consent, honeypot) is unchanged and already
  tested in `leads-capture.test.ts`.

## Testing

- **`hub/lib/events.test.ts` (new):** `getEvent('retreat-inner-evolution', 'ru')` and
  `'en'` return a config; `getEvent('nope', 'ru')` → `null`; `listEvents('ru')` returns a
  non-empty array; the seeded event's `capture.event === 'retreat-inner-evolution'` and
  `capture.consentLabel` / `capture.cta` are non-empty in both locales; `whatToExpect` is
  non-empty. (Logic lives only in the data layer; pages and the form are presentational,
  matching how LMS web left the form untested.)
- **Worker:** no code change → suite untouched. Run `cd workers && npx vitest run src/`
  once to confirm still green after the `wrangler.toml` route edit.
- **hub suite:** `cd hub && npx vitest run` must stay green (it already has
  `lib/site.test.ts`).

## Files

| File | Responsibility |
|---|---|
| `workers/wrangler.toml` | additive `mamaev.coach/api/*` route |
| `hub/lib/events.ts` | `EventConfig`/`CaptureFormConfig` types + `EVENTS` + `getEvent`/`listEvents` |
| `hub/lib/events.test.ts` | data-layer tests |
| `hub/components/capture-form.tsx` | ported client capture form (relative POST) |
| `hub/lib/dictionaries.ts` | `capture` block (8 keys) ru + en |
| `hub/app/events/page.tsx` | events index (ru) |
| `hub/app/en/events/page.tsx` | events index (en) |
| `hub/app/events/[slug]/page.tsx` | per-event landing (ru) + `generateStaticParams` |
| `hub/app/en/events/[slug]/page.tsx` | per-event landing (en) + `generateStaticParams` |
| hub header or home | one `/events/` entry-point link |

## Ops (post-merge, gated on owner)

- Deploy the worker so the new `mamaev.coach/api/*` route activates (push triggers CI;
  the route applies on the next worker deploy).
- Smoke: `POST https://mamaev.coach/api/leads/capture` with a test consented payload →
  expect 200 and a row in D1 `event_leads`.

## Out of scope (epic, later slices)

- Structured schedule schema (Day-0 kickoff, sessions/objectives/break-outs).
- Paid ticketing / checkout (`fb_c20c437f`) and booking bridge (`fb_57c6302d436f`).
- Multi-umbrella / S.A.S.H.A reuse of the events surface.
- Additional event instances beyond the seeded retreat.
- Admin view for event landings (mirror `/admin/leads` later).

## Notes

- The duplicated capture form (LMS web + hub) is intentional — each Next app is
  self-contained, and a shared package is overkill for one component (YAGNI). The
  `event` tag string keeps both surfaces feeding the same `event_leads` taxonomy.
