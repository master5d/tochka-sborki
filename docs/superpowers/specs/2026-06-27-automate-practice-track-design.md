# SOP "document & automate your practice" exercise track — Design

**Ticket:** `fb_c008570dbf9b` (Course exercise: "Document & automate your practice with AI" —
trimmed SOP-topic menu).

**Date:** 2026-06-27

## Goal

Add a second optional, de-hustled exercise track to the `/exercises` page: anyone with a
repeating practice uses the agentic-AI skills the course teaches to document one recurring task
as a simple SOP and automate the routine part of it. Framed take-the-routine-off-your-hands —
NOT "replace yourself" / not a content mill / not 10x-output hustle. Honors the authenticity
boundary (AI handles the drudgery; judgment and human contact stay with the person) and the
anti-dependency / amplify-your-voice through-line. Sibling to the existing
package-expertise track.

## Scope (carved by honest triage)

The honest, on-spec, live-consumer delta is a new **content** section in the existing
`/exercises` MDX (rendered route, plain Markdown) — the same proven mechanic that shipped the
package-expertise track. No engine, no component, no data module.

- **In scope:** one optional track section appended to `content/{ru,en}/exercises.mdx`
  (bilingual, mirrored), distinct from the existing numbered exercises 1–8 and from the
  package-expertise track; a content-presence test; a one-line frontmatter `description` update
  in each file (now mentions both optional tracks honestly).
- **Out of scope (deferred):**
  - Any change to the applied-challenge engine or `CHALLENGE_TEMPLATES`.
  - A new niche value / niche-skin in `niche-map.ts`.
  - A dedicated page or a bespoke track component (YAGNI — MDX section).
  - n8n / external automation wiring (the track teaches the learner to build their own; the
    course does not ship a runtime automation).

## Architecture

Pure content. The track is plain Markdown appended to both `content/ru/exercises.mdx` and
`content/en/exercises.mdx`, after the package-expertise track, rendered by the existing
`/exercises` route (no component, no data module — the file is plain Markdown today). The
frontmatter `description` is updated to mention both optional tracks. No engine, no route, no
data-flow change.

## Components

### `content/ru/exercises.mdx` (modified)

Update the frontmatter `description` to:
`"8 упражнений для закрепления уровней 1–4 + опциональные треки: «упакуй экспертизу» и «автоматизируй практику»"`

Append at the end of the file (after the package-expertise track), this section verbatim:

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

### `content/en/exercises.mdx` (modified)

Update the frontmatter `description` to:
`"8 exercises to consolidate levels 1–4 + optional tracks: \"package your expertise\" and \"automate your practice\""`

Append at the end of the file (after the package-expertise track), this section verbatim:

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

## Data flow

Static content. The `/exercises` route already loads and renders these MDX files; the appended
section renders with them. No endpoint, no data module, no client state.

## Error handling

None — plain Markdown. The MDX must still compile (the section uses only headings, blockquotes,
bold, bullet list, inline code, and a horizontal rule — no MDX components, matching the file's
existing plain-Markdown nature).

## Authenticity (binding)

- Take-the-routine-off-your-hands, NOT "replace yourself" / NOT a content mill / NOT
  10x-output / passive-income hustle. Explicitly negated in the intro paragraph.
- AI handles the drudgery; judgment and human contact stay with the person — baked into Step 3
  ("leave the human part to the human") and Step 5 (living tool, not a finished product).
- "Trimmed SOP-topic menu" (ticket) = a short curated 5-item menu in Step 1, not an exhaustive
  catalog; learner picks exactly one.
- Consistent with the anti-dependency / de-guru / amplify-your-voice thread and the sibling
  package-expertise track.

## Testing

- **`lib/content/automate-track.test.ts` (new):** read the raw `content/ru/exercises.mdx` and
  `content/en/exercises.mdx` files; assert each contains the track heading
  (`ru`: `Задокументируй и автоматизируй свою практику`; `en`: `Document and automate your
  practice`) and the five stable save-anchors (`sop-1-pick.md` … `sop-5-live.md`); assert the
  ru intro marker (`контент-конвейер`) and en intro marker (`content mill`) differ (bilingual,
  not a copy). This pins both presence and bilingual mirroring of the track.
- The section is plain content; it is validated by `npm run build` (MDX compile + static export
  of `/exercises` and `/en/exercises`).

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/automate-track.test.ts` and the
full `npx vitest run`; plus `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en, mirrored (same track, both locales).
- Content, not engine: no change to `lib/cs/*`, `niche-map.ts`, or any component.
- Plain Markdown only (no MDX components) — matches the existing `exercises.mdx`.
- Additive: append the track after the package-expertise track; do not alter exercises 1–8 or
  the package-expertise track. The only non-append edit is the one-line frontmatter
  `description` update in each file.
- Authenticity: de-hustled, take-the-routine-off-your-hands; use the approved copy verbatim.
- Frontend-only: LMS `web` CI job. No worker, no migration.

## Files

| File | Responsibility |
|---|---|
| `content/ru/exercises.mdx` | append the ru track + update description |
| `content/en/exercises.mdx` | append the en track + update description |
| `lib/content/automate-track.test.ts` | assert track present + bilingual in both files |

## Out of scope

- Applied-challenge engine / `CHALLENGE_TEMPLATES` changes.
- New niche / niche-skin.
- Dedicated page or track component.
- n8n / external automation runtime.
