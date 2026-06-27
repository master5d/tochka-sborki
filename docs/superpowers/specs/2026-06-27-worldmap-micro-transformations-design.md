# World Map micro-transformation labels — Design

**Ticket:** `fb_c4396f1b830a` (Retrofit Точка Сборки 9 modules with micro-transformation labels
(from X→to Y) on the World Map).

**Date:** 2026-06-27

## Goal

Give each of the 9 course modules a one-line "micro-transformation" — the learner's shift in that
module, `from X → to Y` — and surface it on the World Map (`/character`). Advances the
transformation-mapped course thread (`fb_66e487821773` doctrine, `fb_33cc76000a86` Kolb) without
building the doctrine itself: this is the concrete, live-surface retrofit.

## Scope (carved by honest triage)

The honest, on-spec, live-consumer delta is a keyed bilingual data module + wiring it into the
existing `ZoneVM` and the `WorldMap` SVG. Engine+data pattern, mirroring `niche-map.ts` /
`unit-framing.ts`. No new page, no doctrine prose, no quest-card redesign.

- **In scope:** a `lib/rpg/transformations.ts` data module (9 modules, bilingual `from`/`to`) +
  resolver; a `transform` field on `ZoneVM` populated by `buildQuestLog`; surfacing on the
  `WorldMap` (per-node SVG `<title>` for hover + screen-reader, plus a current-zone
  transformation line under the locator caption); tests for data completeness, resolver, and
  the `buildQuestLog` wiring.
- **Out of scope (deferred):**
  - The transformation-mapped course architecture doctrine (`fb_66e487821773`) and the Kolb
    lesson-phase backbone (`fb_33cc76000a86`).
  - Rendering the transformation inside the QuestFeed quest cards (the map is the requested
    surface; cards stay as-is).
  - Per-unit (sub-module) transformations — module-level only, matching the World Map's
    one-node-per-module granularity.
  - A full always-visible list of all 9 transformations under the map (surface option B,
    considered and not chosen — current-focus + hover-discovery keeps the compact map clean).

## Architecture

Engine + data, the established `lib/rpg` pattern:

1. **Data module** `lib/rpg/transformations.ts` — a `Record<ModuleSlug, Transformation>` keyed by
   the canonical module slugs, each value a `{ from: Bi; to: Bi }` bilingual pair, plus a
   `getTransformation(slug, locale)` resolver returning the localized `{ from, to }` or `null`.
2. **View-model** — `ZoneVM` gains an optional `transform?: { from: string; to: string }`, which
   `buildQuestLog` fills from `getTransformation(slug, locale)` for each zone.
3. **Surface** — `WorldMap` reads `z.transform` and renders (a) a per-node SVG `<title>` (native
   hover tooltip + screen-reader text) and (b) a single current-zone transformation line under
   the existing locator caption. Connective UI words (`Сейчас:` / `Now:`, `из`/`в` / `from`/`to`)
   stay inline via the locale ternary, matching the file's existing `mapLabel`/caption idiom.

## Components

### `lib/rpg/transformations.ts` (new)

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

### `lib/rpg/types.ts` (modified)

Add to `ZoneVM`:

```ts
  transform?: { from: string; to: string } // module micro-transformation, localized
```

### `lib/rpg/quest-log.ts` (modified)

Import the resolver and populate each zone:

```ts
import { getTransformation } from './transformations'
```

In the `zones` map, add to each object:

```ts
    transform: getTransformation(slug, locale) ?? undefined,
```

(`locale` here is the existing `'ru' | 'en'` param, which is `Locale`.)

### `components/rpg/world-map.tsx` (modified)

(a) Per-node `<title>` inside each zone `<g>` (after the niche/current text markers), only when
`z.transform` is present:

```tsx
{z.transform && (
  <title>{`${z.zoneName}: ${locale === 'en' ? 'from' : 'из'} ${z.transform.from} ${locale === 'en' ? 'to' : 'в'} ${z.transform.to}`}</title>
)}
```

(b) A current-zone transformation line under the existing locator caption `<p>`. Compute the
current zone once near the top of the component:

```tsx
const current = zones.find(z => z.status === 'current')
```

and render, after the locator caption `<p>`:

```tsx
{current?.transform && (
  <p style={{ marginTop: '0.25rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
    {locale === 'en'
      ? `Now: from ${current.transform.from} → to ${current.transform.to}`
      : `Сейчас: из ${current.transform.from} → в ${current.transform.to}`}
  </p>
)}
```

## Data flow

Static. `buildQuestLog` (already called on `/character`) resolves the transformation per zone at
build of the view-model; `WorldMap` renders it. No endpoint, no client state, no localStorage.

## Error handling

`getTransformation` returns `null` for an unknown slug; `ZoneVM.transform` is optional and both
render sites guard on its presence, so a missing/extra module slug degrades gracefully (node has
no tooltip, no current line) rather than throwing.

## Authenticity (binding)

- The `from → to` copy is honest, plain, and de-hyped — a real inner/skill shift per module, not
  a marketing promise. Consistent with the anti-hype / amplify-your-voice thread.
- Surfacing is quiet (hover tooltip + one current-focus line), not a badge-stat brag wall.

## Testing

- **`lib/rpg/transformations.test.ts` (new):**
  - every `MODULE_SLUGS` entry has a `MICRO_TRANSFORMATIONS` record with non-empty `from.ru`,
    `from.en`, `to.ru`, `to.en` (completeness + bilingual).
  - `getTransformation('01-introduction', 'ru')` and `'en'` return the expected localized
    strings and they differ across locales.
  - `getTransformation('does-not-exist', 'ru')` returns `null`.
- **`lib/rpg/quest-log.test.ts` (extend the existing file):** after `buildQuestLog`, a known
  zone (e.g. `01-introduction`) has a populated `transform` with `from`/`to` matching
  `getTransformation` for that locale.
- The `WorldMap` render change (SVG `<title>` + current line) is validated by `npm run build`
  (static export compiles), mirroring how `buildLocator` is unit-tested while the `WorldMap`
  component itself is not.

Run: `cd LMS/tochka-sborki/web && npx vitest run` and `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en (the `Bi` pair on every transformation).
- Engine + data pattern (`lib/rpg/*`): generic resolver + keyed bilingual data; no hardcoded
  copy in components beyond the existing inline connective-word ternary.
- Module-level only (one node = one module on the World Map).
- Additive: `transform` is optional on `ZoneVM`; no existing field or behavior changes. The
  World Map's nodes, path, locator, niche crown, and current ✦ marker stay as-is.
- Frontend-only: LMS `web` CI job. No worker, no migration.

## Files

| File | Responsibility |
|---|---|
| `lib/rpg/transformations.ts` (new) | 9-module bilingual `from→to` data + `getTransformation` resolver |
| `lib/rpg/transformations.test.ts` (new) | completeness + resolver tests |
| `lib/rpg/types.ts` | add optional `transform` to `ZoneVM` |
| `lib/rpg/quest-log.ts` | populate `transform` per zone from the resolver |
| `lib/rpg/quest-log.test.ts` | assert `transform` populated on a known zone |
| `components/rpg/world-map.tsx` | per-node `<title>` + current-zone transformation line |

## Out of scope

- Transformation-mapped course architecture doctrine (`fb_66e487821773`) / Kolb backbone
  (`fb_33cc76000a86`).
- QuestFeed quest-card rendering of the transformation.
- Per-unit (sub-module) transformations.
- Always-visible full list under the map (surface option B).
