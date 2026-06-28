# Office-hours AMA Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an honest, static-export bridge from the course to the author's free group AMA office-hours (link-out) plus a light pointer to separate 1:1 mentorship at `mentor.mamaev.coach`, surfaced as a card on `/character` and two awareness nodes in the ecosystem diagram.

**Architecture:** Pure engine+data module (`lib/course/office-hours.ts`, mirroring `ecosystem.ts`/`showcase.ts`) + a thin presentational card + two static data nodes in `ecosystem.ts`. Zero backend — external link-outs only. The AMA registration URL is a config constant (empty by default); its CTA renders only when set (the `REAL_CASES.length>0` / `VIDEO.url=null` facade pattern).

**Tech Stack:** Next.js 16 (static export, `output: 'export'`), TypeScript, Vitest.

## Global Constraints

- All files under `LMS/tochka-sborki/web/`. Static export; no worker, no migration. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en — every new copy string is a `Bi { ru: string; en: string }` pair.
- Pure engine+data + thin component (mirror `lib/course/ecosystem.ts`). Copy lives in the data module, NOT `lib/dictionaries.ts`.
- Additive only: existing `ecosystem.ts` nodes, `getEcosystem`, and `profile-client.tsx` content stay byte-identical apart from the listed insertions.
- External links: `target="_blank" rel="noopener noreferrer"`.
- Authenticity (binding): AMA is **free**; 1:1 is **paid and separate** on `mentor.mamaev.coach` (no in-course payment, no scheduler); **no scarcity/countdown/"N spots left"/glossy urgency**; cadence in prose; sole-prop framing (never "nonprofit/tax-deductible").
- `mentorUrl` is exactly `https://mentor.mamaev.coach`. `amaRegisterUrl` ships as `''` (dark).
- Use the exact copy from the spec verbatim.

---

### Task 1: office-hours engine+data module + unit test

**Files:**
- Create: `LMS/tochka-sborki/web/lib/course/office-hours.ts`
- Test: `LMS/tochka-sborki/web/lib/course/office-hours.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/intake/types`.
- Produces: `OfficeHoursData`, `OfficeHoursVM` interfaces; `OFFICE_HOURS: OfficeHoursData` constant; `resolveOfficeHours(data: OfficeHoursData, locale: Locale): OfficeHoursVM`; `getOfficeHours(locale: Locale): OfficeHoursVM`.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/course/office-hours.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolveOfficeHours, getOfficeHours, OFFICE_HOURS } from './office-hours'

