# Intake Clarity-Gate — Design Spec

**Date:** 2026-06-20
**Batch:** 1a (clarity / positioning) of the prioritized feedback board
**Closes:** `fb_39f6ccee8c5e` (clarity-first), `fb_85c12d9ad395` (value-prop delta — already on landing, reinforced here), partial `fb_c4366260db34` (RPG plain-mode framing; full toggle deferred to 1b)

## Problem

A non-gamer ("чайник") logged in and went **intake → reveal → unit**, ending with zero
clarity about *what this is* / *what they'll get* / *is it a course or a game*. Root cause is
**sequencing, not missing copy**: the LMS landing (`ai.mamaev.coach` home) already answers the
value-prop delta strongly (`hero.subtitle`, `<ChatVsSystem>` "Чат отвечает. Система делает.",
FAQ on "мой чат и так помнит" / freelancer / authenticity). But the entry flow bypasses it —
`auth/verify` redirects new users to `/quest-intake/`, and `intake-guard` pushes anyone without a
completed intake there too. New users hit the RPG questionnaire (jargon-y "quest" module intro)
**before** any plain clarity.

Chosen value-prop delta (owner): **"Собрать систему, не беседу"** — a charged chat is a smart
conversationalist in someone else's window that forgets; the course teaches translating intent
into a working system you own. Barrier = intent-not-translated-to-task + mundane execution.

## Approach (owner-selected: A+B)

A plain-language **clarity-gate as step 0 of the intake wizard**, shown before the first
question, with a secondary link to the full landing for those who want depth. No routing change.

## Components

- `lib/intake/intake-gate-content.ts` — `buildIntakeGateContent(locale): IntakeGateContent`
  (pure, course-data; bilingual `{ru,en}` table per the `onboarding-bridge-content.ts` pattern).
  Holds: eyebrow, title, lead, 3 chat→system rows (reusing `chatVsSystem` meaning), metaphor-frame
  paragraph, primary CTA label, secondary CTA label + href (locale-correct: `/` or `/en`).
- `components/intake/intake-gate.tsx` — `<IntakeGate locale onEnter />`, web-only (`@/` alias OK;
  not workers-consumed). Styling mirrors `onboarding-bridge.tsx`.
- `components/intake/intake-wizard.tsx` — wire a local `gateDismissed` flag; render
  `<IntakeGate onEnter={() => setGateDismissed(true)} />` when `step === 0 && !gateDismissed &&`
  no saved answers. Returning users (saved `current_step` > 0, or persisted answers) skip it.

## Copy (RU; EN mirrored in builder)

- Eyebrow: `⬡ Открытый курс · Бесплатно`
- Title: `Прежде чем начать — что это и что ты получишь`
- Lead: `Точка Сборки — бесплатный курс. Научишься поручать AI собирать рабочие системы под твои
  задачи — не переписываться с чатом, а получать готовый результат. Без кода, на твоём языке.`
- Rows (Сейчас → После курса):
  1. `AI советует — делаешь руками` → `Поручаешь — получаешь готовое`
  2. `Каждый раз объясняешь заново` → `Система уже знает твой проект`
  3. `Ответ живёт во вкладке` → `Результат там, где нужен — в файлах, письмах, таблицах`
- Frame: `Дальше — пара вопросов и игровая обёртка: миры, спутник, карта пути. Это метафора
  курса, чтобы учиться было живее — не компьютерная игра и не про программирование, просто
  способ подачи.`
- Primary CTA: `Поехали →`  · Secondary: `Подробнее о курсе →` (→ `/` or `/en`)

## Behavior

- Primary CTA → `onEnter()` → wizard renders Q1.
- Secondary CTA → navigate to landing (`/` / `/en`).
- Gate shows only on a fresh start; mid-intake resumers never see it.

## Testing

vitest (env=node) on the pure builder: returns all fields for both locales, exactly 3 rows,
locale-correct secondary href. No React render test (not in stack).

## Out of scope (next sub-batches)

- 1b: global RPG↔plain-mode toggle across intake + units + dashboard (`fb_c4366260db34` remainder).
- 1c: blog/prologue positioning (`fb_a17dbd388984`, `fb_06875951557b`).
- 1d: demo video + showcase gallery (`fb_2fbf86ac3c67`, `fb_83d05aa7ee6f`).
