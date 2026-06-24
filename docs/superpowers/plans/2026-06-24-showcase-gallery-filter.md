# Showcase Gallery Category Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a filterable category tab bar over the landing showcase gallery's existing real/dream case cards, using an honest course-fit closed category set.

**Architecture:** Engine + course-data split. `lib/course/showcase.ts` gains a closed `CategoryKey` union, a bilingual `CATEGORIES` registry, a `category` field per case, the used categories on the view-model, and a pure `filterByCategory` helper. The interactive tab bar is extracted to a new `'use client'` `components/showcase-filter.tsx` (precedent: `showcase-video.tsx`); `components/showcase-gallery.tsx` stays the server shell (label + video) and delegates the cards to the filter.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, `trailingSlash: true`), React, TypeScript, Vitest.

## Global Constraints

- All files under `LMS/tochka-sborki/web/`. Static export — no server runtime.
- Bilingual ru + en in every added string (category labels, "All"/"Все", group aria-label).
- Engine + course-data split: the component is generic over `ShowcaseVM`; the Точка-Сборки categories and case→category assignments live in `lib/course/showcase.ts`.
- New interactive UI lives in a `'use client'` component (`showcase-filter.tsx`); the gallery stays a server component shell.
- Additive only: do not change the video facade, the card markup *content*, the `result`/`author` copy, the CTA, or the real/dream section ordering — only add the category field, the tab bar, and the filtering.
- Authenticity: every tab maps to ≥1 real case (no empty tabs); real/dream separation preserved (proof above dreams); no fabricated replays/thumbnails/metrics.
- Run tests from `LMS/tochka-sborki/web/`: `npx vitest run`. Build: `npm run build`.

---

