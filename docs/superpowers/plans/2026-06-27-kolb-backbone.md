# Kolb Experiential Cycle Backbone — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Formalize the Kolb experiential cycle as the named backbone of the 4 lesson phases — bilingual `kolb` attribution + accessor + quiet `title` on each phase badge — and make "a lesson covers all 4 stages" binding via a drift-guard test.

**Architecture:** Engine + data + a drift-guard test, both established patterns. `PHASE_META` (in `phase-chrome.ts`) gains a `kolb` bilingual field + a `phaseKolb` accessor; `phase.tsx` adds `title={phaseKolb(...)}` to the existing badge; a new `kolb-coverage.test.ts` walks unit MDX (mirroring `reflection-prompts.test.ts`) and asserts every unit covers all 4 phases. Additive — no behavior changes.

**Tech Stack:** Next.js (static export), TypeScript, Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en — the `kolb` field is a `Record<Locale, string>` pair on every phase.
- Engine + data pattern: keyed bilingual data + accessor; the drift-guard mirrors `lib/content/reflection-prompts.test.ts`'s file-walk idiom.
- Additive: `kolb` is a new field on `PHASE_META`; `phaseKolb` is new; the `title` is a new attr on an existing badge `<div>`. `PHASE_ORDER`, the wizard, `PHASE_META`'s existing fields (`label`/`icon`/`color`), `MENTAL_MARKER`/`MENTAL_PHASES`/`phaseLabel`/`phaseMarker`, and all lesson content stay unchanged in behavior.
- Coverage rule: each unit (any MDX file containing `<Phase type="`) has ≥1 of each of the 4 phases. Overview pages (no `<Phase>`) are skipped.
- Authenticity: Kolb stage names are standard pedagogical terms; no hype/sales framing. Use the approved copy (in the spec) VERBATIM. The learner-facing phase labels stay Активация/Рефлексия/Концепция/Практика — the Kolb attribution is quiet (`title` only).
- Frontend-only: LMS `web` CI job. No worker, no migration.
- `PhaseType = 'activation' | 'reflection' | 'concept' | 'practice'` and `Locale` (from `@/lib/dictionaries`) are existing; do not redefine them.

---

### Task 1: Kolb attribution data + accessor + quiet badge title

**Files:**
- Modify: `LMS/tochka-sborki/web/components/phase-chrome.ts`
- Modify: `LMS/tochka-sborki/web/components/phase-chrome.test.ts` (extend the existing file)
- Modify: `LMS/tochka-sborki/web/components/phase.tsx`

**Interfaces:**
- Produces: `kolb: Record<Locale, string>` on each `PHASE_META` entry; `function phaseKolb(type: PhaseType, locale: Locale): string`.
- Consumes (in `phase.tsx`): `phaseKolb`.

- [ ] **Step 1: Extend the existing phase-chrome test (failing)**

READ `LMS/tochka-sborki/web/components/phase-chrome.test.ts` first to match its imports/structure. Add the `phaseKolb` import to the existing import from `./phase-chrome` (alongside `PHASE_META`/`phaseLabel`/…), then add this test inside the existing top-level `describe` (or as a new `describe` if the file has none):

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

If `PHASE_META` is not already imported in the test file, add it to the import too.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run components/phase-chrome.test.ts`
Expected: FAIL — `phaseKolb` is not exported / `kolb` is `undefined` (TS/runtime error).

- [ ] **Step 3: Add `kolb` to `PHASE_META` + the `phaseKolb` accessor**

In `components/phase-chrome.ts`, replace the `PHASE_META` declaration with (adding the `kolb` field; `label`/`icon`/`color` unchanged):

```ts
export const PHASE_META: Record<PhaseType, { label: Record<Locale, string>; kolb: Record<Locale, string>; icon: string; color: string }> = {
  activation: { label: { ru: 'Активация', en: 'Activation' }, kolb: { ru: 'Колб: конкретный опыт',              en: 'Kolb: concrete experience' },        icon: '⚡', color: 'var(--phase-1)' },
  reflection: { label: { ru: 'Рефлексия', en: 'Reflection' }, kolb: { ru: 'Колб: рефлексивное наблюдение',      en: 'Kolb: reflective observation' },      icon: '👁', color: 'var(--phase-2)' },
  concept:    { label: { ru: 'Концепция', en: 'Concept' },    kolb: { ru: 'Колб: абстрактная концептуализация', en: 'Kolb: abstract conceptualization' },  icon: '💡', color: 'var(--phase-3)' },
  practice:   { label: { ru: 'Практика', en: 'Practice' },    kolb: { ru: 'Колб: активный эксперимент',          en: 'Kolb: active experimentation' },      icon: '🛠', color: 'var(--phase-4)' },
}
```

Add the accessor next to `phaseLabel`:

```ts
export function phaseKolb(type: PhaseType, locale: Locale): string {
  return PHASE_META[type].kolb[locale]
}
```

(Leave `MENTAL_MARKER`, `MENTAL_PHASES`, `phaseLabel`, `phaseMarker` untouched.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run components/phase-chrome.test.ts`
Expected: PASS — the new Kolb-attribution test green, existing tests still green.

