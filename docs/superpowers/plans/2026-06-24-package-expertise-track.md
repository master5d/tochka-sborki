# Package-Expertise Exercise Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append an optional, de-hustled "package your expertise into a product" exercise track to the `/exercises` page, bilingual (ru + en), build-to-serve framing.

**Architecture:** Pure content. The track is plain Markdown appended to both `content/ru/exercises.mdx` and `content/en/exercises.mdx` (rendered by the existing `/exercises` route), with a one-line frontmatter `description` update in each. A content-presence test pins the track's presence and bilingual mirroring. No engine, component, or data-flow change.

**Tech Stack:** Next.js (static export, MDX content), Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en, mirrored (same track, both locales).
- Content, not engine: no change to `lib/cs/*`, `lib/course/niche-map.ts`, or any component.
- Plain Markdown only (no MDX components) — matches the existing `exercises.mdx`.
- Additive: append the track after the existing numbered exercises 1–8; do not alter them. The only non-append edit is the one-line frontmatter `description` update in each file.
- Authenticity: de-hustled, build-to-serve; no scarcity / manipulative sales copy / funnel tactics. Use the approved copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- Run tests from `LMS/tochka-sborki/web/`: `npx vitest run`. Build: `npm run build`.

---

### Task 1: append the bilingual track + content-presence test

**Files:**
- Modify: `LMS/tochka-sborki/web/content/ru/exercises.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/exercises.mdx`
- Test: `LMS/tochka-sborki/web/lib/content/package-track.test.ts` (new)

**Interfaces:** none (content + a self-contained file-reading test).

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/content/package-track.test.ts`. It reads the raw MDX files relative to its own location (same idiom as `reflection-prompts.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT = join(HERE, '..', '..', 'content') // web/content
const read = (loc: 'ru' | 'en') => readFileSync(join(CONTENT, loc, 'exercises.mdx'), 'utf8')

const ANCHORS = [
  'offer-1-gift.md', 'offer-2-core.md', 'offer-3-design.md',
  'offer-4-build.md', 'offer-5-share.md',
]

