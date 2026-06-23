# Inline `<ModuleSurvey>` (post-class evaluation) — Design

**Ticket:** `fb_6a22ff6e0f0a` (reusable post-class evaluation survey at the end of each
module — Likert recommend/impact/apply + open field, skippable).

**Date:** 2026-06-23

## Goal

Surface the existing post-class evaluation survey *inline at the end of a module*
(point-of-experience), pre-filled with the module and with skippable questions — rather
than only on the standalone `/feedback` page where the learner must navigate away and
pick a module manually. Reusable as an MDX block; seeded at the end of module 01.

## Honest-triage note (verified — this scoped the ticket)

- The survey **mechanic already exists**: `components/feedback-form.tsx` renders exactly
  the re:Work template — three Likert 1-5 scales (`recommend` = would-recommend,
  `impact` = positive impact, `apply` = able-to-apply) + open `unclear`/`other` fields —
  and POSTs to `/api/feedback`, handled by `workers/src/handlers/feedback.ts`, which
  forwards to n8n. The standalone `/feedback` page uses it with a manual module `<select>`.
- The **genuine delta**: inline at module end + module pre-filled (no select) + questions
  **skippable**.
- **Blocking finding:** `handleFeedback` currently *requires* `lesson, recommend, impact,
  apply` (400 otherwise). "Skippable" is impossible without relaxing this. So the design
  relaxes the backend to require only `lesson` (the module); the three Likert answers
  become optional. The existing `feedback.test.ts` "returns 400 … missing" test sends
  `{ lesson: 'Meeting 1' }` and expects 400 — that test must be rewritten (lesson-only is
  now a valid skippable submission).
- `LikertScale` is a private function inside `feedback-form.tsx`. To reuse it (DRY), it
  is extracted to its own file with a `required?` prop.
