# Niche-path "package your expertise" exercise track — Design

**Ticket:** `fb_22027860e9eb` (Niche-path / applied-challenge: "package your own expertise into a
course or knowledge product with AI" — coach/expert/healer segment, de-hustled, build-to-serve).

**Date:** 2026-06-24

## Goal

Add an optional, de-hustled exercise track to the `/exercises` page: a coach/expert/healer uses
the agentic-AI skills the course teaches to scaffold and share their own offering. Framed
build-to-serve / share-your-gift — NOT a profit machine: no scarcity, no manipulative sales
copy, no funnel tactics. Honors the authenticity boundary (amplify your voice, don't
ghostwrite or manipulate).

## Scope (carved by honest triage)

The ticket itself says "Course content, not engine." The applied-challenge engine
(`lib/cs/applied-challenge.ts`, `CHALLENGE_TEMPLATES`) is generic per-module with `{niche}`
slot-fill — it is NOT the surface for a thematic "ship your own offering" track. The honest,
on-spec, live-consumer delta is a new **content** section in the existing `/exercises` MDX
(rendered route, plain Markdown).

- **In scope:** one optional track section appended to `content/{ru,en}/exercises.mdx`
  (bilingual, mirrored), distinct from the existing numbered exercises 1–8; a content-presence
  test.
- **Out of scope (deferred):**
  - Any change to the applied-challenge engine or `CHALLENGE_TEMPLATES` (ticket: "not engine").
  - A new niche value / niche-skin in `niche-map.ts`.
  - A dedicated `/package` page or a bespoke track component (YAGNI — MDX section).
  - The non-coder JTBD ticket (`fb_11b7a3c19d14`) — the track threads toward it but does not
    build it.

## Architecture

Pure content. The track is plain Markdown appended to both `content/ru/exercises.mdx` and
`content/en/exercises.mdx`, rendered by the existing `/exercises` route (no component, no data
module — the file is plain Markdown today, no MDX components). The frontmatter `description` is
lightly updated to mention the optional track honestly. No engine, no route, no data-flow
change.

## Components

### `content/ru/exercises.mdx` (modified)

Update the frontmatter `description` to:
`"8 упражнений для закрепления уровней 1–4 + опциональный трек «упакуй экспертизу»"`

Append at the end of the file (after the last numbered exercise), this section verbatim:

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

### `content/en/exercises.mdx` (modified)

Update the frontmatter `description` to:
`"8 exercises to consolidate levels 1–4 + an optional \"package your expertise\" track"`

Append at the end of the file, this section verbatim:

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

## Data flow

Static content. The `/exercises` route already loads and renders these MDX files; the appended
section renders with them. No endpoint, no data module, no client state.

## Error handling

None — plain Markdown. The MDX must still compile (the section uses only headings, blockquotes,
bold, inline code, and a horizontal rule — no MDX components, matching the file's existing
plain-Markdown nature).

## Authenticity (binding)

- Build-to-serve / share-your-gift, NOT a profit machine. No scarcity, no countdowns, no
  manipulative sales copy, no funnel/Facebook-ad tactics.
- Amplify your voice, don't ghostwrite or manipulate — explicitly baked into Step 3 ("you need
  structure, not manipulation") and Step 5 ("share, don't push").
- The closing line reframes away from "funnel" toward integrity. Consistent with the
  anti-dependency / de-guru thread.

## Testing

- **`lib/content/package-track.test.ts` (new):** read the raw
  `content/ru/exercises.mdx` and `content/en/exercises.mdx` files; assert each contains the
  track heading (`ru`: `Упакуй свою экспертизу в продукт`; `en`: `Package your expertise into a
  product`) and the five stable save-anchors (`offer-1-gift.md` … `offer-5-share.md`); assert
  the ru intro line and en intro line differ (bilingual, not a copy). This pins both the
  presence and the bilingual mirroring of the track.
- The section is plain content; it is validated by `npm run build` (MDX compile + static export
  of `/exercises` and `/en/exercises`).

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/content/package-track.test.ts` and the full
`npx vitest run`; plus `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en, mirrored (same track, both locales).
- Content, not engine: no change to `lib/cs/*`, `niche-map.ts`, or any component.
- Plain Markdown only (no MDX components) — matches the existing `exercises.mdx`.
- Additive: append the track after the existing exercises; do not alter exercises 1–8. The only
  non-append edit is the one-line frontmatter `description` update in each file.
- Authenticity: de-hustled, build-to-serve; use the approved copy verbatim.
- Frontend-only: LMS `web` CI job. No worker, no migration.

## Files

| File | Responsibility |
|---|---|
| `content/ru/exercises.mdx` | append the ru track + update description |
| `content/en/exercises.mdx` | append the en track + update description |
| `lib/content/package-track.test.ts` | assert track present + bilingual in both files |

## Out of scope

- Applied-challenge engine / `CHALLENGE_TEMPLATES` changes.
- New niche / niche-skin.
- Dedicated `/package` page or track component.
- Non-coder JTBD ticket (`fb_11b7a3c19d14`).
