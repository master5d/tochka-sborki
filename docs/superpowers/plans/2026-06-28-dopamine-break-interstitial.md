# Dopamine-break Interstitial Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a throttled mid-unit pattern-interrupt ("dopamine break") to the Точка Сборки course player — a pure trigger engine + thin overlay that ships dormant (dark) until break content lands via sibling ticket `fb_282cf1`.

**Architecture:** Engine+data pattern mirroring `lib/pacing` — keyed bilingual data (`BREAKS`, empty by default) + locale resolver + a pure `shouldBreak()` decider (fully unit-tested) + a thin presentational overlay wired into `components/unit-wizard.tsx` on the `handleNext` step transition. With empty data the decider always returns `false`, so current UX is byte-unchanged.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), TypeScript, React client components, Vitest. No new dependencies.

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Watch: `npm run test:watch`.
- Bilingual convention (verified against `lib/course/office-hours.ts`): `interface Bi { ru: string; en: string }` is **module-local, not exported/imported**; only `Locale` (`'ru' | 'en'`) comes from `@/lib/intake/types`.
- Threshold values are **exact**: `MIN_BREAK_STEP = 2`, `BREAK_COOLDOWN_STEPS = 3`, `MAX_BREAKS_PER_SESSION = 2`.
- CSS tokens (from `themes/model-kit.css`) — use these verbatim, they exist: `--bg-surface`, `--bg-primary`, `--text-primary`, `--text-secondary`, `--text-accent`, `--border-color`, `--font-mono`. There is **no** `--font-display` or `--bg-base` token; do not use them.
- Dark-ship: `BREAKS` stays `[]` in this slice. Do **not** author any puzzle/break content — that is sibling ticket `fb_282cf1`. No fabricated owner copy.
- Authenticity: no streak-shaming, no scarcity/countdown; the interstitial is always dismissible in a single tap and never blocks progress.
- Commit directly to `main` (trunk-based). Do **not** create a feature branch.
- No new dependencies. Reuse existing pacing helpers for rest detection.

---

### Task 1: Break data, types, thresholds, and resolver

**Files:**
- Create: `lib/breaks/types.ts`
- Create: `lib/breaks/thresholds.ts`
- Create: `lib/breaks/data.ts`
- Test: `lib/breaks/data.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/intake/types`.
- Produces:
  - `interface BreakActivity { key: string; title: Bi; prompt: Bi; cta?: Bi }`
  - `interface ResolvedBreak { key: string; title: string; prompt: string; cta: string }`
  - `interface BreakContext { availableCount: number; currentStep: number; stepsSinceLastBreak: number; breaksShownThisSession: number; restMode: boolean }`
  - `const BREAKS: BreakActivity[]` (empty)
  - `function resolveBreaks(locale: Locale, source?: BreakActivity[]): ResolvedBreak[]` — `source` defaults to `BREAKS`; the optional param exists for testability (mirrors the blog `getGraphEntries(locale, source)` precedent).
  - `const MIN_BREAK_STEP = 2`, `const BREAK_COOLDOWN_STEPS = 3`, `const MAX_BREAKS_PER_SESSION = 2`

- [ ] **Step 1: Write the failing test**

Create `lib/breaks/data.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { BREAKS, resolveBreaks } from './data'
import type { BreakActivity } from './types'

const sample: BreakActivity[] = [
  { key: 'breathe', title: { ru: 'Пауза', en: 'Pause' }, prompt: { ru: 'Сделай вдох', en: 'Take a breath' } },
  { key: 'look', title: { ru: 'Взгляд', en: 'Look' }, prompt: { ru: 'Посмотри вдаль', en: 'Look far' }, cta: { ru: 'Дальше', en: 'Onward' } },
]

describe('resolveBreaks', () => {
  it('returns [] when BREAKS is empty (dark-ship default)', () => {
    expect(BREAKS).toEqual([])
    expect(resolveBreaks('ru')).toEqual([])
    expect(resolveBreaks('en')).toEqual([])
  })

  it('maps Bi fields to the active locale', () => {
    expect(resolveBreaks('en', sample)[0]).toEqual({
      key: 'breathe', title: 'Pause', prompt: 'Take a breath', cta: 'Continue',
    })
    expect(resolveBreaks('ru', sample)[0].title).toBe('Пауза')
    expect(resolveBreaks('ru', sample)[0].prompt).toBe('Сделай вдох')
  })

  it('applies default cta only when cta is omitted', () => {
    const r = resolveBreaks('ru', sample)
    expect(r[0].cta).toBe('Продолжить') // omitted -> locale default
    expect(r[1].cta).toBe('Дальше')     // provided -> used verbatim
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/breaks/data.test.ts`
Expected: FAIL — cannot resolve `./data` / `./types` (modules not created yet).

