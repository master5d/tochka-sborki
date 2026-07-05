# RSVP reader — Slice 2 of the «Скорочтение» epic

**Epic:** «Скорочтение» — an isolated hybrid speed-reading module for the S.A.S.H.A. academy
(course skeleton + interactive trainers). Slice 1 (course skeleton) shipped 2026-07-05.

**This slice (2):** the **RSVP reader** — the flagship trainer. Words are flashed one at a time
(or in small chunks) at an adjustable words-per-minute rate, with a Spritz-style ORP (Optimal
Recognition Point) pivot letter so the eye stays fixed. All reading logic lives in a pure,
unit-tested engine; the React component is thin. Sovereign (zero backend, zero LLM), bilingual,
all copy `lintDehustle []`.

## Scope decision

RSVP reader only. Lives on its own route `/speedreading/rsvp` (+ `/en/`), keeping the slice-1
syllabus dark and leaving room for future trainers (Schulte, WPM test) as sibling routes. `noindex`
for now (the course is still "готовится"); flippable later. Ships with one built-in original sample
passage so the tool works immediately, plus a paste-your-own textarea. Out of scope: Schulte tables,
WPM entry/exit test, CS/progress integration, nav/registry wiring, any backend.

## Architecture

Everything under `lib/speedreading/` + `components/speedreading/` + `app/speedreading/rsvp/`,
outside `content/` — same isolation as slice 1. Clean split: **all reading logic in the pure engine
(fully unit-tested), the component thin** (delegates to the engine, owns only playback/DOM state).

### `lib/speedreading/rsvp.ts` (pure, no DOM)

```ts
export interface RsvpFrame { text: string; ms: number; index: number }
export interface RsvpScheduleOpts { wpm: number; chunkSize?: number; punctuationDwell?: boolean }
export interface OrpSplit { before: string; pivot: string; after: string }

export const DEFAULT_WPM = 300
export const MIN_WPM = 100
export const MAX_WPM = 900
export const WPM_STEP = 25
export const DEFAULT_CHUNK = 1
export const MAX_CHUNK = 3

export function clampWpm(n: number): number      // clamp to [MIN_WPM, MAX_WPM], round to integer
export function clampChunk(n: number): number    // clamp to [1, MAX_CHUNK], integer
export function tokenize(text: string): string[] // split on whitespace, trim, drop empties; punctuation stays attached
export function orpIndex(word: string): number   // pivot index by length: len 1→0, 2–5→1, 6–9→2, 10–13→3, 14+→4; clamp to [0, len-1]
export function splitOrp(word: string): OrpSplit // pivot = exactly 1 char at orpIndex; before+pivot+after === word
export function buildSchedule(tokens: string[], opts: RsvpScheduleOpts): RsvpFrame[]
```

**`buildSchedule` rules:**
- Group `tokens` into chunks of `clampChunk(opts.chunkSize ?? DEFAULT_CHUNK)`; chunk `text` = words joined by a single space.
- Base per-word ms = `60000 / clampWpm(opts.wpm)`. Chunk base ms = base × (words in chunk).
- Punctuation dwell (default ON unless `punctuationDwell === false`): if the chunk's last word ends with
  `,` `;` `:` → ×1.5; if it ends with `.` `!` `?` `…` → ×2.0. Applied to the chunk's ms. Round ms to integer.
- `index` is the 0-based frame position, sequential. Empty `tokens` → `[]`.

### `lib/speedreading/rsvp-sample.ts` (bilingual data)

```ts
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'
export const RSVP_SAMPLE: Bi          // one original ~70-word passage about attention & reading, per locale
export function resolveRsvpSample(locale: Locale): string
```

Copy is **original** (not third-party), neutral, and `lintDehustle` clean. It exists only so the reader
has text on first load.

### `lib/speedreading/rsvp-store.ts` + `lib/speedreading/rsvp-types.ts` (mirror `lib/pacing/store.ts` + `types.ts`)

```ts
// rsvp-types.ts
export const RSVP_KEY = 'speedreading_rsvp'
export interface RsvpSession { date: string; wpm: number; words: number }
export interface RsvpState { wpm: number; chunkSize: number; sessions: RsvpSession[] }

// rsvp-store.ts (pure reducers + persistence with graceful fallback)
export function freshRsvp(): RsvpState                                  // { wpm: DEFAULT_WPM, chunkSize: DEFAULT_CHUNK, sessions: [] }
export function setWpm(state: RsvpState, wpm: number): RsvpState        // clampWpm
export function setChunk(state: RsvpState, n: number): RsvpState        // clampChunk
export function logSession(state: RsvpState, session: RsvpSession): RsvpState  // append, cap last 50
export function readRsvp(): RsvpState                                   // localStorage read; malformed/missing → freshRsvp()
export function writeRsvp(state: RsvpState): void                       // try/catch, ignore failures
```

