# Use-case gallery — category filter — Design

**Ticket:** `fb_e9649b38d80e` (adopt Manus-style use-case gallery: filterable category
tabs + cards + step-by-step replays — enhances the existing `components/showcase-gallery.tsx`).

**Date:** 2026-06-24

## Goal

Add a filterable category tab bar to the landing showcase gallery, layered over the existing
real/dream case cards, using an honest course-fit closed category set. A newcomer can filter
the possibility gallery by domain. No fabricated replays, no fabricated thumbnails — only the
real delta over what `showcase-gallery.tsx` already renders.

## Scope (carved by honest triage)

The card UI already exists (`REAL_CASES` proof cards + `DREAM_CASES` aspirational cards, each
with `icon/title/blurb/tag/result?/author?/href?`). The honest delta is **category
filtering**.

- **In scope:** a closed course-fit category set, a `category` field on each case, a tab bar
  that filters both grids simultaneously, with bilingual labels.
- **Out of scope (deferred):**
  - Step-by-step replay viewer (`fb_e9649b38d80e` "step-by-step replays") — there is no
    replay content; fabricating it would be dishonest. The existing per-case `href` →
    blog deep-dive (omitted until the post exists) already covers "see how it was done."
  - Real card thumbnails — no image assets exist; cards keep their emoji icons. A thumbnail
    field can be added later when assets exist; not now.
  - A dedicated `/showcase` page (YAGNI — landing embed only).
  - The verbatim Manus taxonomy (Featured/Research/Life/Data/Education/Productivity/WTF) —
    generic, does not fit this course, would produce empty/inauthentic tabs. Rejected in
    brainstorming in favor of course-fit categories.

## Architecture

Engine + course-data split, matching the existing pattern (`lib/course/showcase.ts` data +
`components/showcase-gallery.tsx` engine, with the interactive video already extracted to the
`'use client'` `components/showcase-video.tsx`). The interactive filtering is extracted the
same way: a new `'use client'` `components/showcase-filter.tsx` holds the active-category
state and renders the tab bar + both filtered grids + CTA; the server
`components/showcase-gallery.tsx` stays the shell (section label + video) and delegates the
cards to the filter. Filtering logic is a pure helper so it is unit-testable without
rendering. No network, no storage — pure client state.

## Components

### `lib/course/showcase.ts` (modified)

Add a closed category key union, a bilingual category registry, a `category` field on both
case interfaces, the resolved categories on the view-model, and a pure filter helper.

```ts
export type CategoryKey =
  | 'co-thinking' | 'launch' | 'flow' | 'knowledge' | 'dictation' | 'platform'

interface CategoryDef { key: CategoryKey; label: Bi }

// Stable display order. Every key here that is referenced by >=1 case becomes a tab.
const CATEGORIES: CategoryDef[] = [
  { key: 'co-thinking', label: { ru: 'Со-мышление', en: 'Co-thinking' } },
  { key: 'launch',      label: { ru: 'Запуск',       en: 'Launch' } },
  { key: 'flow',        label: { ru: 'Поток',        en: 'Flow' } },
  { key: 'knowledge',   label: { ru: 'Знание',       en: 'Knowledge' } },
  { key: 'dictation',   label: { ru: 'Диктовка',     en: 'Dictation' } },
  { key: 'platform',    label: { ru: 'Платформа',    en: 'Platform' } },
]
```

`ShowcaseCase` and `RealCase` each gain `category: CategoryKey`.

Case → category assignment (aligns with the existing `tag` text, but `category` is the stable
locale-independent key that drives filtering; `tag` stays the displayed chip):

- DREAM_CASES: `partner` → `co-thinking`, `weekend` → `launch`, `routine` → `flow`,
  `brain` → `knowledge`.
- REAL_CASES: `echo` → `dictation`, `lms` → `platform`, `canvas` → `launch`,
  `brain` → `knowledge`.

The resolved category list (`ResolvedCategory = { key: CategoryKey; label: string }`) is added
to `ShowcaseVM` as `categories`, in `CATEGORIES` order, containing exactly the keys used by at
least one resolved case (real ∪ dream). `category` is carried through onto each resolved case
(`ResolvedDream`/`ResolvedReal` gain `category: CategoryKey`).

Pure helper (exported, testable):

```ts
export type CatFilter = 'all' | CategoryKey
export function filterByCategory<T extends { category: CategoryKey }>(
  cases: T[], active: CatFilter,
): T[] {
  return active === 'all' ? cases : cases.filter(c => c.category === active)
}
```

`getShowcase(locale)` builds `categories` by scanning the resolved real ∪ dream cases for used
keys and emitting the matching `CATEGORIES` entries (resolved label) in registry order.

### `components/showcase-filter.tsx` (new, `'use client'`)

`export function ShowcaseFilter({ data, locale }: { data: ShowcaseVM; locale: Locale })`.