- [ ] **Step 3: Create the types module**

Create `lib/breaks/types.ts`:

```ts
// lib/breaks/types.ts
// Trigger-engine types for the dopamine-break interstitial (fb_a03db93a5bbe).
// `Bi` is module-local by convention (see lib/course/office-hours.ts); only Locale is imported.
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
  cta: string
}

export interface BreakContext {
  availableCount: number
  currentStep: number
  stepsSinceLastBreak: number
  breaksShownThisSession: number
  restMode: boolean
}
```

- [ ] **Step 4: Create the thresholds module**

Create `lib/breaks/thresholds.ts`:

```ts
// lib/breaks/thresholds.ts
// Throttle constants for the dopamine-break trigger (mirrors lib/pacing/thresholds.ts).
export const MIN_BREAK_STEP = 2          // skip the shallow intro steps
export const BREAK_COOLDOWN_STEPS = 3    // step transitions between breaks
export const MAX_BREAKS_PER_SESSION = 2  // frequency cap per player session
```

- [ ] **Step 5: Create the data + resolver module**

Create `lib/breaks/data.ts`:

```ts
// lib/breaks/data.ts
// Dark-ship break content: BREAKS stays empty until the owner adds activities via
// fb_282cf1c678f7. With BREAKS empty, the trigger never fires (see shouldBreak gate 1).
import type { Locale } from '@/lib/intake/types'
import type { BreakActivity, ResolvedBreak } from './types'

export const BREAKS: BreakActivity[] = []

const DEFAULT_CTA: Record<Locale, string> = { ru: 'Продолжить', en: 'Continue' }

export function resolveBreaks(locale: Locale, source: BreakActivity[] = BREAKS): ResolvedBreak[] {
  return source.map(b => ({
    key: b.key,
    title: b.title[locale],
    prompt: b.prompt[locale],
    cta: b.cta ? b.cta[locale] : DEFAULT_CTA[locale],
  }))
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- lib/breaks/data.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add lib/breaks/types.ts lib/breaks/thresholds.ts lib/breaks/data.ts lib/breaks/data.test.ts
git commit -m "feat(breaks): break data/types/thresholds + locale resolver (fb_a03db93a5bbe)"
```

---

### Task 2: `shouldBreak` decider

**Files:**
- Create: `lib/breaks/should-break.ts`
- Test: `lib/breaks/should-break.test.ts`

**Interfaces:**
- Consumes: `BreakContext` from `./types`; `MIN_BREAK_STEP`, `BREAK_COOLDOWN_STEPS`, `MAX_BREAKS_PER_SESSION` from `./thresholds`.
- Produces: `function shouldBreak(ctx: BreakContext): boolean` — pure, no I/O, no React. Returns `true` only when every gate passes.

- [ ] **Step 1: Write the failing test**

Create `lib/breaks/should-break.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldBreak } from './should-break'
import type { BreakContext } from './types'

// A context where every gate passes; each test flips exactly one field.
const pass: BreakContext = {
  availableCount: 1,
  currentStep: 2,
  stepsSinceLastBreak: 3,
  breaksShownThisSession: 0,
  restMode: false,
}

describe('shouldBreak', () => {
  it('returns true when all gates pass', () => {
    expect(shouldBreak(pass)).toBe(true)
  })
  it('false when no break content is available (dark-ship)', () => {
    expect(shouldBreak({ ...pass, availableCount: 0 })).toBe(false)
  })
  it('false before MIN_BREAK_STEP', () => {
    expect(shouldBreak({ ...pass, currentStep: 1 })).toBe(false)
  })
  it('false within the cooldown window', () => {
    expect(shouldBreak({ ...pass, stepsSinceLastBreak: 2 })).toBe(false)
  })
  it('false at the session frequency cap', () => {
    expect(shouldBreak({ ...pass, breaksShownThisSession: 2 })).toBe(false)
  })
  it('false when pacing is in rest mode', () => {
    expect(shouldBreak({ ...pass, restMode: true })).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/breaks/should-break.test.ts`