`readRsvp` validates each field (wpm/chunkSize numbers via clamps, sessions is an array) and falls back to `freshRsvp()` on any parse error — exactly like `readPacing`.

### `lib/speedreading/use-rsvp.ts` (`'use client'`)

`useRsvp()` hook: reads persisted state on mount, exposes `{ wpm, chunkSize, setWpm, setChunk, sessions, logSession }`,
and writes back to localStorage on change. Playback state (playing / current index / derived schedule) is **not** in
the hook — it lives in the component. Mirrors the shape of `lib/pacing/use-pacing.ts`.

### `components/speedreading/rsvp-reader.tsx` (`'use client'`)

Props `{ locale: Locale }`.
- **Text source:** a `<textarea>` defaulting to `resolveRsvpSample(locale)`; the schedule is rebuilt (via `tokenize` + `buildSchedule`) when the user starts playback (reads current text + wpm + chunkSize).
- **Display:** a fixed-width centered box showing the current frame; the ORP pivot char (from `splitOrp`) is colored `var(--text-accent)` and positioned on the box's center axis via `before`/`pivot`/`after` spans, with thin focal ticks above and below the pivot.
- **Controls:** WPM slider (`MIN_WPM`–`MAX_WPM`, step `WPM_STEP`), chunk-size control (1–`MAX_CHUNK`), play/pause, reset. Progress read-out "index / total".
- **Timer:** a `useEffect` advances the frame index with `setTimeout(next, frame.ms)`; on reaching the end it calls `logSession({ date, wpm, words: tokens.length })`. Cleanup clears the timeout on pause/unmount.
- **a11y:** no autoplay — playback starts only on explicit user action (honors `prefers-reduced-motion`, since the flashing is user-initiated). Controls are keyboard-operable.
- **Copy:** bilingual UI labels inline via `locale` (e.g. "Скорость"/"Speed", "Играть"/"Play", "Сброс"/"Reset", "Ваш текст"/"Your text"); all `lintDehustle` clean.

### `app/speedreading/rsvp/page.tsx` (RU) + `app/en/speedreading/rsvp/page.tsx` (EN)

Mirror the slice-1 page shell: `metadata` with `robots: { index: false, follow: false }`, `<Nav locale=… />`,
`<main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>` with a short heading + one-line
instruction + `<RsvpReader locale=… />`. Titles: RU `'RSVP-читалка — Скорочтение'`, EN `'RSVP reader — Speed Reading'`.

## Testing

- `lib/speedreading/rsvp.test.ts` — `tokenize` (multiple spaces/newlines, trims, drops empties, keeps punctuation);
  `orpIndex` (each length bucket + 1-char + empty-string edge); `splitOrp` (before+pivot+after reconstructs the word,
  pivot length 1); `buildSchedule` (frame count for chunkSize 1 and 2, base ms = round(60000/wpm), `,`→×1.5 and `.`→×2.0
  dwell, sequential `index`, empty tokens → `[]`); `clampWpm`/`clampChunk` bounds (below min, above max, fractional).
- `lib/speedreading/rsvp-store.test.ts` — `freshRsvp` shape; `setWpm`/`setChunk` clamp; `logSession` caps at 50;
  `readRsvp`/`writeRsvp` round-trip via a mocked `localStorage`; malformed JSON → `freshRsvp()`.
- `lib/speedreading/rsvp-sample.test.ts` — `RSVP_SAMPLE.ru`/`.en` non-empty, `ru !== en`, `lintDehustle []` on both.
- Component: thin (logic lives in the engine) → no render test (no RTL precedent in the repo); correctness is caught by
  `next build` + a manual smoke of `/speedreading/rsvp`.

## Global constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/rsvp/`. No `content/`, no `LMS/registry.json`, no nav entry. Routes `robots: noindex`.
- Pure engine / thin component: no DOM in `rsvp.ts`; the component delegates all reading logic to the engine.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_rsvp`.
- `Bi` imported from `@/lib/course`; `Locale` from `@/lib/dictionaries` — not redefined.
- De-hustle: every user-facing string (sample passage + UI labels) passes `lintDehustle []` (reuse `lib/authoring/dehustle.ts`).
- Authenticity: no fabricated metrics, no "guaranteed" speed multipliers, no scarcity/urgency/vanity. WPM is a real, user-set rate.
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM. No new dependencies — plain React + the engine.
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run && npx next build` (build must statically export `/speedreading/rsvp` and `/en/speedreading/rsvp`).
- Trunk-based `main`, one commit per task. **Ops:** git only via the PowerShell tool (bash-git hangs this session).

## Out of scope (later epic slices)

Schulte tables (S3), WPM entry/exit test (S4), progress/CS integration (S5), nav/registry wiring, lesson prose, any persistence beyond the local `speedreading_rsvp` settings + lightweight session log.
