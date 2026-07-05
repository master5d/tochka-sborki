# RSVP Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the RSVP reader — the flagship trainer of the «Скорочтение» epic: words flashed at an adjustable WPM with a Spritz-style ORP pivot, own-text paste, and lightweight local persistence.

**Architecture:** All reading logic lives in a pure, unit-tested engine (`lib/speedreading/rsvp.ts`); a localStorage store + hook mirror `lib/pacing`; a thin `'use client'` component delegates to the engine and owns only playback/DOM state; two page routes (RU + EN) mount it. Zero backend, zero LLM, no new dependencies.

**Tech Stack:** TypeScript, Next.js 16 App Router (`output: 'export'`), React (useState/useEffect/useRef/useMemo), Vitest, `lib/authoring/dehustle.ts` `lintDehustle`.

## Global Constraints

- Isolated: files only under `lib/speedreading/`, `components/speedreading/`, `app/speedreading/rsvp/`. No `content/`, no `LMS/registry.json`, no nav entry. Both routes `robots: { index: false, follow: false }`.
- Pure engine / thin component: no DOM in `rsvp.ts`; the component delegates all reading logic to the engine.
- Store mirrors `lib/pacing/store.ts`: pure reducers + `read`/`write` with try/catch graceful fallback; localStorage key `speedreading_rsvp`.
- `Bi` imported from `@/lib/course`; `Locale` from `@/lib/dictionaries` — not redefined.
- De-hustle: every user-facing string (sample passage + UI labels) passes `lintDehustle []` (reuse `lib/authoring/dehustle.ts`; do not duplicate the ban-list). If a string trips the lint, reword the copy — never weaken the guard.
- Authenticity: no fabricated metrics, no "guaranteed" speed multipliers, no scarcity/urgency/vanity. WPM is a real, user-set rate.
- Bilingual RU (primary) + EN; both routes present.
- Sovereign: zero backend, zero LLM, no new dependencies — plain React + the engine.
- Web gate (from `LMS/tochka-sborki/web`): `npx tsc --noEmit && npx vitest run && npx next build`; the build must statically export `/speedreading/rsvp` and `/en/speedreading/rsvp`.
- Trunk-based `main`, one commit per task. **Ops: run all git via the PowerShell tool — bash-git hangs this session.** Run tsc/vitest/build via the Bash tool from the web dir. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- All `lib/`, `components/`, `app/` paths below are relative to `LMS/tochka-sborki/web/`.

---

### Task 1: Pure RSVP engine (`lib/speedreading/rsvp.ts`)

