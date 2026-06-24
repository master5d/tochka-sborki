# Consent-first `<CaptureForm>` + `/api/leads/capture` — Design

**Ticket:** `fb_667daeba55b3` (event/retreat interest-capture form — consent-first:
name/email/optional-phone/city → CRM, tagged with event + city).

**Date:** 2026-06-23

**Arc note:** This is the buildable core of the former "B2 capture-form family" batch.
Honest triage split the batch: the **booking bridge** (`fb_57c6302d436f`) is deferred as a
full internal slots system (its own epic), and the **PLP generator** (`fb_8724dc87679d`) is
a different mechanic (intake→artifact, no form/endpoint) deferred to its own slice. This
spec covers only the event/retreat capture form.

## Goal

A reusable, consent-first interest-capture form: an inline (never a pop-up) form that a
visitor fills with name / email / optional phone / city / GDPR consent + one clear CTA, and
on submit persists a lead in D1 and mirrors the email to Resend — tagged with the event and
city of interest. Reusable as an engine component; seeded with one de-hustled retreat
config.

## Honest-triage findings (verified — these shaped the design)

- **No public lead-capture endpoint exists.** `users` + `addResendContact` (Resend mirror)
  + the admin-only `leads.ts` (`listLeads`/`syncContacts`) exist, but creating a lead
  currently only happens through authenticated paths (`/api/auth/send-link`,
  `/api/intake/submit`, `/api/alumni/optin`). An anonymous visitor has no capture path.
- **n8n is retired in this codebase.** `N8N_WEBHOOK_URL`/`SECRET` are referenced ONLY by
  the legacy `feedback.ts` handler; no other handler uses them and they are not in
  `wrangler.toml`. `crm.ts` documents the live model: **"D1 `users` = source of truth,
  Resend = secondary mirror."** So this design uses **direct D1 + Resend, no n8n.**
  (Spillover ticket `fb_df698341da2a` tracks migrating the legacy feedback handler off n8n —
  out of scope here.)
- **`users` has no rich columns** — only `id, email (unique), created_at, language, source,
  telegram_handle`. Since there is no n8n to forward rich fields to, name/phone/city/event
  need a real home in D1 → a dedicated `event_leads` table.

## Decisions locked during brainstorming

1. **Approach B — direct D1 + Resend, no n8n.** A new additive `event_leads` table stores
   the rich lead detail; the email is also upserted into `users` (the CRM source of truth,
   so the lead appears in the admin leads list + gets a Resend contact), carrying a
   `source` tag. This honors the ticket's "existing D1 users + Resend pipeline" literally
   and matches the modern direct-D1 pattern in `auth.ts`.
2. **Generic engine component + `lib/content` config + string-prop MDX wrapper** — the
   proven content-engine pattern (AnnotatedExample/WillWont/ModuleSurvey). The wrapper
   sidesteps the `next-mdx-remote@6` inline array/object prop limitation (the `cities`
   array cannot be passed inline in MDX).
3. **Consent-first / authenticity guards (sacred, from the ticket):** phone is OPTIONAL
   with a transparent justification; the form is **inline, never a modal/pop-up interrupt**;
   the GDPR consent checkbox is **required**; no scarcity, hype, or pressure copy. A
   honeypot field guards the public endpoint against bots.
4. **Seed one config** — a single de-hustled retreat (`retreat-inner-evolution`), RU+EN.
   The keyed/string-prop form makes adding events trivial.
5. Static-export safe; bilingual; one additive migration; no other server changes.

## Components

### `workers/migrations/0012_event_leads.sql` (new, additive)