### Task 1: Category data model + pure filter helper

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.ts`
- Test: `LMS/tochka-sborki/web/lib/course/showcase.test.ts`

**Interfaces:**
- Consumes: existing `Bi`, `ShowcaseCase`, `RealCase`, `ShowcaseVM`, `getShowcase` in `showcase.ts`.
- Produces (relied on by Task 2):
  - `export type CategoryKey = 'co-thinking' | 'launch' | 'flow' | 'knowledge' | 'dictation' | 'platform'`
  - `export type CatFilter = 'all' | CategoryKey`
  - `export interface ResolvedCategory { key: CategoryKey; label: string }`
  - `export const CATEGORY_KEYS: CategoryKey[]`
  - `ShowcaseVM.categories: ResolvedCategory[]` (registry order, only used keys)
  - each resolved case (`real.cases[i]`, `dream.cases[i]`) carries `category: CategoryKey`
  - `export function filterByCategory<T extends { category: CategoryKey }>(cases: T[], active: CatFilter): T[]`

- [ ] **Step 1: Write the failing tests**

Add to `lib/course/showcase.test.ts`. Change the import line at the top of the file to also import `filterByCategory` and `CATEGORY_KEYS`:

```ts
import { getShowcase, videoEmbedUrl, resolveVideoSource, withAutoplay, filterByCategory, CATEGORY_KEYS } from './showcase'
```

Append these describe blocks at the end of the file:

```ts
describe('categories', () => {
  it('every real+dream case has a valid category key', () => {
    const s = getShowcase('ru')
    for (const c of [...s.real.cases, ...s.dream.cases]) {
      expect(CATEGORY_KEYS).toContain(c.category)
    }
  })

  for (const loc of ['ru', 'en'] as const) {
    it(`categories = used keys in registry order, non-empty, labelled, each >=1 case (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.categories.length).toBeGreaterThan(0)
      const all = [...s.real.cases, ...s.dream.cases]
      const used = new Set(all.map(c => c.category))
      // exactly the used keys
      expect(new Set(s.categories.map(c => c.key))).toEqual(used)
      // registry order
      expect(s.categories.map(c => c.key)).toEqual(CATEGORY_KEYS.filter(k => used.has(k)))
      // each labelled + maps to >=1 case (no empty tabs)
      for (const cat of s.categories) {
        expect(cat.label.length).toBeGreaterThan(0)
        expect(all.filter(c => c.category === cat.key).length).toBeGreaterThanOrEqual(1)
      }
    })
  }

  it('ru and en category labels differ (bilingual)', () => {
    const ru = getShowcase('ru').categories.map(c => c.label).join('|')
    const en = getShowcase('en').categories.map(c => c.label).join('|')
    expect(ru).not.toBe(en)
  })
})

describe('filterByCategory', () => {
  const sample = [
    { category: 'launch' as const, id: 'a' },
    { category: 'flow' as const, id: 'b' },
    { category: 'launch' as const, id: 'c' },
  ]
  it('all → full list unchanged', () => expect(filterByCategory(sample, 'all')).toEqual(sample))
  it('key → only that category', () => expect(filterByCategory(sample, 'launch').map(x => x.id)).toEqual(['a', 'c']))
  it('unused key → empty', () => expect(filterByCategory(sample, 'knowledge')).toEqual([]))
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts`
Expected: FAIL — `filterByCategory` and `CATEGORY_KEYS` are not exported; `c.category` / `s.categories` undefined.

- [ ] **Step 3: Add the category types, registry, and helper**

In `lib/course/showcase.ts`, immediately after the `interface Bi { ru: string; en: string }` line, add:

```ts
export type CategoryKey =
  | 'co-thinking' | 'launch' | 'flow' | 'knowledge' | 'dictation' | 'platform'

export type CatFilter = 'all' | CategoryKey

interface CategoryDef { key: CategoryKey; label: Bi }

export interface ResolvedCategory { key: CategoryKey; label: string }

// Stable display order. Every key referenced by >=1 case becomes a tab.
const CATEGORIES: CategoryDef[] = [
  { key: 'co-thinking', label: { ru: 'Со-мышление', en: 'Co-thinking' } },
  { key: 'launch',      label: { ru: 'Запуск',       en: 'Launch' } },
  { key: 'flow',        label: { ru: 'Поток',        en: 'Flow' } },
  { key: 'knowledge',   label: { ru: 'Знание',       en: 'Knowledge' } },
  { key: 'dictation',   label: { ru: 'Диктовка',     en: 'Dictation' } },
  { key: 'platform',    label: { ru: 'Платформа',    en: 'Platform' } },
]

export const CATEGORY_KEYS: CategoryKey[] = CATEGORIES.map(c => c.key)

export function filterByCategory<T extends { category: CategoryKey }>(
  cases: T[], active: CatFilter,
): T[] {
  return active === 'all' ? cases : cases.filter(c => c.category === active)
}
```

- [ ] **Step 4: Add `category` to the case interfaces and resolved shapes**

In `lib/course/showcase.ts`, add `category: CategoryKey` to both raw case interfaces. The `ShowcaseCase` interface becomes:

```ts
export interface ShowcaseCase {
  id: string
  icon: string
  title: Bi
  blurb: Bi
  tag: Bi
  category: CategoryKey
  href?: string
}
```

The `RealCase` interface becomes:

```ts
export interface RealCase {
  id: string; icon: string; title: Bi; blurb: Bi; tag: Bi; category: CategoryKey
  result: Bi      // the "обернул во благо" payoff line
  author: Bi      // attribution
  href?: string   // → blog deep-dive; omitted until the post exists
}
```

Add `category` to the resolved shapes. Replace the two `Resolved*` interface lines with:

```ts
interface ResolvedDream { id: string; icon: string; title: string; blurb: string; tag: string; category: CategoryKey; href?: string }
interface ResolvedReal extends ResolvedDream { result: string; author: string }
```

Add `categories` to the view-model. In `ShowcaseVM`, after the `dream: { … }` field, add:

```ts
  categories: ResolvedCategory[]
```

- [ ] **Step 5: Assign categories to each case and emit `categories` from `getShowcase`**

In `DREAM_CASES`, add a `category` to each object:
- `partner` → `category: 'co-thinking'`
- `weekend` → `category: 'launch'`
- `routine` → `category: 'flow'`
- `brain` → `category: 'knowledge'`

In `REAL_CASES`, add a `category` to each object:
- `echo` → `category: 'dictation'`
- `lms` → `category: 'platform'`
- `canvas` → `category: 'launch'`
- `brain` → `category: 'knowledge'`

(Place `category` right after the `tag: { … }` field in each object.)

In `getShowcase`, add `category: c.category` to both `.map(...)` resolvers, and compute `categories`. The function body becomes:

```ts
export function getShowcase(locale: Locale): ShowcaseVM {
  const L: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  const used = new Set<CategoryKey>([...REAL_CASES, ...DREAM_CASES].map(c => c.category))
  return {
    label: LABEL[L],
    video: { source: resolveVideoSource(VIDEO.url), poster: VIDEO.poster, caption: VIDEO.caption[L] },
    real: {
      heading: REAL_HEADING[L],
      cases: REAL_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], category: c.category, result: c.result[L], author: c.author[L], href: c.href })),
    },
    dream: {
      heading: DREAM_HEADING[L],
      cases: DREAM_CASES.map(c => ({ id: c.id, icon: c.icon, title: c.title[L], blurb: c.blurb[L], tag: c.tag[L], category: c.category, href: c.href })),
    },
    categories: CATEGORIES.filter(c => used.has(c.key)).map(c => ({ key: c.key, label: c.label[L] })),
    cta: CTA[L],
  }
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts`
Expected: PASS — all category + filter tests green, existing showcase tests still green.

- [ ] **Step 7: Run the full suite to confirm no regression**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/showcase.ts LMS/tochka-sborki/web/lib/course/showcase.test.ts
git commit -m "feat(showcase): category model + filterByCategory helper (fb_e9649b38d80e)"
```

---

### Task 2: Client filter component + gallery rewire

**Files:**
- Create: `LMS/tochka-sborki/web/components/showcase-filter.tsx`
- Modify: `LMS/tochka-sborki/web/components/showcase-gallery.tsx`

**Interfaces:**
- Consumes (from Task 1): `ShowcaseVM`, `CatFilter`, `filterByCategory`, `ResolvedCategory`, per-case `category`, `getShowcase`.
- Produces: `export function ShowcaseFilter({ data, locale }: { data: ShowcaseVM; locale: Locale })`.

- [ ] **Step 1: Create the client filter component**

Create `components/showcase-filter.tsx` with the full content below. The card/grid/subHeading styles and the real/dream/CTA markup are moved verbatim from the current `showcase-gallery.tsx` (only the data source changes to the filtered lists, and a tab bar is added above):

```tsx
'use client'

import { useState } from 'react'
import type { ShowcaseVM, CatFilter } from '@/lib/course/showcase'
import { filterByCategory } from '@/lib/course/showcase'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseFilter({ data, locale }: { data: ShowcaseVM; locale: Locale }) {
  const [active, setActive] = useState<CatFilter>('all')
  const intakeHref = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'
  const deepDive = locale === 'en' ? '→ deep-dive' : '→ разбор'
  const allLabel = locale === 'en' ? 'All' : 'Все'
  const groupLabel = locale === 'en' ? 'Filter by category' : 'Фильтр по категории'

  const card: React.CSSProperties = {
    display: 'block', padding: '1.2rem', borderRadius: 12,
    border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
    color: 'inherit', textDecoration: 'none',
  }
  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
  }
  const subHeading: React.CSSProperties = { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '1.6rem' }
  const tab = (selected: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
    padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
    border: '1px solid var(--border-color)',
    background: selected ? 'var(--text-accent)' : 'transparent',
    color: selected ? 'var(--text-on-accent)' : 'var(--text-secondary)',
  })

  const realCases = filterByCategory(data.real.cases, active)
  const dreamCases = filterByCategory(data.dream.cases, active)

  return (
    <>
      <div role="group" aria-label={groupLabel} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.6rem' }}>
        <button type="button" aria-pressed={active === 'all'} onClick={() => setActive('all')} style={tab(active === 'all')}>{allLabel}</button>
        {data.categories.map(c => (
          <button key={c.key} type="button" aria-pressed={active === c.key} onClick={() => setActive(c.key)} style={tab(active === c.key)}>{c.label}</button>
        ))}
      </div>

      {realCases.length > 0 && (
        <>
          <h2 style={subHeading}>{data.real.heading}</h2>
          <div style={{ ...grid, marginBottom: '2.5rem' }}>
            {realCases.map(c => {
              const inner = (
                <>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.result}</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>— {c.author}</span>
                  </div>
                  {c.href && <div style={{ marginTop: '0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>{deepDive}</div>}
                </>
              )
              return c.href
                ? <a key={c.id} href={c.href} style={card}>{inner}</a>
                : <div key={c.id} style={card}>{inner}</div>
            })}
          </div>
        </>
      )}

      {dreamCases.length > 0 && (
        <>
          <h2 style={subHeading}>{data.dream.heading}</h2>
          <div style={grid}>
            {dreamCases.map(c => {
              const inner = (
                <>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
                </>
              )
              return c.href
                ? <a key={c.id} href={c.href} style={card}>{inner}</a>
                : <div key={c.id} style={card}>{inner}</div>
            })}
          </div>
        </>
      )}

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <a href={intakeHref} style={{ display: 'inline-block', background: 'var(--text-accent)', color: 'var(--text-on-accent)', fontWeight: 700, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>{data.cta}</a>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Rewire the gallery to the server shell**

Replace the entire content of `components/showcase-gallery.tsx` with:

```tsx
import { getShowcase } from '@/lib/course/showcase'
import { ShowcaseVideo } from '@/components/showcase-video'
import { ShowcaseFilter } from '@/components/showcase-filter'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseGallery({ locale }: { locale: Locale }) {
  const t = getShowcase(locale)

  return (
    <section className="home-section" style={{ padding: 'var(--section-gap) 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.6rem' }}>{t.label}</div>

        <ShowcaseVideo source={t.video.source} poster={t.video.poster} caption={t.video.caption} title={t.real.heading} />

        <ShowcaseFilter data={t} locale={locale} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — full typecheck succeeds and static export emits `out/index.html` and `out/en/index.html` (the home page hosts the gallery). No type errors on `data.categories`, `c.category`, or `CatFilter`.

- [ ] **Step 4: Run the full test suite**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (no test consumes the gallery component directly; this confirms nothing else regressed).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/components/showcase-filter.tsx LMS/tochka-sborki/web/components/showcase-gallery.tsx
git commit -m "feat(showcase): category filter tab bar over gallery (fb_e9649b38d80e)"
```

---

## Self-Review

**Spec coverage:**
- Category set + `category` field + bilingual labels → Task 1 (Steps 3–5). ✓
- `categories` on VM, registry order, only-used keys, ≥1 case per tab → Task 1 (Step 5 + tests Step 1). ✓
- `filterByCategory` pure helper + tests → Task 1 (Steps 3, 1). ✓
- `'use client'` filter component, tab bar filters both grids, empty section hidden, real/dream preserved, CTA unchanged → Task 2 (Step 1). ✓
- Gallery becomes server shell (label + video) delegating to filter → Task 2 (Step 2). ✓
- Validation by `next build` (embed already on home page) → Task 2 (Step 3). ✓
- Carve (no replays/thumbnails/`/showcase`/Manus taxonomy) → respected; nothing in the plan adds them. ✓

**Placeholder scan:** none — all code is complete and verbatim.

**Type consistency:** `CategoryKey`, `CatFilter`, `ResolvedCategory`, `CATEGORY_KEYS`, `filterByCategory`, and `ShowcaseVM.categories` are defined in Task 1 and consumed with the same names/signatures in Task 2. The resolved cases carry `category: CategoryKey`, matching `filterByCategory`'s `T extends { category: CategoryKey }` constraint. `Locale` imported from `@/lib/intake/types` (matching the existing gallery import). ✓
