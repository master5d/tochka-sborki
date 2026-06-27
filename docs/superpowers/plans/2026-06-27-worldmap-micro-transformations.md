# World Map Micro-Transformation Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the 9 course modules a bilingual `from X → to Y` micro-transformation and surface it on the World Map (`/character`) via per-node tooltip + a current-zone line.

**Architecture:** Engine + data, the established `lib/rpg` pattern. A keyed bilingual data module (`transformations.ts`) + resolver, an optional `transform` field on `ZoneVM` populated by `buildQuestLog`, and two render sites in `WorldMap` (SVG `<title>` per node + one current-zone line under the locator caption). Additive — no existing field or behavior changes.

**Tech Stack:** Next.js (static export), TypeScript, Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en — every transformation is a `Bi { ru; en }` pair.
- Engine + data pattern (`lib/rpg/*`): generic resolver + keyed bilingual data; no hardcoded copy in components beyond the existing inline connective-word locale ternary (`mapLabel` idiom in `world-map.tsx`).
- Module-level only (one World Map node = one module).
- Additive: `transform` is OPTIONAL on `ZoneVM`; no existing field, type, or behavior changes. The World Map's nodes, snake path, locator caption, niche 👑, and current ✦ marker stay byte-identical.
- Use the approved `from → to` copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- Canonical module slugs come from `lib/rpg/modules.ts` `MODULE_SLUGS`. `Bi` and `Locale` come from `lib/rpg/types.ts`. `ModuleSlug` from `lib/rpg/modules.ts`.

---

### Task 1: transformations data module + resolver

**Files:**
- Create: `LMS/tochka-sborki/web/lib/rpg/transformations.ts`
- Test: `LMS/tochka-sborki/web/lib/rpg/transformations.test.ts` (new)

**Interfaces:**
- Consumes: `ModuleSlug`, `MODULE_SLUGS` from `./modules`; `Bi`, `Locale` from `./types`.
- Produces: `interface Transformation { from: Bi; to: Bi }`; `const MICRO_TRANSFORMATIONS: Record<ModuleSlug, Transformation>`; `function getTransformation(slug: string, locale: Locale): { from: string; to: string } | null`.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/rpg/transformations.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { MODULE_SLUGS } from './modules'
import { MICRO_TRANSFORMATIONS, getTransformation } from './transformations'

