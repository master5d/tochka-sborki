# Transformation-Mapped Macro-Phases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group the 9 course modules into 3 bilingual `frustration → desire` macro-phases and surface them as a compact "transformation arc" visual above the World Map on `/character`.

**Architecture:** Engine + data, the established `lib/rpg` pattern (sibling to `transformations.ts`). A keyed bilingual data module (`macro-phases.ts`) with a `phaseForSlug` resolver and a `buildTransformationArc` view-model builder, then a thin display component (`transformation-arc.tsx`) wired into `ProfileClient`. Additive — no existing behavior changes.

**Tech Stack:** Next.js (static export), TypeScript, Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en — every phase field is a `Bi { ru; en }` pair.
- Engine + data pattern (`lib/rpg/*`): keyed bilingual data + pure builder/resolver; the component is a thin renderer with only inline connective-word locale ternaries.
- 3 macro-phases over all 9 module slugs; each slug in exactly one phase; the union equals `MODULE_SLUGS`.
- Additive: new files + a localized injection into `ProfileClient`; the World Map, quest-log, and all existing `/character` content stay unchanged in behavior. The existing `<WorldMap>` call and its props are untouched (only wrapped with a top margin).
- Authenticity: honest `frustration → desire` copy; NO fee/payment/refund/scarcity framing. Use the approved copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- `ModuleSlug` from `lib/rpg/modules.ts`; `MODULE_SLUGS` (value) from the same. `Bi`/`Locale` from `lib/rpg/types.ts`. `Locale` for the component from `@/lib/intake/types` (matching `profile-client.tsx`).

---

### Task 1: macro-phases data module + resolver + arc builder

**Files:**
- Create: `LMS/tochka-sborki/web/lib/rpg/macro-phases.ts`
- Test: `LMS/tochka-sborki/web/lib/rpg/macro-phases.test.ts` (new)

**Interfaces:**
- Consumes: `ModuleSlug` from `./modules`; `Bi`, `Locale` from `./types`; (test also imports `MODULE_SLUGS` from `./modules`).
- Produces: `interface MacroPhase`; `const MACRO_PHASES: MacroPhase[]`; `function phaseForSlug(slug: string): MacroPhase | null`; `interface ArcPhaseVM`; `interface TransformationArcVM`; `function buildTransformationArc(currentSlug: string | null, locale: Locale): TransformationArcVM`.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/rpg/macro-phases.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { MODULE_SLUGS } from './modules'
import { MACRO_PHASES, phaseForSlug, buildTransformationArc } from './macro-phases'

