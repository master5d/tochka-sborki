# `<WillWont>` Expectation-Contract Engine — Design

**Ticket:** `fb_797eef868c61` (reusable anti-fluff "will / won't" honest-expectation
device for course/lesson/event intros — engine + course data).

**Date:** 2026-06-23

## Goal

Give the content engine a reusable "what WILL be covered / what will NOT be" block —
an honest expectation contract that builds trust through candor (aligned with the
authenticity boundary, not hype). Usable in any lesson/module/event intro via MDX, and
seeded with one real placement: the course-intro contract at the start of module 01.

## Honest-triage note (verified — this scoped the ticket)

- The landing already renders this exact device: `components/program-venn.tsx` (mounted
  in `home-page.tsx:207`) shows `inLabel «то, что будет»` / `outLabel «то, чего не
  будет»` + `items[]` (included) / `excluded[]` (excluded) + `provoc` (the punchline),
  driven by `getDictionary(locale).venn`. **The landing case is done.**
- The genuine gap: `ProgramVenn` is a one-off landing section (hardcoded Venn geometry,
  coupled to the `venn` dictionary). It is NOT reusable for lesson/module/event intros.
  This ticket builds the reusable form — a simpler two-column block, distinct from the Venn.
- **MDX prop constraint (known gotcha, `reference_mdx_remote_inline_props`):**
  `next-mdx-remote@6` does not deliver inline array/object props (`will={[…]}` →
  `undefined` → build fails). Only string props work. → data in a `lib/` module, fed by
  a string-prop wrapper (the `AnnotatedExample`+`PromptAnatomy` pattern).
- Modules have no intro page — a module slug redirects to its first unit
  (`ModuleRedirect`). So a "module intro" lives at the top of the first unit's MDX.
  Module 01 `u1-activation` ("Твой опыт с AI") is the course entry point; its top (after
  the agent-agnostic tip blockquote, before the first `<Phase>`) is the natural
  course-intro contract placement.

## Decisions locked during brainstorming

1. **Engine + course-data split** (the ticket asks for it; mirrors AnnotatedExample
   engine + PromptAnatomy wrapper). Generic presentational `WillWontBlock`; bilingual
   keyed data in `lib/content/will-wont.ts`; string-prop wrapper `<WillWont id locale>`.
2. **Two-column block** (Будет ✓ / Не будет ✗), NOT a Venn — simpler, content-first,
   responsive (stacks on mobile). Distinct from the landing's `ProgramVenn`.
3. **Items are plain strings** (YAGNI — no per-item notes).
4. **Column labels are generic props** on the engine (`willLabel`/`wontLabel`), supplied
   per-locale by the data module — the engine stays copy-agnostic and fully reusable.
5. **Seed one entry, `course-intro`**, with authenticity-aligned Точка Сборки copy.
   **Explicitly NO income-flex** ("100k за неделю") — the source's income claims and
   web-design niche are excluded per the ticket; we take the device, not the promises.
6. **Placement:** module 01 `u1-activation` (RU+EN), the course entry.
7. Static export, no server/data/migration, no new dependency.

## Components

### `lib/content/will-wont.ts` (pure)

```ts
import type { Locale } from '@/lib/intake/types'

export interface WillWontVM {
  heading: string
  willLabel: string
  wontLabel: string
  will: string[]
  wont: string[]
  punchline?: string
}

// per-entry bilingual content (heading/will/wont/punchline), keyed by id
export const WILL_WONT: Record<string, Record<Locale, {
  heading: string; will: string[]; wont: string[]; punchline?: string
}>>

// generic column labels per locale (Будет / Не будет)
export const LABELS: Record<Locale, { will: string; wont: string }>

export function getWillWont(id: string, locale: Locale): WillWontVM | null
```

- `getWillWont(id, locale)`: if `WILL_WONT[id]` is missing → `null` (graceful — wrapper
  renders nothing). Otherwise compose the entry's `heading/will/wont/punchline` for the
  locale with `LABELS[locale]` into a `WillWontVM`.
- Locale guard: `locale === 'en' ? 'en' : 'ru'` (same as `getShowcase`/`getPromptAnatomy`).

**Seed `course-intro` (RU source; EN mirror in the plan):**