**Files:**
- Create: `lib/speedreading/rsvp.ts`
- Test: `lib/speedreading/rsvp.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no imports).
- Produces (later tasks rely on these exact names):
  - types `RsvpFrame { text: string; ms: number; index: number }`, `OrpSplit { before: string; pivot: string; after: string }`, `RsvpScheduleOpts { wpm: number; chunkSize?: number; punctuationDwell?: boolean }`
  - constants `DEFAULT_WPM=300`, `MIN_WPM=100`, `MAX_WPM=900`, `WPM_STEP=25`, `DEFAULT_CHUNK=1`, `MAX_CHUNK=3`
  - `clampWpm(n): number`, `clampChunk(n): number`, `tokenize(text): string[]`, `orpIndex(word): number`, `splitOrp(word): OrpSplit`, `buildSchedule(tokens, opts): RsvpFrame[]`

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/rsvp.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  tokenize, orpIndex, splitOrp, buildSchedule, clampWpm, clampChunk,
  DEFAULT_WPM, MIN_WPM, MAX_WPM, DEFAULT_CHUNK, MAX_CHUNK,
} from './rsvp'

describe('tokenize', () => {
  it('splits on any whitespace and drops empties', () => {
    expect(tokenize('  hello   world\n\tfoo ')).toEqual(['hello', 'world', 'foo'])
  })
  it('keeps punctuation attached to words', () => {
    expect(tokenize('Hello, world.')).toEqual(['Hello,', 'world.'])
  })
  it('empty / whitespace-only text → []', () => {
    expect(tokenize('')).toEqual([])
    expect(tokenize('   \n  ')).toEqual([])
  })
})

describe('orpIndex', () => {
  it('buckets by length', () => {
    expect(orpIndex('a')).toBe(0)        // len 1
    expect(orpIndex('read')).toBe(1)     // len 2–5
    expect(orpIndex('reading')).toBe(2)  // len 6–9
    expect(orpIndex('comprehend')).toBe(3) // len 10–13
    expect(orpIndex('extraordinarily')).toBe(4) // len 14+
  })
  it('never exceeds the last index', () => {
    expect(orpIndex('')).toBe(0)
    expect(orpIndex('to')).toBeLessThanOrEqual(1)
  })
})

describe('splitOrp', () => {
  it('pivot is exactly one char and the parts reconstruct the word', () => {
    const w = 'reading'
    const s = splitOrp(w)
    expect(s.pivot.length).toBe(1)
    expect(s.before + s.pivot + s.after).toBe(w)
    expect(s.before.length).toBe(orpIndex(w))
  })
  it('handles the empty string', () => {
    expect(splitOrp('')).toEqual({ before: '', pivot: '', after: '' })
  })
})

describe('buildSchedule', () => {
  it('one frame per word at chunk 1, base ms = round(60000/wpm), sequential index', () => {
    const frames = buildSchedule(['aa', 'bb', 'cc'], { wpm: 300, punctuationDwell: false })
    expect(frames).toHaveLength(3)
    expect(frames.map(f => f.index)).toEqual([0, 1, 2])
    expect(frames[0].ms).toBe(200) // 60000/300
    expect(frames[0].text).toBe('aa')
  })
  it('groups words at chunk size 2', () => {
    const frames = buildSchedule(['a', 'b', 'c'], { wpm: 300, chunkSize: 2, punctuationDwell: false })
    expect(frames.map(f => f.text)).toEqual(['a b', 'c'])
    expect(frames[0].ms).toBe(400) // two words × 200
  })
  it('punctuation dwell: comma ×1.5, period ×2.0 (on by default)', () => {
    const mid = buildSchedule(['word,'], { wpm: 300 })
    const end = buildSchedule(['word.'], { wpm: 300 })
    expect(mid[0].ms).toBe(300) // 200 × 1.5
    expect(end[0].ms).toBe(400) // 200 × 2.0
  })
  it('empty tokens → []', () => {
    expect(buildSchedule([], { wpm: 300 })).toEqual([])
  })
})

describe('clamps', () => {
  it('clampWpm bounds and rounds', () => {
    expect(clampWpm(10)).toBe(MIN_WPM)
    expect(clampWpm(99999)).toBe(MAX_WPM)
    expect(clampWpm(301.6)).toBe(302)
    expect(clampWpm(Number.NaN)).toBe(DEFAULT_WPM)
  })
  it('clampChunk bounds', () => {
    expect(clampChunk(0)).toBe(1)
    expect(clampChunk(99)).toBe(MAX_CHUNK)
    expect(clampChunk(Number.NaN)).toBe(DEFAULT_CHUNK)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/rsvp.test.ts`
Expected: FAIL — cannot resolve `./rsvp`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/speedreading/rsvp.ts`:

```ts
// lib/speedreading/rsvp.ts
// Pure RSVP engine (Скорочтение epic, slice 2). No DOM, no imports — fully unit-tested.
// tokenize → words; orpIndex/splitOrp → Spritz-style pivot; buildSchedule → timed frames.
export interface RsvpFrame { text: string; ms: number; index: number }
export interface OrpSplit { before: string; pivot: string; after: string }
export interface RsvpScheduleOpts { wpm: number; chunkSize?: number; punctuationDwell?: boolean }

export const DEFAULT_WPM = 300
export const MIN_WPM = 100
export const MAX_WPM = 900
export const WPM_STEP = 25
export const DEFAULT_CHUNK = 1
export const MAX_CHUNK = 3

export function clampWpm(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_WPM
  return Math.min(MAX_WPM, Math.max(MIN_WPM, Math.round(n)))
}