describe('macro-phases', () => {
  it('has exactly 3 phases indexed 1,2,3', () => {
    expect(MACRO_PHASES).toHaveLength(3)
    expect(MACRO_PHASES.map(p => p.index)).toEqual([1, 2, 3])
  })

  it('covers every module slug exactly once', () => {
    const flat = MACRO_PHASES.flatMap(p => p.slugs)
    expect(flat).toHaveLength(MODULE_SLUGS.length)
    expect(new Set(flat).size).toBe(flat.length) // no duplicates
    expect(new Set(flat)).toEqual(new Set(MODULE_SLUGS))
  })

  it('has non-empty bilingual copy for every phase', () => {
    for (const p of MACRO_PHASES) {
      for (const field of [p.name, p.frustration, p.desire]) {
        expect(field.ru.trim().length).toBeGreaterThan(0)
        expect(field.en.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('resolves a slug to its phase, and null for unknown', () => {
    expect(phaseForSlug('04-prompt-engineering')?.key).toBe('craft')
    expect(phaseForSlug('00-kickstart')?.key).toBe('orient')
    expect(phaseForSlug('08-agent-engineering')?.key).toBe('orchestrate')
    expect(phaseForSlug('nope')).toBeNull()
  })

  it('builds a localized arc with exactly the current phase flagged', () => {
    const ru = buildTransformationArc('07-tools', 'ru')
    expect(ru.phases).toHaveLength(3)
    expect(ru.phases.filter(p => p.isCurrent).map(p => p.key)).toEqual(['orchestrate'])
    expect(ru.phases.find(p => p.key === 'orchestrate')!.name).toBe('Оркестрация')

    const en = buildTransformationArc('07-tools', 'en')
    expect(en.phases.find(p => p.key === 'orchestrate')!.name).toBe('Orchestration')

    const none = buildTransformationArc(null, 'ru')
    expect(none.phases.some(p => p.isCurrent)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/macro-phases.test.ts`
Expected: FAIL — `macro-phases.ts` does not exist (import error).

- [ ] **Step 3: Create the data module**

Create `LMS/tochka-sborki/web/lib/rpg/macro-phases.ts` exactly:

```ts
import type { ModuleSlug } from './modules'
import type { Bi, Locale } from './types'

export interface MacroPhase {
  key: string          // stable id
  index: number        // 1-based position
  name: Bi
  frustration: Bi      // the pain that opens the phase
  desire: Bi           // the outcome that closes it
  slugs: ModuleSlug[]
}

export const MACRO_PHASES: MacroPhase[] = [
  {
    key: 'orient', index: 1,
    name:        { ru: 'Ориентация',  en: 'Orientation' },
    frustration: { ru: 'теряюсь в мире ИИ, не знаю с чего начать', en: "lost in the world of AI, I don't know where to start" },
    desire:      { ru: 'сориентирован, среда готова, стек выбран',  en: 'oriented, environment ready, stack chosen' },
    slugs: ['00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection'],
  },
  {
    key: 'craft', index: 2,
    name:        { ru: 'Ремесло', en: 'Craft' },
    frustration: { ru: 'прошу — получаю не то, агент забывает, всё вручную', en: 'I ask and get the wrong thing, the agent forgets, everything is manual' },
    desire:      { ru: 'бегло сотрудничаю: формулирую, держу контекст, строю pipeline', en: 'I collaborate fluently: I phrase, hold context, build pipelines' },
    slugs: ['04-prompt-engineering', '05-context-memory', '06-audio-pipeline'],
  },
  {
    key: 'orchestrate', index: 3,
    name:        { ru: 'Оркестрация', en: 'Orchestration' },
    frustration: { ru: 'делаю всё в одиночку, агент в вакууме', en: 'I do it all alone, the agent works in a vacuum' },
    desire:      { ru: 'оркеструю агентов и инструменты под задачу', en: 'I orchestrate agents and tools for the task' },
    slugs: ['07-tools', '08-agent-engineering'],
  },
]

export function phaseForSlug(slug: string): MacroPhase | null {
  return MACRO_PHASES.find(p => (p.slugs as string[]).includes(slug)) ?? null
}

export interface ArcPhaseVM {
  key: string
  index: number
  name: string
  frustration: string
  desire: string
  isCurrent: boolean
}
export interface TransformationArcVM { phases: ArcPhaseVM[] }

export function buildTransformationArc(currentSlug: string | null, locale: Locale): TransformationArcVM {
  const cur = currentSlug ? phaseForSlug(currentSlug) : null
  return {
    phases: MACRO_PHASES.map(p => ({
      key: p.key,
      index: p.index,
      name: p.name[locale],
      frustration: p.frustration[locale],
      desire: p.desire[locale],
      isCurrent: cur?.key === p.key,
    })),
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/macro-phases.test.ts`
Expected: PASS — all five tests green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/rpg/macro-phases.ts LMS/tochka-sborki/web/lib/rpg/macro-phases.test.ts
git commit -m "feat(rpg): macro-phase data + arc builder (fb_66e487821773)"
```

---

### Task 2: TransformationArc component + wire into ProfileClient

**Files:**
- Create: `LMS/tochka-sborki/web/components/rpg/transformation-arc.tsx`
- Modify: `LMS/tochka-sborki/web/app/character/profile-client.tsx`

**Interfaces:**
- Consumes: `buildTransformationArc` from `@/lib/rpg/macro-phases` (Task 1); `Locale` from `@/lib/intake/types`. In `ProfileClient`, `vm.zones` from the existing `buildQuestLog` call.
- Produces: `export function TransformationArc({ currentSlug, locale, accent }: { currentSlug: string | null; locale: Locale; accent: string })`.

This is a display component + a wiring edit. The component is not unit-tested (matching how `WorldMap`/`ProfileClient` are untested while builders are); validated by the full suite (Task 1 tests stay green) + `npm run build`.

- [ ] **Step 1: Create the display component**

Create `LMS/tochka-sborki/web/components/rpg/transformation-arc.tsx` exactly:

```tsx
import { buildTransformationArc } from '@/lib/rpg/macro-phases'
import type { Locale } from '@/lib/intake/types'

export function TransformationArc({ currentSlug, locale, accent }: { currentSlug: string | null; locale: Locale; accent: string }) {
  const vm = buildTransformationArc(currentSlug, locale)
  const heading = locale === 'en' ? 'Your transformation arc' : 'Твоя арка трансформации'
  return (
    <section aria-label={heading} style={{ maxWidth: 520, margin: '0 auto' }}>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{heading}</p>
      <ol style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
        {vm.phases.map(p => (
          <li key={p.key} aria-current={p.isCurrent ? 'step' : undefined}
              style={{ border: `1px solid ${p.isCurrent ? accent : 'var(--border-color)'}`, borderRadius: 8, padding: '0.5rem 0.6rem', background: p.isCurrent ? 'var(--bg-surface)' : 'transparent', opacity: p.isCurrent ? 1 : 0.7 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{locale === 'en' ? `Phase ${p.index}` : `Фаза ${p.index}`}</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {locale === 'en' ? `from ${p.frustration} → to ${p.desire}` : `из ${p.frustration} → в ${p.desire}`}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 2: Wire it into ProfileClient**

In `LMS/tochka-sborki/web/app/character/profile-client.tsx`:

(a) Add the import near the other `@/components/rpg/*` imports (next to the `WorldMap` import):

```tsx
import { TransformationArc } from '@/components/rpg/transformation-arc'
```

(b) After the existing `const vm = buildQuestLog(...)` line, add:

```tsx
  const currentSlug = vm.zones.find(z => z.status === 'current')?.slug ?? null
```

(c) Replace the existing map `<div>` block:

```tsx
        <div style={{ margin: '1.5rem 0' }}>
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} locale={locale} nicheDungeonCleared={nicheDungeonCleared} />
        </div>
```

with:

```tsx
        <div style={{ margin: '1.5rem 0' }}>
          <TransformationArc currentSlug={currentSlug} locale={locale} accent={accent} />
          <div style={{ marginTop: '1rem' }}>
            <WorldMap zones={vm.zones} accent={accent} glyph={glyph} locale={locale} nicheDungeonCleared={nicheDungeonCleared} />
          </div>
        </div>
```

(The `<WorldMap>` element and its props are unchanged — only wrapped in a `<div>` with a top margin, with the arc rendered above it.)

- [ ] **Step 3: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (Task 1 macro-phases tests included; no existing test touches `ProfileClient`/`TransformationArc` render).

- [ ] **Step 4: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the new component + props; static export of `/character` and `/en/character` compiles with the arc rendered above the World Map.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/components/rpg/transformation-arc.tsx LMS/tochka-sborki/web/app/character/profile-client.tsx
git commit -m "feat(rpg): surface transformation arc on /character (fb_66e487821773)"
```

---

## Self-Review

**Spec coverage:**
- `macro-phases.ts` data (3 phases, bilingual, all 9 slugs) + `phaseForSlug` + `buildTransformationArc` → Task 1. ✓
- `TransformationArc` display component (a11y `<ol>` + `aria-current`, responsive grid) → Task 2 (Step 1). ✓
- Wire into `ProfileClient` (current slug from `vm.zones`, arc above World Map) → Task 2 (Step 2). ✓
- Tests: coverage + resolver + builder → Task 1 (Step 1). ✓
- Build-validated component/wiring → Task 2 (Step 4). ✓
- Approved copy verbatim → Task 1 (Step 3) literal data block. ✓
- Additive (World Map/quest-log unchanged) → Task 2 only wraps the existing `<WorldMap>`. ✓
- Carve (no engine/deliverables/charity/payment/Kolb/from→to/steps) → respected; nothing added. ✓

**Placeholder scan:** none — all code complete and verbatim.

**Type consistency:** `MacroPhase`/`MACRO_PHASES`/`phaseForSlug`/`buildTransformationArc`/`TransformationArcVM`/`ArcPhaseVM` defined in Task 1 are consumed unchanged in Task 2. `buildTransformationArc(currentSlug: string | null, locale: Locale)` matches the component's `currentSlug: string | null` and `locale: Locale` props, and `ProfileClient` passes `vm.zones.find(...)?.slug ?? null` (`string | null`) + `locale` (`Locale`) + `accent` (`string`). `macro-phases.ts` imports only `type ModuleSlug` (no unused value import); the test imports `MODULE_SLUGS` separately. `Locale` source: `./types` (re-exports from intake) in the data module, `@/lib/intake/types` in the component (matching `profile-client.tsx`'s existing import). ✓