```sql
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

Applied to prod via the cloudflare-api MCP `/query` (zero-token), not wrangler.

### `workers/src/handlers/leads-capture.ts` (new)

```ts
export async function handleLeadCapture(request: Request, env: Env): Promise<Response>
```

Flow:
1. Parse JSON; on failure → 400 `Invalid JSON`.
2. **Honeypot:** if the honeypot field (`company`) is non-empty → return `200 {ok:true}`
   WITHOUT any DB write or Resend call (silent bot no-op).
3. **Validation:** require a syntactically valid `email` (same regex idiom as `auth.ts`)
   and `consent === true`. Missing/invalid email → 400 `Valid email required`; missing
   consent → 400 `Consent required`.
4. `INSERT INTO event_leads (id, name, email, phone, city, event, message, consent_at,
   source, language, created_at)` with `id = crypto.randomUUID()`, `consent_at`/`created_at`
   = `Math.floor(Date.now()/1000)`, `source = 'capture:' + (event ?? 'general')`.
5. **Upsert `users`:** `SELECT id FROM users WHERE email = ?`; if absent, `INSERT INTO users
   (id, email, created_at, language, source, telegram_handle) VALUES (?, ?, ?, ?, ?, NULL)`
   with the same `source` tag (mirrors `auth.ts`). If present, leave the existing user row
   untouched (do not overwrite an account holder's source).
6. `await addResendContact(env, { email, language, source })` (best-effort; it already
   swallows its own errors).
7. Return `200 {ok:true}`.

`event`, `name`, `phone`, `city`, `message`, `language` are all optional in the payload.
No n8n.

### `workers/src/handlers/leads-capture.test.ts` (new, env=node)

- valid full payload (`consent:true`, valid email) → 200; asserts an `INSERT INTO
  event_leads` call and an `INSERT INTO users` call were made.
- existing user email → 200; asserts `event_leads` insert happened but NO second `users`
  insert (upsert skip).
- missing `email` → 400.
- malformed `email` (`"nope"`) → 400.
- missing/false `consent` → 400.
- honeypot `company:'x'` filled → 200 with NO `event_leads` insert and NO `users` insert.

Uses the same `makeDb`/`DbCall` mock harness as `auth.test.ts`/`feedback.test.ts`.

### `workers/src/index.ts` (modified)

Add a route branch: `else if (path === '/api/leads/capture' && method === 'POST') {
return handleLeadCapture(request, env) }`, alongside the existing `/api/feedback` branch.

### `lib/content/capture-forms.ts` (new)

```ts
export interface CaptureFormConfig {
  event: string                 // tag, e.g. 'retreat-inner-evolution'
  heading: string
  blurb: string
  cities: string[]              // city <select> options; [] → free-text city input
  phoneJustification: string    // transparent reason phone is asked (optional field)
  consentLabel: string          // GDPR consent checkbox copy
  cta: string
  successMessage: string
}
export function getCaptureForm(id: string, locale: Locale): CaptureFormConfig | null
```

`CAPTURE_FORMS: Record<string, Record<Locale, CaptureFormConfig>>` seeded with one
`retreat-inner-evolution` entry (RU+EN), de-hustled (no scarcity/hype). `getCaptureForm`
returns `null` for an unknown id.

### `lib/content/capture-forms.test.ts` (new, env=node)

- `getCaptureForm('retreat-inner-evolution','ru')` and `'en'` return non-null with all
  fields non-empty.
- `getCaptureForm('nope','ru')` returns `null`.
- ru config differs from en (`heading` ru ≠ en).

### `components/capture-form.tsx` (new, `'use client'`)

```tsx
export function CaptureForm({ config, locale }: { config: CaptureFormConfig; locale: Locale }): React.JSX.Element
```

- State: `name, email, phone, city, message, consent, company(honeypot)` + `status`
  (`idle|loading|success|error`).
- Renders an inline `<section>` (NOT a modal): heading, blurb, fields — name (text),
  email (email, required), phone (tel, optional) with the `phoneJustification` shown beneath
  it, city (`<select>` from `config.cities`, or text input if `cities` is empty), an
  optional message `<textarea>`, a **required** consent `<input type=checkbox>` with
  `config.consentLabel`, and one submit button (`config.cta`).
- A visually-hidden honeypot input named `company` (`aria-hidden`, `tabIndex=-1`,
  off-screen) — real users never fill it.
- `handleSubmit`: POST `/api/leads/capture` with `{ name, email, phone, city,
  event: config.event, message, consent, company, locale }`; on `res.ok` → success state
  (`config.successMessage`); else → error (`t.errorMessage` from the shared dictionary).
- All CSS vars; reuses the `feedback-form.tsx` styling idiom (mono labels, surface inputs,
  accent button). Submit disabled while loading and while `!consent`.

### `components/capture-form-block.tsx` (new — string-prop MDX wrapper)

```tsx
export function CaptureFormBlock({ id, locale }: { id: string; locale?: Locale }): React.JSX.Element | null
```

`getCaptureForm(id, locale ?? 'ru')` → if null, render `null`; else `<CaptureForm
config locale />`. Registered in `components/mdx-components.tsx`, usable as
`<CaptureFormBlock id="retreat-inner-evolution" locale="ru" />`.

### `lib/dictionaries.ts` (modified)

Add a small shared `capture` block (ru+en) for the field labels not carried by per-event
config: `nameLabel`, `emailLabel`, `phoneLabel`, `cityLabel`, `messageLabel`, `submitting`,
`errorMessage`. (Per-event copy — heading/blurb/consent/cta/success — lives in
`capture-forms.ts`.)

## Data flow

```
event/landing page or MDX → <CaptureFormBlock id locale/>  (client)
  → POST /api/leads/capture { name,email,phone?,city,event,message?,consent,company,locale }
    → honeypot (company) filled?     → 200 {ok:true}  (no writes)
    → invalid email / !consent       → 400
    → INSERT event_leads (rich detail, source='capture:<event>')
    → upsert users (email; new row only) + addResendContact (Resend mirror)
    → 200 {ok:true} → success state
