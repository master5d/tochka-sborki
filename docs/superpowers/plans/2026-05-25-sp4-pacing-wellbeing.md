# SP4 — Pacing & Wellbeing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side pacing/wellbeing layer — activity tracking + four gentle, dismissible nudges (rest-day, G11 re-engagement, post-Boss calibration, anxiety check-in) shown one-at-a-time on the dashboard, plus a calibration-driven mode suggestion.

**Architecture:** New `lib/pacing/` records activity in a `pacing` localStorage key (pure helpers + store + hook, mirroring `lib/unit-progress.ts`). Pure derivations feed a `lib/wellbeing/selectNudge` priority picker rendered by a single `<WellbeingPanel>`. All client-side; no server/D1. Calibration ratings drive a suggest-only mode badge in `ModeSelector`.

**Tech Stack:** Next.js 16 (static export), React, TypeScript, Vitest. Reuses `Mode`/`MODE` (`lib/cs`), `localDate` (`lib/quests/daily-store`), intake profile.

**Reference spec:** `docs/superpowers/specs/2026-05-25-sp4-pacing-wellbeing-design.md`

**Branch:** `sp4-pacing-wellbeing` (already created off main).

**Conventions:** client store = pure helpers + storage shell + hook. Bilingual via `Bi`/`Record<Locale,…>` constants. Run vitest with `--no-file-parallelism` (suite is flaky under full parallelism). Do NOT `git add -A` — an unrelated `meta.json` must stay unstaged; stage only listed files.

---

### Task 1: pacing types, thresholds, store

**Files:**
- Create: `web/lib/pacing/types.ts`
- Create: `web/lib/pacing/thresholds.ts`
- Create: `web/lib/pacing/store.ts`
- Create: `web/lib/pacing/store.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/pacing/store.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { freshPacing, logCompletion, touch, recordCalibration, dismissNudge } from './store'

describe('pacing store mutations', () => {
  it('logs a completion and records the active date', () => {
    const s = logCompletion(freshPacing(), '01/u1', 'copilot', '2026-05-25')
    expect(s.completions).toEqual([{ unitKey: '01/u1', date: '2026-05-25', mode: 'copilot' }])
    expect(s.activeDates).toEqual(['2026-05-25'])
  })
  it('is idempotent for the same unit on the same day', () => {
    let s = logCompletion(freshPacing(), '01/u1', 'copilot', '2026-05-25')
    s = logCompletion(s, '01/u1', 'archmage', '2026-05-25')
    expect(s.completions).toHaveLength(1)
  })
  it('does not mutate the input', () => {
    const base = freshPacing()
    logCompletion(base, '01/u1', 'copilot', '2026-05-25')
    expect(base.completions).toHaveLength(0)
  })
  it('caps completions at 50 (FIFO)', () => {
    let s = freshPacing()
    for (let i = 0; i < 55; i++) s = logCompletion(s, `m/u${i}`, 'commander', '2026-05-25')
    expect(s.completions).toHaveLength(50)
    expect(s.completions[0].unitKey).toBe('m/u5')
  })
  it('touch sets lastSeen and active date', () => {
    const s = touch(freshPacing(), '2026-05-25')
    expect(s.lastSeen).toBe('2026-05-25')
    expect(s.activeDates).toContain('2026-05-25')
  })
  it('records calibration (map + lastCalibration)', () => {
    const s = recordCalibration(freshPacing(), '04-prompt-engineering', 'harder')
    expect(s.calibration['04-prompt-engineering']).toBe('harder')
    expect(s.lastCalibration).toEqual({ module: '04-prompt-engineering', rating: 'harder' })
  })
  it('dismissNudge stamps the date', () => {
    const s = dismissNudge(freshPacing(), 'rest', '2026-05-25')
    expect(s.dismissed.rest).toBe('2026-05-25')
  })
})
```

- [ ] **Step 2: Run to verify it fails**
Run: `cd web && npx vitest run lib/pacing/store.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './store'`.

- [ ] **Step 3: Create `web/lib/pacing/types.ts`**
```ts
import type { Mode } from '@/lib/cs/types'

export interface Completion { unitKey: string; date: string; mode: Mode }
export type CalibrationRating = 'easier' | 'right' | 'harder'

export interface PacingState {
  activeDates: string[]                                  // YYYY-MM-DD, dedup + asc, cap 60
  lastSeen: string                                       // YYYY-MM-DD of last touch()
  completions: Completion[]                              // cap 50, chronological
  calibration: Record<string, CalibrationRating>         // by module slug
  lastCalibration?: { module: string; rating: CalibrationRating }
  dismissed: Record<string, string>                      // nudgeKey -> YYYY-MM-DD
}

export const PACING_KEY = 'pacing'
```

