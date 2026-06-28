# Office-hours AMA bridge — Design

**Ticket:** `fb_57c6302d436f` (1:1 / office-hours booking bridge — free course → paid coaching).

**Date:** 2026-06-28

## Goal

Give a learner an honest bridge from inside the course to the author's **group AMA office-hours**
(1-to-many, "Ask Me Anything"), plus a light pointer to **1:1 mentorship** which lives separately
at `mentor.mamaev.coach`. This is the honest top of the brand ladder (free course → free group AMA
→ paid 1:1), not a funnel.

## Reframe (from the ticket's literal "1:1 booking")

The owner reframed office-hours from **1:1** to **1-to-many AMA** (group, free). The **1:1** is a
separate feature that already has its own home at `mentor.mamaev.coach` — in the course we only
add a clearly-marked external link to it, never an in-course booking/scheduler. This removes the
appointment-scheduler entirely: an AMA is a recurring group session a learner registers for, so
the "bridge" is a pure external link-out (the learn-with-AI handoff / hub-events precedent).

## Scope (carved by honest triage)

- **In scope:** an engine+data module + a thin display card on `/character` linking out to (a) the
  group AMA registration and (b) the 1:1 mentor site; plus two awareness nodes in the Connect
  pillar of the ecosystem diagram.
- **Out of scope (carved):**
  - The full **paid coach-program design** the triage reason bundles (the "5-Day APM Coaching
    Offer Builder" structure: nichification → milestones → format → session template → intake →
    policies) — a separate content/program epic.
  - Building any **scheduler / calendar / appointment-slot** UI (YAGNI — bridge to the external
    tool the AMA registration lives on).
  - **In-course payment** for the AMA (it is free) or for the 1:1 (handled on the mentor site).
  - **Async question-collection** (reuse of `/ask` + `questions`) — a possible later enhancement,
    not this slice; the chosen mechanic is the live registration link-out.
  - **alumni/matching** (`fb_7fdd9f891109`) — related funnel layer, separate ticket.

## Architecture

Pure engine + data, a thin presentational card, and two static data nodes in the ecosystem. Fully
static-export, **zero backend**. The AMA registration URL is a config constant (empty by default);
the AMA call-to-action renders only when it is set (the `VIDEO.url=null` / `REAL_CASES.length>0`
facade pattern), so the feature ships "ready/dark" and lights up when the owner creates the
recurring event. The 1:1 mentor link is always present (`mentor.mamaev.coach` is live).

## Component

### `lib/course/office-hours.ts` (new)

Follows the `ecosystem.ts` / `showcase.ts` engine+data pattern: a bilingual `RAW` constant + a
pure resolver.

```ts
import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface OfficeHoursData {
  amaRegisterUrl: string            // '' until the owner creates the recurring AMA event
  mentorUrl: string                 // 'https://mentor.mamaev.coach'
  eyebrow: Bi
  heading: Bi
  intro: Bi                         // what the AMA is (group, Ask-Me-Anything)
  amaCtaLabel: Bi
  cadenceNote: Bi                   // prose cadence, no countdown/scarcity
  oneToOneCtaLabel: Bi
  oneToOneBlurb: Bi
  honestNote: Bi                    // "the free course is complete; this is an optional next step"
}

export interface OfficeHoursVM {
  eyebrow: string
  heading: string
  intro: string
  ama: { available: boolean; registerUrl: string; ctaLabel: string; cadenceNote: string }
  oneToOne: { url: string; ctaLabel: string; blurb: string }
  honestNote: string
}

export const OFFICE_HOURS: OfficeHoursData = {
  amaRegisterUrl: '',
  mentorUrl: 'https://mentor.mamaev.coach',
  eyebrow: { ru: 'За пределами курса', en: 'Beyond the course' },
  heading: {
    ru: 'Открытый разбор (AMA) — спроси что угодно',
    en: 'Open AMA office-hours — ask me anything',
  },
  intro: {
    ru: 'Живая групповая встреча: приноси свои вопросы по агентам, стеку, застрявшим проектам — разбираем вместе, бесплатно.',
    en: 'A live group session: bring your questions about agents, your stack, stuck projects — we work through them together, free.',
  },
  amaCtaLabel: { ru: 'Записаться на разбор', en: 'Register for the AMA' },
  cadenceNote: {
    ru: 'Встречи проходят регулярно; ближайшую дату и формат увидишь на странице записи.',
    en: 'Sessions run regularly; you’ll see the next date and format on the registration page.',
  },
  oneToOneCtaLabel: { ru: 'Личная работа 1:1', en: 'Work 1:1' },
  oneToOneBlurb: {
    ru: 'Нужен разбор именно твоего случая? Личное наставничество — отдельно, на mentor.mamaev.coach.',
    en: 'Need a deep dive on your own case? 1:1 mentorship is separate, at mentor.mamaev.coach.',
  },
  honestNote: {
    ru: 'Курс самодостаточен и бесплатен — это опциональный следующий шаг, а не платный замок.',
    en: 'The course is complete and free — this is an optional next step, not a paywall.',
  },
}

export function resolveOfficeHours(data: OfficeHoursData, locale: Locale): OfficeHoursVM {
  const k: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  return {
    eyebrow: data.eyebrow[k],
    heading: data.heading[k],
    intro: data.intro[k],
    ama: {
      available: data.amaRegisterUrl.trim().length > 0,
      registerUrl: data.amaRegisterUrl,
      ctaLabel: data.amaCtaLabel[k],
      cadenceNote: data.cadenceNote[k],
    },
    oneToOne: { url: data.mentorUrl, ctaLabel: data.oneToOneCtaLabel[k], blurb: data.oneToOneBlurb[k] },
    honestNote: data.honestNote[k],
  }
}

export function getOfficeHours(locale: Locale): OfficeHoursVM {
  return resolveOfficeHours(OFFICE_HOURS, locale)
}
```

