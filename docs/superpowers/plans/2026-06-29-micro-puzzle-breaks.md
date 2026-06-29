# Micro-puzzle Breaks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an interactive multiple-choice puzzle variant to the existing dopamine-break interstitial engine, shipping dark (`BREAKS=[]`).

**Architecture:** Convert `BreakActivity`/`ResolvedBreak` into discriminated unions on a `kind` field (`'passive' | 'puzzle'`); branch `resolveBreaks` by kind; add a puzzle branch to the `BreakInterstitial` overlay (pick → lock → reveal correct/incorrect + explanation → Continue). The trigger decider, thresholds, and wizard are untouched (decider counts length; wizard is variant-agnostic and already typed on `ResolvedBreak`).

**Tech Stack:** TypeScript, React (Next.js 16, `'use client'`), Vitest. No new dependencies.

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Scoped: `npm run test -- lib/breaks/data.test.ts`.
- Dark-ship: `BREAKS` stays `[]`. Do NOT seed real puzzle content — owner-gated.
- `Bi` is module-local in `types.ts` (`interface Bi { ru: string; en: string }`); only `Locale` is imported (from `@/lib/intake/types`).
- Backward compatibility: the `passive` variant must preserve the exact current resolved shape + overlay behavior. `lib/breaks/should-break.ts`, `lib/breaks/thresholds.ts`, and `components/unit-wizard.tsx` must NOT change.
- Authenticity: no score, no streak, no timer, no scarcity, no shaming. Wrong answers get the same gentle `reveal`. Puzzle is skippable via backdrop-dismiss.
- Additive: no new dependencies, no changes outside the 3 files named below + their tests.
- Commit directly to `main` (trunk-based). Do NOT create a feature branch.

---

### Task 1: Discriminated-union types + `resolveBreaks` puzzle branch

**Files:**
- Modify: `lib/breaks/types.ts` (full rewrite of the type block)
- Modify: `lib/breaks/data.ts` (branch `resolveBreaks`)
- Test: `lib/breaks/data.test.ts` (update existing fixtures + add puzzle/mixed cases)

**Interfaces:**
- Consumes: `Locale` from `@/lib/intake/types`.
- Produces:
  - `type BreakActivity = PassiveBreak | PuzzleBreak` (source, `Bi`-valued).
  - `type ResolvedBreak = ResolvedPassive | ResolvedPuzzle` (locale-resolved strings).
  - `PassiveBreak = { kind:'passive'; key:string; title:Bi; prompt:Bi; cta?:Bi }`.
  - `PuzzleBreak = { kind:'puzzle'; key:string; title:Bi; question:Bi; choices:Bi[]; answer:number; reveal:Bi; cta?:Bi }`.
  - `ResolvedPassive = { kind:'passive'; key:string; title:string; prompt:string; cta:string }`.
  - `ResolvedPuzzle = { kind:'puzzle'; key:string; title:string; question:string; choices:string[]; answer:number; reveal:string; cta:string }`.
  - `BreakContext` unchanged.
  - `resolveBreaks(locale: Locale, source?: BreakActivity[]): ResolvedBreak[]`.

- [ ] **Step 1: Rewrite the test fixtures + add the failing puzzle/mixed cases**