- [ ] **Step 4: Create `web/lib/pacing/thresholds.ts`**
```ts
export const REST_DAILY = 4   // completions in one day → rest/check-in signal
export const REST_STREAK = 5  // consecutive active days → rest signal
export const LAPSE_DAYS = 7   // days since last visit → re-engagement
```

- [ ] **Step 5: Create `web/lib/pacing/store.ts`**
```ts
import { PACING_KEY, type PacingState, type CalibrationRating } from './types'
import type { Mode } from '@/lib/cs/types'

const COMPLETIONS_CAP = 50
const ACTIVE_DATES_CAP = 60

export function freshPacing(): PacingState {
  return { activeDates: [], lastSeen: '', completions: [], calibration: {}, dismissed: {} }
}

function addDate(dates: string[], date: string): string[] {
  if (dates.includes(date)) return dates
  const next = [...dates, date].sort()
  return next.length > ACTIVE_DATES_CAP ? next.slice(next.length - ACTIVE_DATES_CAP) : next
}

export function logCompletion(state: PacingState, unitKey: string, mode: Mode, date: string): PacingState {
  const activeDates = addDate(state.activeDates, date)
  if (state.completions.some(c => c.unitKey === unitKey && c.date === date)) {
    return { ...state, activeDates }
  }
  const completions = [...state.completions, { unitKey, date, mode }]
  const capped = completions.length > COMPLETIONS_CAP
    ? completions.slice(completions.length - COMPLETIONS_CAP)
    : completions
  return { ...state, completions: capped, activeDates }
}

export function touch(state: PacingState, date: string): PacingState {
  return { ...state, lastSeen: date, activeDates: addDate(state.activeDates, date) }
}

export function recordCalibration(state: PacingState, moduleSlug: string, rating: CalibrationRating): PacingState {
  return {
    ...state,
    calibration: { ...state.calibration, [moduleSlug]: rating },
    lastCalibration: { module: moduleSlug, rating },
  }
}

export function dismissNudge(state: PacingState, key: string, date: string): PacingState {
  return { ...state, dismissed: { ...state.dismissed, [key]: date } }
}

// ---- storage shell (browser only) ----
export function readPacing(): PacingState {
  try {
    const raw = localStorage.getItem(PACING_KEY)
    if (!raw) return freshPacing()
    const p = JSON.parse(raw) as Partial<PacingState>
    return {
      activeDates: Array.isArray(p.activeDates) ? p.activeDates : [],
      lastSeen: typeof p.lastSeen === 'string' ? p.lastSeen : '',
      completions: Array.isArray(p.completions) ? p.completions : [],
      calibration: p.calibration && typeof p.calibration === 'object' ? p.calibration : {},
      lastCalibration: p.lastCalibration,
      dismissed: p.dismissed && typeof p.dismissed === 'object' ? p.dismissed : {},
    }
  } catch {
    return freshPacing()
  }
}

export function writePacing(state: PacingState): void {
  try { localStorage.setItem(PACING_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}
```

- [ ] **Step 6: Run to verify it passes**
Run: `cd web && npx vitest run lib/pacing/store.test.ts --no-file-parallelism`
Expected: PASS (7 tests).

- [ ] **Step 7: Commit**
```bash
git add web/lib/pacing/types.ts web/lib/pacing/thresholds.ts web/lib/pacing/store.ts web/lib/pacing/store.test.ts
git commit -m "feat(pacing): pacing store + thresholds (SP4 foundation)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: pacing derivations

**Files:**
- Create: `web/lib/pacing/derive.ts`
- Create: `web/lib/pacing/derive.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/pacing/derive.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { todayCount, currentStreak, recentDowngrade, daysBetween } from './derive'
import { freshPacing, logCompletion } from './store'
import type { PacingState } from './types'

function withDates(dates: string[]): PacingState {
  return { ...freshPacing(), activeDates: [...dates].sort() }
}

