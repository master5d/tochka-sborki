# Micro-puzzle breaks — design (fb_282cf1c678f7)

**Ticket:** `fb_282cf1c678f7` — «Добавить микро-паззл игры как перерывы внутри курса». Owner samples (OneDrive/Точка Сборки/Дофаминовый блок): pipe-puzzle «which glass is filled first», предлоги «так быстро где я». Sibling of the shipped dopamine-break engine (`fb_a03db93a5bbe`).

## Goal

Add an **interactive multiple-choice puzzle** break variant on top of the existing break trigger engine + interstitial overlay. A puzzle break shows a question and choices; tapping a choice locks the answer, reveals correct/incorrect plus a one-line explanation, then offers Continue. Ships **dark** (`BREAKS=[]`) — lights up when the owner adds puzzle data.

## What already exists (component-overlap audit — grep-before-build)

- `lib/breaks/{types,thresholds,data,should-break}.ts` — trigger engine. `shouldBreak(ctx)` 5-gate decider keys only on `availableCount` (= `BREAKS.length`), `currentStep`, `stepsSinceLastBreak`, `breaksShownThisSession`, `restMode`. **Does not read activity fields.**
- `components/break-interstitial.tsx` — thin overlay. Renders `null` when no activity; shows title + prompt + cta; dismiss on backdrop or button → `onContinue`.
- `components/unit-wizard.tsx` — **variant-agnostic**: `breaks[breaksShown % breaks.length]` picks any activity; `<BreakInterstitial activity={pendingBreak} onContinue={dismissBreak} />`. `dismissBreak` advances the step.

**Real delta:** the current `BreakActivity` is passive-only (`title + prompt + cta`). The ticket needs an *interactive* break type. The delta is a discriminated-union variant + an overlay branch — **not** a new engine. The trigger decider, thresholds, and wizard need **no changes** (decider counts length; wizard is variant-agnostic).

## Decision (from design gate)

**Generic multiple-choice puzzle** (chosen over bespoke per-puzzle renderers and passive-prompts-only). One reusable interactive type covers both owner samples (glass → MC «which glass?»; prepositions → MC word pick). Engine-pattern (generic resolver + keyed bilingual data + thin display), dark-ship, maximum delta / minimum risk. No bespoke SVG simulations, no drag-and-drop — deferred (YAGNI).

## Architecture

### 1. `lib/breaks/types.ts` — discriminated union

`Bi` stays module-local (`interface Bi { ru: string; en: string }`). Convert the source and resolved types to discriminated unions on `kind`:

```ts
export interface BreakBase { key: string }

export interface PassiveBreak extends BreakBase {
  kind: 'passive'
  title: Bi
  prompt: Bi
  cta?: Bi
}

export interface PuzzleBreak extends BreakBase {
  kind: 'puzzle'
  title: Bi
  question: Bi
  choices: Bi[]      // >= 2
  answer: number     // index into choices
  reveal: Bi         // one-line explanation shown after answering
  cta?: Bi
}

export type BreakActivity = PassiveBreak | PuzzleBreak

export interface ResolvedPassive { kind: 'passive'; key: string; title: string; prompt: string; cta: string }
export interface ResolvedPuzzle {
  kind: 'puzzle'; key: string; title: string
  question: string; choices: string[]; answer: number; reveal: string; cta: string
}
export type ResolvedBreak = ResolvedPassive | ResolvedPuzzle

export interface BreakContext { /* unchanged */ }
```

(`BreakContext` is unchanged.)

### 2. `lib/breaks/data.ts` — `resolveBreaks` branches on `kind`

```ts
export const BREAKS: BreakActivity[] = []   // dark-ship, unchanged

export function resolveBreaks(locale: Locale, source: BreakActivity[] = BREAKS): ResolvedBreak[] {
  return source.map(b => b.kind === 'puzzle'
    ? {
        kind: 'puzzle', key: b.key, title: b.title[locale],
        question: b.question[locale],
        choices: b.choices.map(c => c[locale]),
        answer: b.answer,
        reveal: b.reveal[locale],
        cta: b.cta ? b.cta[locale] : DEFAULT_CTA[locale],
      }
    : {
        kind: 'passive', key: b.key, title: b.title[locale],
        prompt: b.prompt[locale],
        cta: b.cta ? b.cta[locale] : DEFAULT_CTA[locale],
      })
}
```

`DEFAULT_CTA` (`{ ru:'Продолжить', en:'Continue' }`) is reused for both variants.

### 3. `components/break-interstitial.tsx` — puzzle branch

The outer dialog shell (backdrop, modal box, `role="dialog"`, backdrop-dismiss → `onContinue`) is shared. Branch on `activity.kind`:

- **passive** → existing card (title + prompt + cta), behavior unchanged.
- **puzzle** → title + question + a vertical list of choice buttons. Local `useState<number | null>` for the picked index.
  - Before answering: choices are active; no Continue button (backdrop still dismisses = skip, no coercion).
  - After picking index `i`: lock all choices; mark the chosen one ✓ (if `i === activity.answer`) or ✗, and always mark the correct one; show `reveal`; show the Continue button → `onContinue`.
  - Correctness check is the inline expression `i === activity.answer` — trivial, no helper.

Styling uses the existing token vars (`--bg-surface`, `--border-color`, `--text-accent`, `--text-primary`, `--text-secondary`). Choice buttons get visible `:focus-visible` (inherits the global a11y outline from the contrast/keyboard slices) and ARIA: the chosen state announced via the button text/`aria-pressed`.

## Authenticity / values

A playful pattern-interrupt, not a game layer: **no score, no streak, no timer, no scarcity, no "you failed" shaming**. Wrong answers get the same gentle `reveal` ("вот почему"). Fully optional — backdrop-dismiss skips. De-gamified, consistent with the de-hustle / anti-vanity stance.

## Testing

- `lib/breaks/data.test.ts` (extend the existing file):
  - puzzle activity resolves: `question`, each `choices[i]`, and `reveal` localized to ru/en; `answer` index preserved; `cta` defaults when omitted.
  - passive activity still resolves exactly as before (regression).
  - a mixed `source` (one passive + one puzzle) resolves each by its `kind`.
- `components/break-interstitial.tsx` — build-validated only (`npm run build`), same as slice-1 overlay. No DOM logic test; the only branch logic (`i === answer`) is exercised by reading, not worth a jsdom harness.
- Full suite + build green, no regression to `should-break.test.ts` / `data.test.ts` passive cases.

## Scope

- Single app: `LMS/tochka-sborki/web/`. `lms_target: engine`.
- **Out of scope:** bespoke puzzle renderers (SVG pipe-sim, drag-and-drop word rearrange), authoring UI, scoring/progress, seeding real puzzle content into `BREAKS` (owner-gated, dark-ship), changes to the trigger decider/thresholds/wizard.

## Backward compatibility

`BreakActivity`/`ResolvedBreak` gain a `kind` discriminant. Because `BREAKS=[]`, there is no data to migrate. The passive variant preserves the exact current shape and overlay behavior. `shouldBreak`, `thresholds.ts`, and `unit-wizard.tsx` are untouched (decider counts length; wizard is variant-agnostic and already types on `ResolvedBreak`). No new dependencies.

## Task decomposition (for the plan)

1. **Discriminated-union types + `resolveBreaks` puzzle branch** (TDD on `data.test.ts`): convert types, branch the resolver, prove puzzle + passive + mixed resolution.
2. **Interactive puzzle branch in `break-interstitial.tsx`**: shared shell + `kind` branch, pick→lock→reveal→Continue, focus-visible/ARIA; build-validate + full suite green.
