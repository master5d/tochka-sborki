# Schulte tables — Slice 3 of the «Скорочтение» epic

**Epic:** «Скорочтение» — an isolated hybrid speed-reading module for the S.A.S.H.A. academy
(course skeleton + interactive trainers). Slice 1 (course skeleton) + Slice 2 (RSVP reader) shipped 2026-07-05.

**This slice (3):** the **Schulte tables** trainer — a size×size grid of shuffled numbers; the user finds
and clicks `1, 2, 3 … N²` in order while keeping the gaze on a center fixation dot, training peripheral
vision. Deterministic grid generation (own mulberry32 shuffle), a timer, best-time + session log in
localStorage. Pure engine + thin client component, sovereign, isolated.

## Scope decision

Schulte trainer only, on its own route `/speedreading/schulte` (+ `/en/`), `noindex`. Out of scope: WPM
entry/exit test (S4), progress/CS integration (S5), nav/registry wiring, any backend. Decisions locked in
brainstorming: **show the current target ("Найди: N")** above the grid (clarity-first); **wrong clicks are
ignored and counted** in a neutral error tally — no time penalty, no shaming (anti-shaming value).

## Architecture

Everything under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/schulte/` — same
isolation as slices 1–2. Clean pure-engine / thin-component split. Numbers only — no bilingual passage.

### `lib/speedreading/schulte.ts` (pure, no DOM)

```ts
export const MIN_SIZE = 3
export const MAX_SIZE = 7
export const DEFAULT_SIZE = 5

export function clampSize(n: number): number            // clamp [MIN_SIZE, MAX_SIZE], round; NaN → DEFAULT_SIZE
export function shuffle<T>(items: T[], seed: number): T[] // mulberry32 full Fisher–Yates; pure (copies input, no mutation)
export function generateGrid(seed: number, size: number): number[] // shuffle([1..clampSize(size)²], seed); flat length size²
```

`shuffle` uses the same mulberry32 PRNG formula proven in `lib/quests/seed.ts` (`pick`), but is a **full**
Fisher–Yates over the whole array (not a partial subset), so it is self-contained here rather than reusing
`pick` (whose `n === length` path returns an unshuffled copy). A **numeric** seed keeps the engine free of
any `lib/quests` dependency: the component holds a seed counter and increments it for a "new table".

### `lib/speedreading/schulte-types.ts`

```ts
export const SCHULTE_KEY = 'speedreading_schulte'
export interface SchulteSession { date: string; size: number; ms: number; errors: number }
export interface SchulteState { size: number; best: Record<number, number>; sessions: SchulteSession[] }
```

### `lib/speedreading/schulte-store.ts` (mirror `lib/pacing/store.ts`)

```ts
export function freshSchulte(): SchulteState                        // { size: DEFAULT_SIZE, best: {}, sessions: [] }
export function setSize(state: SchulteState, n: number): SchulteState  // clampSize
export function recordResult(state: SchulteState, size: number, ms: number, errors: number): SchulteState
  // best[size] = min(existing ?? ∞, ms); append { date? } — see hook — session; cap sessions at 50
