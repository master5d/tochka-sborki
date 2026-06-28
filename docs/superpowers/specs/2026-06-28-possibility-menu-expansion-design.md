# Possibility-menu expansion — Design

**Ticket:** `fb_2e206493af2b` (Mine 200+ AI money/side-hustle catalog into course
possibility-menu — showcase / niche use-cases).

**Date:** 2026-06-28

## Goal

Enrich the landing showcase's "what you can dream about" possibility-menu (`DREAM_CASES`) with
more curated, de-hustled, course-fit possibilities, so a learner who can't yet imagine what to
build sees a fuller menu — directly serving the headline barrier (imagination-not-translated-to-task)
and the "show the menu before they know what they want" principle. Reuses the existing showcase
gallery + category filter.

## Scope (carved by honest triage)

The ticket's literal "200+ AI money/side-hustle catalog" conflicts with the project's anti-hustle
authenticity (the whole de-hustle thread; possibility ≠ income-promise). We do NOT dump 200
money-making ideas. The honest, on-spec delta serving the ticket's deep purpose ("покажи меню до
вопроса чего хочешь" — the imagination barrier) is a **curated expansion of `DREAM_CASES`** with
de-hustled, course-fit aspirational cards, covering all 6 existing categories.

- **In scope:** add 6 new `DREAM_CASES` entries (4 → 10) in `lib/course/showcase.ts`, bilingual,
  possibility-framed, covering the 6 `CategoryKey`s (currently `dictation` + `platform` have no
  dream cards); extend `lib/course/showcase.test.ts`.
- **Out of scope (carved):**
  - The literal 200+ money/side-hustle catalog dump (anti-hustle; possibility not income).
  - A new `/possibilities` route (YAGNI — the showcase gallery + filter already exist).
  - Any `niche-map.ts` change or a new filter mechanic (the category filter is shipped).
  - New categories (the 6 course-fit `CategoryKey`s stand; this only fills/expands them).

## Architecture

Pure data. Append 6 entries to the `DREAM_CASES` array in `lib/course/showcase.ts` (same
`ShowcaseCase` shape: `{ id, icon, title: Bi, blurb: Bi, tag: Bi, category: CategoryKey }`). The
existing `getShowcase` VM, `showcase-gallery.tsx`, and `showcase-filter.tsx` render and filter
them unchanged. A test extension pins the expansion, category coverage, bilingual completeness,
id-uniqueness, and the de-hustle (no money-promise) guard.

## Component

### `lib/course/showcase.ts` (modified)

Append these 6 entries to `DREAM_CASES` (after the existing `brain` entry), verbatim:

```ts
  { id: 'dictate', icon: '🎙️',
    title: { ru: 'Голос вместо клавиатуры', en: 'Voice instead of keyboard' },
    blurb: { ru: 'Наговори мысли — агент превратит их в текст, заметки, черновик.', en: 'Speak your thoughts — the agent turns them into text, notes, a draft.' },
    tag: { ru: 'Диктовка', en: 'Dictation' },
    category: 'dictation' },
  { id: 'tool', icon: '🧰',
    title: { ru: 'Свой маленький инструмент', en: 'Your own little tool' },
    blurb: { ru: 'Собери приложение под свою задачу, которым пользуешься каждый день.', en: 'Build an app for your own task that you use every day.' },
    tag: { ru: 'Платформа', en: 'Platform' },
    category: 'platform' },
  { id: 'orient', icon: '🔎',
    title: { ru: 'Разобраться в новой теме', en: 'Get oriented in a new field' },
    blurb: { ru: 'Из нуля до ориентации в незнакомой области через ИИ-исследование.', en: 'From zero to oriented in an unfamiliar area through AI research.' },
    tag: { ru: 'Знание', en: 'Knowledge' },
    category: 'knowledge' },
  { id: 'untangle', icon: '🧭',
    title: { ru: 'Распутать сложное', en: 'Untangle the hard stuff' },
    blurb: { ru: 'Продумать трудное решение вслух с напарником, который задаёт правильные вопросы.', en: 'Think through a tough decision out loud with a partner that asks the right questions.' },
    tag: { ru: 'Со-мышление', en: 'Co-thinking' },
    category: 'co-thinking' },
  { id: 'gift', icon: '🎁',
    title: { ru: 'Поделись своим даром', en: 'Share your gift' },
    blurb: { ru: 'Упакуй то, что умеешь, в гайд или мини-курс, который реально кому-то поможет.', en: 'Package what you know into a guide or mini-course that genuinely helps someone.' },
    tag: { ru: 'Запуск', en: 'Launch' },
    category: 'launch' },
  { id: 'conveyor', icon: '🌊',
    title: { ru: 'Конвейер инсайтов', en: 'An insight conveyor' },
    blurb: { ru: 'Источники, которые ты читаешь, сами приносят тебе суть — без ручного перелопачивания.', en: 'The sources you read bring you the essence themselves — no manual digging.' },
    tag: { ru: 'Поток', en: 'Flow' },
    category: 'flow' },
```