Expected: FAIL — cannot resolve `./should-break`.

- [ ] **Step 3: Write the decider**

Create `lib/breaks/should-break.ts`:

```ts
// lib/breaks/should-break.ts
// Pure trigger decision for the dopamine-break interstitial. Every gate must pass.
import { MIN_BREAK_STEP, BREAK_COOLDOWN_STEPS, MAX_BREAKS_PER_SESSION } from './thresholds'
import type { BreakContext } from './types'

export function shouldBreak(ctx: BreakContext): boolean {
  if (ctx.availableCount <= 0) return false                       // dark-ship: no content
  if (ctx.currentStep < MIN_BREAK_STEP) return false             // skip intro steps
  if (ctx.stepsSinceLastBreak < BREAK_COOLDOWN_STEPS) return false // cooldown
  if (ctx.breaksShownThisSession >= MAX_BREAKS_PER_SESSION) return false // frequency cap
  if (ctx.restMode) return false                                 // don't stack on a rest nudge
  return true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/breaks/should-break.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/breaks/should-break.ts lib/breaks/should-break.test.ts
git commit -m "feat(breaks): pure shouldBreak trigger decider (fb_a03db93a5bbe)"
```

---

### Task 3: Interstitial overlay + unit-wizard wiring

**Files:**
- Create: `components/break-interstitial.tsx`
- Modify: `components/unit-wizard.tsx` (imports near top; state near lines 53-69; `handleNext` at lines 123-126; render the overlay inside the returned tree)

**Interfaces:**
- Consumes: `ResolvedBreak` from `@/lib/breaks/types`; `resolveBreaks` from `@/lib/breaks/data`; `shouldBreak` from `@/lib/breaks/should-break`; `BreakContext` from `@/lib/breaks/types`; existing `todayCount`, `currentStreak`, `recentDowngrade` from `@/lib/pacing/derive`; existing `REST_DAILY`, `REST_STREAK` from `@/lib/pacing/thresholds`; existing `localDate` from `@/lib/quests/daily-store`; existing `pacingState` (already destructured at `unit-wizard.tsx:69`).
- Produces: `function BreakInterstitial({ activity, onContinue }: { activity: ResolvedBreak | null; onContinue: () => void }): JSX.Element | null`.

- [ ] **Step 1: Create the interstitial component**

Create `components/break-interstitial.tsx`:

```tsx
'use client'

import type { ResolvedBreak } from '@/lib/breaks/types'

interface Props {
  activity: ResolvedBreak | null
  onContinue: () => void
}

// Thin presentational overlay. Renders null when there is no activity (belt-and-suspenders
// with the shouldBreak decider). Always dismissible: clicking the backdrop or the button
// calls onContinue. No business logic, no data imports beyond the resolved view type.
export function BreakInterstitial({ activity, onContinue }: Props) {
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
          {/* eyebrow is intentionally tiny and content-free until real breaks land */}
          ⏸
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
          {activity.title}
        </h2>
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
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add imports to `unit-wizard.tsx`**

In `components/unit-wizard.tsx`, add these imports alongside the existing import block (the file already imports `usePacing` from `@/lib/pacing/use-pacing` at line 12). Add:

```tsx
import { BreakInterstitial } from '@/components/break-interstitial'
import { resolveBreaks } from '@/lib/breaks/data'
import { shouldBreak } from '@/lib/breaks/should-break'
import type { ResolvedBreak } from '@/lib/breaks/types'
import { todayCount, currentStreak, recentDowngrade } from '@/lib/pacing/derive'
import { REST_DAILY, REST_STREAK } from '@/lib/pacing/thresholds'
import { localDate } from '@/lib/quests/daily-store'
```

> Note: `useState` and `useEffect` are already imported (line 3). `pacingState` is already destructured (line 69).

- [ ] **Step 3: Add break session state + derived values**

In `unit-wizard.tsx`, just after the existing `const { state: pacingState, logCompletion: logPacing } = usePacing()` (line 69), add:

```tsx
  // Dopamine-break (pattern-interrupt) trigger state — session-scoped, in-memory.
  const breaks = resolveBreaks(locale)
  const [breaksShown, setBreaksShown] = useState(0)
  const [lastBreakStep, setLastBreakStep] = useState(-Infinity)
  const [pendingBreak, setPendingBreak] = useState<ResolvedBreak | null>(null)

  function restModeNow(): boolean {
    const today = localDate()
    return (
      todayCount(pacingState, today) >= REST_DAILY ||
      currentStreak(pacingState, today) >= REST_STREAK ||
      recentDowngrade(pacingState)
    )
  }
