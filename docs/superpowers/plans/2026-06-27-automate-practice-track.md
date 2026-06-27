# SOP "Document & Automate Your Practice" Exercise Track Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append a second optional, de-hustled "document & automate your practice" exercise track to the `/exercises` page, bilingual (ru + en), take-the-routine-off-your-hands framing.

**Architecture:** Pure content. The track is plain Markdown appended to both `content/ru/exercises.mdx` and `content/en/exercises.mdx` (rendered by the existing `/exercises` route), after the existing package-expertise track, with a one-line frontmatter `description` update in each. A content-presence test pins the track's presence and bilingual mirroring. No engine, component, or data-flow change.

**Tech Stack:** Next.js (static export, MDX content), Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en, mirrored (same track, both locales).
- Content, not engine: no change to `lib/cs/*`, `lib/course/niche-map.ts`, or any component.
- Plain Markdown only (no MDX components) — matches the existing `exercises.mdx`.
- Additive: append the track after the existing package-expertise track; do not alter exercises 1–8 or the package-expertise track. The only non-append edit is the one-line frontmatter `description` update in each file.
- Authenticity: de-hustled, take-the-routine-off-your-hands; no "replace yourself" / content-mill / 10x-output / passive-income framing. Use the approved copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration.
- Run tests from `LMS/tochka-sborki/web/`: `npx vitest run`. Build: `npm run build`.

---

### Task 1: append the bilingual track + content-presence test

**Files:**
- Modify: `LMS/tochka-sborki/web/content/ru/exercises.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/exercises.mdx`
- Test: `LMS/tochka-sborki/web/lib/content/automate-track.test.ts` (new)

**Interfaces:** none (content + a self-contained file-reading test). Mirrors the existing `lib/content/package-track.test.ts` idiom.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/content/automate-track.test.ts`. It reads the raw MDX files relative to its own location (same idiom as `package-track.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT = join(HERE, '..', '..', 'content') // web/content
const read = (loc: 'ru' | 'en') => readFileSync(join(CONTENT, loc, 'exercises.mdx'), 'utf8')

const ANCHORS = [
  'sop-1-pick.md', 'sop-2-document.md', 'sop-3-automate.md',
  'sop-4-build.md', 'sop-5-live.md',
]