describe('office-hours', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`resolves all VM strings non-empty (${loc})`, () => {
      const vm = getOfficeHours(loc)
      expect(vm.eyebrow.trim().length).toBeGreaterThan(0)
      expect(vm.heading.trim().length).toBeGreaterThan(0)
      expect(vm.intro.trim().length).toBeGreaterThan(0)
      expect(vm.ama.ctaLabel.trim().length).toBeGreaterThan(0)
      expect(vm.ama.cadenceNote.trim().length).toBeGreaterThan(0)
      expect(vm.oneToOne.ctaLabel.trim().length).toBeGreaterThan(0)
      expect(vm.oneToOne.blurb.trim().length).toBeGreaterThan(0)
      expect(vm.honestNote.trim().length).toBeGreaterThan(0)
    })

    it(`1:1 points at the mentor site (${loc})`, () => {
      expect(getOfficeHours(loc).oneToOne.url).toBe('https://mentor.mamaev.coach')
    })
  }

  it('AMA is dark by default (no register url shipped)', () => {
    expect(getOfficeHours('ru').ama.available).toBe(false)
    expect(OFFICE_HOURS.amaRegisterUrl).toBe('')
  })

  it('AMA lights up when a register url is configured', () => {
    const vm = resolveOfficeHours({ ...OFFICE_HOURS, amaRegisterUrl: 'https://luma.example/ama' }, 'ru')
    expect(vm.ama.available).toBe(true)
    expect(vm.ama.registerUrl).toBe('https://luma.example/ama')
  })

  it('whitespace-only register url stays dark', () => {
    const vm = resolveOfficeHours({ ...OFFICE_HOURS, amaRegisterUrl: '   ' }, 'en')
    expect(vm.ama.available).toBe(false)
  })

  it('is de-hustled — no scarcity/countdown framing', () => {
    const banned = /(осталось|мест\b|countdown|limited|spots|hurry|только сегодня|last chance)/i
    for (const loc of ['ru', 'en'] as const) {
      const vm = getOfficeHours(loc)
      const strings = [vm.eyebrow, vm.heading, vm.intro, vm.ama.ctaLabel, vm.ama.cadenceNote, vm.oneToOne.ctaLabel, vm.oneToOne.blurb, vm.honestNote]
      for (const s of strings) expect(banned.test(s), `scarcity framing: ${s}`).toBe(false)
    }
  })

  it('honest note states free + optional', () => {
    expect(getOfficeHours('ru').honestNote).toMatch(/бесплат/i)
    expect(getOfficeHours('ru').honestNote).toMatch(/опционал/i)
    expect(getOfficeHours('en').honestNote).toMatch(/free/i)
    expect(getOfficeHours('en').honestNote).toMatch(/optional/i)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/office-hours.test.ts`
Expected: FAIL — `Cannot find module './office-hours'`.

- [ ] **Step 3: Write the module**

Create `LMS/tochka-sborki/web/lib/course/office-hours.ts`:

```ts
// web/lib/course/office-hours.ts
// Engine+data for the office-hours AMA bridge (free group Ask-Me-Anything) + a light
// pointer to separate 1:1 mentorship at mentor.mamaev.coach. Display = components/office-hours-card.tsx.
import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface OfficeHoursData {
  amaRegisterUrl: string            // '' until the owner creates the recurring AMA event
  mentorUrl: string                 // https://mentor.mamaev.coach
  eyebrow: Bi
  heading: Bi
  intro: Bi
  amaCtaLabel: Bi
  cadenceNote: Bi
  oneToOneCtaLabel: Bi
  oneToOneBlurb: Bi
  honestNote: Bi
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/office-hours.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/office-hours.ts LMS/tochka-sborki/web/lib/course/office-hours.test.ts
git commit -m "feat(course): office-hours AMA bridge engine+data (fb_57c6302d436f)"
```

---

### Task 2: office-hours card component + wire into /character

**Files:**
- Create: `LMS/tochka-sborki/web/components/office-hours-card.tsx`
- Modify: `LMS/tochka-sborki/web/app/character/profile-client.tsx`

**Interfaces:**
- Consumes: `getOfficeHours(locale)` and the `OfficeHoursVM` shape from Task 1; `Locale` from `@/lib/intake/types`.
- Produces: `OfficeHoursCard` React component, props `{ locale: Locale }`.

- [ ] **Step 1: Create the card component**

Create `LMS/tochka-sborki/web/components/office-hours-card.tsx`. It is presentational (no hooks/state), chrome mirroring `components/intake/charter-card.tsx`. The AMA CTA + cadence render only when `oh.ama.available`. Both links are external new-tab.

```tsx
import type { Locale } from '@/lib/intake/types'
import { getOfficeHours } from '@/lib/course/office-hours'

export function OfficeHoursCard({ locale }: { locale: Locale }) {
  const oh = getOfficeHours(locale)
  const linkBtn: React.CSSProperties = {
    display: 'inline-block', background: 'var(--bg-surface)', color: 'var(--text-primary)',
    border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px',
    fontSize: 14, textDecoration: 'none', fontFamily: 'inherit',
  }
  return (
    <section style={{ maxWidth: 640, margin: '2rem auto 3rem', padding: '0 1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '.6rem' }}>{oh.eyebrow}</h2>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 .5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{oh.heading}</h3>
        <p style={{ margin: '0 0 1rem', fontSize: '.9rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{oh.intro}</p>
        {oh.ama.available && (
          <p style={{ margin: '0 0 1rem' }}>
            <a href={oh.ama.registerUrl} target="_blank" rel="noopener noreferrer" style={linkBtn}>{oh.ama.ctaLabel} ↗</a>
            <span style={{ display: 'block', marginTop: '.5rem', fontSize: '.8rem', color: 'var(--text-secondary)' }}>{oh.ama.cadenceNote}</span>
          </p>
        )}
        <p style={{ margin: '0 0 .75rem', fontSize: '.9rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{oh.oneToOne.blurb}</p>
        <p style={{ margin: '0 0 1rem' }}>
          <a href={oh.oneToOne.url} target="_blank" rel="noopener noreferrer" style={linkBtn}>{oh.oneToOne.ctaLabel} ↗</a>
        </p>
        <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-secondary)', opacity: .85 }}>{oh.honestNote}</p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire it into the profile page**

In `LMS/tochka-sborki/web/app/character/profile-client.tsx`, add the import alongside the other card imports (after the `CompanionSetup` import line):

```tsx
import { OfficeHoursCard } from '@/components/office-hours-card'
```

Then render it immediately after the `<CompanionSetup ... />` line, before the closing `</>`:

```tsx
        <CompanionSetup profile={profile} locale={locale} />
        <OfficeHoursCard locale={locale} />
      </>
```

(Keep every other line in the file byte-identical.)

- [ ] **Step 3: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the component and `OfficeHoursVM` usage; `/character` (ru + en) compiles in the static export with the new card.

- [ ] **Step 4: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (no test targets the component; this confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/components/office-hours-card.tsx LMS/tochka-sborki/web/app/character/profile-client.tsx
git commit -m "feat(character): office-hours AMA bridge card (fb_57c6302d436f)"
```

---

### Task 3: ecosystem Connect-pillar awareness nodes

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/ecosystem.ts`
- Test: `LMS/tochka-sborki/web/lib/course/ecosystem.test.ts` (extend)

**Interfaces:**
- Consumes: existing `getEcosystem(locale)` and the `RAW` structure in `ecosystem.ts`.
- Produces: no new exports — two added nodes in the `connect` pillar.

- [ ] **Step 1: Add the failing assertion**

In `LMS/tochka-sborki/web/lib/course/ecosystem.test.ts`, append this `it` block inside the existing `describe('getEcosystem', ...)` block (before its closing `})`):

```ts
  it('Connect pillar surfaces the AMA office-hours node', () => {
    const connect = getEcosystem('ru').pillars.find((p) => p.key === 'connect')!
    const labels = connect.nodes.map((n) => n.label)
    expect(labels).toContain('AMA office-hours')
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/ecosystem.test.ts`
Expected: FAIL — the Connect pillar has no `AMA office-hours` node yet.

- [ ] **Step 3: Add the two nodes**

In `LMS/tochka-sborki/web/lib/course/ecosystem.ts`, the `connect` pillar currently is:

```ts
    {
      key: 'connect',
      title: { ru: 'Связывайся', en: 'Connect' },
      nodes: [
        { label: { ru: 'Сообщество S.A.S.H.A', en: 'S.A.S.H.A community' }, status: 'planned' },
        { label: { ru: 'Кросс-курс companion', en: 'Cross-course companion' }, status: 'planned' },
      ],
    },
```

Append two nodes to its `nodes` array so it becomes:

```ts
    {
      key: 'connect',
      title: { ru: 'Связывайся', en: 'Connect' },
      nodes: [
        { label: { ru: 'Сообщество S.A.S.H.A', en: 'S.A.S.H.A community' }, status: 'planned' },
        { label: { ru: 'Кросс-курс companion', en: 'Cross-course companion' }, status: 'planned' },
        { label: { ru: 'AMA office-hours', en: 'AMA office-hours' }, status: 'planned' },
        { label: { ru: '1:1 наставничество', en: '1:1 mentorship' }, status: 'live' },
      ],
    },
```

(Leave the `learn` and `prove` pillars, the interfaces, and `getEcosystem` unchanged.)

- [ ] **Step 4: Run the ecosystem test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/ecosystem.test.ts`
Expected: PASS — the new assertion green; the existing structure/ordering/planned/bilingual tests stay green (still 3 ordered pillars, ≥1 planned node).

- [ ] **Step 5: Full suite + build**

Run: `cd LMS/tochka-sborki/web && npx vitest run && npm run build`
Expected: PASS — suite green; static export compiles the ecosystem diagram with the two new Connect nodes.

- [ ] **Step 6: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/ecosystem.ts LMS/tochka-sborki/web/lib/course/ecosystem.test.ts
git commit -m "feat(course): ecosystem Connect nodes for AMA + 1:1 (fb_57c6302d436f)"
```

---

## Self-Review

**Spec coverage:**
- `lib/course/office-hours.ts` engine+data (`OFFICE_HOURS`, `resolveOfficeHours`, `getOfficeHours`, both interfaces) → Task 1. ✓
- Test: bilingual non-empty, `ama.available` both branches, mentor URL, anti-scarcity guard, honest marker → Task 1 (Step 1). ✓
- `components/office-hours-card.tsx` presentational card; AMA CTA only when available; external new-tab links → Task 2 (Step 1). ✓
- Wire after `<CompanionSetup>` in `profile-client.tsx` → Task 2 (Step 2). ✓
- `ecosystem.ts` Connect +2 nodes (AMA planned, 1:1 live) → Task 3 (Step 3). ✓
- `ecosystem.test.ts` assert AMA node present → Task 3 (Step 1). ✓
- Build-validated card → Task 2 (Step 3). ✓
- Carve (no scheduler / in-course payment / async collection / coach-program design / alumni) → nothing added. ✓

**Placeholder scan:** none — full code in every code step; exact copy verbatim from the spec.

**Type consistency:** `OfficeHoursData`/`OfficeHoursVM` field names match across the module, the test, and the card (`eyebrow`, `heading`, `intro`, `ama.{available,registerUrl,ctaLabel,cadenceNote}`, `oneToOne.{url,ctaLabel,blurb}`, `honestNote`). `getOfficeHours(locale)` / `resolveOfficeHours(data, locale)` signatures consistent. The card imports `getOfficeHours` (the no-arg-data form), matching Task 1's export. The ecosystem nodes use the existing `RawNode` shape (`label: Bi`, `status`). ✓
