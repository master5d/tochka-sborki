# WPM entry/exit test — Slice 4 of the «Скорочтение» epic

**Epic:** «Скорочтение» — an isolated hybrid speed-reading module for the S.A.S.H.A. academy
(course skeleton + interactive trainers). Slices 1 (skeleton), 2 (RSVP reader), 3 (Schulte tables) shipped 2026-07-05.

**This slice (4):** the **WPM entry/exit test** — the trainer that realizes the epic's original promise of a
real "before/after" measurement. The user reads a timed passage, answers comprehension questions, and gets a
headline **effective WPM** (raw words-per-minute × comprehension), plus the delta from their first test.
Pure engine + bilingual passage data + localStorage store + a thin multi-step client component. Sovereign, isolated.

## Scope decision

WPM test only, on its own route `/speedreading/test` (+ `/en/`), `noindex`. Out of scope: progress/CS integration
(S5), nav/registry wiring, any backend. Decisions locked in brainstorming: **effective WPM (raw × comprehension)
is the headline metric** (raw WPM and comprehension % shown as its components — discourages skim-without-understanding,
matches the authenticity value); reading is **self-timed** (user clicks "Done" when finished); comprehension is
measured by **3 multiple-choice questions** per passage, mirroring the existing `break-interstitial` MCQ pattern
(pick → lock → ✓/✗, no shaming).

## Architecture

Everything under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/test/` — same isolation as
slices 1–3. Clean pure-engine / data / thin-component split.

### `lib/speedreading/wpm.ts` (pure)

```ts
import { tokenize } from './rsvp'   // reuse the slice-2 tokenizer

export function wordCount(text: string): number                       // tokenize(text).length
export function computeWpm(words: number, ms: number): number         // ms <= 0 ? 0 : Math.round(words / (ms / 60000))
export function comprehensionFraction(correct: number, total: number): number  // total <= 0 ? 0 : correct / total  (0..1)
export function effectiveWpm(wpm: number, fraction: number): number   // Math.round(wpm * fraction)
```

### `lib/speedreading/passages.ts` (bilingual data)

```ts
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export interface TestQuestion { prompt: Bi; choices: Bi[]; answer: number }  // answer = index into choices
export interface TestPassage { id: string; text: Bi; questions: TestQuestion[] }
export const PASSAGES: TestPassage[]                                    // 3 passages, each with 3 questions

