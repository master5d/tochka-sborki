# Transformation-mapped architecture — macro-phases — Design

**Ticket:** `fb_66e487821773` (Transformation-mapped course architecture: 3 macro-phases
frustration→desire → ~9 modules (from X→to Y) → steps; visual roadmap "show don't tell").

**Date:** 2026-06-27

## Goal

Add the macro-phase layer of the transformation-mapped architecture: group the 9 course modules
into 3 macro-phases, each a `frustration → desire` arc, and surface them as a compact visual
"transformation arc" on `/character`, above the World Map. This is the "show don't tell" visual
roadmap the ticket asks for, sitting one level above the per-module `from→to` micro-transformations
already shipped on the World Map (`fb_c4396f1b830a`).

## Scope (carved by honest triage)

The per-module `from X → to Y` micro-transformation labels are ALREADY SHIPPED on the World Map
(`fb_c4396f1b830a`). The remaining, uncovered delta of this ticket is (a) the **3 macro-phase
(frustration→desire) grouping** over the 9 modules and (b) its **visual roadmap surface**. That
is the whole of this slice.

- **In scope:** a `lib/rpg/macro-phases.ts` data module (3 phases, bilingual, covering all 9
  module slugs) + a `phaseForSlug` resolver + a `buildTransformationArc` view-model builder; a
  `<TransformationArc>` display component on `/character`; tests for the data, resolver, and
  builder.
- **Out of scope (deferred / carved):**
  - The generic authoring-engine "transformation-mapping dimension" (`fb_8e8eaf0a`) — that engine
    does not exist yet; we apply the architecture to Точка Сборки's real 9 modules, not build a
    generic authoring tool.
  - The deliverables menu (→ `fb_8e8eaf0a`) and the Charity field (→ checkout `fb_c20c437f`).
  - Any fee / payment / refund framing — explicitly dropped (clashes with the free-course ethos).
  - The Kolb lesson-phase backbone (`fb_33cc76000a86`) — sibling ticket, not this slice.
  - Re-rendering the per-module `from→to` (already on the World Map).
  - The 1–5 "steps" sub-layer (units already exist per module; not re-modeled here).

## Architecture

Engine + data, the established `lib/rpg` pattern (sibling to `transformations.ts`):

1. **Data module** `lib/rpg/macro-phases.ts` — `MACRO_PHASES: MacroPhase[]` (exactly 3 phases,
   each with a bilingual `name`/`frustration`/`desire` and an ordered `slugs` list; the union of
   all `slugs` equals `MODULE_SLUGS`, each slug in exactly one phase) + `phaseForSlug(slug)`
   resolver + `buildTransformationArc(currentSlug, locale)` returning a localized view-model with
   an `isCurrent` flag per phase.
2. **Display component** `components/rpg/transformation-arc.tsx` — a thin renderer of the
   view-model: an accessible `<ol>` of 3 phase cards (responsive grid), the current phase
   highlighted via `aria-current="step"` + accent border. No interactivity, no hooks.
3. **Wiring** — `ProfileClient` derives `currentSlug` from the existing quest-log
   (`vm.zones.find(z => z.status === 'current')?.slug ?? null`) and renders `<TransformationArc>`
   above the `<WorldMap>`.

## Components

### `lib/rpg/macro-phases.ts` (new)

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

### `components/rpg/transformation-arc.tsx` (new)

A thin, display-only renderer (no `'use client'` needed — no hooks; it is bundled into the
client tree via `ProfileClient`). Responsive grid so the 3 cards wrap on narrow screens.

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

### `app/character/profile-client.tsx` (modified)

Add the import:

```tsx
import { TransformationArc } from '@/components/rpg/transformation-arc'
```

Derive the current slug from the already-built quest-log VM (after `const vm = buildQuestLog(...)`):

```tsx
  const currentSlug = vm.zones.find(z => z.status === 'current')?.slug ?? null
```

Render it inside the existing map `<div>`, above `<WorldMap>`:

```tsx
        <div style={{ margin: '1.5rem 0' }}>
          <TransformationArc currentSlug={currentSlug} locale={locale} accent={accent} />
          <div style={{ marginTop: '1rem' }}>
            <WorldMap zones={vm.zones} accent={accent} glyph={glyph} locale={locale} nicheDungeonCleared={nicheDungeonCleared} />
          </div>
        </div>
```

(The existing `<WorldMap>` and its props stay unchanged; it is only wrapped with a top margin so
the arc and the map don't collide.)

## Data flow

Static. `ProfileClient` already builds `vm` (quest-log) on `/character`; the current slug feeds
`buildTransformationArc`. No endpoint, no client state, no localStorage.

## Error handling

`phaseForSlug` returns `null` for an unknown slug; `buildTransformationArc(null, …)` returns all
phases with `isCurrent: false` (e.g. course complete / no current zone) — the arc still renders,
just with nothing highlighted. No throw.

## Authenticity (binding)

- The `frustration → desire` copy is honest and plain — a real learning arc, not a hype promise.
- No fee / payment / refund / scarcity framing (explicitly dropped per the ticket triage).
- "Show don't tell": the arc is a quiet visual map, not a sales ladder.

## Testing

- **`lib/rpg/macro-phases.test.ts` (new):**
  - `MACRO_PHASES` covers every `MODULE_SLUGS` entry exactly once (flattened `slugs` equals the
    set of `MODULE_SLUGS`, no duplicates, total length 9); exactly 3 phases with `index` 1,2,3.
  - every phase has non-empty `name`/`frustration`/`desire` in both `ru` and `en`.
  - `phaseForSlug('04-prompt-engineering')` returns the `craft` phase; `phaseForSlug('nope')`
    returns `null`.
  - `buildTransformationArc('07-tools', 'ru')` marks ONLY the `orchestrate` phase `isCurrent` and
    localizes (e.g. `name === 'Оркестрация'`); `buildTransformationArc('07-tools', 'en')` gives
    `name === 'Orchestration'`; `buildTransformationArc(null, 'ru')` marks none current.
- The `TransformationArc` component and the `ProfileClient` wiring are validated by `npm run build`
  (static export of `/character` + `/en/character`), mirroring how `buildLocator` is unit-tested
  while `WorldMap`/`ProfileClient` are not.

Run: `cd LMS/tochka-sborki/web && npx vitest run` and `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en (every phase field a `Bi` pair).
- Engine + data pattern (`lib/rpg/*`): keyed bilingual data + pure builder/resolver; the
  component is a thin renderer with only inline connective-word locale ternaries.
- Additive: new files + a localized injection into `ProfileClient`; the World Map, quest-log,
  and all existing `/character` content stay unchanged in behavior.
- 3 macro-phases over all 9 module slugs, each slug in exactly one phase.
- Frontend-only: LMS `web` CI job. No worker, no migration.

## Files

| File | Responsibility |
|---|---|
| `lib/rpg/macro-phases.ts` (new) | 3-phase bilingual data + `phaseForSlug` + `buildTransformationArc` |
| `lib/rpg/macro-phases.test.ts` (new) | coverage + resolver + builder tests |
| `components/rpg/transformation-arc.tsx` (new) | display-only 3-phase arc renderer |
| `app/character/profile-client.tsx` | derive current slug + render the arc above the World Map |

## Out of scope

- Authoring-engine transformation-mapping (`fb_8e8eaf0a`); deliverables menu; Charity field
  (`fb_c20c437f`); fee/payment/refund; Kolb backbone (`fb_33cc76000a86`); per-module `from→to`
  (already shipped); 1–5 steps sub-layer.