Result: `DREAM_CASES` has 10 entries — co-thinking ×2 (`partner`, `untangle`), launch ×2
(`weekend`, `gift`), flow ×2 (`routine`, `conveyor`), knowledge ×2 (`brain`, `orient`),
dictation ×1 (`dictate`), platform ×1 (`tool`). All 6 categories now have ≥1 dream card.

### `lib/course/showcase.test.ts` (extend the existing file)

Add a `describe('possibility-menu (dream cases)')` block (the file already imports `getShowcase`
and `CATEGORY_KEYS`):

```ts
describe('possibility-menu (dream cases)', () => {
  const dream = getShowcase('ru').dream.cases
  const dreamEn = getShowcase('en').dream.cases

  it('is an expanded curated menu (>=10) covering all categories', () => {
    expect(dream.length).toBeGreaterThanOrEqual(10)
    expect(new Set(dream.map(c => c.category))).toEqual(new Set(CATEGORY_KEYS))
  })

  it('every dream case is bilingual non-empty', () => {
    for (const arr of [dream, dreamEn]) for (const c of arr) {
      expect(c.title.trim().length).toBeGreaterThan(0)
      expect(c.blurb.trim().length).toBeGreaterThan(0)
      expect(c.tag.trim().length).toBeGreaterThan(0)
    }
  })

  it('is de-hustled — no money-promise framing', () => {
    const banned = /(зараб|доход|деньг|прибыл|earn|income|\bmoney\b|profit|passive)/i
    for (const arr of [dream, dreamEn]) for (const c of arr) {
      expect(banned.test(c.title), `money framing in title: ${c.title}`).toBe(false)
      expect(banned.test(c.blurb), `money framing in blurb: ${c.blurb}`).toBe(false)
    }
  })

  it('dream case ids are unique', () => {
    const ids = dream.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

## Data flow

Static. `getShowcase(locale)` already maps `DREAM_CASES` into the VM; the gallery + filter render
the expanded set with no change. No endpoint, no client state.

## Authenticity (binding)

- De-hustled possibility-menu: possibilities, not income promises — NO money/side-hustle framing
  (enforced by the de-hustle test guard). The `gift` card mirrors the package-track's
  share-your-gift framing (help someone), not "make money".
- Honest: aspirational ("dream") cards stay in the dream section, distinct from the proof
  `REAL_CASES` — the real/dream separation is unchanged.

## Testing

- **`lib/course/showcase.test.ts` (extend):** dream count ≥10; dream cases cover every
  `CATEGORY_KEYS`; all dream cases bilingual non-empty (ru + en); de-hustle guard (no
  money-promise term in any dream title/blurb, both locales); dream ids unique.
- Validated by `npm run build` (static export of the landing).

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts` then the full
`npx vitest run`; plus `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en (every new case a `Bi` pair).
- Pure data + test; reuse the shipped gallery/filter — no component or filter change.
- Additive: append to `DREAM_CASES`; the existing 4 dream cards, all `REAL_CASES`, the categories
  registry, and the filter stay unchanged.
- Authenticity: de-hustled, possibility-not-income; approved copy verbatim.
- Frontend-only: LMS `web` CI job. No worker, no migration.

## Files

| File | Responsibility |
|---|---|
| `lib/course/showcase.ts` | append 6 de-hustled dream cases (4 → 10), all 6 categories |
| `lib/course/showcase.test.ts` (extend) | count + category coverage + bilingual + de-hustle + unique-id |

## Out of scope

- 200+ money/side-hustle catalog dump; `/possibilities` route; niche-map changes; new categories
  or filter mechanic.