Replace the entire contents of `lib/breaks/data.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { BREAKS, resolveBreaks } from './data'
import type { BreakActivity } from './types'

const sample: BreakActivity[] = [
  { kind: 'passive', key: 'breathe', title: { ru: 'Пауза', en: 'Pause' }, prompt: { ru: 'Сделай вдох', en: 'Take a breath' } },
  { kind: 'passive', key: 'look', title: { ru: 'Взгляд', en: 'Look' }, prompt: { ru: 'Посмотри вдаль', en: 'Look far' }, cta: { ru: 'Дальше', en: 'Onward' } },
]

const puzzle: BreakActivity = {
  kind: 'puzzle',
  key: 'glass',
  title: { ru: 'Паззл', en: 'Puzzle' },
  question: { ru: 'Какой стакан наполнится первым?', en: 'Which glass fills first?' },
  choices: [
    { ru: 'Первый', en: 'First' },
    { ru: 'Третий', en: 'Third' },
  ],
  answer: 1,
  reveal: { ru: 'Труба к третьему открыта', en: 'The pipe to the third is open' },
}

describe('resolveBreaks', () => {
  it('returns [] when BREAKS is empty (dark-ship default)', () => {
    expect(BREAKS).toEqual([])
    expect(resolveBreaks('ru')).toEqual([])
    expect(resolveBreaks('en')).toEqual([])
  })

  it('maps passive Bi fields to the active locale', () => {
    expect(resolveBreaks('en', sample)[0]).toEqual({
      kind: 'passive', key: 'breathe', title: 'Pause', prompt: 'Take a breath', cta: 'Continue',
    })
    expect(resolveBreaks('ru', sample)[0].title).toBe('Пауза')
    expect(resolveBreaks('ru', sample)[0].prompt).toBe('Сделай вдох')
  })

  it('applies default cta only when cta is omitted (passive)', () => {
    const r = resolveBreaks('ru', sample)
    expect(r[0].cta).toBe('Продолжить') // omitted -> locale default
    expect(r[1].cta).toBe('Дальше')     // provided -> used verbatim
  })

  it('resolves a puzzle activity: localized question/choices/reveal, answer index preserved', () => {
    const r = resolveBreaks('en', [puzzle])[0]
    expect(r).toEqual({
      kind: 'puzzle',
      key: 'glass',
      title: 'Puzzle',
      question: 'Which glass fills first?',
      choices: ['First', 'Third'],
      answer: 1,
      reveal: 'The pipe to the third is open',
      cta: 'Continue',
    })
    const ru = resolveBreaks('ru', [puzzle])[0]
    expect(ru.kind === 'puzzle' && ru.choices).toEqual(['Первый', 'Третий'])
    expect(ru.kind === 'puzzle' && ru.question).toBe('Какой стакан наполнится первым?')
    expect(ru.cta).toBe('Продолжить')
  })

  it('resolves a mixed source by kind', () => {
    const r = resolveBreaks('en', [sample[0], puzzle])
    expect(r[0].kind).toBe('passive')
    expect(r[1].kind).toBe('puzzle')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- lib/breaks/data.test.ts`
Expected: FAIL — TypeScript errors (fixtures use `kind`, which the old `BreakActivity` lacks) and/or the puzzle case fails because `resolveBreaks` doesn't branch.

- [ ] **Step 3: Rewrite the types**

Replace the entire contents of `lib/breaks/types.ts` with:

```ts
// lib/breaks/types.ts
// Trigger-engine types for the break interstitial (fb_a03db93a5bbe + fb_282cf1c678f7).
// `Bi` is module-local by convention (see lib/course/office-hours.ts); only Locale is imported.
interface Bi { ru: string; en: string }

export interface PassiveBreak {
  kind: 'passive'
  key: string
  title: Bi
  prompt: Bi
  cta?: Bi
}

export interface PuzzleBreak {
  kind: 'puzzle'
  key: string
  title: Bi
  question: Bi
  choices: Bi[]   // >= 2
  answer: number  // index into choices
  reveal: Bi      // one-line explanation shown after answering
  cta?: Bi
}

export type BreakActivity = PassiveBreak | PuzzleBreak

export interface ResolvedPassive {
  kind: 'passive'
  key: string
  title: string
  prompt: string
  cta: string
}

export interface ResolvedPuzzle {
  kind: 'puzzle'
  key: string
  title: string
  question: string
  choices: string[]
  answer: number
  reveal: string
  cta: string
}

export type ResolvedBreak = ResolvedPassive | ResolvedPuzzle

export interface BreakContext {
  availableCount: number
  currentStep: number
  stepsSinceLastBreak: number
  breaksShownThisSession: number
  restMode: boolean
}
```

- [ ] **Step 4: Branch `resolveBreaks` by kind**

Replace the entire contents of `lib/breaks/data.ts` with:

```ts
// lib/breaks/data.ts
// Dark-ship break content: BREAKS stays empty until the owner adds activities via
// fb_282cf1c678f7. With BREAKS empty, the trigger never fires (see shouldBreak gate 1).
import type { Locale } from '@/lib/intake/types'
import type { BreakActivity, ResolvedBreak } from './types'

export const BREAKS: BreakActivity[] = []

const DEFAULT_CTA: Record<Locale, string> = { ru: 'Продолжить', en: 'Continue' }

export function resolveBreaks(locale: Locale, source: BreakActivity[] = BREAKS): ResolvedBreak[] {
  return source.map(b => {
    const cta = b.cta ? b.cta[locale] : DEFAULT_CTA[locale]
    if (b.kind === 'puzzle') {
      return {
        kind: 'puzzle',
        key: b.key,
        title: b.title[locale],
        question: b.question[locale],
        choices: b.choices.map(c => c[locale]),
        answer: b.answer,
        reveal: b.reveal[locale],
        cta,
      }
    }
    return {
      kind: 'passive',
      key: b.key,
      title: b.title[locale],
      prompt: b.prompt[locale],
      cta,
    }
  })
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm run test -- lib/breaks/data.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Confirm the breaks unit tests pass (do NOT run the full build yet)**

Run: `npm run test -- lib/breaks`
Expected: PASS — `data.test.ts` (5) + `should-break.test.ts` (unchanged) green.

Do NOT run `npm run build` in this task. It is **expected to fail** here: the un-edited `break-interstitial.tsx` still reads `activity.prompt` directly, which no longer exists on the `ResolvedBreak` union until the Task 2 branch narrows on `kind`. The full build is restored to green in Task 2 Step 2. (Vitest transpiles without whole-program typechecking, so the unit tests pass independently — that is Task 1's testable deliverable.)

- [ ] **Step 7: Commit**

```bash
git add lib/breaks/types.ts lib/breaks/data.ts lib/breaks/data.test.ts
git commit -m "feat(breaks): discriminated-union BreakActivity + puzzle resolve branch (fb_282cf1c678f7)"
```

---

### Task 2: Interactive puzzle branch in the interstitial overlay

**Files:**
- Modify: `components/break-interstitial.tsx` (full rewrite — shared shell + `kind` branch)

**Interfaces:**
- Consumes: `ResolvedBreak` (`ResolvedPassive | ResolvedPuzzle`) from `@/lib/breaks/types` (Task 1).
- Props unchanged: `{ activity: ResolvedBreak | null; onContinue: () => void }`.
- No new exports. `unit-wizard.tsx` continues to render `<BreakInterstitial activity={pendingBreak} onContinue={dismissBreak} />` with no change.

- [ ] **Step 1: Rewrite the overlay with a passive + puzzle branch**

Replace the entire contents of `components/break-interstitial.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import type { ResolvedBreak } from '@/lib/breaks/types'

interface Props {
  activity: ResolvedBreak | null
  onContinue: () => void
}