describe('automate-practice track', () => {
  it('ru exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('ru')
    expect(src).toContain('Задокументируй и автоматизируй свою практику')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('en exercises.mdx contains the track heading and all five save-anchors', () => {
    const src = read('en')
    expect(src).toContain('Document and automate your practice')
    for (const a of ANCHORS) expect(src).toContain(a)
  })
  it('the ru and en intro markers differ (bilingual, not a copy)', () => {
    expect(read('ru')).toContain('контент-конвейер')
    expect(read('en')).toContain('content mill')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/automate-track.test.ts`
Expected: FAIL — the track is not in either file yet (`toContain` assertions fail).

- [ ] **Step 3: Append the ru track + update ru frontmatter**

In `content/ru/exercises.mdx`:

(a) Change the frontmatter `description` line to exactly:

```
description: "8 упражнений для закрепления уровней 1–4 + опциональные треки: «упакуй экспертизу» и «автоматизируй практику»"
```

(b) Append at the very end of the file (after the package-expertise track's closing blockquote), exactly:

```markdown
---

## 🔧 Трек (опционально): Задокументируй и автоматизируй свою практику

> «Сними рутину с рук — чтобы осталось время на человеческое.»

Этот трек — для тех, у кого есть повторяющаяся практика: коуч, мастер, фрилансер, маленькая команда. Цель — **не** «заменить себя» и не построить контент-конвейер, а снять с себя нудную повторяющуюся часть, чтобы осталось время на то, что умеешь только ты. ИИ берёт на себя писанину и рутину; суждение и живой контакт остаются за тобой. Делай по одному шагу, сохраняй результат в `my-experiments/`.

### Шаг 1. Выбери одну повторяющуюся задачу

**Цель:** одна задача, не весь бизнес.

Выбери из меню одну вещь, которую ты делаешь снова и снова:

- онбординг нового клиента
- еженедельный отчёт или сводка
- ответы на частые вопросы
- подготовка и публикация поста
- выставление счёта / напоминание об оплате

Возьми ровно одну — самую надоевшую. Запиши выбор в `my-experiments/sop-1-pick.md`.

### Шаг 2. Расскажи её вслух — собери SOP с ИИ

**Цель:** превратить «то, что в голове» в понятные шаги.

Опиши агенту, как ты делаешь эту задачу — своими словами, как рассказал бы коллеге. Попроси разложить это в простой SOP: шаги, входы, что считается «готово». Ты правишь и держишь смысл; агент оформляет. Сохрани SOP в `my-experiments/sop-2-document.md`.

### Шаг 3. Найди, что можно отдать машине

**Цель:** отделить рутину от суждения.

Пройдись по SOP и отметь: где механическая рутина (формат, копипаст, шаблон), а где нужно твоё суждение или живой контакт. Автоматизируй рутину — человеческое оставь человеку. Выпиши, что именно отдаёшь машине, в `my-experiments/sop-3-automate.md`.

### Шаг 4. Собери одну маленькую автоматизацию

**Цель:** один рабочий кусочек, не вся система.

Собери vibe-кодингом или промптом одну автоматизацию из шага 3 — шаблон письма, скрипт-заготовку, чек-лист-генератор. Не «весь процесс», а один честный кусок, который реально экономит время. Проверь на настоящей задаче. Сохрани в `my-experiments/sop-4-build.md`.

### Шаг 5. Оставь это живым

**Цель:** не свалить в архив.

Используй SOP и автоматизацию на следующей реальной задаче и поправь то, что не сошлось. Это не «готовый продукт», а живой инструмент, который растёт с практикой. Запиши, что улучшил, в `my-experiments/sop-5-live.md`.

> Готово. Ты не заменил себя — ты убрал рутину с дороги, чтобы делать то, ради чего тебя зовут.
```

- [ ] **Step 4: Append the en track + update en frontmatter**

In `content/en/exercises.mdx`:

(a) Change the frontmatter `description` line to exactly:

```
description: "8 exercises to consolidate levels 1–4 + optional tracks: \"package your expertise\" and \"automate your practice\""
```

(b) Append at the very end of the file (after the package-expertise track's closing blockquote), exactly:

```markdown
---

## 🔧 Track (optional): Document and automate your practice

> "Take the routine off your hands — so there's time left for the human part."

This track is for anyone with a repeating practice: a coach, a maker, a freelancer, a small team. The goal is **not** to "replace yourself" or build a content mill — it's to lift the dull, repetitive part off you so you have time for what only you can do. AI takes the paperwork and the routine; the judgment and the human contact stay with you. Take one step at a time and save your work to `my-experiments/`.

### Step 1. Pick one recurring task

**Goal:** one task, not the whole business.

Pick one thing from the menu that you do again and again:

- onboarding a new client
- a weekly report or summary
- answering frequent questions
- preparing and publishing a post
- invoicing / payment reminders

Take exactly one — the one you're most tired of. Note your choice in `my-experiments/sop-1-pick.md`.

### Step 2. Say it out loud — build the SOP with AI

**Goal:** turn "what's in your head" into clear steps.

Describe to the agent how you do this task — in your own words, the way you'd tell a colleague. Ask it to lay this out as a simple SOP: steps, inputs, what counts as "done". You edit and hold the meaning; the agent does the formatting. Save the SOP to `my-experiments/sop-2-document.md`.

### Step 3. Find what you can hand to the machine

**Goal:** separate routine from judgment.

Walk through the SOP and mark it: where is mechanical routine (formatting, copy-paste, templates), and where does it need your judgment or a human touch. Automate the routine — leave the human part to the human. Write down exactly what you're handing to the machine in `my-experiments/sop-3-automate.md`.

### Step 4. Build one small automation

**Goal:** one working piece, not the whole system.

Vibe-code or prompt one automation from Step 3 — an email template, a script stub, a checklist generator. Not "the whole process", just one honest piece that actually saves time. Test it on a real task. Save it to `my-experiments/sop-4-build.md`.

### Step 5. Keep it alive

**Goal:** don't dump it in an archive.

Use the SOP and the automation on your next real task and fix what didn't fit. It's not a "finished product" but a living tool that grows with your practice. Note what you improved in `my-experiments/sop-5-live.md`.

> Done. You didn't replace yourself — you cleared the routine out of the way so you can do what you're actually called for.
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/automate-track.test.ts`
Expected: PASS — both files contain the track heading + five anchors, ru/en intro markers present.

- [ ] **Step 6: Run the full suite to confirm no regression**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (including the package-track test and any content drift-guard tests; the track is in `exercises.mdx`, a hands-on file, not a reflection phase, so "save/write/build" verbs are allowed).

- [ ] **Step 7: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — MDX compiles and static export emits `/exercises` and `/en/exercises` with both optional tracks. No MDX parse error (the section uses only headings, blockquotes, bold, a bullet list, inline code, and `---`).

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/content/ru/exercises.mdx LMS/tochka-sborki/web/content/en/exercises.mdx LMS/tochka-sborki/web/lib/content/automate-track.test.ts
git commit -m "feat(course): optional document-and-automate-your-practice exercise track (fb_c008570dbf9b)"
```

---

## Self-Review

**Spec coverage:**
- Optional track appended to both `exercises.mdx`, after the package-expertise track → Task 1 (Steps 3-4). ✓
- Approved copy verbatim (ru + en, intro + 5 steps + closing) → Task 1 (Steps 3-4). ✓
- Frontmatter `description` one-line update each (now mentions both tracks) → Task 1 (Steps 3a, 4a). ✓
- Content-presence + bilingual test (heading + 5 anchors + ru/en markers) → Task 1 (Step 1). ✓
- Validation by `next build` (MDX compile + /exercises export) → Task 1 (Step 7). ✓
- Trimmed SOP-topic menu (5-item bullet list, pick one) → Task 1 (Step 3b / 4b, Шаг 1 / Step 1). ✓
- Carve (no engine/niche/page/component/n8n) → respected; nothing added. ✓
- Plain Markdown only (no MDX components) → the appended section uses only headings/blockquote/bold/bullet-list/code/`---`. ✓

**Placeholder scan:** none — all copy complete and verbatim.

**Type consistency:** the test is self-contained (file reads, no imports from app code); the `ANCHORS` list matches the five save-targets authored in Steps 3-4 (`sop-1-pick.md` … `sop-5-live.md`). The bilingual markers in Step 1 of the test (`контент-конвейер` / `content mill`) appear verbatim in the intro paragraphs of Steps 3b / 4b. ✓