describe('derive', () => {
  it('todayCount counts only today', () => {
    let s = logCompletion(freshPacing(), 'a', 'commander', '2026-05-25')
    s = logCompletion(s, 'b', 'commander', '2026-05-25')
    s = logCompletion(s, 'c', 'commander', '2026-05-24')
    expect(todayCount(s, '2026-05-25')).toBe(2)
  })
  it('currentStreak counts consecutive days ending today', () => {
    const s = withDates(['2026-05-23', '2026-05-24', '2026-05-25'])
    expect(currentStreak(s, '2026-05-25')).toBe(3)
  })
  it('currentStreak counts from yesterday when today is inactive', () => {
    const s = withDates(['2026-05-23', '2026-05-24'])
    expect(currentStreak(s, '2026-05-25')).toBe(2)
  })
  it('currentStreak is 0 with a gap', () => {
    const s = withDates(['2026-05-20', '2026-05-25'])
    expect(currentStreak(s, '2026-05-27')).toBe(0)
  })
  it('daysBetween computes calendar-day gap', () => {
    expect(daysBetween('2026-05-18', '2026-05-25')).toBe(7)
    expect(daysBetween('2026-05-25', '2026-05-25')).toBe(0)
  })
  it('recentDowngrade detects a strictly decreasing mode run', () => {
    let s = logCompletion(freshPacing(), 'a', 'archmage', '2026-05-25')
    s = logCompletion(s, 'b', 'copilot', '2026-05-25')
    s = logCompletion(s, 'c', 'commander', '2026-05-25')
    expect(recentDowngrade(s)).toBe(true)
  })
  it('recentDowngrade is false when steady or rising', () => {
    let s = logCompletion(freshPacing(), 'a', 'commander', '2026-05-25')
    s = logCompletion(s, 'b', 'copilot', '2026-05-25')
    expect(recentDowngrade(s)).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**
Run: `cd web && npx vitest run lib/pacing/derive.test.ts --no-file-parallelism`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/lib/pacing/derive.ts`**
```ts
import type { PacingState } from './types'
import type { Mode } from '@/lib/cs/types'

const RANK: Record<Mode, number> = { commander: 0, copilot: 1, archmage: 2 }

export function todayCount(state: PacingState, today: string): number {
  return state.completions.filter(c => c.date === today).length
}

function dayBefore(date: string): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function currentStreak(state: PacingState, today: string): number {
  const set = new Set(state.activeDates)
  let cursor: string | null = set.has(today)
    ? today
    : (set.has(dayBefore(today)) ? dayBefore(today) : null)
  let n = 0
  while (cursor && set.has(cursor)) { n++; cursor = dayBefore(cursor) }
  return n
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00').getTime()
  const b = new Date(to + 'T00:00:00').getTime()
  return Math.round((b - a) / 86400000)
}

export function recentDowngrade(state: PacingState): boolean {
  const recent = state.completions.slice(-3)
  if (recent.length < 2) return false
  for (let i = 1; i < recent.length; i++) {
    if (RANK[recent[i].mode] >= RANK[recent[i - 1].mode]) return false
  }
  return true
}
```

- [ ] **Step 4: Run to verify it passes**
Run: `cd web && npx vitest run lib/pacing/derive.test.ts --no-file-parallelism`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**
```bash
git add web/lib/pacing/derive.ts web/lib/pacing/derive.test.ts
git commit -m "feat(pacing): activity derivations (streak/intensity/downgrade)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: usePacing hook + log completions from the wizard

**Files:**
- Create: `web/lib/pacing/use-pacing.ts`
- Modify: `web/components/unit-wizard.tsx` (import + `handleComplete`)

- [ ] **Step 1: Create `web/lib/pacing/use-pacing.ts`**
```ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  freshPacing, readPacing, writePacing,
  logCompletion as _log, touch as _touch,
  recordCalibration as _cal, dismissNudge as _dismiss,
} from './store'
import { localDate } from '@/lib/quests/daily-store'
import type { PacingState, CalibrationRating } from './types'
import type { Mode } from '@/lib/cs/types'

export function usePacing() {
  const [state, setState] = useState<PacingState>(freshPacing)
  const [ready, setReady] = useState(false)

  useEffect(() => { setState(readPacing()); setReady(true) }, [])

  const update = useCallback((fn: (s: PacingState) => PacingState) => {
    setState(prev => { const next = fn(prev); writePacing(next); return next })
  }, [])

  const logCompletion = useCallback((unitKey: string, mode: Mode) =>
    update(s => _log(s, unitKey, mode, localDate())), [update])
  const touch = useCallback(() => update(s => _touch(s, localDate())), [update])
  const recordCalibration = useCallback((m: string, r: CalibrationRating) =>
    update(s => _cal(s, m, r)), [update])
  const dismissNudge = useCallback((k: string) =>
    update(s => _dismiss(s, k, localDate())), [update])

  return { state, ready, logCompletion, touch, recordCalibration, dismissNudge }
}
```

- [ ] **Step 2: Wire into `web/components/unit-wizard.tsx`.** Add the import near the other lib imports:
```tsx
import { usePacing } from '@/lib/pacing/use-pacing'
```
Inside the component, near the `useShards()` call, add:
```tsx
  const { logCompletion: logPacing } = usePacing()
```
In `handleComplete`, after `if (chosenMode) award(unitKey, chosenMode)`, add:
```tsx
    logPacing(unitKey, chosenMode ?? 'commander')
```

- [ ] **Step 3: Verify the suite still passes (no behavior regression)**
Run: `cd web && npx vitest run --no-file-parallelism`
Expected: PASS (existing + Task 1/2 tests). The hook has no dedicated test (thin wrapper over tested pure fns).

- [ ] **Step 4: Commit**
```bash
git add web/lib/pacing/use-pacing.ts web/components/unit-wizard.tsx
git commit -m "feat(pacing): usePacing hook; log unit completions from the wizard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: G11 aspiration parser

**Files:**
- Create: `web/lib/intake/parse-aspiration.ts`
- Create: `web/lib/intake/parse-aspiration.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/intake/parse-aspiration.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { parseAspiration } from './parse-aspiration'

describe('parseAspiration', () => {
  it('reads G11 from an object answers field', () => {
    expect(parseAspiration({ answers: { G11: 'Ada Lovelace' } })).toBe('Ada Lovelace')
  })
  it('reads G11 from a JSON-string answers field', () => {
    expect(parseAspiration({ answers: JSON.stringify({ G11: 'Ada Lovelace' }) })).toBe('Ada Lovelace')
  })
  it('returns null when G11 is missing, empty, or non-string', () => {
    expect(parseAspiration({ answers: { G11: '  ' } })).toBeNull()
    expect(parseAspiration({ answers: {} })).toBeNull()
    expect(parseAspiration(null)).toBeNull()
    expect(parseAspiration({ answers: 'not json' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**
Run: `cd web && npx vitest run lib/intake/parse-aspiration.test.ts --no-file-parallelism`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/lib/intake/parse-aspiration.ts`** (mirrors `parse-outcome.ts`)
```ts
// web/lib/intake/parse-aspiration.ts
// Extract the learner's aspirational figure (G11) from an intake profile.
// `profile.answers` may be a JSON string or an already-parsed object; G11 is optional.
export function parseAspiration(profile: { answers?: unknown } | null | undefined): string | null {
  try {
    const raw = profile?.answers
    const a = typeof raw === 'string' ? JSON.parse(raw) : raw
    const g11 = (a as Record<string, unknown> | null | undefined)?.G11
    return typeof g11 === 'string' && g11.trim() ? g11 : null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run to verify it passes**
Run: `cd web && npx vitest run lib/intake/parse-aspiration.test.ts --no-file-parallelism`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add web/lib/intake/parse-aspiration.ts web/lib/intake/parse-aspiration.test.ts
git commit -m "feat(intake): parseAspiration (G11) extractor

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: calibration → mode suggestion + ModeSelector badge

**Files:**
- Create: `web/lib/pacing/suggest-mode.ts`
- Create: `web/lib/pacing/suggest-mode.test.ts`
- Modify: `web/components/cs/mode-selector.tsx` (optional `suggested` prop + badge)
- Modify: `web/components/unit-wizard.tsx` (pass `suggested`)

- [ ] **Step 1: Write the failing test** — `web/lib/pacing/suggest-mode.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { suggestModeFromCalibration } from './suggest-mode'

describe('suggestModeFromCalibration', () => {
  it('suggests commander after a "harder" rating', () => {
    expect(suggestModeFromCalibration('harder')).toBe('commander')
  })
  it('suggests archmage after an "easier" rating', () => {
    expect(suggestModeFromCalibration('easier')).toBe('archmage')
  })
  it('suggests nothing for "right" or undefined', () => {
    expect(suggestModeFromCalibration('right')).toBeNull()
    expect(suggestModeFromCalibration(undefined)).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**
Run: `cd web && npx vitest run lib/pacing/suggest-mode.test.ts --no-file-parallelism`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/lib/pacing/suggest-mode.ts`**
```ts
import type { Mode } from '@/lib/cs/types'
import type { CalibrationRating } from './types'

export function suggestModeFromCalibration(rating: CalibrationRating | undefined): Mode | null {
  if (rating === 'harder') return 'commander'
  if (rating === 'easier') return 'archmage'
  return null
}
```

- [ ] **Step 4: Run to verify it passes**
Run: `cd web && npx vitest run lib/pacing/suggest-mode.test.ts --no-file-parallelism`
Expected: PASS (3 tests).

- [ ] **Step 5: Add the `suggested` badge to `web/components/cs/mode-selector.tsx`.** Add `suggested?: Mode` to the prop type, a `REC` label constant, and render a badge on the matching mode. Replace the component's props destructuring and the `<span>` holding the label:

Add after the `HEADING` constant:
```tsx
const REC: Record<Locale, string> = { ru: 'рекомендуем', en: 'recommended' }
```
Add `suggested` to the destructured props and its type:
```tsx
export function ModeSelector({
  locale,
  accent,
  selected,
  onSelect,
  helpId,
  suggested,
}: {
  locale: Locale
  accent: string
  selected?: Mode
  onSelect: (mode: Mode) => void
  helpId?: string
  suggested?: Mode
}) {
```
Replace the label `<span>` (the one rendering `cfg.label[locale]`) with one that appends the badge when `suggested === m && !active`:
```tsx
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: active ? accent : 'var(--text-primary)' }}>
                  {cfg.label[locale]}
                  {suggested === m && !active && (
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.6rem', fontWeight: 400, color: accent, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      ◆ {REC[locale]}
                    </span>
                  )}
                </span>
```

- [ ] **Step 6: Pass `suggested` from `web/components/unit-wizard.tsx`.** Add the import:
```tsx
import { suggestModeFromCalibration } from '@/lib/pacing/suggest-mode'
```
Get pacing state from the hook already added in Task 3 — change that line to also expose `state`:
```tsx
  const { state: pacingState, logCompletion: logPacing } = usePacing()
```
Compute the suggestion and pass it to the `<ModeSelector>`:
```tsx
  const suggestedMode = suggestModeFromCalibration(pacingState.lastCalibration?.rating)
```
In the `<ModeSelector ... />` JSX add the prop:
```tsx
          suggested={suggestedMode}
```

- [ ] **Step 7: Run the suite**
Run: `cd web && npx vitest run --no-file-parallelism`
Expected: PASS.

- [ ] **Step 8: Commit**
```bash
git add web/lib/pacing/suggest-mode.ts web/lib/pacing/suggest-mode.test.ts web/components/cs/mode-selector.tsx web/components/unit-wizard.tsx
git commit -m "feat(pacing): calibration-driven mode suggestion (suggest-only badge)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 6: wellbeing content + selectNudge

**Files:**
- Create: `web/lib/wellbeing/types.ts`
- Create: `web/lib/wellbeing/content.ts`
- Create: `web/lib/wellbeing/select-nudge.ts`
- Create: `web/lib/wellbeing/select-nudge.test.ts`

- [ ] **Step 1: Write the failing test** — `web/lib/wellbeing/select-nudge.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { selectNudge } from './select-nudge'
import { freshPacing } from '@/lib/pacing/store'
import type { NudgeContext } from './types'

const baseCtx: NudgeContext = {
  daysSinceActive: 0, todayCount: 0, currentStreak: 0, recentDowngrade: false,
  hasIncomplete: true, freshModule: null, g11: null, outcome: null, questsLeft: 5,
}
const TODAY = '2026-05-25'

describe('selectNudge', () => {
  it('returns null when no signal fires', () => {
    expect(selectNudge(freshPacing(), baseCtx, TODAY)).toBeNull()
  })
  it('prioritises re-engagement when lapsed with incomplete work', () => {
    const n = selectNudge(freshPacing(), { ...baseCtx, daysSinceActive: 8 }, TODAY)
    expect(n?.kind).toBe('reengage')
  })
  it('does not re-engage when everything is complete', () => {
    const n = selectNudge(freshPacing(), { ...baseCtx, daysSinceActive: 8, hasIncomplete: false }, TODAY)
    expect(n?.kind).not.toBe('reengage')
  })
  it('check-in outranks rest when both fire', () => {
    const n = selectNudge(freshPacing(), { ...baseCtx, todayCount: 4 }, TODAY)
    expect(n?.kind).toBe('checkin')
  })
  it('shows rest on a long streak alone', () => {
    const n = selectNudge(freshPacing(), { ...baseCtx, currentStreak: 5 }, TODAY)
    expect(n?.kind).toBe('rest')
  })
  it('shows calibrate for a fresh uncalibrated module', () => {
    const n = selectNudge(freshPacing(), { ...baseCtx, freshModule: { slug: '04-x', title: 'Prompts' } }, TODAY)
    expect(n).toEqual({ kind: 'calibrate', moduleSlug: '04-x', moduleTitle: 'Prompts' })
  })
  it('respects a same-day dismissal', () => {
    const s = { ...freshPacing(), dismissed: { rest: TODAY } }
    const n = selectNudge(s, { ...baseCtx, currentStreak: 5 }, TODAY)
    expect(n).toBeNull()
  })
})
```

- [ ] **Step 2: Run to verify it fails**
Run: `cd web && npx vitest run lib/wellbeing/select-nudge.test.ts --no-file-parallelism`
Expected: FAIL — module not found.

- [ ] **Step 3: Create `web/lib/wellbeing/types.ts`**
```ts
export type NudgeKind = 'reengage' | 'checkin' | 'rest' | 'calibrate'

export interface NudgeContext {
  daysSinceActive: number
  todayCount: number
  currentStreak: number
  recentDowngrade: boolean
  hasIncomplete: boolean
  freshModule: { slug: string; title: string } | null
  g11: string | null
  outcome: string | null
  questsLeft: number
}

export interface SelectedNudge {
  kind: NudgeKind
  moduleSlug?: string
  moduleTitle?: string
}
```

- [ ] **Step 4: Create `web/lib/wellbeing/select-nudge.ts`**
```ts
import { REST_DAILY, REST_STREAK, LAPSE_DAYS } from '@/lib/pacing/thresholds'
import type { PacingState } from '@/lib/pacing/types'
import type { NudgeContext, SelectedNudge } from './types'

export function selectNudge(state: PacingState, ctx: NudgeContext, today: string): SelectedNudge | null {
  const blocked = (key: string) => state.dismissed[key] === today

  if (ctx.daysSinceActive >= LAPSE_DAYS && ctx.hasIncomplete && !blocked('reengage')) {
    return { kind: 'reengage' }
  }
  if ((ctx.todayCount >= REST_DAILY || ctx.recentDowngrade) && !blocked('checkin')) {
    return { kind: 'checkin' }
  }
  if ((ctx.todayCount >= REST_DAILY || ctx.currentStreak >= REST_STREAK) && !blocked('rest')) {
    return { kind: 'rest' }
  }
  if (ctx.freshModule && !state.calibration[ctx.freshModule.slug] && !blocked(`calibrate:${ctx.freshModule.slug}`)) {
    return { kind: 'calibrate', moduleSlug: ctx.freshModule.slug, moduleTitle: ctx.freshModule.title }
  }
  return null
}
```

- [ ] **Step 5: Create `web/lib/wellbeing/content.ts`** (bilingual copy; functions where a value is interpolated)
```ts
import type { Locale } from '@/lib/intake/types'

type L<T> = Record<Locale, T>

export const WB = {
  reengage: {
    title: { ru: 'Ты возвращаешься', en: 'You came back' } as L<string>,
    // g11 may be null; outcome may be null; questsLeft is a number
    body: (g11: string | null, outcome: string | null, questsLeft: number, locale: Locale): string => {
      const anchor = g11
        ? (locale === 'ru' ? `${g11} тоже не останавливался(ась). ` : `${g11} didn't stop either. `)
        : ''
      const goal = outcome
        ? (locale === 'ru' ? `до «${outcome}» ` : `from "${outcome}" `)
        : ''
      return locale === 'ru'
        ? `${anchor}Ты в ${questsLeft} квестах ${goal}— продолжим с того места, где остановился(ась)?`
        : `${anchor}You're ${questsLeft} quests ${goal}away — pick up where you left off?`
    },
    cta: { ru: 'Продолжить →', en: 'Continue →' } as L<string>,
  },
  checkin: {
    title: { ru: 'Как ты держишься?', en: 'How are you holding up?' } as L<string>,
    ok: { ru: 'Норм', en: "I'm good" } as L<string>,
    overwhelmed: { ru: 'Перегружен(а)', en: 'A bit overwhelmed' } as L<string>,
    relief: {
      ru: 'Сбавь темп — переключись на режим «Командир», иди мелкими шагами. Прогресс не сгорит.',
      en: 'Ease off — switch to Commander mode and take small steps. Your progress is safe.',
    } as L<string>,
  },
  rest: {
    title: { ru: 'Сделай паузу', en: 'Take a breather' } as L<string>,
    body: {
      ru: 'Ты прошёл(ла) много за короткое время. Отдых — часть пути; прогресс никуда не денется.',
      en: "You've covered a lot in a short stretch. Rest is part of the path — your progress stays put.",
    } as L<string>,
    ack: { ru: 'Понятно', en: 'Got it' } as L<string>,
  },
  calibrate: {
    title: (moduleTitle: string, locale: Locale): string =>
      locale === 'ru' ? `«${moduleTitle}» пройден. Как сложность?` : `"${moduleTitle}" cleared. How was the challenge?`,
    easier: { ru: 'Легко', en: 'Too easy' } as L<string>,
    right: { ru: 'В самый раз', en: 'Just right' } as L<string>,
    harder: { ru: 'Тяжело', en: 'Too much' } as L<string>,
  },
} as const
```

- [ ] **Step 6: Run to verify it passes**
Run: `cd web && npx vitest run lib/wellbeing/select-nudge.test.ts --no-file-parallelism`
Expected: PASS (7 tests). `content.ts` has no test (static copy).

- [ ] **Step 7: Commit**
```bash
git add web/lib/wellbeing/types.ts web/lib/wellbeing/content.ts web/lib/wellbeing/select-nudge.ts web/lib/wellbeing/select-nudge.test.ts
git commit -m "feat(wellbeing): nudge content + priority selector

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 7: WellbeingPanel + dashboard wiring

**Files:**
- Create: `web/components/wellbeing/wellbeing-panel.tsx`
- Modify: `web/app/dashboard/dashboard-client.tsx` (render panel + touch)

- [ ] **Step 1: Create `web/components/wellbeing/wellbeing-panel.tsx`**
```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePacing } from '@/lib/pacing/use-pacing'
import { todayCount, currentStreak, recentDowngrade, daysBetween } from '@/lib/pacing/derive'
import { localDate } from '@/lib/quests/daily-store'
import { selectNudge } from '@/lib/wellbeing/select-nudge'
import { WB } from '@/lib/wellbeing/content'
import type { Locale } from '@/lib/intake/types'

interface Props {
  locale: Locale
  accent: string
  g11: string | null
  outcome: string | null
  /** module slug -> ordered unit slugs */
  unitsByModule: Record<string, { slug: string; title: string }[]>
  moduleTitles: Record<string, string>
  isUnitDone: (moduleSlug: string, unitSlug: string) => boolean
  /** href to the first incomplete unit, or dashboard if none */
  resumeHref: string
}

export function WellbeingPanel({ locale, accent, g11, outcome, unitsByModule, moduleTitles, isUnitDone, resumeHref }: Props) {
  const router = useRouter()
  const { state, ready, touch, recordCalibration, dismissNudge } = usePacing()
  const seenRef = useRef<string | null>(null)

  // Record the visit once — but capture the pre-visit lastSeen first so re-engagement can fire.
  useEffect(() => {
    if (ready && seenRef.current === null) {
      seenRef.current = state.lastSeen || ''
      touch()
    }
  }, [ready, state.lastSeen, touch])

  const today = localDate()

  const ctx = useMemo(() => {
    let total = 0, done = 0
    let freshModule: { slug: string; title: string } | null = null
    for (const [slug, units] of Object.entries(unitsByModule)) {
      total += units.length
      const doneInMod = units.filter(u => isUnitDone(slug, u.slug)).length
      done += doneInMod
      if (doneInMod === units.length && units.length > 0 && !state.calibration[slug] && !freshModule) {
        freshModule = { slug, title: moduleTitles[slug] ?? slug }
      }
    }
    const seenBefore = seenRef.current
    return {
      daysSinceActive: seenBefore ? daysBetween(seenBefore, today) : 0,
      todayCount: todayCount(state, today),
      currentStreak: currentStreak(state, today),
      recentDowngrade: recentDowngrade(state),
      hasIncomplete: done < total,
      freshModule,
      g11, outcome,
      questsLeft: Math.max(0, total - done),
    }
  }, [state, unitsByModule, moduleTitles, isUnitDone, g11, outcome, today])

  if (!ready) return null
  const nudge = selectNudge(state, ctx, today)
  if (!nudge) return null

  const card: React.CSSProperties = {
    border: `1px solid ${accent}`, borderRadius: 12, padding: '1rem 1.1rem',
    background: 'var(--bg-surface)', marginBottom: '1rem',
  }
  const titleStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', color: accent, fontWeight: 700 }
  const btn: React.CSSProperties = {
    padding: '0.4rem 0.8rem', borderRadius: 8, border: `1px solid ${accent}`,
    background: 'transparent', color: accent, cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
  }
  const row: React.CSSProperties = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }

  if (nudge.kind === 'reengage') {
    return (
      <section style={card}>
        <div style={titleStyle}>{WB.reengage.title[locale]}</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0.4rem 0 0', lineHeight: 1.45 }}>
          {WB.reengage.body(g11, outcome, ctx.questsLeft, locale)}
        </p>
        <div style={row}>
          <button style={{ ...btn, background: accent, color: '#000' }} onClick={() => router.push(resumeHref)}>
            {WB.reengage.cta[locale]}
          </button>
          <button style={btn} onClick={() => dismissNudge('reengage')} aria-label="dismiss">×</button>
        </div>
      </section>
    )
  }

  if (nudge.kind === 'checkin') {
    return (
      <section style={card}>
        <div style={titleStyle}>{WB.checkin.title[locale]}</div>
        <div style={row}>
          <button style={btn} onClick={() => dismissNudge('checkin')}>{WB.checkin.ok[locale]}</button>
          <button style={btn} onClick={() => dismissNudge('checkin')}>{WB.checkin.overwhelmed[locale]}</button>
        </div>
        <CheckinRelief locale={locale} />
      </section>
    )
  }

  if (nudge.kind === 'rest') {
    return (
      <section style={card}>
        <div style={titleStyle}>{WB.rest.title[locale]}</div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: '0.4rem 0 0', lineHeight: 1.45 }}>
          {WB.rest.body[locale]}
        </p>
        <div style={row}>
          <button style={btn} onClick={() => dismissNudge('rest')}>{WB.rest.ack[locale]}</button>
        </div>
      </section>
    )
  }

  // calibrate
  return (
    <section style={card}>
      <div style={titleStyle}>{WB.calibrate.title(nudge.moduleTitle ?? '', locale)}</div>
      <div style={row}>
        <button style={btn} onClick={() => recordCalibration(nudge.moduleSlug!, 'easier')}>{WB.calibrate.easier[locale]}</button>
        <button style={btn} onClick={() => recordCalibration(nudge.moduleSlug!, 'right')}>{WB.calibrate.right[locale]}</button>
        <button style={btn} onClick={() => recordCalibration(nudge.moduleSlug!, 'harder')}>{WB.calibrate.harder[locale]}</button>
      </div>
    </section>
  )
}

function CheckinRelief({ locale }: { locale: Locale }) {
  // The check-in buttons both dismiss for the day; the relief copy is always shown beneath
  // so the "overwhelmed" learner immediately sees the reassurance without an extra step.
  return (
    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.5rem 0 0', lineHeight: 1.4 }}>
      {WB.checkin.relief[locale]}
    </p>
  )
}
```

- [ ] **Step 2: Wire into `web/app/dashboard/dashboard-client.tsx`.** Add imports:
```tsx
import { WellbeingPanel } from '@/components/wellbeing/wellbeing-panel'
import { parseAspiration } from '@/lib/intake/parse-aspiration'
```
Compute the resume href + module-title map alongside the existing derived values (after `const outcome = parseOutcome(profile)`):
```tsx
  const aspiration = parseAspiration(profile)
  const moduleTitles = Object.fromEntries(Object.entries(modules).map(([slug, m]) => [slug, m.title]))
  const firstIncomplete = (() => {
    for (const [slug, units] of Object.entries(unitsByModule)) {
      for (const u of units) if (!isCompleted(slug, u.slug)) return `${prefix}/lessons/${slug}/${u.slug}/`
    }
    return `${prefix}/dashboard/`
  })()
```
NOTE: `prefix` — if the dashboard client doesn't already define it, add `const prefix = locale === 'en' ? '/en' : ''`. Render `<WellbeingPanel>` immediately after the `<IntroCard page="dashboard" .../>` line:
```tsx
        <WellbeingPanel
          locale={locale}
          accent={accent}
          g11={aspiration}
          outcome={outcome}
          unitsByModule={unitsByModule}
          moduleTitles={moduleTitles}
          isUnitDone={isCompleted}
          resumeHref={firstIncomplete}
        />
```

- [ ] **Step 3: Build + suite**
Run: `cd web && npx vitest run --no-file-parallelism && npm run build`
Expected: tests PASS; build succeeds (static export, no type errors). If `isCompleted`/`unitsByModule`/`modules`/`prefix` names differ in the current dashboard-client, adapt to the actual names (read the file first) and report the adaptation.

- [ ] **Step 4: Commit**
```bash
git add web/components/wellbeing/wellbeing-panel.tsx web/app/dashboard/dashboard-client.tsx
git commit -m "feat(wellbeing): WellbeingPanel wired into the dashboard

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 8: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full suite** — `cd web && npx vitest run --no-file-parallelism` → all PASS (incl. new pacing/wellbeing/intake tests).
- [ ] **Step 2: Build** — `cd web && npm run build` → succeeds, no MDX/type errors.
- [ ] **Step 3: Hand off to `superpowers:finishing-a-development-branch`.**

---

## Self-Review

**Spec coverage:**
- Pacing foundation (spec §1) → Tasks 1–3 (store, derive, hook + wiring). ✓
- `selectNudge` priority + dedup (spec §2) → Task 6. ✓
- WellbeingPanel + 4 cards (spec §3) → Task 7. ✓
- Calibration suggest-only (spec §4) → Task 5. ✓
- G11 from intake (spec §3) → Task 4 + Task 7 wiring. ✓
- Thresholds as named constants → Task 1 (`thresholds.ts`). ✓
- Tests (derive/store/select-nudge/suggest-mode/parse-aspiration) → Tasks 1,2,4,5,6. ✓
- Out of scope (per-skin copy, server sync, hard blocks, started-not-finished) → honored. ✓

**Placeholder scan:** No TBD/TODO; every code step shows full code; commands have expected output. Task 7 Step 2 flags that it must adapt to the real dashboard variable names (read-first) — this is concrete guidance, not a placeholder.

**Type consistency:** `PacingState`, `Completion`, `CalibrationRating`, `Mode`, `NudgeContext`, `SelectedNudge`, `freshPacing`, `logCompletion`, `touch`, `recordCalibration`, `dismissNudge`, `selectNudge`, `suggestModeFromCalibration`, `parseAspiration`, `WB` used consistently across tasks. `localDate` imported from `@/lib/quests/daily-store`. `usePacing` exposes `state` (used in Task 5 wizard + Task 7 panel).