// Thin presentational overlay. Renders null when there is no activity (belt-and-suspenders
// with the shouldBreak decider). Always dismissible: clicking the backdrop calls onContinue.
// Passive breaks show a prompt + Continue. Puzzle breaks show a question + choices; picking
// an answer locks the choices, reveals correct/incorrect + a one-line explanation, then offers
// Continue. No score, no streak, no shaming — a gentle pattern-interrupt.
export function BreakInterstitial({ activity, onContinue }: Props) {
  const [picked, setPicked] = useState<number | null>(null)

  if (!activity) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activity.title}
      onClick={onContinue}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 420, width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 12, padding: '1.75rem', textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-accent)', marginBottom: '0.6rem',
        }}>
          ⏸
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
          {activity.title}
        </h2>

        {activity.kind === 'passive' ? (
          <>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
              {activity.prompt}
            </p>
            <button
              type="button"
              onClick={onContinue}
              style={{
                background: 'var(--text-accent)', color: 'var(--bg-primary)',
                border: 'none', borderRadius: 8, padding: '0.6rem 1.4rem',
                fontWeight: 600, cursor: 'pointer',
              }}
            >
              {activity.cta}
            </button>
          </>
        ) : (
          <>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
              {activity.question}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {activity.choices.map((choice, i) => {
                const isCorrect = i === activity.answer
                const isPicked = i === picked
                const answered = picked !== null
                // After answering: highlight the correct choice; mark the wrong pick.
                const mark = answered && isCorrect ? ' ✓' : answered && isPicked ? ' ✗' : ''
                const borderColor = answered && isCorrect
                  ? 'var(--text-accent)'
                  : answered && isPicked
                    ? 'var(--crit, #c0392b)'
                    : 'var(--border-color)'
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={answered}
                    aria-pressed={isPicked}
                    onClick={() => setPicked(i)}
                    style={{
                      background: 'transparent', color: 'var(--text-primary)',
                      border: `1px solid ${borderColor}`, borderRadius: 8,
                      padding: '0.6rem 1rem', textAlign: 'left',
                      cursor: answered ? 'default' : 'pointer',
                      opacity: answered && !isCorrect && !isPicked ? 0.6 : 1,
                    }}
                  >
                    {choice}{mark}
                  </button>
                )
              })}
            </div>
            {picked !== null && (
              <>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.25rem', fontStyle: 'italic' }}>
                  {activity.reveal}
                </p>
                <button
                  type="button"
                  onClick={onContinue}
                  style={{
                    background: 'var(--text-accent)', color: 'var(--bg-primary)',
                    border: 'none', borderRadius: 8, padding: '0.6rem 1.4rem',
                    fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {activity.cta}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to verify the overlay typechecks and compiles**

Run: `npm run build`
Expected: build succeeds — the `activity.kind` discriminant narrows `activity.prompt` (passive) and `activity.question`/`choices`/`answer`/`reveal` (puzzle) correctly.

- [ ] **Step 3: Run the full test suite (no regression)**

Run: `npm run test`
Expected: PASS — full suite green, including `lib/breaks/data.test.ts` (5) and `lib/breaks/should-break.test.ts` (unchanged).

- [ ] **Step 4: Commit**

```bash
git add components/break-interstitial.tsx
git commit -m "feat(breaks): interactive multiple-choice puzzle variant in interstitial (fb_282cf1c678f7)"
```

---

## Self-Review

**1. Spec coverage:**
- Discriminated-union `BreakActivity`/`ResolvedBreak` on `kind` → Task 1 Steps 3. ✅
- `resolveBreaks` branches by kind, `BREAKS=[]` preserved → Task 1 Step 4. ✅
- Puzzle resolution test (localized question/choices/reveal, answer index, default cta) + passive regression + mixed source → Task 1 Step 1. ✅
- Interactive overlay branch: pick → lock → reveal ✓/✗ + explanation → Continue; backdrop-dismiss skip; no Continue before answering → Task 2 Step 1. ✅
- Authenticity (no score/streak/timer/shaming; same gentle reveal on wrong) → Task 2 overlay (no scoring state; `reveal` shown regardless of correctness). ✅
- Token-var styling + focus-visible/ARIA (`aria-pressed`, `aria-modal`, `aria-label`) → Task 2 Step 1. ✅
- Backward compat: passive resolved shape gains only `kind`; overlay passive branch byte-equivalent in behavior; should-break/thresholds/wizard untouched → Global Constraints + Task 1 Step 6 + Task 2 Step 3. ✅
- Out of scope (bespoke renderers, authoring UI, scoring, seeding BREAKS) → not implemented. ✅

**2. Placeholder scan:** No TBD/TODO. All code (types, resolver, test, overlay) is complete and verbatim. `var(--crit, #c0392b)` uses a CSS fallback, not a code placeholder.

**3. Type consistency:** `resolveBreaks(locale, source?): ResolvedBreak[]` matches between Task 1 (produces) and Task 2 (consumes). The discriminant `kind` is `'passive' | 'puzzle'` everywhere. `ResolvedPuzzle` fields used in the overlay (`question`, `choices`, `answer`, `reveal`, `cta`, `title`) all exist in the Task 1 type. `ResolvedPassive` fields (`prompt`, `cta`, `title`) match the overlay passive branch. Props `{ activity: ResolvedBreak | null; onContinue: () => void }` are unchanged, so `unit-wizard.tsx` needs no edit (confirmed: it imports `ResolvedBreak` and renders the component as-is).
