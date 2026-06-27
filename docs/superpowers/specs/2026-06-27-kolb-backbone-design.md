# Kolb experiential cycle backbone — formalization — Design

**Ticket:** `fb_33cc76000a86` (Kolb experiential learning cycle as lesson-phase backbone:
experience→reflect→conceptualize→experiment; formalize as authoring/review checklist).

**Date:** 2026-06-27

## Goal

Formalize the Kolb experiential learning cycle as the named backbone of the course's existing
4-phase lesson structure, and make the "a lesson covers all 4 stages" authoring rule binding via
a drift-guard test. Surface the Kolb attribution quietly (hover + screen-reader) on each phase
badge, without adding jargon-noise to the learner-facing UI.

## Scope (carved by honest triage)

The 4 lesson phases ALREADY ARE the Kolb cycle — `PhaseType = 'activation' | 'reflection' |
'concept' | 'practice'` with `PHASE_ORDER` (`phase.tsx`) rendering them in exactly that order,
which already enforces the "don't front-load content before experience+reflection" guardrail at
the wizard-step level. The ROADMAP mentions Колба in prose, but the mapping is not formalized in
code and there is no test asserting every unit covers all 4 stages (`reflection-prompts.test.ts`
only checks banned input verbs inside activation/reflection blocks).

- **In scope:**
  - A `kolb` bilingual attribution per phase in `PHASE_META` + a `phaseKolb` helper.
  - A quiet `title` (hover + screen-reader) carrying the Kolb stage on each phase badge.
  - A Kolb-coverage drift-guard test: every unit MDX covers all 4 phases.
  - Extend the existing `phase-chrome.test.ts` for the new data/helper.
- **Out of scope (deferred / done):**
  - The content-design principles ticket (`fb_cea25e03`) — sibling, separate.
  - AI-mentor anti-blame persona (`fb_e3d6506231a8`) — already shipped.
  - Transformation macro-phases / micro-transformations — already shipped.
  - Any change to `PHASE_ORDER` / wizard sequencing (the ordering guardrail already holds).
  - A visible Kolb sub-label in the lesson body (rejected — jargon-noise; the quiet `title` is
    the chosen surface).

## Architecture

Engine + data + a drift-guard test, both established patterns:

1. **Data** — `components/phase-chrome.ts` gains a `kolb: Record<Locale, string>` field on each
   `PHASE_META` entry (the canonical Kolb stage, plainly worded) + a `phaseKolb(type, locale)`
   accessor mirroring the existing `phaseLabel`.
2. **Surface** — `components/phase.tsx` adds `title={phaseKolb(type, locale)}` to the existing
   phase badge `<div>` (the one rendering `{icon} {label}`). Hover tooltip + best-effort
   screen-reader; no visual change, no new element.
3. **Authoring guard** — `lib/content/kolb-coverage.test.ts` (new) walks every unit MDX (same
   `walk` idiom as `reflection-prompts.test.ts`) and asserts each unit page covers all 4
   `<Phase type="...">` stages.

## Components

### `components/phase-chrome.ts` (modified)

Add `kolb` to each `PHASE_META` entry and a `phaseKolb` helper. The `PHASE_META` type becomes:

```ts
export const PHASE_META: Record<PhaseType, { label: Record<Locale, string>; kolb: Record<Locale, string>; icon: string; color: string }> = {
  activation: { label: { ru: 'Активация', en: 'Activation' }, kolb: { ru: 'Колб: конкретный опыт',              en: 'Kolb: concrete experience' },        icon: '⚡', color: 'var(--phase-1)' },
  reflection: { label: { ru: 'Рефлексия', en: 'Reflection' }, kolb: { ru: 'Колб: рефлексивное наблюдение',      en: 'Kolb: reflective observation' },      icon: '👁', color: 'var(--phase-2)' },
  concept:    { label: { ru: 'Концепция', en: 'Concept' },    kolb: { ru: 'Колб: абстрактная концептуализация', en: 'Kolb: abstract conceptualization' },  icon: '💡', color: 'var(--phase-3)' },
  practice:   { label: { ru: 'Практика', en: 'Practice' },    kolb: { ru: 'Колб: активный эксперимент',          en: 'Kolb: active experimentation' },      icon: '🛠', color: 'var(--phase-4)' },
}
```

Add the accessor (next to `phaseLabel`):

```ts
export function phaseKolb(type: PhaseType, locale: Locale): string {
  return PHASE_META[type].kolb[locale]
}
```

(`MENTAL_MARKER`, `MENTAL_PHASES`, `phaseLabel`, `phaseMarker` stay unchanged.)

### `components/phase.tsx` (modified)

Import `phaseKolb` and add a `title` to the badge `<div>`:

(a) Update the import:

```tsx
import { PHASE_META, phaseLabel, phaseMarker, phaseKolb, type PhaseType } from './phase-chrome'
```

(b) Near the other locals (after `const marker = phaseMarker(type, locale)`):