```

- [ ] **Step 4: Gate `handleNext` on the break trigger**

Replace the existing `handleNext` (lines 123-126):

```tsx
  function handleNext() {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
    scrollToTop()
  }
```

with:

```tsx
  function advanceStep() {
    setCurrentStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
    scrollToTop()
  }

  function handleNext() {
    const decision = shouldBreak({
      availableCount: breaks.length,
      currentStep,
      stepsSinceLastBreak: currentStep - lastBreakStep,
      breaksShownThisSession: breaksShown,
      restMode: restModeNow(),
    })
    if (decision) {
      setPendingBreak(breaks[breaksShown % breaks.length])
      return // hold the step; advance after the learner taps continue
    }
    advanceStep()
  }

  function dismissBreak() {
    setBreaksShown(n => n + 1)
    setLastBreakStep(currentStep)
    setPendingBreak(null)
    advanceStep()
  }
```

> With `breaks.length === 0` (current dark-ship state), `shouldBreak` returns `false` on gate 1, so `handleNext` always calls `advanceStep()` — behavior identical to today.

- [ ] **Step 5: Render the overlay**

In the returned JSX of `unit-wizard.tsx`, render the interstitial inside the `UnitWizardContext.Provider` tree (place it immediately after the opening `<UnitWizardContext.Provider ...>` tag at line 149, before the breadcrumb div):

```tsx
      <BreakInterstitial activity={pendingBreak} onContinue={dismissBreak} />
```

- [ ] **Step 6: Verify the build passes**

Run: `npm run build`
Expected: build succeeds with no type errors. (`BreakInterstitial` renders `null` while `pendingBreak` is null, so the dark-ship page output is unchanged.)

- [ ] **Step 7: Verify existing tests still pass**

Run: `npm run test`
Expected: PASS — all existing tests plus the 9 new break tests (3 data + 6 decider). No existing test regresses.

- [ ] **Step 8: Commit**

```bash
git add components/break-interstitial.tsx components/unit-wizard.tsx
git commit -m "feat(breaks): interstitial overlay + throttled unit-wizard trigger (fb_a03db93a5bbe)"
```

---

## Self-Review

**1. Spec coverage:**
- Engine+data dark-ship (empty `BREAKS`, resolver) → Task 1. ✅
- Thresholds module → Task 1. ✅
- Pure `shouldBreak` with all 5 gates → Task 2 (+ one test per gate). ✅
- Interstitial component (null when no activity, dismissible) → Task 3 Step 1. ✅
- unit-wizard wiring on `handleNext`, session throttle, rest-mode suppression reusing existing pacing helpers → Task 3 Steps 2-5. ✅
- Backward compat (empty data ⇒ no behavior change) → noted in Task 3 Step 4 and Step 6. ✅
- Testing (pure tests + build validation, no new deps) → Tasks 1-3. ✅

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"/"similar to". Every code step shows complete code. The `⏸` eyebrow is intentional minimal chrome, not a content placeholder (real break content is sibling `fb_282cf1`).

**3. Type consistency:** `BreakActivity`/`ResolvedBreak`/`BreakContext` shapes identical across Tasks 1-3. `resolveBreaks(locale, source?)`, `shouldBreak(ctx)`, `BreakInterstitial({ activity, onContinue })` signatures match between producer and consumer tasks. `restMode` derived field name matches `BreakContext.restMode`. CSS tokens all verified present; no `--font-display`/`--bg-base` used.