- Holds `const [active, setActive] = useState<CatFilter>('all')`.
- Renders a tab bar: an "All"/"Все" button plus one button per `data.categories` entry. Each
  is a `<button aria-pressed={active === key}>` calling `setActive`. The active tab is
  visually distinct (accent background). The "All"/"Все" label is the only locale branch in
  the component (`locale === 'en' ? 'All' : 'Все'`); everything else comes from `data`.
- Renders the **Real stories** section (`data.real.heading` + grid) from
  `filterByCategory(data.real.cases, active)`, and the **Dream** section
  (`data.dream.heading` + grid) from `filterByCategory(data.dream.cases, active)`. The card
  markup is moved verbatim from `showcase-gallery.tsx` (real card: icon/title/blurb/result/
  tag/author/optional href deep-dive; dream card: icon/title/blurb/tag/optional href).
- A section whose filtered list is empty renders nothing (no heading, no empty grid) — keeps
  the real-grid's existing `length > 0` guard semantics and extends it to the dream grid.
- Renders the CTA (`data.cta` → intake href) below the grids, unchanged.
- The `deepDive` label (`'→ разбор'` / `'→ deep-dive'`) and `intakeHref` move into this
  component (they are locale-derived, same as today in the gallery).

### `components/showcase-gallery.tsx` (modified)

Becomes the server shell: keep the outer `<section>`, the `t.label` eyebrow, and
`<ShowcaseVideo …/>`; replace the inline real/dream/CTA rendering with
`<ShowcaseFilter data={t} locale={locale} />`. No change to the section chrome or the video
facade.

## Data flow

Static + pure client state. `getShowcase(locale)` returns the view-model (now including
`categories` and per-case `category`); the server gallery passes it to the client filter,
which holds the active category in `useState` and re-filters on click. No endpoint, no fetch,
no storage.

## Error handling

Pure functions over closed unions (`Locale`, `CategoryKey`, `CatFilter`) and fixed-shape data;
no runtime failure modes. `filterByCategory` on `'all'` returns the input list; on a key
returns the matching subset (possibly empty → section hidden). Unknown categories cannot occur
(the union is closed and every case's `category` is checked by a test).

## Authenticity (binding)

- Real/dream separation is preserved — proof cards stay above aspirational cards, never merged
  into one grid.
- No fabricated replays (the deferred replay viewer) and no fabricated thumbnails (emoji icons
  stay).
- Every tab maps to ≥1 real case — no empty or inauthentic category tabs.
- No hype, no scarcity, no fabricated metrics (existing `result` copy is untouched).

## Testing

- **`lib/course/showcase.test.ts` (new or extended):**
  - Every `REAL_CASES` and `DREAM_CASES` entry has a `category` that is a key in `CATEGORIES`.
  - For `'ru'` and `'en'`, `getShowcase(locale).categories` is non-empty, in `CATEGORIES`
    registry order, and contains exactly the union of categories used by the resolved real and
    dream cases — every returned category has ≥1 case (no empty tabs) and every used category
    appears.
  - Each returned category has a non-empty `label`; ru and en category-label sets differ
    (bilingual, not a copy).
  - Each resolved case (real + dream) carries its `category` through `getShowcase`.
  - `filterByCategory`: `'all'` returns the full input array; a specific key returns only
    cases of that category; a key with no matches returns `[]`.
- The `ShowcaseFilter` component is presentational/interactive (like `ShowcaseVideo` — not
  unit-tested); it is validated by `next build` (full typecheck + static export) since the
  gallery is already embedded on the home page.

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts` and the full
`npx vitest run`; plus `npm run build` for the embed.

## Global constraints

- All files under `LMS/tochka-sborki/web/`. Static export (`output: 'export'`),
  `trailingSlash: true`.
- Bilingual ru + en in every added string (category labels, "All"/"Все").
- Engine + course-data split: the component is generic over `ShowcaseVM`; the Точка-Сборки
  categories and case→category assignments live in `lib/course/showcase.ts`.
- New interactive UI extracted to a `'use client'` component (`showcase-filter.tsx`), the
  precedent being `showcase-video.tsx`; the gallery stays a server component shell.
- Additive: do not change the video facade, the card markup content, the `result`/`author`
  copy, the CTA, or the real/dream section ordering — only add the category field, the tab
  bar, and the filtering.

## Files

| File | Responsibility |
|---|---|
| `lib/course/showcase.ts` | `CategoryKey` + `CATEGORIES` + per-case `category` + `categories` on VM + `filterByCategory` |
| `lib/course/showcase.test.ts` | category data + filter helper tests |
| `components/showcase-filter.tsx` | `'use client'` tab bar + filtered real/dream grids + CTA |
| `components/showcase-gallery.tsx` | server shell: label + video, delegates to the filter |

## Out of scope

- Step-by-step replay viewer (no content).
- Real card thumbnails (no assets).
- Dedicated `/showcase` page.
- Manus verbatim taxonomy.
- Any change to the video facade, card copy, or real/dream ordering.