export function readSchulte(): SchulteState                        // localStorage read; malformed/missing → freshSchulte()
export function writeSchulte(state: SchulteState): void            // try/catch, ignore failures
```

`recordResult` takes `size/ms/errors` and the caller-supplied `date` (passed through — see hook) to build the
`SchulteSession`. It updates `best[size]` only when `ms` is faster than the stored best (or none stored), and
appends the session capped to the last 50. `readSchulte` validates each field (size via `clampSize`, best is an
object, sessions is an array) and falls back to `freshSchulte()` on any parse error — exactly like `readPacing`.

Signature note: to keep the store pure of clocks, `recordResult(state, size, ms, errors, date)` receives `date`
as its last argument (the hook supplies `localDate()`), mirroring how `logCompletion` receives `date` in pacing.

### `lib/speedreading/use-schulte.ts` (`'use client'`)

`useSchulte()` hook: reads persisted state on mount, exposes `{ state, ready, setSize, recordResult }`, writes
back to localStorage on change. `recordResult(size, ms, errors)` internally supplies `localDate()`. Game state
(current target, elapsed time, seed, running flag) lives in the **component**, not the hook. Mirrors `use-pacing.ts`.

### `components/speedreading/schulte-table.tsx` (`'use client'`)

Props `{ locale: Locale }`.
- **Grid:** `generateGrid(seed, state.size)` via `useMemo` keyed on `[seed, state.size]`, rendered as a
  `size×size` grid of number buttons. A center fixation dot is overlaid at the grid's center.
- **Flow:** Start → `running = true`, `target = 1`, `errors = 0`, `startTime = Date.now()`, an interval updates
  an `elapsed` display. Clicking a number `v`: if `!running` ignore; if `v === target` → mark that cell done
  (dimmed, disabled) and `target += 1`; when `target > size²` → stop the interval, `ms = Date.now() - startTime`,
  call `recordResult(size, ms, errors)`, set `running = false`. If `v !== target` → `errors += 1` (no penalty).
- **Readouts (bilingual inline via `locale`):** while running, "Найди: {target}" / "Find: {target}"; a neutral
  error count; the elapsed time; the best time for the current size. On completion, "Готово — {sec} с (лучшее
  {best} с)" / "Done — {sec}s (best {best}s)".
- **Controls:** size selector (`MIN_SIZE`–`MAX_SIZE`), "Новая таблица"/"New table" (increments the seed and
  resets the round), "Сброс"/"Reset". Changing size resets the round with a fresh grid.
- **Timer:** `setInterval` (≈100 ms) updates `elapsed` while running; cleared on stop and on unmount.
- **a11y:** playback is user-initiated (no autostart); buttons are keyboard-operable.
- All UI copy is `lintDehustle`-clean plain labels.

### `app/speedreading/schulte/page.tsx` (RU) + `app/en/speedreading/schulte/page.tsx` (EN)

Mirror the slice-2 route shell: `metadata` with `robots: { index: false, follow: false }`, `<Nav locale=…/>`,
`<main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>` with a short heading + one-line
instruction + `<SchulteTable locale=…/>`. Titles: RU `'Таблицы Шульте — Скорочтение'`, EN `'Schulte tables — Speed Reading'`.

## Testing

- `lib/speedreading/schulte.test.ts` — `clampSize` (below min, above max, fractional, NaN → default);
  `shuffle` (same seed → identical order; is a permutation — sorted result equals sorted input; two different
  seeds produce at least one differing order; does not mutate the input array); `generateGrid` (length `size²`,
  contains each of `1..size²` exactly once, deterministic for a fixed seed, respects `clampSize`).
- `lib/speedreading/schulte-store.test.ts` — `freshSchulte` shape; `setSize` clamp; `recordResult` sets best on
  first result, keeps the min when a slower ms arrives, updates when a faster ms arrives, stores `errors`, and
  caps sessions at 50; `readSchulte`/`writeSchulte` round-trip via a mocked `localStorage`; malformed JSON and
  missing key → `freshSchulte()`.
- Component: thin (logic in the engine + store) → no render test (no RTL precedent in the repo); correctness is
  caught by `next build` + a manual smoke of `/speedreading/schulte`.

## Global constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/schulte/`. No `content/`, no `LMS/registry.json`, no nav entry. Both routes `robots: noindex`.
- Pure engine / thin component: no DOM in `schulte.ts`; the component delegates grid generation to the engine.
- Deterministic generation: `generateGrid(seed, size)` is a pure function of its inputs; `shuffle` never mutates the input.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_schulte`; store takes `date` as an argument (no clock inside the store).
- `Locale` imported from `@/lib/dictionaries`; `localDate` from `@/lib/quests/daily-store` — not redefined.
- De-hustle: every user-facing string (UI labels + page copy) is `lintDehustle`-clean plain language.
- Authenticity: no fabricated metrics; time and error counts are real measurements; no scarcity/urgency/vanity, no shaming on errors.
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM, no new dependencies — plain React + the engine.
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run && npx next build` (build must statically export `/speedreading/schulte` and `/en/speedreading/schulte`).
- Trunk-based `main`, one commit per task. **Ops:** git only via the PowerShell tool (bash-git hangs this session).

## Out of scope (later epic slices)

WPM entry/exit test (S4), progress/CS integration (S5), nav/registry wiring, lesson prose, any persistence beyond the local `speedreading_schulte` best-times + session log.
