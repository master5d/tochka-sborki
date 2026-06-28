# Dopamine-break interstitial — design (fb_a03db93a5bbe)

**Ticket:** `fb_a03db93a5bbe` — Dopamine-break pattern-interrupt interstitial (distract & switch between segments).
**Sibling:** `fb_282cf1c678f7` — puzzle *content* (pending, owner samples in OneDrive). This slice ships the **placement/trigger** half only.

## Goal

A throttled pattern-interrupt that injects a short "switch & reset" micro-moment mid-unit — a healthy dopamine substitute for doomscrolling between learning segments. Ships as a **dark engine+data unit** (mirrors `lib/pacing`): dormant until real break content lands via `fb_282cf1`.

## Scope

- Single app: `LMS/tochka-sborki/web/`.
- Trigger point: **mid-unit, throttled** — fires on a step transition inside `unit-wizard.tsx` (`handleNext`), gated by throttle rules.
- Break content in this slice: **dark shell + data hook** — keyed `BREAKS` array, empty by default. Renders nothing when empty. No fabricated puzzle content.

Out of scope: the puzzle/break content itself (`fb_282cf1`), between-unit triggers, server persistence of break stats.

## Architecture — pure decider + thin overlay

Mirrors the existing `lib/pacing` engine+data pattern: generic pure logic + keyed bilingual data + thin display component. Tests on pure logic; component validated by `npm run build`.

### Units

| Unit | Responsibility |
|---|---|
| `lib/breaks/types.ts` | `BreakActivity` (keyed, bilingual `Bi{ru;en}`: `title`, `prompt`, optional `cta`), `BreakContext`, `ResolvedBreak` |
| `lib/breaks/thresholds.ts` | `MIN_BREAK_STEP = 2`, `BREAK_COOLDOWN_STEPS = 3`, `MAX_BREAKS_PER_SESSION = 2` |
| `lib/breaks/data.ts` | `BREAKS: BreakActivity[] = []` (empty → dark) + `resolveBreaks(locale): ResolvedBreak[]` resolver |
| `lib/breaks/should-break.ts` | **pure** `shouldBreak(ctx: BreakContext): boolean` — all gate logic, fully unit-tested |
| `components/break-interstitial.tsx` | thin presentational overlay; renders `null` when no activity; "continue" + dismiss |
| `components/unit-wizard.tsx` (modify) | wire-in: session throttle state; on `handleNext` consult `shouldBreak`; show overlay before advancing |

### Types (authoritative shapes)

```ts
// lib/breaks/types.ts
// Convention (verified against lib/course/office-hours.ts): `Bi` is a module-local
// interface, NOT an import; only `Locale` comes from @/lib/intake/types.
import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface BreakActivity {
  key: string
  title: Bi
  prompt: Bi
  cta?: Bi
}

export interface ResolvedBreak {
  key: string
  title: string
  prompt: string
  cta: string // resolver supplies a default continue label when cta omitted
}

export interface BreakContext {
  availableCount: number      // resolveBreaks(locale).length
  currentStep: number         // unit-wizard currentStep
  stepsSinceLastBreak: number // currentStep - lastBreakStep (or large if none yet)
  breaksShownThisSession: number
  restMode: boolean           // pacing already advising rest/check-in
}
```

> `resolveBreaks(locale)` maps each `BreakActivity`'s `Bi` fields to the active-locale `string` (e.g. `title[locale]`), supplying a default continue label when `cta` is omitted.

### `shouldBreak` gates (ALL must pass to return `true`)

1. `availableCount > 0` — dark-ship: zero break content ⇒ never fires.
2. `currentStep >= MIN_BREAK_STEP` — skip shallow intro steps.
3. `stepsSinceLastBreak >= BREAK_COOLDOWN_STEPS` — cooldown between breaks.
4. `breaksShownThisSession < MAX_BREAKS_PER_SESSION` — frequency cap.
5. `restMode === false` — suppressed when pacing already advises rest/check-in (don't stack a break on a "go rest" nudge).

Pure function, no I/O, no React. Each gate independently unit-tested.

### Data flow

1. `unit-wizard.tsx` resolves `BREAKS` once (`resolveBreaks(locale)`) and holds session throttle state: `breaksShownThisSession`, `lastBreakStep` (init e.g. `-Infinity` so cooldown passes first time).
2. `restMode` derived from existing pacing — reuse `selectNudge(pacingState, ctx, today)` and treat a `rest` or `checkin` result as `restMode = true` (or read the same pacing thresholds directly; implementer picks the lowest-coupling path that reuses existing logic, no new thresholds).
3. On `handleNext`: build `BreakContext`, call `shouldBreak`. If `true`, pick an activity by session-rotation index (`breaksShownThisSession % availableCount`), set pending-break state, render `<BreakInterstitial>` overlay **instead of** advancing.
4. Learner taps continue (or dismiss): increment `breaksShownThisSession`, set `lastBreakStep = currentStep`, clear pending-break, then advance the step.
5. If `shouldBreak` is `false`: advance immediately as today (no behavior change — and with empty `BREAKS`, this is always the path, so current UX is byte-unchanged).

### Component contract

`break-interstitial.tsx`:
- Props: `activity: ResolvedBreak | null`, `onContinue: () => void`, `onDismiss?: () => void` (dismiss = same as continue but immediate).
- Renders `null` when `activity` is null (belt-and-suspenders with the decider).
- Overlay card: title, prompt, single primary "continue" button (uses `activity.cta`). Always dismissible.
- Presentational only — no pacing/data imports, no business logic.

## Authenticity constraints

- No streak-shaming, no scarcity, no countdown.
- Always dismissible; never blocks progress beyond a single tap.
- Copy is a calm reset prompt, not a hype/FOMO interrupt.
- Owner-voice not fabricated: ships with **no** content; copy only appears when owner supplies it via `fb_282cf1`.

## Testing

- `lib/breaks/should-break.test.ts` — one test per gate (each gate independently flips the result), plus an all-pass case.
- `lib/breaks/data.test.ts` — `resolveBreaks` returns active-locale strings; empty `BREAKS` ⇒ `[]`; default `cta` applied when omitted.
- Component validated via `npm run build` (no logic tests on the thin presentational overlay).
- No new dependencies.

## Backward compatibility

With `BREAKS = []`, `shouldBreak` always returns `false` (gate 1), so `unit-wizard` advances exactly as today. Existing unit-wizard behavior and tests are unaffected — the feature is fully dormant until content lands.

## Task decomposition (for the plan)

1. **Data + types + thresholds + resolver** (`types.ts`, `thresholds.ts`, `data.ts`) + `data.test.ts`.
2. **`shouldBreak` decider** (`should-break.ts`) + `should-break.test.ts`.
3. **Interstitial component + unit-wizard wiring** (`break-interstitial.tsx`, modify `unit-wizard.tsx`) — validated by `npm run build`.