- heading RU `Честный контракт` / EN `An honest deal`.
- LABELS RU `{ will: 'Будет', wont: 'Не будет' }` / EN `{ will: 'Will', wont: "Won't" }`.
- will (RU): соберёшь рабочую штуку своими руками (бот, лендинг, автоматизация) ·
  научишься писать задачу для AI и держать цикл · выберешь стек под себя — платный
  или суверенный · пройдёшь путь от первого промпта до агента.
- wont (RU): обещаний «100к за неделю» и income-flex · воды и пересказа документации ·
  волшебной кнопки «сделай за меня» · привязки к одному вендору.
- punchline RU: `Без воды и без хайпа — честный обмен: ты вкладываешь внимание, курс даёт навык.`

### `components/will-wont-block.tsx` (server component, presentational — the engine)

```tsx
export function WillWontBlock(props: {
  heading?: string
  willLabel: string
  wontLabel: string
  will: string[]
  wont: string[]
  punchline?: string
}): React.JSX.Element
```

- Optional `heading` (mono eyebrow / bold title).
- Two columns in a grid (`repeat(auto-fit, minmax(240px,1fr))` or `1fr 1fr`): the WILL
  column (each item prefixed `✓`, accent color) and the WON'T column (each item prefixed
  `✗`, muted `--text-secondary`). Column tops show `willLabel` / `wontLabel`.
- Optional `punchline` below, emphasized (accent).
- Responsive: inline `<style>` `@media (max-width:720px){ .willwont-grid{grid-template-columns:1fr } }`.
- CSS vars only; check/cross glyphs `aria-hidden`; labels/items are real text.

### `components/will-wont.tsx` (server wrapper) + registration

```tsx
import { getWillWont } from '@/lib/content/will-wont'
import { WillWontBlock } from '@/components/will-wont-block'
import type { Locale } from '@/lib/intake/types'

export function WillWont({ id, locale }: { id: string; locale: Locale }) {
  const vm = getWillWont(id, locale)
  return vm ? <WillWontBlock {...vm} /> : null
}
```

Registered in `components/mdx-components.tsx` (`import { WillWont }` + `WillWont,`).

### MDX insertions (2 files)

- `content/ru/01-*/u1-activation.mdx`: `<WillWont id="course-intro" locale="ru" />`
  after the agent-agnostic `> 💡` tip blockquote, before the first `<Phase type="activation">`.
- `content/en/01-*/u1-activation.mdx`: `<WillWont id="course-intro" locale="en" />`
  at the mirror position.

## Data flow

```
unit .mdx → <WillWont id="course-intro" locale/>
  → getWillWont(id, locale) → WillWontVM | null
    → null ? (nothing) : <WillWontBlock heading willLabel wontLabel will wont punchline/>
      → two-column Будет/Не будет block + punchline
```

## Edge cases

- **Unknown `id`** → `getWillWont` returns `null` → wrapper renders nothing (no throw).
- **Unknown locale** → guard defaults to ru.
- **No punchline** (`punchline` undefined) → the punchline line is omitted.
- **Narrow viewport** → columns stack.

## Testing (vitest env=node — pure data only)

`lib/content/will-wont.test.ts`:
- `getWillWont('course-intro', 'ru')` and `('en')` → `heading`, `willLabel`, `wontLabel`,
  `punchline` non-empty; `will.length >= 1` and `wont.length >= 1`, every item non-empty.
- `getWillWont('does-not-exist', 'ru')` → `null`.
- ru and en differ (`heading` ru ≠ en; `will[0]` ru ≠ en).

`WillWontBlock` and the wrapper are verified by a green `npm run build` (repo convention).

## Files

| File | Responsibility |
|---|---|
| `lib/content/will-wont.ts` | `WillWontVM`, `WILL_WONT` keyed data, `LABELS`, `getWillWont` |
| `lib/content/will-wont.test.ts` | data tests |
| `components/will-wont-block.tsx` | presentational two-column engine |
| `components/will-wont.tsx` | string-prop wrapper feeding the engine |
| `components/mdx-components.tsx` | register `WillWont` |
| `content/{ru,en}/01-*/u1-activation.mdx` | course-intro placement |

No server, data, migration, or new dependency. ~3 TDD tasks.

## Out of scope

- Touching `ProgramVenn` (the landing's will/won't device stays as-is).
- Authoring will/won't blocks for other modules/events — YAGNI; one seed entry now, the
  keyed map makes adding more trivial.
- Per-item notes / icons beyond ✓/✗ — YAGNI.
- An income/earnings claim of any kind — explicitly excluded by the ticket.
