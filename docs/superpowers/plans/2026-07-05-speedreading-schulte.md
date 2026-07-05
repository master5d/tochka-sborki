# Schulte Tables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Schulte-tables trainer (slice 3 of the «Скорочтение» epic): a size×size grid of shuffled numbers the user clicks `1..N²` in order, with a center fixation dot, a timer, and best-time + session persistence.

**Architecture:** A pure, deterministic engine (`lib/speedreading/schulte.ts`: mulberry32 full shuffle + grid gen) drives a localStorage store + hook mirroring `lib/pacing`; a thin `'use client'` component owns game state (target/elapsed/seed) and delegates grid generation to the engine; two page routes (RU + EN) mount it. Zero backend, zero LLM, no new dependencies.

**Tech Stack:** TypeScript, Next.js 16 App Router (`output: 'export'`), React (useState/useEffect/useRef/useMemo), Vitest.

## Global Constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/schulte/`. No `content/`, no `LMS/registry.json`, no nav entry. Both routes `robots: { index: false, follow: false }`.
- Pure engine / thin component: no DOM in `schulte.ts`; the component delegates grid generation to the engine.
- Deterministic: `generateGrid(seed, size)` is a pure function of its inputs; `shuffle` never mutates the input array.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_schulte`; the store takes `date` as an argument (no clock inside the store).
- `Locale` imported from `@/lib/dictionaries`; `localDate` from `@/lib/quests/daily-store` — not redefined.
- De-hustle: every user-facing string (UI labels + page copy) is plain language, no scarcity/urgency/vanity, no shaming on errors.
- Authenticity: time and error counts are real measurements; no fabricated metrics.
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM, no new dependencies — plain React + the engine.
- Web gate (from `LMS/tochka-sborki/web`): `npx tsc --noEmit && npx vitest run && npx next build`; the build must statically export `/speedreading/schulte` and `/en/speedreading/schulte`.
- Trunk-based `main`, one commit per task. **Ops: run all git via the PowerShell tool — bash-git hangs this session.** Run tsc/vitest/build via the Bash tool from the web dir. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- All `lib/`, `components/`, `app/` paths below are relative to `LMS/tochka-sborki/web/`.

---

### Task 1: Pure Schulte engine (`lib/speedreading/schulte.ts`)

**Files:**
- Create: `lib/speedreading/schulte.ts`
- Test: `lib/speedreading/schulte.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no imports).
- Produces (later tasks rely on these exact names): `MIN_SIZE=3`, `MAX_SIZE=7`, `DEFAULT_SIZE=5`, `clampSize(n): number`, `shuffle<T>(items: T[], seed: number): T[]`, `generateGrid(seed: number, size: number): number[]`.

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/schulte.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { clampSize, shuffle, generateGrid, MIN_SIZE, MAX_SIZE, DEFAULT_SIZE } from './schulte'

describe('clampSize', () => {
  it('bounds, rounds, and defaults on NaN', () => {
    expect(clampSize(1)).toBe(MIN_SIZE)
    expect(clampSize(99)).toBe(MAX_SIZE)
    expect(clampSize(5.4)).toBe(5)
    expect(clampSize(Number.NaN)).toBe(DEFAULT_SIZE)
  })
})

describe('shuffle', () => {
  const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  it('is deterministic for a fixed seed', () => {
    expect(shuffle(base, 42)).toEqual(shuffle(base, 42))
  })
  it('is a permutation of the input (same multiset)', () => {
    expect([...shuffle(base, 7)].sort((a, b) => a - b)).toEqual(base)
  })
  it('different seeds usually differ', () => {
    expect(shuffle(base, 1)).not.toEqual(shuffle(base, 2))
  })
  it('does not mutate the input array', () => {
    const input = [...base]
    shuffle(input, 99)
    expect(input).toEqual(base)
  })
})