describe('micro-transformations', () => {
  it('has a complete, non-empty bilingual record for every module slug', () => {
    for (const slug of MODULE_SLUGS) {
      const t = MICRO_TRANSFORMATIONS[slug]
      expect(t, `missing ${slug}`).toBeTruthy()
      expect(t.from.ru.trim().length).toBeGreaterThan(0)
      expect(t.from.en.trim().length).toBeGreaterThan(0)
      expect(t.to.ru.trim().length).toBeGreaterThan(0)
      expect(t.to.en.trim().length).toBeGreaterThan(0)
    }
  })

  it('resolves localized strings that differ across locales', () => {
    const ru = getTransformation('01-introduction', 'ru')
    const en = getTransformation('01-introduction', 'en')
    expect(ru).toEqual({ from: '«ИИ — это про код»', to: 'понимаю четыре сдвига Software 3.0' })
    expect(en).toEqual({ from: '"AI is about code"', to: 'I grasp the four shifts of Software 3.0' })
    expect(ru!.to).not.toBe(en!.to)
  })

  it('returns null for an unknown slug', () => {
    expect(getTransformation('does-not-exist', 'ru')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/transformations.test.ts`
Expected: FAIL — `transformations.ts` does not exist (import error).

- [ ] **Step 3: Create the data module**

Create `LMS/tochka-sborki/web/lib/rpg/transformations.ts` exactly:

```ts
import type { ModuleSlug } from './modules'
import type { Bi, Locale } from './types'

export interface Transformation { from: Bi; to: Bi }

export const MICRO_TRANSFORMATIONS: Record<ModuleSlug, Transformation> = {
  '00-kickstart':        { from: { ru: 'теряюсь в терминах ИИ',          en: 'lost in AI jargon' },
                           to:   { ru: 'вижу карту местности',            en: 'I see the lay of the land' } },
  '01-introduction':     { from: { ru: '«ИИ — это про код»',             en: '"AI is about code"' },
                           to:   { ru: 'понимаю четыре сдвига Software 3.0', en: 'I grasp the four shifts of Software 3.0' } },
  '02-setup-guide':      { from: { ru: 'пустой терминал пугает',         en: 'an empty terminal is scary' },
                           to:   { ru: 'инструменты под рукой',           en: 'my tools are set up and at hand' } },
  '03-stack-selection':  { from: { ru: '«какой ИИ выбрать?»',            en: '"which AI do I pick?"' },
                           to:   { ru: 'осознанно выбрал свой стек',      en: "I've consciously chosen my stack" } },
  '04-prompt-engineering': { from: { ru: 'прошу — получаю не то',        en: 'I ask — I get the wrong thing' },
                           to:   { ru: 'формулирую так, что агент понимает', en: 'I phrase it so the agent understands' } },
  '05-context-memory':   { from: { ru: 'агент забывает контекст',        en: 'the agent forgets context' },
                           to:   { ru: 'держу контекст и память',         en: 'I hold context and memory' } },
  '06-audio-pipeline':   { from: { ru: 'данные разрознены',              en: 'data is scattered' },
                           to:   { ru: 'строю pipeline сырое → инсайт',   en: 'I build a pipeline from raw to insight' } },
  '07-tools':            { from: { ru: 'агент в вакууме',                en: 'the agent works in a vacuum' },
                           to:   { ru: 'подключаю инструменты, навыки, хуки', en: 'I plug in tools, skills, hooks' } },
  '08-agent-engineering': { from: { ru: 'делаю всё руками',              en: 'I do everything by hand' },
                           to:   { ru: 'оркеструю агентов под задачу',    en: 'I orchestrate agents for the task' } },
}

export function getTransformation(
  slug: string,
  locale: Locale,
): { from: string; to: string } | null {
  const t = MICRO_TRANSFORMATIONS[slug as ModuleSlug]
  return t ? { from: t.from[locale], to: t.to[locale] } : null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/transformations.test.ts`
Expected: PASS — all three tests green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/rpg/transformations.ts LMS/tochka-sborki/web/lib/rpg/transformations.test.ts
git commit -m "feat(rpg): micro-transformation data module + resolver (fb_c4396f1b830a)"
```

---

### Task 2: wire `transform` into ZoneVM via buildQuestLog

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/rpg/types.ts`
- Modify: `LMS/tochka-sborki/web/lib/rpg/quest-log.ts`
- Test: `LMS/tochka-sborki/web/lib/rpg/quest-log.test.ts` (extend the existing file)

**Interfaces:**
- Consumes: `getTransformation` from `./transformations` (Task 1).
- Produces: `ZoneVM.transform?: { from: string; to: string }` populated per zone.

- [ ] **Step 1: Add the failing test (extend the existing quest-log test)**

Open `LMS/tochka-sborki/web/lib/rpg/quest-log.test.ts`. Add a test that, after `buildQuestLog`, a known module zone carries its resolved transformation. Use the same fixture/setup the existing tests in this file already use to call `buildQuestLog` (reuse the existing `profile`, `modules`, `getState`, `pack` construction — do NOT invent a new harness; mirror an existing test in the file). The new test body:

```ts
import { getTransformation } from './transformations'

it('populates each zone with its micro-transformation (ru)', () => {
  const vm = buildQuestLog(/* reuse the same args the existing ru test uses */)
  const intro = vm.zones.find(z => z.slug === '01-introduction')
  expect(intro?.transform).toEqual(getTransformation('01-introduction', 'ru'))
  // every zone whose slug is a known module has a transform
  for (const z of vm.zones) {
    if (getTransformation(z.slug, 'ru')) expect(z.transform).toBeTruthy()
  }
})
```

If the file already imports `buildQuestLog` and has a ready-made arg set, reuse it verbatim; only add the `getTransformation` import and the new `it(...)` block.

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/quest-log.test.ts`
Expected: FAIL — `transform` is `undefined` (field not yet added/populated).

- [ ] **Step 3: Add the optional field to `ZoneVM`**

In `lib/rpg/types.ts`, inside the `ZoneVM` interface, add (e.g. after `href: string`):

```ts
  transform?: { from: string; to: string } // module micro-transformation, localized
```

- [ ] **Step 4: Populate it in `buildQuestLog`**

In `lib/rpg/quest-log.ts`:

(a) Add the import near the other `./` imports:

```ts
import { getTransformation } from './transformations'
```

(b) In the `zones` map object literal, add as a new field (e.g. after `href`):

```ts
    transform: getTransformation(slug, locale) ?? undefined,
```

(`locale` is the existing `'ru' | 'en'` parameter, assignable to `Locale`.)

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/rpg/quest-log.test.ts`
Expected: PASS — the known zone has the resolved `transform`.

- [ ] **Step 6: Commit**

```bash
git add LMS/tochka-sborki/web/lib/rpg/types.ts LMS/tochka-sborki/web/lib/rpg/quest-log.ts LMS/tochka-sborki/web/lib/rpg/quest-log.test.ts
git commit -m "feat(rpg): carry micro-transformation on ZoneVM (fb_c4396f1b830a)"
```

---

### Task 3: surface the transformation on the World Map

**Files:**
- Modify: `LMS/tochka-sborki/web/components/rpg/world-map.tsx`

**Interfaces:**
- Consumes: `ZoneVM.transform` (Task 2). No new exports.

This is a render-only change to an existing `'use client'` SVG component, validated by the build (the component is not unit-tested today, matching how `buildLocator` is tested but `WorldMap` is not).

- [ ] **Step 1: Compute the current zone**

In `components/rpg/world-map.tsx`, near the top of the component body (after `const loc = buildLocator(...)`), add:

```tsx
  const current = zones.find(z => z.status === 'current')
```

- [ ] **Step 2: Add a per-node `<title>` inside each zone `<g>`**

Inside the `zones.map((z, i) => { ... })` returned `<g>`, after the existing current-`✦` `<text>` block (the last child before `</g>`), add:

```tsx
              {z.transform && (
                <title>{`${z.zoneName}: ${locale === 'en' ? 'from' : 'из'} ${z.transform.from} ${locale === 'en' ? 'to' : 'в'} ${z.transform.to}`}</title>
              )}
```

- [ ] **Step 3: Add the current-zone transformation line under the locator caption**

After the existing locator caption `<p>...{loc.caption}...</p>` (and before the closing `</div>`), add:

```tsx
      {current?.transform && (
        <p style={{ marginTop: '0.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          {locale === 'en'
            ? `Now: from ${current.transform.from} → to ${current.transform.to}`
            : `Сейчас: из ${current.transform.from} → в ${current.transform.to}`}
        </p>
      )}
```

- [ ] **Step 4: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (the new transformations + quest-log tests included; no existing test touches `WorldMap` render).

- [ ] **Step 5: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the new optional field and the JSX (`<title>` is valid inside SVG `<g>`); static export of `/character` and `/en/character` compiles.

- [ ] **Step 6: Commit**

```bash
git add LMS/tochka-sborki/web/components/rpg/world-map.tsx
git commit -m "feat(rpg): surface micro-transformations on the World Map (fb_c4396f1b830a)"
```

---

## Self-Review

**Spec coverage:**
- `transformations.ts` data module (9 modules, bilingual) + `getTransformation` resolver → Task 1. ✓
- `ZoneVM.transform?` optional field → Task 2 (Step 3). ✓
- `buildQuestLog` populates `transform` → Task 2 (Step 4). ✓
- World Map per-node `<title>` (hover + screen-reader) → Task 3 (Step 2). ✓
- Current-zone transformation line under locator caption → Task 3 (Step 3). ✓
- Tests: data completeness + resolver + quest-log wiring → Tasks 1 & 2. ✓
- Build-validated render change → Task 3 (Step 5). ✓
- Approved copy verbatim → Task 1 (Step 3) literal data block. ✓
- Carve (no doctrine / quest-card / per-unit / full-list) → respected; nothing added. ✓

**Placeholder scan:** Task 2 Step 1 deliberately defers to the existing test file's fixture rather than inventing one ("reuse the args the existing ru test uses") — the implementer must read `quest-log.test.ts` first; this is an instruction, not a placeholder. All code to be written is complete.

**Type consistency:** `Transformation`/`MICRO_TRANSFORMATIONS`/`getTransformation` defined in Task 1 are consumed unchanged in Task 2; `getTransformation(slug, locale)` returns `{ from, to } | null`, and `ZoneVM.transform` is `{ from, to } | undefined` (Task 2 maps `null → undefined` via `?? undefined`). `Bi`/`Locale`/`ModuleSlug` import paths match `lib/rpg/types.ts` and `lib/rpg/modules.ts`. The World Map reads only `z.transform.from`/`.to` and `z.zoneName`, all present on `ZoneVM`. ✓