export interface ResolvedQuestion { prompt: string; choices: string[]; answer: number }
export interface ResolvedPassage { id: string; text: string; questions: ResolvedQuestion[] }
export function resolvePassage(passage: TestPassage, locale: Locale): ResolvedPassage
export function pickPassage(count: number): TestPassage                 // PASSAGES[count % PASSAGES.length] — rotates so entry ≠ exit
```

**3 passages** (`id`s `attention`, `memory`, `vision`), each ~130–150 words, **original neutral educational prose**
on a meta-topic of the course (how attention works while reading; memory and the forgetting curve; eye movement and
peripheral vision). Each has **3 comprehension MCQs** answerable from the text, each with **≥3 choices** and a valid
`answer` index. The full passage + question prose is authored verbatim in the implementation plan; every string is
`lintDehustle`-clean and contains no third-party copyrighted text.

### `lib/speedreading/wpm-test-types.ts`

```ts
export const WPM_KEY = 'speedreading_wpm'
export interface WpmResult {
  date: string; passageId: string; ms: number; words: number
  wpm: number; correct: number; total: number; effectiveWpm: number
}
export interface WpmTestState { results: WpmResult[] }
```

### `lib/speedreading/wpm-test-store.ts` (mirror `lib/pacing/store.ts`)

```ts
export function freshWpmTest(): WpmTestState                            // { results: [] }
export function recordTest(state: WpmTestState, result: WpmResult): WpmTestState  // append, cap last 50
export function readWpmTest(): WpmTestState                            // localStorage read; malformed/missing → freshWpmTest()
export function writeWpmTest(state: WpmTestState): void                // try/catch, ignore failures
```

`readWpmTest` validates `results` is an array and falls back to `freshWpmTest()` on any parse error — like `readPacing`.
No clock inside the store; the caller supplies `date`.

### `lib/speedreading/use-wpm-test.ts` (`'use client'`)

`useWpmTest()` hook: reads persisted state on mount, exposes `{ state, ready, recordTest }`, writes back on change.
`recordTest(result: Omit<WpmResult, 'date'>)` internally supplies `localDate()` (from `@/lib/quests/daily-store`) and
appends the full `WpmResult`. Test-flow state (step / passage / timer / picks) lives in the **component**. Mirrors `use-pacing.ts`.

### `components/speedreading/wpm-test.tsx` (`'use client'`)

Props `{ locale: Locale }`. A four-step state machine `'intro' | 'reading' | 'quiz' | 'result'`.
- **intro:** a one-line explanation + a "Start" button. The passage for this run is `pickPassage(state.results.length)`
  (rotates by prior-test count), resolved to `locale`.
- **reading:** the passage text + a "Готово"/"Done" button. Start sets `startAt = Date.now()`; Done sets
  `ms = Date.now() - startAt` and advances to quiz.
- **quiz:** the 3 questions, each rendered with the `break-interstitial` MCQ pattern (choices as buttons; picking
  locks that question and marks ✓ on the correct choice / ✗ on a wrong pick; no shaming). When all questions are
  answered, a "Показать результат"/"See result" button computes `correct = Σ(pick === answer)` and advances to result.
- **result:** computes `wpm = computeWpm(words, ms)`, `frac = comprehensionFraction(correct, total)`,
  `eff = effectiveWpm(wpm, frac)`; displays **effective WPM large** with raw WPM and comprehension % as its
  components. If a prior result exists (i.e. `state.results` was non-empty before this run), shows the **delta in
  effective WPM vs the first recorded test** ("до/после"). Calls `recordTest({...})` exactly once on entering result.
  A "Ещё раз"/"Again" button returns to intro (the next passage rotates because `results.length` grew).
- Bilingual UI labels inline via `locale`; all `lintDehustle`-clean plain language.
- a11y: user-initiated throughout; buttons keyboard-operable.

### `app/speedreading/test/page.tsx` (RU) + `app/en/speedreading/test/page.tsx` (EN)

Mirror the slice-3 route shell: `metadata` with `robots: { index: false, follow: false }`, `<Nav locale=…/>`,
`<main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>` with a short heading + one-line
instruction + `<WpmTest locale=…/>`. Titles: RU `'Тест скорости — Скорочтение'`, EN `'Reading-speed test — Speed Reading'`.

## Testing

- `lib/speedreading/wpm.test.ts` — `wordCount` (matches `tokenize` length; multi-space/newline); `computeWpm`
  (300 words / 60000 ms = 300; `ms <= 0` → 0; rounds); `comprehensionFraction` (`3/3 = 1`, `1/2 = 0.5`, `total 0` → 0);
  `effectiveWpm` (rounds `wpm × fraction`, e.g. `400 × 0.5 = 200`).
- `lib/speedreading/passages.test.ts` — exactly 3 passages with unique ids; each passage has ≥3 questions; each
  question has ≥3 choices and an `answer` index within `[0, choices.length)`; `resolvePassage` localizes (a sampled
  field differs ru vs en); **`lintDehustle []`** over every passage text + every question prompt + every choice, both
  locales; `pickPassage` rotates (`pickPassage(0)` and `pickPassage(PASSAGES.length)` are the same passage; consecutive
  counts differ).
- `lib/speedreading/wpm-test-store.test.ts` — `freshWpmTest` shape; `recordTest` appends and caps at 50; `readWpmTest`/
  `writeWpmTest` round-trip via a mocked `localStorage`; malformed JSON and missing key → `freshWpmTest()`.
- Component: thin (logic in engine + store) → no render test (no RTL precedent in the repo); correctness is caught by
  `next build` + a manual smoke of `/speedreading/test`.

## Global constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/test/`. No `content/`, no `LMS/registry.json`, no nav entry. Both routes `robots: noindex`.
- Pure engine / data / thin component: no DOM in `wpm.ts`; the component delegates all metric computation to the engine.
- Reuse: `wordCount` builds on `tokenize` from `./rsvp` (slice 2) — do not re-implement word splitting. The quiz mirrors the `break-interstitial` MCQ interaction.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_wpm`; no clock in the store (date passed in via the hook).
- `Bi` imported from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `localDate` from `@/lib/quests/daily-store` — not redefined.
- De-hustle: every user-facing string (passages, questions, choices, UI labels) passes `lintDehustle []` (reuse `lib/authoring/dehustle.ts`). If a string trips the lint, reword it — never weaken the guard.
- Authenticity: WPM, comprehension, and effective WPM are real measurements of the user's own reading; no fabricated metrics, no "guaranteed" gains, no scarcity/urgency/vanity, no shaming on wrong answers. Passages are original — no third-party copyrighted text.
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM, no new dependencies — plain React + the engine.
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run && npx next build` (build must statically export `/speedreading/test` and `/en/speedreading/test`).
- Trunk-based `main`, one commit per task. **Ops:** git only via the PowerShell tool (bash-git hangs this session).

## Out of scope (later epic slices)

Progress/CS integration (S5 — the `speedreading_wpm` results, plus the `speedreading_rsvp` and `speedreading_schulte`
sessions, are ready to surface on the dashboard/character card), nav/registry wiring, lesson prose, any backend.