```

## Edge cases

- **Honeypot filled** → 200 with no writes (bots get a normal-looking success, no data).
- **Duplicate email** (same person, repeat interest) → a new `event_leads` row each time
  (interest history is legitimate); `users` upsert is a no-op for the existing account.
- **Resend down** → `addResendContact` swallows the error; the lead is still saved in D1
  (D1 is the source of truth) and the user sees success.
- **No `event`** (generic capture) → `source = 'capture:general'`, `event` column null.
- **Empty `cities`** → city renders as a free-text input instead of a `<select>`.
- **Malformed JSON / missing email / missing consent** → 400, nothing written.

## Testing

`workers/` (env=node, run `cd workers && npx vitest run src/`):
- `leads-capture.test.ts` — the six cases above.

`LMS/tochka-sborki/web` (run `cd LMS/tochka-sborki/web && npm test`):
- `capture-forms.test.ts` — config resolution.

`CaptureForm`, `CaptureFormBlock`, and the MDX registration are verified by a green
web `npm run build` (repo convention — UI is not unit-tested).

## Files

| File | Responsibility |
|---|---|
| `workers/migrations/0012_event_leads.sql` | additive `event_leads` table |
| `workers/src/handlers/leads-capture.ts` | public consent-first capture → D1 + Resend |
| `workers/src/handlers/leads-capture.test.ts` | handler validation + write assertions |
| `workers/src/index.ts` | route `POST /api/leads/capture` |
| `lib/content/capture-forms.ts` | `CaptureFormConfig` + keyed configs + `getCaptureForm` |
| `lib/content/capture-forms.test.ts` | config resolution tests |
| `components/capture-form.tsx` | inline consent-first form (`'use client'`) |
| `components/capture-form-block.tsx` | string-prop MDX wrapper |
| `components/mdx-components.tsx` | register `CaptureFormBlock` |
| `lib/dictionaries.ts` | shared capture field labels (ru+en) |

One additive migration; direct D1 + Resend; no n8n; reuses `users` + `addResendContact`.
~5 TDD tasks.

## Out of scope

- The **booking bridge** (`fb_57c6302d436f`) — deferred as a full internal slots epic.
- The **PLP generator** (`fb_8724dc87679d`) — deferred to its own intake-artifact slice.
- Migrating the legacy **feedback** handler off n8n (`fb_df698341da2a`) — separate ticket.
- An **admin surface** for `event_leads` (the existing `/admin/leads` reads `users`; a
  richer event-leads view is a follow-up, likely with the events calendar `fb_8d2e32ce`).
- The **events calendar / per-event landing pages** (`fb_8d2e32ce`) — this form is a
  building block that calendar will consume.
- **Rate limiting** beyond the honeypot (no infra for it yet; honeypot is the YAGNI guard).