export function clampChunk(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_CHUNK
  return Math.min(MAX_CHUNK, Math.max(1, Math.round(n)))
}

export function tokenize(text: string): string[] {
  return text.split(/\s+/).map(t => t.trim()).filter(t => t.length > 0)
}

export function orpIndex(word: string): number {
  const len = word.length
  if (len <= 1) return 0
  let idx: number
  if (len <= 5) idx = 1
  else if (len <= 9) idx = 2
  else if (len <= 13) idx = 3
  else idx = 4
  return Math.min(idx, len - 1)
}

export function splitOrp(word: string): OrpSplit {
  if (word.length === 0) return { before: '', pivot: '', after: '' }
  const i = orpIndex(word)
  return { before: word.slice(0, i), pivot: word[i], after: word.slice(i + 1) }
}

const MID_PUNCT = /[,;:]$/
const END_PUNCT = /[.!?…]$/

export function buildSchedule(tokens: string[], opts: RsvpScheduleOpts): RsvpFrame[] {
  const wpm = clampWpm(opts.wpm)
  const chunk = clampChunk(opts.chunkSize ?? DEFAULT_CHUNK)
  const dwell = opts.punctuationDwell !== false
  const base = 60000 / wpm
  const frames: RsvpFrame[] = []
  for (let i = 0; i < tokens.length; i += chunk) {
    const group = tokens.slice(i, i + chunk)
    const text = group.join(' ')
    let ms = base * group.length
    if (dwell) {
      const last = group[group.length - 1]
      if (END_PUNCT.test(last)) ms *= 2.0
      else if (MID_PUNCT.test(last)) ms *= 1.5
    }
    frames.push({ text, ms: Math.round(ms), index: frames.length })
  }
  return frames
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/rsvp.test.ts`
Expected: PASS — all cases green.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/rsvp.ts LMS/tochka-sborki/web/lib/speedreading/rsvp.test.ts
git commit -m @'
feat(speedreading): pure RSVP engine — tokenize/orp/schedule (slice 2 task 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: Sample text, store, and hook

**Files:**
- Create: `lib/speedreading/rsvp-types.ts`
- Create: `lib/speedreading/rsvp-sample.ts`
- Create: `lib/speedreading/rsvp-store.ts`
- Create: `lib/speedreading/use-rsvp.ts`
- Test: `lib/speedreading/rsvp-store.test.ts`
- Test: `lib/speedreading/rsvp-sample.test.ts`

**Interfaces:**
- Consumes: from `./rsvp` (Task 1) — `DEFAULT_WPM`, `DEFAULT_CHUNK`, `clampWpm`, `clampChunk`; `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `localDate` from `@/lib/quests/daily-store`.
- Produces (Task 3 relies on these):
  - `RSVP_KEY = 'speedreading_rsvp'`, `RsvpSession { date; wpm; words }`, `RsvpState { wpm; chunkSize; sessions }`
  - `RSVP_SAMPLE: Bi`, `resolveRsvpSample(locale): string`
  - `freshRsvp()`, `setWpm(state, wpm)`, `setChunk(state, n)`, `logSession(state, session)`, `readRsvp()`, `writeRsvp(state)`
  - hook `useRsvp()` → `{ state: RsvpState; ready: boolean; setWpm(wpm); setChunk(n); logSession(wpm, words) }`

- [ ] **Step 1: Write the failing tests**

Create `lib/speedreading/rsvp-store.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { freshRsvp, setWpm, setChunk, logSession, readRsvp, writeRsvp } from './rsvp-store'
import { RSVP_KEY } from './rsvp-types'
import { DEFAULT_WPM, DEFAULT_CHUNK, MIN_WPM, MAX_WPM, MAX_CHUNK } from './rsvp'

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
  })
})

describe('rsvp-store', () => {
  it('freshRsvp has default wpm/chunk and empty sessions', () => {
    expect(freshRsvp()).toEqual({ wpm: DEFAULT_WPM, chunkSize: DEFAULT_CHUNK, sessions: [] })
  })
  it('setWpm and setChunk clamp', () => {
    expect(setWpm(freshRsvp(), 5).wpm).toBe(MIN_WPM)
    expect(setWpm(freshRsvp(), 99999).wpm).toBe(MAX_WPM)
    expect(setChunk(freshRsvp(), 99).chunkSize).toBe(MAX_CHUNK)
    expect(setChunk(freshRsvp(), 0).chunkSize).toBe(1)
  })
  it('logSession appends and caps at 50', () => {
    let s = freshRsvp()
    for (let i = 0; i < 60; i++) s = logSession(s, { date: '2026-07-05', wpm: 300, words: 10 })
    expect(s.sessions).toHaveLength(50)
  })
  it('write then read round-trips', () => {
    const s = setWpm(freshRsvp(), 450)
    writeRsvp(s)
    expect(readRsvp().wpm).toBe(450)
  })
  it('missing key → freshRsvp', () => {
    expect(readRsvp()).toEqual(freshRsvp())
  })
  it('malformed JSON → freshRsvp', () => {
    localStorage.setItem(RSVP_KEY, '{not json')
    expect(readRsvp()).toEqual(freshRsvp())
  })
})
```

Create `lib/speedreading/rsvp-sample.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { RSVP_SAMPLE, resolveRsvpSample } from './rsvp-sample'
import { lintDehustle } from '../authoring/dehustle'

describe('RSVP_SAMPLE', () => {
  it('has non-empty ru and en that differ', () => {
    expect(RSVP_SAMPLE.ru.length).toBeGreaterThan(0)
    expect(RSVP_SAMPLE.en.length).toBeGreaterThan(0)
    expect(RSVP_SAMPLE.ru).not.toBe(RSVP_SAMPLE.en)
  })
  it('is de-hustle clean in both locales', () => {
    expect(lintDehustle(RSVP_SAMPLE.ru)).toEqual([])
    expect(lintDehustle(RSVP_SAMPLE.en)).toEqual([])
  })
  it('resolveRsvpSample localizes', () => {
    expect(resolveRsvpSample('ru')).toBe(RSVP_SAMPLE.ru)
    expect(resolveRsvpSample('en')).toBe(RSVP_SAMPLE.en)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/speedreading/rsvp-store.test.ts lib/speedreading/rsvp-sample.test.ts`
Expected: FAIL — modules do not exist yet.

- [ ] **Step 3: Create the types**

Create `lib/speedreading/rsvp-types.ts`:

```ts
// lib/speedreading/rsvp-types.ts
export const RSVP_KEY = 'speedreading_rsvp'
export interface RsvpSession { date: string; wpm: number; words: number }
export interface RsvpState { wpm: number; chunkSize: number; sessions: RsvpSession[] }
```

- [ ] **Step 4: Create the sample passage**

Create `lib/speedreading/rsvp-sample.ts`:

```ts
// lib/speedreading/rsvp-sample.ts
// One original, neutral passage so the reader has text on first load. De-hustle clean (tested).
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'

export const RSVP_SAMPLE: Bi = {
  ru: 'Чтение — это навык внимания. Глаз движется по строке рывками, останавливаясь на словах, а между остановками мозг достраивает смысл. Когда внимание собрано, строка идёт ровно и мысль не рвётся. Когда оно рассеяно, взгляд возвращается назад, и то же предложение читается дважды. Тренировка не заставляет читать быстрее силой — она убирает лишние движения и возвраты, чтобы внимание держалось на смысле дольше. Начни спокойно и дай глазу привыкнуть к ровному темпу.',
  en: 'Reading is a skill of attention. The eye moves along a line in small jumps, resting on words, and between those stops the mind fills in the meaning. When attention is gathered, the line runs smoothly and the thought holds together. When it scatters, the gaze slips backward and the same sentence is read twice. Training does not force faster reading — it removes the extra motions and the backtracking, so attention stays on the meaning longer. Begin calmly and let the eye settle into an even pace.',
}

export function resolveRsvpSample(locale: Locale): string {
  return RSVP_SAMPLE[locale]
}
```

If either string trips `lintDehustle` in Step 7, reword the offending sentence keeping its meaning — do not edit the test.

- [ ] **Step 5: Create the store**

Create `lib/speedreading/rsvp-store.ts` (mirror `lib/pacing/store.ts`):

```ts
// lib/speedreading/rsvp-store.ts
// Pure reducers + localStorage persistence with graceful fallback. Mirrors lib/pacing/store.ts.
import { RSVP_KEY, type RsvpState, type RsvpSession } from './rsvp-types'
import { DEFAULT_WPM, DEFAULT_CHUNK, clampWpm, clampChunk } from './rsvp'

const SESSIONS_CAP = 50

export function freshRsvp(): RsvpState {
  return { wpm: DEFAULT_WPM, chunkSize: DEFAULT_CHUNK, sessions: [] }
}

export function setWpm(state: RsvpState, wpm: number): RsvpState {
  return { ...state, wpm: clampWpm(wpm) }
}

export function setChunk(state: RsvpState, n: number): RsvpState {
  return { ...state, chunkSize: clampChunk(n) }
}

export function logSession(state: RsvpState, session: RsvpSession): RsvpState {
  const sessions = [...state.sessions, session]
  const capped = sessions.length > SESSIONS_CAP ? sessions.slice(sessions.length - SESSIONS_CAP) : sessions
  return { ...state, sessions: capped }
}

export function readRsvp(): RsvpState {
  try {
    const raw = localStorage.getItem(RSVP_KEY)
    if (!raw) return freshRsvp()
    const p = JSON.parse(raw) as Partial<RsvpState>
    return {
      wpm: clampWpm(typeof p.wpm === 'number' ? p.wpm : DEFAULT_WPM),
      chunkSize: clampChunk(typeof p.chunkSize === 'number' ? p.chunkSize : DEFAULT_CHUNK),
      sessions: Array.isArray(p.sessions) ? p.sessions : [],
    }
  } catch {
    return freshRsvp()
  }
}

export function writeRsvp(state: RsvpState): void {
  try { localStorage.setItem(RSVP_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}
```

- [ ] **Step 6: Create the hook**

Create `lib/speedreading/use-rsvp.ts` (mirror `lib/pacing/use-pacing.ts`):

```ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  freshRsvp, readRsvp, writeRsvp,
  setWpm as _setWpm, setChunk as _setChunk, logSession as _logSession,
} from './rsvp-store'
import { localDate } from '@/lib/quests/daily-store'
import type { RsvpState } from './rsvp-types'

export function useRsvp() {
  const [state, setState] = useState<RsvpState>(freshRsvp)
  const [ready, setReady] = useState(false)

  useEffect(() => { setState(readRsvp()); setReady(true) }, [])

  const update = useCallback((fn: (s: RsvpState) => RsvpState) => {
    setState(prev => { const next = fn(prev); writeRsvp(next); return next })
  }, [])

  const setWpm = useCallback((wpm: number) => update(s => _setWpm(s, wpm)), [update])
  const setChunk = useCallback((n: number) => update(s => _setChunk(s, n)), [update])
  const logSession = useCallback((wpm: number, words: number) =>
    update(s => _logSession(s, { date: localDate(), wpm, words })), [update])

  return { state, ready, setWpm, setChunk, logSession }
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run lib/speedreading/rsvp-store.test.ts lib/speedreading/rsvp-sample.test.ts`
Expected: PASS. If a sample string trips `lintDehustle`, reword that sentence (Step 4 note) and re-run.

- [ ] **Step 8: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/rsvp-types.ts LMS/tochka-sborki/web/lib/speedreading/rsvp-sample.ts LMS/tochka-sborki/web/lib/speedreading/rsvp-store.ts LMS/tochka-sborki/web/lib/speedreading/use-rsvp.ts LMS/tochka-sborki/web/lib/speedreading/rsvp-store.test.ts LMS/tochka-sborki/web/lib/speedreading/rsvp-sample.test.ts
git commit -m @'
feat(speedreading): RSVP sample, store, hook (slice 2 task 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 3: Reader component + RU/EN routes

**Files:**
- Create: `components/speedreading/rsvp-reader.tsx`
- Create: `app/speedreading/rsvp/page.tsx`
- Create: `app/en/speedreading/rsvp/page.tsx`

**Interfaces:**
- Consumes: `tokenize`, `buildSchedule`, `splitOrp`, `MIN_WPM`, `MAX_WPM`, `WPM_STEP`, `MAX_CHUNK` from `@/lib/speedreading/rsvp`; `resolveRsvpSample` from `@/lib/speedreading/rsvp-sample`; `useRsvp` from `@/lib/speedreading/use-rsvp`; `Locale` from `@/lib/dictionaries`; `Nav` from `@/components/nav`.
- Produces: `RsvpReader({ locale })` client component; routes `/speedreading/rsvp` (RU) and `/en/speedreading/rsvp` (EN).

- [ ] **Step 1: Create the reader component**

Create `components/speedreading/rsvp-reader.tsx`. The ORP pivot is fixed on the box's center axis using a monospace font (`1ch` = one character): the `before` span's right edge and the `after` span's left edge each sit `0.5ch` from center, so the single pivot char stays centered across every word.

```tsx
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import type { Locale } from '@/lib/dictionaries'
import {
  tokenize, buildSchedule, splitOrp,
  MIN_WPM, MAX_WPM, WPM_STEP, MAX_CHUNK,
} from '@/lib/speedreading/rsvp'
import { resolveRsvpSample } from '@/lib/speedreading/rsvp-sample'
import { useRsvp } from '@/lib/speedreading/use-rsvp'

const T = {
  ru: { speed: 'Скорость', chunk: 'Слов за раз', play: 'Играть', pause: 'Пауза', reset: 'Сброс', yourText: 'Ваш текст', wpm: 'сл/мин' },
  en: { speed: 'Speed', chunk: 'Words at once', play: 'Play', pause: 'Pause', reset: 'Reset', yourText: 'Your text', wpm: 'wpm' },
}

const btn: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: 6, padding: '.4rem .9rem',
  background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '.9rem',
}
const label: React.CSSProperties = { display: 'block', fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: '.9rem' }

export function RsvpReader({ locale }: { locale: Locale }) {
  const t = T[locale]
  const { state, ready, setWpm, setChunk, logSession } = useRsvp()
  const [text, setText] = useState('')
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // seed the textarea with the sample once (after persisted state is ready)
  useEffect(() => { if (ready && text === '') setText(resolveRsvpSample(locale)) }, [ready, locale, text])

  const tokens = useMemo(() => tokenize(text), [text])
  const schedule = useMemo(
    () => buildSchedule(tokens, { wpm: state.wpm, chunkSize: state.chunkSize }),
    [tokens, state.wpm, state.chunkSize],
  )

  useEffect(() => {
    if (!playing) return
    if (index >= schedule.length) {
      setPlaying(false)
      if (tokens.length > 0) logSession(state.wpm, tokens.length)
      return
    }
    timer.current = setTimeout(() => setIndex(i => i + 1), schedule[index].ms)
    return () => { if (timer.current) clearTimeout(timer.current) }
  }, [playing, index, schedule, tokens.length, state.wpm, logSession])

  const start = () => { if (index >= schedule.length) setIndex(0); setPlaying(true) }
  const pause = () => setPlaying(false)
  const reset = () => { setPlaying(false); setIndex(0) }

  const frame = schedule[Math.min(index, schedule.length - 1)]
  const orp = frame ? splitOrp(frame.text) : { before: '', pivot: '', after: '' }

  return (
    <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)' }}>
      {/* word display — ORP pivot fixed on the center axis (monospace, 1ch) */}
      <div style={{ position: 'relative', height: '3rem', marginBottom: '.35rem', fontFamily: 'var(--font-mono)', fontSize: '2rem', lineHeight: '3rem' }} aria-live="polite">
        <span style={{ position: 'absolute', top: 0, right: 'calc(50% + 0.5ch)', color: 'var(--text-primary)', whiteSpace: 'pre' }}>{orp.before}</span>
        <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', color: 'var(--text-accent)', fontWeight: 700 }}>{orp.pivot}</span>
        <span style={{ position: 'absolute', top: 0, left: 'calc(50% + 0.5ch)', color: 'var(--text-primary)', whiteSpace: 'pre' }}>{orp.after}</span>
      </div>
      {/* center focal tick */}
      <div style={{ height: 8, borderLeft: '2px solid var(--text-accent)', width: 0, margin: '0 auto .75rem' }} aria-hidden="true" />

      <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center' }}>
        <button style={btn} onClick={playing ? pause : start}>{playing ? t.pause : t.play}</button>
        <button style={btn} onClick={reset}>{t.reset}</button>
      </div>
      <div style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--text-secondary)', marginTop: '.5rem' }}>
        {Math.min(index, schedule.length)} / {schedule.length}
      </div>

      <label style={label}>
        {t.speed}: {state.wpm} {t.wpm}
        <input type="range" min={MIN_WPM} max={MAX_WPM} step={WPM_STEP} value={state.wpm}
          onChange={e => setWpm(Number(e.target.value))} style={{ display: 'block', width: '100%' }} />
      </label>

      <label style={label}>
        {t.chunk}: {state.chunkSize}
        <input type="range" min={1} max={MAX_CHUNK} step={1} value={state.chunkSize}
          onChange={e => setChunk(Number(e.target.value))} style={{ display: 'block', width: '100%' }} />
      </label>

      <label style={label}>
        {t.yourText}
        <textarea value={text} onChange={e => { setText(e.target.value); reset() }} rows={4}
          style={{ display: 'block', width: '100%', marginTop: '.3rem', fontFamily: 'inherit', fontSize: '.85rem',
            border: '1px solid var(--border-color)', borderRadius: 6, padding: '.5rem', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
      </label>
    </section>
  )
}
```

- [ ] **Step 2: Create the RU route**

Create `app/speedreading/rsvp/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { RsvpReader } from '@/components/speedreading/rsvp-reader'

export const metadata: Metadata = {
  title: 'RSVP-читалка — Скорочтение',
  description: 'Тренажёр скорочтения: слова вспышками с регулируемой скоростью (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>RSVP-читалка</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Слова показываются по одному. Поставь удобную скорость и держи взгляд на цветной опорной букве.
        </p>
        <RsvpReader locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Create the EN route**

Create `app/en/speedreading/rsvp/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { RsvpReader } from '@/components/speedreading/rsvp-reader'

export const metadata: Metadata = {
  title: 'RSVP reader — Speed Reading',
  description: 'A speed-reading trainer: words flashed at an adjustable rate (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <h1 style={{ fontSize: '1.4rem', margin: '0 0 .5rem', color: 'var(--text-primary)' }}>RSVP reader</h1>
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Words appear one at a time. Set a comfortable pace and keep your eyes on the colored pivot letter.
        </p>
        <RsvpReader locale="en" />
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
Expected: all tests pass; build succeeds and statically exports `/speedreading/rsvp` and `/en/speedreading/rsvp`.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/components/speedreading/rsvp-reader.tsx LMS/tochka-sborki/web/app/speedreading/rsvp/page.tsx LMS/tochka-sborki/web/app/en/speedreading/rsvp/page.tsx
git commit -m @'
feat(speedreading): RSVP reader component + RU/EN routes (slice 2 task 3)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

## Notes for the executor

- **Do not** add the trainer to `LMS/registry.json`, `components/nav.tsx`, or `content/`. It stays dark/isolated. Both routes are `noindex`.
- Reuse `clampWpm`/`clampChunk` from the engine everywhere WPM/chunk are set — do not re-implement bounds in the store or component.
- No new npm dependencies. Plain React + the engine only.
- If `lintDehustle` flags a sample string in Task 2, reword the offending sentence and keep meaning; never edit the test to pass.
- The component owns playback state (playing/index); persistence (wpm/chunk/sessions) is the hook's. Keep that separation.
- Hold the push until the user's "go" gate; commit locally per task.
```