### `lib/course/office-hours.test.ts` (new)

- For ru + en: every VM string non-empty; `oneToOne.url === 'https://mentor.mamaev.coach'`.
- `resolveOfficeHours` with a fake `amaRegisterUrl` set → `ama.available === true` and
  `ama.registerUrl` echoes it; with `''` → `ama.available === false`.
- `getOfficeHours` (the shipped constant) → `ama.available === false` (dark by default).
- **De-hustle / anti-scarcity guard:** scan every VM string (both locales) — none matches
  `/(осталось|мест\b|countdown|limited|spots|hurry|только сегодня|last chance)/i`.
- **Honest-framing marker:** `honestNote` contains `бесплат` (ru) / `free` (en) AND `опционал`
  (ru) / `optional` (en) for its locale.

### `components/office-hours-card.tsx` (new)

Presentational component (no client state — plain function), chrome mirroring `CharterCard`
(`components/intake/charter-card.tsx`): a bordered card with eyebrow, heading, intro, the AMA CTA
(an external `<a target="_blank" rel="noopener noreferrer">`, rendered **only when**
`ama.available`), the cadence note (only when available), the 1:1 blurb + external link to
`oneToOne.url`, and the honest note as a muted line. Props: `{ locale: Locale }`; calls
`getOfficeHours(locale)`.

### `app/character/profile-client.tsx` (modified)

Import `OfficeHoursCard` and render `<OfficeHoursCard locale={locale} />` immediately after
`<CompanionSetup ... />` (the closing "beyond this course" step). No other change.

### `lib/course/ecosystem.ts` (modified)

Add two nodes to the **Connect** pillar's `nodes` array (additive; existing nodes byte-identical):

```ts
{ label: { ru: 'AMA office-hours', en: 'AMA office-hours' }, status: 'planned' },
{ label: { ru: '1:1 наставничество', en: '1:1 mentorship' }, status: 'live' },
```

`AMA office-hours` is `planned` (the recurring event is not live yet); `1:1 наставничество` is
`live` (`mentor.mamaev.coach` exists). The `getEcosystem` resolver is unchanged.

### `lib/course/ecosystem.test.ts` (extend)

Add one assertion: the Connect pillar's node labels (either locale) include `AMA office-hours` —
locking the delta. Existing tests stay green (still 3 ordered pillars, ≥1 planned node, bilingual).

## Data flow

Static. The card reads `getOfficeHours(locale)` at render; the ecosystem diagram reads
`getEcosystem(locale)`. No endpoint, no client state, no D1, no worker.

## Authenticity (binding)

- AMA is **free** — the honest top of the ladder; `honestNote` states the course is complete and
  free and this is optional, not a paywall (this is the anti-dependency lens made concrete).
- 1:1 is **paid and separate**, clearly on `mentor.mamaev.coach`; no in-course payment, no
  scheduler.
- **No scarcity / countdown / "N spots left" / glossy urgency** — cadence is prose; the
  anti-scarcity test guard enforces it.
- **sole-prop framing**: it is the author's own offering; never "nonprofit / tax-deductible".

## Testing

- `lib/course/office-hours.test.ts`: bilingual non-empty; `ama.available` both branches; mentor
  URL; anti-scarcity guard; honest-framing marker.
- `lib/course/ecosystem.test.ts`: AMA node present in Connect.
- Card validated by `npm run build` (static export).

Run: `cd LMS/tochka-sborki/web && npx vitest run` then `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export; `output: 'export'`.
- Bilingual ru + en (every new string a `Bi` pair).
- Pure engine+data + thin component (mirrors `ecosystem.ts` / `showcase.ts`); copy lives in the
  data module, not `dictionaries.ts` (consistent with the sibling course-data modules).
- Additive: existing `ecosystem.ts` nodes, `getEcosystem`, and `profile-client.tsx` content stay
  unchanged apart from the listed insertions.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- External links open in a new tab with `rel="noopener noreferrer"`.

## Files

| File | Responsibility |
|---|---|
| `lib/course/office-hours.ts` | engine+data: AMA + 1:1 bridge content, `resolveOfficeHours` / `getOfficeHours` |
| `lib/course/office-hours.test.ts` | bilingual + availability branches + mentor URL + anti-scarcity + honest marker |
| `components/office-hours-card.tsx` | presentational card; AMA CTA (when available) + 1:1 link + honest note |
| `app/character/profile-client.tsx` | render `<OfficeHoursCard>` after `<CompanionSetup>` |
| `lib/course/ecosystem.ts` | Connect pillar +2 nodes (AMA planned, 1:1 live) |
| `lib/course/ecosystem.test.ts` | assert AMA node present in Connect |

## Out of scope

- Paid coach-program design (5-day APM bundle); scheduler/calendar; in-course payment;
  async question-collection; alumni/matching `fb_7fdd9f891109`.