```tsx
  const kolb = phaseKolb(type, locale)
```

(c) Add `title={kolb}` to the existing badge `<div>` (the one with the `display: 'inline-flex'`
style rendering `{icon} {label}`). The badge's children and styles are otherwise unchanged.

### `lib/content/kolb-coverage.test.ts` (new)

Drift-guard mirroring `reflection-prompts.test.ts`'s file-walk. A "unit" MDX is any file
containing at least one `<Phase type="...">`; non-unit pages (e.g. `exercises.mdx`,
`cheatsheet`) contain no phases and are skipped. Each unit must cover all 4 Kolb stages
(at least one block of each — `≥1`, not exactly-1, so a legitimately split phase does not
false-fail).

```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, statSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT = join(HERE, '..', '..', 'content') // web/content

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.mdx') ? [p] : []
  })
}

const PHASES = ['activation', 'reflection', 'concept', 'practice'] as const
const files = walk(CONTENT)

describe('Kolb cycle coverage', () => {
  it('discovers unit mdx files', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8')
    if (!/<Phase type="/.test(src)) return // overview page, not a unit
    for (const type of PHASES) {
      const count = (src.match(new RegExp(`<Phase type="${type}"`, 'g')) || []).length
      expect(count, `${file}: missing <Phase type="${type}"> (Kolb stage)`).toBeGreaterThanOrEqual(1)
    }
  })
})
```

### `components/phase-chrome.test.ts` (extend the existing file)

Add a block asserting the new data/helper: every `PhaseType` has non-empty `kolb.ru`/`kolb.en`,
and `phaseKolb(type, locale)` returns them. Reuse whatever import/setup the existing file uses;
add only the `phaseKolb` import (if not already imported) and the new assertions.

```ts
it('every phase has a non-empty bilingual Kolb attribution', () => {
  for (const type of ['activation', 'reflection', 'concept', 'practice'] as const) {
    expect(PHASE_META[type].kolb.ru.trim().length).toBeGreaterThan(0)
    expect(PHASE_META[type].kolb.en.trim().length).toBeGreaterThan(0)
    expect(phaseKolb(type, 'ru')).toBe(PHASE_META[type].kolb.ru)
    expect(phaseKolb(type, 'en')).toBe(PHASE_META[type].kolb.en)
  }
})
```

## Data flow

Static. `PHASE_META` is read by `phase.tsx` at render; the coverage test reads MDX at test time.
No endpoint, no client state.

## Error handling

None — `phaseKolb` indexes a total `Record<PhaseType, …>` (every `PhaseType` has a `kolb`). The
coverage test skips non-unit pages rather than failing them.

## Authenticity (binding)

- Kolb stage names are standard pedagogical terms (de-funneled — the ticket source was an
  infographic stripped of its Telegram-channel CTA). No hype, no sales framing.
- The attribution is quiet (hover/SR `title`), honoring the project's "disarm jargon for
  non-geeks" principle — the learner-facing label stays Активация/Рефлексия/Концепция/Практика.

## Testing

- **`components/phase-chrome.test.ts` (extend):** every phase has non-empty bilingual `kolb`;
  `phaseKolb` returns it.
- **`lib/content/kolb-coverage.test.ts` (new):** every unit MDX (file containing `<Phase
  type=`) covers all 4 Kolb stages (≥1 each); overview pages skipped; discovers >30 files.
- The `phase.tsx` `title` change is validated by `npm run build` (the component already renders;
  adding a `title` attr is type-safe) — no new render test, matching the file's existing
  no-unit-test treatment of the component body.

Run: `cd LMS/tochka-sborki/web && npx vitest run` and `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en (the `kolb` pair on every phase).
- Engine + data pattern: keyed bilingual data + accessor; the drift-guard mirrors
  `reflection-prompts.test.ts`.
- Additive: `kolb` is a new field on `PHASE_META`; `phaseKolb` is new; the `title` is a new attr
  on an existing badge. `PHASE_ORDER`, the wizard, the phase labels/markers, and all lesson
  content stay unchanged in behavior.
- Coverage rule: each unit (any file with `<Phase type=`) has ≥1 of each of the 4 phases.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- Use the approved Kolb copy (above) VERBATIM.

## Files

| File | Responsibility |
|---|---|
| `components/phase-chrome.ts` | add bilingual `kolb` to `PHASE_META` + `phaseKolb` accessor |
| `components/phase-chrome.test.ts` (extend) | assert `kolb` present + `phaseKolb` returns it |
| `components/phase.tsx` | add `title={phaseKolb(...)}` to the phase badge |
| `lib/content/kolb-coverage.test.ts` (new) | assert every unit MDX covers all 4 Kolb stages |

## Out of scope

- Content-design principles ticket (`fb_cea25e03`); mentor anti-blame (`fb_e3d6506231a8`, done);
  macro/micro transformation layers (done); `PHASE_ORDER`/wizard changes; a visible in-body
  Kolb sub-label.