describe('package-expertise track', () => {
  it('ru exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('ru')
    expect(src).toContain('Упакуй свою экспертизу в продукт')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('en exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('en')
    expect(src).toContain('Package your expertise into a product')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('the ru and en intro lines differ (bilingual, not a copy)', () => {
    expect(read('ru')).toContain('машина для денег')
    expect(read('en')).toContain('money machine')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/package-track.test.ts`
Expected: FAIL — the track is not in either file yet (`toContain` assertions fail).

- [ ] **Step 3: Append the ru track + update ru frontmatter**

In `content/ru/exercises.mdx`:

(a) Change the frontmatter `description` line to:

```
description: "8 упражнений для закрепления уровней 1–4 + опциональный трек «упакуй экспертизу»"
```

(b) Append at the very end of the file (after the last numbered exercise), exactly:

```markdown
---

## 🎁 Трек (опционально): Упакуй свою экспертизу в продукт

> «Усиливай свой голос, не заменяй его.»

Этот трек — для коучей, экспертов, практиков, целителей: тех, у кого уже есть дар, и кто хочет, чтобы он дошёл до большего числа людей. Это **не** «машина для денег» и не воронка с фейк-дедлайнами. Это про то, чтобы собрать и поделиться тем, что ты уже умеешь — твоим голосом, а ИИ берёт на себя оформление, а не подмену. Делай по одному шагу, сохраняй результат в `my-experiments/`.

### Шаг 1. Назови свой дар

**Цель:** одним абзацем, без оффер-копи.

Ответь честно: что ты даёшь людям, кому именно, какой сдвиг у них происходит. Не «продающий текст» — простая правда. Сохрани в `my-experiments/offer-1-gift.md`.

### Шаг 2. Найди повторяющийся запрос

**Цель:** найти ядро будущего продукта.

С каким вопросом или болью к тебе приходят снова и снова? Этот повторяющийся запрос — и есть то, что стоит упаковать первым. Выпиши три таких запроса и выбери один. Сохрани в `my-experiments/offer-2-core.md`.

### Шаг 3. Спроектируй с ИИ-напарником

**Цель:** структура, где ведёшь ты.

Возьми навык из модуля 4 (промпт-инжиниринг) и попроси агента помочь разложить твой ответ на запрос в понятную структуру — программу, гайд или мини-курс. Ты держишь смысл и голос; агент оформляет. Если он начинает писать за тебя «как надо продавать» — останови: тебе нужна структура, не манипуляция. Сохрани черновик в `my-experiments/offer-3-design.md`.

### Шаг 4. Собери первую версию

**Цель:** маленький честный объём.

Собери vibe-кодингом первую рабочую версию — лендинг, гайд в PDF, или одну страницу с твоим оффером. Не «идеально» и не «на всю программу» — ровно столько, чтобы реальный человек мог это получить и попробовать. Сохрани ссылку/файл в `my-experiments/offer-4-build.md`.

### Шаг 5. Поделись, не впаривай

**Цель:** пригласить, а не надавить.

Покажи это нескольким людям, которым оно действительно полезно. Без scarcity, без обратных отсчётов, без «осталось 2 места». Просто: «я собрал вот это, думаю, тебе пригодится». Собери честную обратную связь и вернись к шагу 3 — это цикл, а не финиш. Запиши, что узнал, в `my-experiments/offer-5-share.md`.

> Готово. Ты не построил «воронку» — ты дал своему дару дойти до людей, оставшись собой.
```

- [ ] **Step 4: Append the en track + update en frontmatter**

In `content/en/exercises.mdx`:

(a) Change the frontmatter `description` line to:

```
description: "8 exercises to consolidate levels 1–4 + an optional \"package your expertise\" track"
```

(b) Append at the very end of the file, exactly:

```markdown
---

## 🎁 Track (optional): Package your expertise into a product

> "Amplify your voice, don't replace it."

This track is for coaches, experts, practitioners, healers — people who already have a gift and want it to reach more people. It is **not** a "money machine" or a funnel with fake deadlines. It's about gathering and sharing what you already do well — in your own voice, with AI handling the packaging, not the substitution. Take one step at a time and save your work to `my-experiments/`.

### Step 1. Name your gift

**Goal:** one paragraph, no sales copy.

Answer honestly: what do you give people, who exactly, what shift happens for them. Not a "sales pitch" — plain truth. Save to `my-experiments/offer-1-gift.md`.

### Step 2. Find the recurring ask

**Goal:** find the core of your future product.

What question or pain do people bring to you again and again? That recurring ask is what's worth packaging first. Write down three such asks and pick one. Save to `my-experiments/offer-2-core.md`.

### Step 3. Design it with your AI partner

**Goal:** structure where you lead.

Take the skill from Module 4 (prompt engineering) and ask the agent to help break your answer to that ask into a clear structure — a program, a guide, or a mini-course. You hold the meaning and the voice; the agent does the formatting. If it starts writing "how to sell" for you — stop it: you need structure, not manipulation. Save the draft to `my-experiments/offer-3-design.md`.

### Step 4. Build a first version

**Goal:** a small, honest scope.

Vibe-code a first working version — a landing page, a PDF guide, or a single page with your offer. Not "perfect" and not "the whole program" — just enough for a real person to receive it and try it. Save the link/file to `my-experiments/offer-4-build.md`.

### Step 5. Share, don't push

**Goal:** invite, don't pressure.

Show it to a few people it genuinely helps. No scarcity, no countdowns, no "2 spots left". Just: "I put this together, I think it'll be useful to you." Gather honest feedback and return to Step 3 — this is a loop, not a finish line. Note what you learned in `my-experiments/offer-5-share.md`.

> Done. You didn't build a "funnel" — you let your gift reach people while staying yourself.
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/package-track.test.ts`
Expected: PASS — both files contain the track heading + five anchors, ru/en intro markers present.

- [ ] **Step 6: Run the full suite to confirm no regression**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (including any content drift-guard tests; the track is in `exercises.mdx`, a hands-on file, not a reflection phase, so "save/write" verbs are allowed).

- [ ] **Step 7: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — MDX compiles and static export emits `/exercises` and `/en/exercises` with the track content. No MDX parse error (the section uses only headings, blockquotes, bold, inline code, and `---`).

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/content/ru/exercises.mdx LMS/tochka-sborki/web/content/en/exercises.mdx LMS/tochka-sborki/web/lib/content/package-track.test.ts
git commit -m "feat(course): optional package-your-expertise exercise track (fb_22027860e9eb)"
```

---

## Self-Review

**Spec coverage:**
- Optional track appended to both `exercises.mdx`, after numbered exercises → Task 1 (Steps 3-4). ✓
- Approved copy verbatim (ru + en, intro + 5 steps + closing) → Task 1 (Steps 3-4). ✓
- Frontmatter `description` one-line update each → Task 1 (Steps 3a, 4a). ✓
- Content-presence + bilingual test (heading + 5 anchors + ru/en markers) → Task 1 (Step 1). ✓
- Validation by `next build` (MDX compile + /exercises export) → Task 1 (Step 7). ✓
- Carve (no engine/niche/page/JTBD) → respected; nothing added. ✓
- Plain Markdown only (no MDX components) → the appended section uses only headings/blockquote/bold/code/`---`. ✓

**Placeholder scan:** none — all copy complete and verbatim.

**Type consistency:** the test is self-contained (file reads, no imports from app code); the `ANCHORS` list matches the five save-targets authored in Steps 3-4 (`offer-1-gift.md` … `offer-5-share.md`). ✓