describe('generateGrid', () => {
  it('has length size² and contains each of 1..size² exactly once', () => {
    const grid = generateGrid(123, 5)
    expect(grid).toHaveLength(25)
    expect([...grid].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
  })
  it('is deterministic for a fixed seed', () => {
    expect(generateGrid(123, 5)).toEqual(generateGrid(123, 5))
  })
  it('respects clampSize (size 99 → 7×7 = 49 cells)', () => {
    expect(generateGrid(1, 99)).toHaveLength(49)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/schulte.test.ts`
Expected: FAIL — cannot resolve `./schulte`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/speedreading/schulte.ts`:

```ts
// lib/speedreading/schulte.ts
// Pure Schulte-table engine (Скорочтение epic, slice 3). No DOM, no imports.
// Deterministic mulberry32 full Fisher–Yates shuffle (same PRNG formula as lib/quests/seed.ts's pick,
// but a full shuffle) → generateGrid produces a reproducible grid of 1..size² for a numeric seed.
export const MIN_SIZE = 3
export const MAX_SIZE = 7
export const DEFAULT_SIZE = 5

export function clampSize(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SIZE
  return Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(n)))
}

export function shuffle<T>(items: T[], seed: number): T[] {
  const arr = [...items]
  let s = seed >>> 0
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr
}

export function generateGrid(seed: number, size: number): number[] {
  const n = clampSize(size)
  const cells = Array.from({ length: n * n }, (_, i) => i + 1)
  return shuffle(cells, seed)
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/schulte.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/schulte.ts LMS/tochka-sborki/web/lib/speedreading/schulte.test.ts
git commit -m @'
feat(speedreading): pure Schulte engine — shuffle + generateGrid (slice 3 task 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: Types, store, and hook

**Files:**
- Create: `lib/speedreading/schulte-types.ts`
- Create: `lib/speedreading/schulte-store.ts`
- Create: `lib/speedreading/use-schulte.ts`
- Test: `lib/speedreading/schulte-store.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_SIZE`, `clampSize` from `./schulte` (Task 1); `localDate` from `@/lib/quests/daily-store`.
- Produces (Task 3 relies on these):
  - `SCHULTE_KEY = 'speedreading_schulte'`, `SchulteSession { date; size; ms; errors }`, `SchulteState { size; best: Record<number, number>; sessions: SchulteSession[] }`
  - `freshSchulte()`, `setSize(state, n)`, `recordResult(state, size, ms, errors, date)`, `readSchulte()`, `writeSchulte(state)`
  - hook `useSchulte()` → `{ state: SchulteState; ready: boolean; setSize(n); recordResult(size, ms, errors) }`

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/schulte-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { freshSchulte, setSize, recordResult, readSchulte, writeSchulte } from './schulte-store'
import { SCHULTE_KEY } from './schulte-types'
import { DEFAULT_SIZE, MIN_SIZE, MAX_SIZE } from './schulte'

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
  })
})

describe('schulte-store', () => {
  it('freshSchulte has default size, empty best and sessions', () => {
    expect(freshSchulte()).toEqual({ size: DEFAULT_SIZE, best: {}, sessions: [] })
  })
  it('setSize clamps', () => {
    expect(setSize(freshSchulte(), 1).size).toBe(MIN_SIZE)
    expect(setSize(freshSchulte(), 99).size).toBe(MAX_SIZE)
  })
  it('recordResult sets best on first result and stores errors', () => {
    const s = recordResult(freshSchulte(), 5, 8000, 2, '2026-07-05')
    expect(s.best[5]).toBe(8000)
    expect(s.sessions).toHaveLength(1)
    expect(s.sessions[0]).toEqual({ date: '2026-07-05', size: 5, ms: 8000, errors: 2 })
  })
  it('recordResult keeps the faster best, ignores a slower ms', () => {
    let s = recordResult(freshSchulte(), 5, 8000, 0, '2026-07-05')
    s = recordResult(s, 5, 9000, 0, '2026-07-05') // slower
    expect(s.best[5]).toBe(8000)
    s = recordResult(s, 5, 6000, 0, '2026-07-05') // faster
    expect(s.best[5]).toBe(6000)
  })
  it('caps sessions at 50', () => {
    let s = freshSchulte()
    for (let i = 0; i < 60; i++) s = recordResult(s, 5, 8000, 0, '2026-07-05')
    expect(s.sessions).toHaveLength(50)
  })
  it('write then read round-trips', () => {
    const s = recordResult(setSize(freshSchulte(), 6), 6, 7000, 1, '2026-07-05')
    writeSchulte(s)
    const r = readSchulte()
    expect(r.size).toBe(6)
    expect(r.best[6]).toBe(7000)
  })
  it('missing key and malformed JSON → freshSchulte', () => {
    expect(readSchulte()).toEqual(freshSchulte())
    localStorage.setItem(SCHULTE_KEY, '{not json')
    expect(readSchulte()).toEqual(freshSchulte())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/speedreading/schulte-store.test.ts`
Expected: FAIL — modules do not exist yet.

- [ ] **Step 3: Create the types**

Create `lib/speedreading/schulte-types.ts`:

```ts
// lib/speedreading/schulte-types.ts
export const SCHULTE_KEY = 'speedreading_schulte'
export interface SchulteSession { date: string; size: number; ms: number; errors: number }
export interface SchulteState { size: number; best: Record<number, number>; sessions: SchulteSession[] }
```

- [ ] **Step 4: Create the store**

Create `lib/speedreading/schulte-store.ts` (mirror `lib/pacing/store.ts`):

```ts
// lib/speedreading/schulte-store.ts
// Pure reducers + localStorage persistence with graceful fallback. Mirrors lib/pacing/store.ts.
// The store takes `date` as an argument — no clock inside (the hook supplies localDate()).
import { SCHULTE_KEY, type SchulteState } from './schulte-types'
import { DEFAULT_SIZE, clampSize } from './schulte'

const SESSIONS_CAP = 50

export function freshSchulte(): SchulteState {
  return { size: DEFAULT_SIZE, best: {}, sessions: [] }
}

export function setSize(state: SchulteState, n: number): SchulteState {
  return { ...state, size: clampSize(n) }
}

export function recordResult(state: SchulteState, size: number, ms: number, errors: number, date: string): SchulteState {
  const prev = state.best[size]
  const best = prev === undefined || ms < prev ? { ...state.best, [size]: ms } : state.best
  const sessions = [...state.sessions, { date, size, ms, errors }]
  const capped = sessions.length > SESSIONS_CAP ? sessions.slice(sessions.length - SESSIONS_CAP) : sessions
  return { ...state, best, sessions: capped }
}

export function readSchulte(): SchulteState {
  try {
    const raw = localStorage.getItem(SCHULTE_KEY)
    if (!raw) return freshSchulte()
    const p = JSON.parse(raw) as Partial<SchulteState>
    return {
      size: clampSize(typeof p.size === 'number' ? p.size : DEFAULT_SIZE),
      best: p.best && typeof p.best === 'object' ? p.best as Record<number, number> : {},
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
    }
  } catch {
    return freshSchulte()
  }
}

export function writeSchulte(state: SchulteState): void {
  try { localStorage.setItem(SCHULTE_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}
```

- [ ] **Step 5: Create the hook**

Create `lib/speedreading/use-schulte.ts` (mirror `lib/pacing/use-pacing.ts`):

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { freshSchulte, readSchulte, writeSchulte, setSize as _setSize, recordResult as _recordResult } from './schulte-store'
import { localDate } from '@/lib/quests/daily-store'
import type { SchulteState } from './schulte-types'

export function useSchulte() {
  const [state, setState] = useState<SchulteState>(freshSchulte)
  const [ready, setReady] = useState(false)

  useEffect(() => { setState(readSchulte()); setReady(true) }, [])

  const update = useCallback((fn: (s: SchulteState) => SchulteState) => {
    setState(prev => { const next = fn(prev); writeSchulte(next); return next })
  }, [])

  const setSize = useCallback((n: number) => update(s => _setSize(s, n)), [update])
  const recordResult = useCallback((size: number, ms: number, errors: number) =>
    update(s => _recordResult(s, size, ms, errors, localDate())), [update])

  return { state, ready, setSize, recordResult }
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/schulte-store.test.ts`
Expected: PASS.

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/schulte-types.ts LMS/tochka-sborki/web/lib/speedreading/schulte-store.ts LMS/tochka-sborki/web/lib/speedreading/use-schulte.ts LMS/tochka-sborki/web/lib/speedreading/schulte-store.test.ts
git commit -m @'
feat(speedreading): Schulte types, store, hook (slice 3 task 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 3: Table component + RU/EN routes

**Files:**
- Create: `components/speedreading/schulte-table.tsx`
- Create: `app/speedreading/schulte/page.tsx`
- Create: `app/en/speedreading/schulte/page.tsx`

**Interfaces:**
- Consumes: `generateGrid`, `MIN_SIZE`, `MAX_SIZE` from `@/lib/speedreading/schulte`; `useSchulte` from `@/lib/speedreading/use-schulte`; `Locale` from `@/lib/dictionaries`; `Nav` from `@/components/nav`.
- Produces: `SchulteTable({ locale })` client component; routes `/speedreading/schulte` (RU) and `/en/speedreading/schulte` (EN).

- [ ] **Step 1: Create the table component**

Create `components/speedreading/schulte-table.tsx`:

```tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Locale } from '@/lib/dictionaries'
import { generateGrid, MIN_SIZE, MAX_SIZE } from '@/lib/speedreading/schulte'
import { useSchulte } from '@/lib/speedreading/use-schulte'

const T = {
  ru: { find: 'Найди', start: 'Старт', newTable: 'Новая таблица', reset: 'Сброс', errors: 'Ошибки', best: 'Лучшее', done: 'Готово', size: 'Размер', sec: 'с' },
  en: { find: 'Find', start: 'Start', newTable: 'New table', reset: 'Reset', errors: 'Errors', best: 'Best', done: 'Done', size: 'Size', sec: 's' },
}

const btn: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: 6, padding: '.4rem .9rem',
  background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '.9rem',
}

export function SchulteTable({ locale }: { locale: Locale }) {
  const t = T[locale]
  const { state, ready, setSize, recordResult } = useSchulte()
  const [seed, setSeed] = useState(1)
  const [running, setRunning] = useState(false)
  const [target, setTarget] = useState(1)
  const [errors, setErrors] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startAt = useRef(0)
  const tick = useRef<ReturnType<typeof setInterval> | null>(null)

  const size = state.size
  const grid = useMemo(() => generateGrid(seed, size), [seed, size])
  const total = size * size
  const best = state.best[size]

  const stopTick = () => { if (tick.current) { clearInterval(tick.current); tick.current = null } }
  useEffect(() => stopTick, [])

  const start = () => {
    setRunning(true); setTarget(1); setErrors(0); setElapsed(0)
    startAt.current = Date.now()
    stopTick()
    tick.current = setInterval(() => setElapsed(Date.now() - startAt.current), 100)
  }
  const reset = () => { setRunning(false); setTarget(1); setErrors(0); setElapsed(0); stopTick() }
  const newTable = () => { reset(); setSeed(s => s + 1) }

  const click = (v: number) => {
    if (!running) return
    if (v === target) {
      if (target >= total) {
        stopTick()
        const ms = Date.now() - startAt.current
        setElapsed(ms)
        setRunning(false)
        recordResult(size, ms, errors)
        setTarget(target + 1)
      } else {
        setTarget(target + 1)
      }
    } else {
      setErrors(e => e + 1)
    }
  }

  const finished = ready && !running && target > total
  const seconds = (elapsed / 1000).toFixed(1)

  return (
    <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.75rem', fontSize: '.9rem', color: 'var(--text-secondary)' }}>
        <span>
          {running
            ? <><b style={{ color: 'var(--text-primary)' }}>{t.find}: {target}</b></>
            : finished
              ? <b style={{ color: 'var(--text-primary)' }}>{t.done} — {seconds} {t.sec}</b>
              : <button style={btn} onClick={start}>{t.start}</button>}
        </span>
        <span>{seconds} {t.sec}{best !== undefined ? ` · ${t.best} ${(best / 1000).toFixed(1)} ${t.sec}` : ''} · {t.errors}: {errors}</span>
      </div>

      {/* grid with center fixation dot */}
      <div style={{ position: 'relative', margin: '0 auto', width: 'fit-content' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 4 }}>
          {grid.map((v) => {
            const done = running && v < target
            return (
              <button key={v} onClick={() => click(v)} disabled={!running || done}
                style={{
                  width: '3rem', height: '3rem', fontFamily: 'var(--font-mono)', fontSize: '1.1rem',
                  border: '1px solid var(--border-color)', borderRadius: 6, cursor: running && !done ? 'pointer' : 'default',
                  background: done ? 'var(--bg-primary)' : 'var(--bg-surface)',
                  color: done ? 'var(--text-secondary)' : 'var(--text-primary)', opacity: done ? 0.4 : 1,
                }}>
                {v}
              </button>
            )
          })}
        </div>
        <span aria-hidden="true" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 8, borderRadius: '50%', background: 'var(--text-accent)', pointerEvents: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button style={btn} onClick={newTable}>{t.newTable}</button>
        <button style={btn} onClick={reset}>{t.reset}</button>
        <label style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>
          {t.size}:{' '}
          <select value={size} onChange={e => { setSize(Number(e.target.value)); reset() }}
            style={{ border: '1px solid var(--border-color)', borderRadius: 6, padding: '.2rem .4rem', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
            {Array.from({ length: MAX_SIZE - MIN_SIZE + 1 }, (_, i) => MIN_SIZE + i).map(n => (
              <option key={n} value={n}>{n}×{n}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Create the RU route**

Create `app/speedreading/schulte/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SchulteTable } from '@/components/speedreading/schulte-table'

export const metadata: Metadata = {
  title: 'Таблицы Шульте — Скорочтение',
  description: 'Тренажёр периферийного зрения: находи числа по порядку (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>Таблицы Шульте</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Держи взгляд на точке в центре и находи числа по порядку, замечая их боковым зрением.
        </p>
        <SchulteTable locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the EN route**

Create `app/en/speedreading/schulte/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SchulteTable } from '@/components/speedreading/schulte-table'

export const metadata: Metadata = {
  title: 'Schulte tables — Speed Reading',
  description: 'A peripheral-vision trainer: find the numbers in order (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>Schulte tables</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Keep your eyes on the center dot and find the numbers in order, catching them with your side vision.
        </p>
        <SchulteTable locale="en" />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Run the full web gate**

Run: `npx vitest run && npx next build`
Expected: all tests pass; build succeeds and statically exports `/speedreading/schulte` and `/en/speedreading/schulte`.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/components/speedreading/schulte-table.tsx LMS/tochka-sborki/web/app/speedreading/schulte/page.tsx LMS/tochka-sborki/web/app/en/speedreading/schulte/page.tsx
git commit -m @'
feat(speedreading): Schulte table component + RU/EN routes (slice 3 task 3)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

## Notes for the executor

- **Do not** add the trainer to `LMS/registry.json`, `components/nav.tsx`, or `content/`. It stays dark/isolated. Both routes are `noindex`.
- Reuse `clampSize` from the engine everywhere size is set — do not re-implement bounds in the store or component.
- No new npm dependencies. Plain React + the engine only.
- The component owns game state (seed/target/errors/elapsed/running); persistence (size/best/sessions) is the hook's. Keep that separation.
- `Date.now()` here is ordinary browser app code (this is not a Workflow orchestration script) — it is allowed.
- Hold the push until the user's "go" gate; commit locally per task.
```
