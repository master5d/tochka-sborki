# Possibility-Menu Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the landing showcase's `DREAM_CASES` possibility-menu (4 → 10) with curated, de-hustled, course-fit cards covering all 6 categories, reusing the shipped gallery + category filter.

**Architecture:** Pure data. Append 6 `ShowcaseCase` entries to `DREAM_CASES` in `lib/course/showcase.ts`; the existing `getShowcase` VM, `showcase-gallery.tsx`, and `showcase-filter.tsx` render/filter them unchanged. Extend `lib/course/showcase.test.ts` to pin the expansion, category coverage, bilingual completeness, id-uniqueness, and the de-hustle guard.

**Tech Stack:** Next.js (static export), TypeScript, Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en (every new case a `Bi` pair).
- Pure data + test; reuse the shipped gallery/filter — NO component or filter change.
- Additive: append to `DREAM_CASES`; the existing 4 dream cards (`partner`/`weekend`/`routine`/`brain`), all `REAL_CASES`, the categories registry, and the filter stay byte-identical.
- Authenticity: de-hustled, possibility-not-income; use the approved copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- The 6 `CategoryKey`s are existing (`co-thinking`/`launch`/`flow`/`knowledge`/`dictation`/`platform`); each new case reuses one. New ids must be unique vs existing dream + real ids.

---

### Task 1: append 6 dream cases + extend the showcase test

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/course/showcase.ts`
- Test: `LMS/tochka-sborki/web/lib/course/showcase.test.ts` (extend the existing file)

**Interfaces:** none (data + a test against the existing `getShowcase` / `CATEGORY_KEYS` exports).

- [ ] **Step 1: Add the failing test (extend the existing file)**

Open `LMS/tochka-sborki/web/lib/course/showcase.test.ts`. It already imports `getShowcase` and `CATEGORY_KEYS` from `./showcase` (line 2). Append this `describe` block at the end of the file:

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

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts`
Expected: FAIL — the first test fails (`dream.length` is 4, not ≥10; categories `dictation`/`platform` missing from dream).

- [ ] **Step 3: Append the 6 dream cases**

In `lib/course/showcase.ts`, append these entries to the `DREAM_CASES` array, immediately after the existing `brain` entry (and before the closing `]`), verbatim:

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

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/showcase.test.ts`
Expected: PASS — 10 dream cases, all 6 categories covered, bilingual, de-hustled, unique ids. (Existing showcase tests stay green — the `categories` test's no-empty-tab invariant still holds since every category now has cards.)

- [ ] **Step 5: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 6: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the new `ShowcaseCase` entries (each uses a valid `CategoryKey`); static export of the landing compiles with the expanded gallery.

- [ ] **Step 7: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/showcase.ts LMS/tochka-sborki/web/lib/course/showcase.test.ts
git commit -m "feat(course): expand the de-hustled possibility-menu (fb_2e206493af2b)"
```

---

## Self-Review

**Spec coverage:**
- 6 new `DREAM_CASES` (4 → 10), all 6 categories → Task 1 (Step 3). ✓
- Bilingual, possibility-framed, verbatim copy → Task 1 (Step 3) literal block. ✓
- Test: count ≥10 + category coverage + bilingual + de-hustle guard + unique ids → Task 1 (Step 1). ✓
- Build-validated → Task 1 (Step 6). ✓
- Additive (existing 4 dream + real + categories + filter unchanged) → respected. ✓
- Carve (no 200+ dump / route / niche-map / new categories) → nothing added. ✓

**Placeholder scan:** none — all 6 cases complete with full bilingual copy.

**Type consistency:** each new entry matches the `ShowcaseCase` shape (`id`, `icon`, `title: Bi`, `blurb: Bi`, `tag: Bi`, `category: CategoryKey`); every `category` is one of the existing 6 `CategoryKey`s. New ids (`dictate`/`tool`/`orient`/`untangle`/`gift`/`conveyor`) are distinct from the existing dream ids (`partner`/`weekend`/`routine`/`brain`) — the unique-id test guards collisions within dream. The test uses the existing `getShowcase` / `CATEGORY_KEYS` imports (already present in the file). ✓