- `/api/feedback` (the standalone form's path) is unaffected for users: that form keeps
  its client-side `required`, so it always sends complete payloads.

## Decisions locked during brainstorming

1. **Relax the backend to require only `lesson`** — recommend/impact/apply/unclear/other
   all optional, honoring skippable. The handler still forwards `{...body, submitted_at}`
   to n8n.
2. **Extract `LikertScale`** to `components/likert-scale.tsx` with `required?: boolean`
   (default `true` — preserves `FeedbackForm` behavior; `ModuleSurvey` passes `false`).
3. **`<ModuleSurvey module locale>`** — a compact client component: module pre-filled
   from a string prop (no select), three skippable Likert scales, one open field, submit;
   reuses the `feedback` dictionary labels + a couple new keys.
4. **localStorage `module-survey:<module>`** — after a successful submit, remember it so a
   revisit shows the thank-you state instead of re-nagging (SSR-safe `useEffect`+mounted
   guard, same pattern as `StackMatrix`).
5. **Seed one placement**: end of module 01's last unit (`01-introduction/u4-practice.mdx`),
   RU+EN. The keyed/string-prop form makes adding more modules trivial.
6. Static export safe; bilingual; no migration; reuses the existing n8n delivery.

## Components

### `workers/src/handlers/feedback.ts` (modified)

Change the validation from:
```ts
if (!body.lesson || !body.recommend || !body.impact || !body.apply) { … 400 … }
```
to:
```ts
if (!body.lesson) {
  return Response.json({ error: 'Missing required field: lesson' }, { status: 400 })
}
```
Everything else (n8n forward, 502 handling) is unchanged. `FeedbackBody`'s `recommend/
impact/apply` become optional (`?`).

`workers/src/handlers/feedback.test.ts` (modified): rewrite the first test —
- `{ recommend: '5' }` (no `lesson`) → **400**.
- `{ lesson: 'Meeting 1' }` (lesson only, Likert skipped) → **200**, forwarded to n8n with
  the secret header (a skippable submission is valid).
The existing forward / 502 tests (full payloads) stay as-is.

### `components/likert-scale.tsx` (new — extracted)

```tsx
export function LikertScale({ name, label, value, onChange, disagree, agree, required = true }: {
  name: string; label: string; value: string; onChange: (v: string) => void
  disagree: string; agree: string; required?: boolean
}): React.JSX.Element
```
The body is the exact current `LikertScale` markup, with the radio `<input>`'s `required`
attribute driven by the `required` prop (`required={required}`). `feedback-form.tsx`
imports it from here (its three usages omit `required`, defaulting to `true` — unchanged
behavior).

### `components/module-survey.tsx` (new, `'use client'`)

```tsx
export function ModuleSurvey({ module, locale }: { module: string; locale?: Locale }): React.JSX.Element
```
- `useState` for recommend/impact/apply/other + status (`idle|loading|success|error`) +
  a `done` flag and a `mounted` flag.
- On mount (`useEffect`): if `localStorage['module-survey:' + module]` is set → `done = true`.
- Renders a compact `<section>`: heading (`t.surveyHeading`), skip hint (`t.surveySkipHint`),
  three `<LikertScale required={false}>` (labels `t.recommendLabel/impactLabel/applyLabel`,
  `t.likertDisagree/likertAgree`), one open `<textarea>` (`t.otherLabel`), a submit button
  (`t.submit`/`t.submitting`).
- `handleSubmit`: POST `/api/feedback` with `{ lesson: module, recommend, impact, apply,
  other, locale }`; on success set `localStorage['module-survey:' + module] = '1'` and show
  the success state (`t.successMessage`); on failure show `t.errorMessage`.
- If `done` (already submitted) or `status==='success'` → render the thank-you/success box
  only. Before mount (`!mounted`) render the form (avoids hydration flash; the localStorage
  check only hides on confirmed prior submit).
- All CSS vars; reuses the feedback styling idiom.

Registered in `components/mdx-components.tsx` (`import { ModuleSurvey }` + `ModuleSurvey,`),
usable as `<ModuleSurvey module="01-introduction" locale="ru" />`.

### `lib/dictionaries.ts` (modified)

Add to the `feedback` block (both `ru` and `en`):
- `surveyHeading: string` — ru `Как прошёл модуль?` / en `How was this module?`
- `surveySkipHint: string` — ru `Любой вопрос можно пропустить — по желанию.` /
  en `You can skip any question — it's optional.`

### MDX placements (2 files)

- `content/ru/01-introduction/u4-practice.mdx`: append `<ModuleSurvey module="01-introduction" locale="ru" />` at the end.
- `content/en/01-introduction/u4-practice.mdx`: append `<ModuleSurvey module="01-introduction" locale="en" />` at the end.

## Data flow

```
module last unit .mdx → <ModuleSurvey module locale/>  (client)
  → (mount) localStorage['module-survey:<module>']? → done → thank-you
  → else form (3 skippable Likert + open) → POST /api/feedback { lesson: module, … }
      → workers handleFeedback (lesson required only) → n8n forward
      → success → set localStorage → thank-you
```

## Edge cases

- **All Likert skipped** → payload has empty `recommend/impact/apply`; backend (lesson-only
  required) accepts → 200.
- **No `lesson`** (not reachable from `ModuleSurvey`, which always sends `module`) → 400.
- **Already submitted** (localStorage) → thank-you state, no re-nag.
- **localStorage unavailable** (try/catch) → treated as not-done; the form shows (no crash).
- **Network error** → `error` status + `t.errorMessage`; localStorage not set (can retry).

## Testing

`workers/src/handlers/feedback.test.ts` (env=node, run from `workers/`):
- `{ recommend: '5' }` (no lesson) → 400.
- `{ lesson: 'Meeting 1' }` (Likert skipped) → 200, forwarded with secret header + `submitted_at`.
- existing full-payload forward + 502 tests unchanged.

`ModuleSurvey`, `LikertScale`, and the MDX placements are verified by a green web
`npm run build` (repo convention — UI not unit-tested). The `feedback-form.tsx` refactor is
covered by the same build (it must still compile and render with the extracted `LikertScale`).

## Files

| File | Responsibility |
|---|---|
| `workers/src/handlers/feedback.ts` | relax validation to `lesson`-only |
| `workers/src/handlers/feedback.test.ts` | rewrite the missing-field test for skippable |
| `components/likert-scale.tsx` | extracted shared Likert scale (+`required?`) |
| `components/feedback-form.tsx` | import the extracted `LikertScale` |
| `components/module-survey.tsx` | inline, pre-filled, skippable survey (`'use client'`) |
| `components/mdx-components.tsx` | register `ModuleSurvey` |
| `lib/dictionaries.ts` | `surveyHeading` + `surveySkipHint` (ru+en) |
| `content/{ru,en}/01-introduction/u4-practice.mdx` | seed placement |

No migration; reuses the existing `/api/feedback` → n8n pipeline. ~3 TDD tasks.

## Out of scope

- Touching the standalone `/feedback` page / `FeedbackForm` UX (it keeps its required
  Likert via client validation; only its `LikertScale` import path changes).
- Auto-injecting the survey into every module (the reusable component + 1 seed placement
  delivers the engine; more placements are trivial follow-ups).
- Server-side storage/analytics of skipped-vs-answered (n8n already receives the payload).
- A new DB table (the pipeline is n8n, unchanged).