- [ ] **Step 5: Add the quiet `title` to the phase badge in `phase.tsx`**

In `components/phase.tsx`:

(a) Update the import line to include `phaseKolb`:

```tsx
import { PHASE_META, phaseLabel, phaseMarker, phaseKolb, type PhaseType } from './phase-chrome'
```

(b) After the existing `const marker = phaseMarker(type, locale)` line, add:

```tsx
  const kolb = phaseKolb(type, locale)
```

(c) Add `title={kolb}` to the existing badge `<div>` — the one with `display: 'inline-flex'` that renders `{icon} {label}`. Add the `title` attribute to that `<div>`; its children and all style properties are otherwise unchanged.

- [ ] **Step 6: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 7: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the widened `PHASE_META` type and the new `title` attr; static export compiles.

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/components/phase-chrome.ts LMS/tochka-sborki/web/components/phase-chrome.test.ts LMS/tochka-sborki/web/components/phase.tsx
git commit -m "feat(course): name the Kolb cycle on lesson phases (fb_33cc76000a86)"
```

---

### Task 2: Kolb-coverage drift-guard test

**Files:**
- Test: `LMS/tochka-sborki/web/lib/content/kolb-coverage.test.ts` (new)

**Interfaces:** none (a self-contained file-walking test, no app imports).

- [ ] **Step 1: Write the drift-guard test**

Create `LMS/tochka-sborki/web/lib/content/kolb-coverage.test.ts` exactly:

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

- [ ] **Step 2: Run the test to verify it passes against current content**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/kolb-coverage.test.ts`
Expected: PASS — every unit MDX already has all 4 phases (the content satisfies the invariant today; this test pins it going forward). The "discovers unit mdx files" guard confirms the walk found files.

- [ ] **Step 3: Sanity-check the guard actually guards (temporary, do NOT commit)**

To confirm the test is not a no-op, temporarily delete one `<Phase type="concept">` opening tag from a single unit MDX, re-run the test, and verify it FAILS for that file; then restore the tag exactly (git checkout the file). This proves the drift-guard bites.

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/kolb-coverage.test.ts` (after the temporary edit) → expect FAIL for that file; then `git checkout -- <that file>` and re-run → expect PASS.

- [ ] **Step 4: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green including the new coverage test.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/content/kolb-coverage.test.ts
git commit -m "test(course): drift-guard every unit covers all 4 Kolb phases (fb_33cc76000a86)"
```

---

## Self-Review

**Spec coverage:**
- `kolb` bilingual attribution on `PHASE_META` + `phaseKolb` accessor → Task 1 (Step 3). ✓
- Quiet `title` (hover + SR) on the phase badge → Task 1 (Step 5). ✓
- Kolb-coverage drift-guard (every unit covers all 4 stages, overview skipped, ≥1 each) → Task 2 (Step 1). ✓
- Extend `phase-chrome.test.ts` for the new data/helper → Task 1 (Step 1). ✓
- Build-validated `title` render change → Task 1 (Step 7). ✓
- Approved Kolb copy verbatim → Task 1 (Step 3) literal data block. ✓
- Additive (PHASE_ORDER/wizard/labels/markers unchanged) → respected. ✓
- Carve (no content-design / mentor / transformation / wizard / in-body sub-label) → nothing added. ✓

**Placeholder scan:** none — all code complete and verbatim. (Task 2 Step 3 is a temporary verification, explicitly reverted, not a placeholder.)

**Type consistency:** `kolb: Record<Locale, string>` matches the existing `label` shape; `phaseKolb(type: PhaseType, locale: Locale): string` mirrors `phaseLabel`. `phase.tsx` consumes `phaseKolb` with the same `type`/`locale` it already passes to `phaseLabel`. The coverage test is self-contained (no app imports), mirroring `reflection-prompts.test.ts`. `PhaseType`/`Locale` are reused, not redefined. ✓
