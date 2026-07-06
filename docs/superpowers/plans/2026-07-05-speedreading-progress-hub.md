# Progress Hub + CS Milestones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the «Скорочтение» epic: turn `/speedreading` into the trainer hub — link the three trainers, show a self-contained progress summary from their stores, and award Cognitive Shards for one-time trainer milestones.

**Architecture:** A pure aggregation/grant module (`lib/speedreading/progress.ts`) reads the three shipped stores' state shapes and the CS wallet primitives (`applyCredit`) — the one intentional one-way bridge to `@/lib/cs`; a thin `'use client'` hub component reads the stores + wallet on mount, grants milestones idempotently, and renders links + progress; the two `/speedreading` pages gain the hub below the existing syllabus. Zero backend, zero LLM, no new deps.

**Tech Stack:** TypeScript, Next.js 16 App Router (`output: 'export'`), React (useState/useEffect), Vitest.

## Global Constraints

- Progress + links live only on the `/speedreading` hub. No dashboard/character/nav changes. Pages stay `noindex`.
- One-way CS bridge: `progress.ts` may import `@/lib/cs` (`applyCredit`, `Wallet`); nothing in `@/lib/cs` imports speedreading. CS keys are namespaced `sr:*`. Grants are idempotent (via `applyCredit`'s `earnedUnits` ledger) and one-time (milestones, never per-session — non-farmable).
- Pure aggregation/grant: no DOM in `progress.ts`; the hub delegates all computation to it.
- Reuse shipped stores: `readRsvp`/`readSchulte`/`readWpmTest` and `readWallet`/`writeWallet` — do not add a new store.
- `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `Wallet`/`applyCredit`/`readWallet`/`writeWallet` from `@/lib/cs/*` — not redefined.
- De-hustle: every user-facing string passes `lintDehustle []`; no grind/scarcity/vanity/shaming.
- Bilingual RU (primary) + EN; both pages.
- Sovereign: zero backend, zero LLM, no new dependencies.
- Web gate (from `LMS/tochka-sborki/web`): `npx tsc --noEmit && npx vitest run && npx next build`; build still exports `/speedreading` and `/en/speedreading`.
- Trunk-based `main`, one commit per task. **Ops: run all git via the PowerShell tool — bash-git hangs this session.** Run tsc/vitest/build via the Bash tool from the web dir. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- All `lib/`, `components/`, `app/` paths below are relative to `LMS/tochka-sborki/web/`.

**Store shapes this slice reads (already shipped — do not change):**
- `RsvpState { wpm: number; chunkSize: number; sessions: { date; wpm; words }[] }`
- `SchulteState { size: number; best: Record<number, number>; sessions: { date; size; ms; errors }[] }`
- `WpmTestState { results: { date; passageId; ms; words; wpm; correct; total; effectiveWpm }[] }`
- `Wallet { balance: number; earnedUnits: string[]; unlocks: string[]; modeByUnit: Record<string, Mode> }`

---

### Task 1: Pure progress + milestone module (`lib/speedreading/progress.ts`)

**Files:**
- Create: `lib/speedreading/progress.ts`
- Test: `lib/speedreading/progress.test.ts`

**Interfaces:**
- Consumes: `Bi` from `@/lib/course`; `Wallet` from `@/lib/cs/types`; `applyCredit` from `@/lib/cs/wallet`; `RsvpState` from `./rsvp-types`; `SchulteState` from `./schulte-types`; `WpmTestState` from `./wpm-test-types`.
- Produces: `Milestone`, `MILESTONES`, `earnedMilestoneKeys(rsvp, schulte, wpm): string[]`, `grantMilestoneCredits(wallet, rsvp, schulte, wpm): Wallet`, `ProgressSummary`, `summarizeProgress(rsvp, schulte, wpm): ProgressSummary`.

- [ ] **Step 1: Write the failing test**

Create `lib/speedreading/progress.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { MILESTONES, earnedMilestoneKeys, grantMilestoneCredits, summarizeProgress } from './progress'
import type { RsvpState } from './rsvp-types'
import type { SchulteState } from './schulte-types'
import type { WpmTestState } from './wpm-test-types'
import type { Wallet } from '@/lib/cs/types'

const emptyRsvp: RsvpState = { wpm: 300, chunkSize: 1, sessions: [] }
const emptySchulte: SchulteState = { size: 5, best: {}, sessions: [] }
const emptyWpm: WpmTestState = { results: [] }
const freshWallet = (): Wallet => ({ balance: 0, earnedUnits: [], unlocks: [], modeByUnit: {} })

const rsvp1: RsvpState = { ...emptyRsvp, sessions: [{ date: 'd', wpm: 250, words: 70 }] }
const schulte1: SchulteState = { ...emptySchulte, best: { 5: 9000 }, sessions: [{ date: 'd', size: 5, ms: 9000, errors: 0 }] }
const wpm1: WpmTestState = { results: [{ date: 'd', passageId: 'attention', ms: 30000, words: 150, wpm: 300, correct: 3, total: 3, effectiveWpm: 300 }] }

describe('MILESTONES', () => {
  it('has 3 unique sr:-namespaced keys with positive cs and bilingual labels', () => {
    expect(MILESTONES).toHaveLength(3)
    const keys = MILESTONES.map(m => m.key)
    expect(new Set(keys).size).toBe(3)
    for (const m of MILESTONES) {
      expect(m.key.startsWith('sr:')).toBe(true)
      expect(m.cs).toBeGreaterThan(0)
      expect(m.label.ru.length).toBeGreaterThan(0)
      expect(m.label.en.length).toBeGreaterThan(0)
    }
  })
})

describe('earnedMilestoneKeys', () => {
  it('empty states earn nothing', () => {
    expect(earnedMilestoneKeys(emptyRsvp, emptySchulte, emptyWpm)).toEqual([])
  })
  it('one session/result each earns the matching key', () => {
    expect(earnedMilestoneKeys(rsvp1, emptySchulte, emptyWpm)).toEqual(['sr:rsvp:first'])
    expect(earnedMilestoneKeys(emptyRsvp, schulte1, emptyWpm)).toEqual(['sr:schulte:first'])
    expect(earnedMilestoneKeys(emptyRsvp, emptySchulte, wpm1)).toEqual(['sr:wpm:first'])
  })
  it('all three earned returns all keys in MILESTONES order', () => {
    expect(earnedMilestoneKeys(rsvp1, schulte1, wpm1)).toEqual(['sr:rsvp:first', 'sr:schulte:first', 'sr:wpm:first'])
  })
})

describe('grantMilestoneCredits', () => {
  it('grants earned milestones once (balance +60, keys in ledger)', () => {
    const w = grantMilestoneCredits(freshWallet(), rsvp1, schulte1, wpm1)
    expect(w.balance).toBe(60)
    expect(w.earnedUnits).toEqual(['sr:rsvp:first', 'sr:schulte:first', 'sr:wpm:first'])
  })
  it('is idempotent — a second grant adds nothing', () => {
    const once = grantMilestoneCredits(freshWallet(), rsvp1, schulte1, wpm1)
    const twice = grantMilestoneCredits(once, rsvp1, schulte1, wpm1)
    expect(twice.balance).toBe(60)
    expect(twice.earnedUnits).toHaveLength(3)
  })
  it('grants only the earned subset', () => {
    const w = grantMilestoneCredits(freshWallet(), rsvp1, emptySchulte, emptyWpm)
    expect(w.balance).toBe(20)
    expect(w.earnedUnits).toEqual(['sr:rsvp:first'])
  })
})

describe('summarizeProgress', () => {
  it('all-empty → zeros and nulls', () => {
    expect(summarizeProgress(emptyRsvp, emptySchulte, emptyWpm)).toEqual({
      rsvpSessions: 0, rsvpLastWpm: null, schulteBestMs: null, schulteSizes: [],
      wpmCount: 0, wpmLatestEff: null, wpmFirstEff: null, wpmDelta: null,
    })
  })
  it('aggregates counts, last wpm, best time (min), sizes, and effective-wpm delta', () => {
    const rsvp: RsvpState = { ...emptyRsvp, sessions: [
      { date: 'd', wpm: 250, words: 70 }, { date: 'd', wpm: 320, words: 70 },
    ] }
    const schulte: SchulteState = { ...emptySchulte, best: { 5: 9000, 4: 8000 } }
    const wpm: WpmTestState = { results: [
      { date: 'd', passageId: 'attention', ms: 40000, words: 150, wpm: 225, correct: 2, total: 3, effectiveWpm: 150 },
      { date: 'd', passageId: 'memory', ms: 30000, words: 150, wpm: 300, correct: 3, total: 3, effectiveWpm: 300 },
    ] }
    expect(summarizeProgress(rsvp, schulte, wpm)).toEqual({
      rsvpSessions: 2, rsvpLastWpm: 320, schulteBestMs: 8000, schulteSizes: [4, 5],
      wpmCount: 2, wpmLatestEff: 300, wpmFirstEff: 150, wpmDelta: 150,
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `LMS/tochka-sborki/web`): `npx vitest run lib/speedreading/progress.test.ts`
Expected: FAIL — cannot resolve `./progress`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/speedreading/progress.ts`:

```ts
// lib/speedreading/progress.ts
// Aggregates the three trainer stores for the /speedreading hub, and grants Cognitive Shards for
// one-time trainer milestones (Скорочтение epic, slice 5). This file holds the ONE intentional one-way
// bridge to the CS layer (@/lib/cs); nothing in @/lib/cs depends on speedreading. Grants are idempotent
// via applyCredit's earnedUnits ledger and one-time (non-farmable), keys namespaced `sr:*`.
import type { Bi } from '@/lib/course'
import type { Wallet } from '@/lib/cs/types'
import { applyCredit } from '@/lib/cs/wallet'
import type { RsvpState } from './rsvp-types'
import type { SchulteState } from './schulte-types'
import type { WpmTestState } from './wpm-test-types'

export interface Milestone { key: string; cs: number; label: Bi }

export const MILESTONES: Milestone[] = [
  { key: 'sr:rsvp:first',    cs: 20, label: { ru: 'Первая тренировка ритма', en: 'First rhythm session' } },
  { key: 'sr:schulte:first', cs: 20, label: { ru: 'Первая таблица',          en: 'First table' } },
  { key: 'sr:wpm:first',     cs: 20, label: { ru: 'Первый замер скорости',   en: 'First speed check' } },
]

export function earnedMilestoneKeys(rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): string[] {
  const keys: string[] = []
  if (rsvp.sessions.length >= 1) keys.push('sr:rsvp:first')
  if (schulte.sessions.length >= 1) keys.push('sr:schulte:first')
  if (wpm.results.length >= 1) keys.push('sr:wpm:first')
  return keys
}

export function grantMilestoneCredits(wallet: Wallet, rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): Wallet {
  const earned = new Set(earnedMilestoneKeys(rsvp, schulte, wpm))
  return MILESTONES.reduce((w, m) => (earned.has(m.key) ? applyCredit(w, m.key, m.cs) : w), wallet)
}

export interface ProgressSummary {
  rsvpSessions: number
  rsvpLastWpm: number | null
  schulteBestMs: number | null
  schulteSizes: number[]
  wpmCount: number
  wpmLatestEff: number | null
  wpmFirstEff: number | null
  wpmDelta: number | null
}

export function summarizeProgress(rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): ProgressSummary {
  const bestValues = Object.values(schulte.best)
  const results = wpm.results
  const latest = results.length ? results[results.length - 1].effectiveWpm : null
  const first = results.length ? results[0].effectiveWpm : null
  return {
    rsvpSessions: rsvp.sessions.length,
    rsvpLastWpm: rsvp.sessions.length ? rsvp.sessions[rsvp.sessions.length - 1].wpm : null,
    schulteBestMs: bestValues.length ? Math.min(...bestValues) : null,
    schulteSizes: Object.keys(schulte.best).map(Number).sort((a, b) => a - b),
    wpmCount: results.length,
    wpmLatestEff: latest,
    wpmFirstEff: first,
    wpmDelta: latest !== null && first !== null ? latest - first : null,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/speedreading/progress.test.ts`
Expected: PASS.

- [ ] **Step 5: Type-check + commit (PowerShell)**

Run: `npx tsc --noEmit` → no errors. Then:

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/lib/speedreading/progress.ts LMS/tochka-sborki/web/lib/speedreading/progress.test.ts
git commit -m @'
feat(speedreading): progress aggregation + CS milestone grants (slice 5 task 1)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

### Task 2: Hub component + page wiring

**Files:**
- Create: `components/speedreading/speedreading-hub.tsx`
- Modify: `app/speedreading/page.tsx`
- Modify: `app/en/speedreading/page.tsx`

**Interfaces:**
- Consumes: `readRsvp` from `@/lib/speedreading/rsvp-store`; `readSchulte` from `@/lib/speedreading/schulte-store`; `readWpmTest` from `@/lib/speedreading/wpm-test-store`; `readWallet`, `writeWallet` from `@/lib/cs/wallet`; `MILESTONES`, `earnedMilestoneKeys`, `grantMilestoneCredits`, `summarizeProgress`, `ProgressSummary` from `@/lib/speedreading/progress`; `Locale` from `@/lib/dictionaries`.
- Produces: `SpeedreadingHub({ locale })` client component, mounted on both `/speedreading` pages.

- [ ] **Step 1: Create the hub component**

Create `components/speedreading/speedreading-hub.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { Locale } from '@/lib/dictionaries'
import { readRsvp } from '@/lib/speedreading/rsvp-store'
import { readSchulte } from '@/lib/speedreading/schulte-store'
import { readWpmTest } from '@/lib/speedreading/wpm-test-store'
import { readWallet, writeWallet } from '@/lib/cs/wallet'
import {
  MILESTONES, earnedMilestoneKeys, grantMilestoneCredits, summarizeProgress, type ProgressSummary,
} from '@/lib/speedreading/progress'

const TRAINERS = {
  ru: [
    { slug: 'rsvp', name: 'RSVP-читалка', desc: 'Слова вспышками с регулируемой скоростью' },
    { slug: 'schulte', name: 'Таблицы Шульте', desc: 'Числа по порядку, боковым зрением' },
    { slug: 'test', name: 'Тест скорости', desc: 'Замер с поправкой на понимание' },
  ],
  en: [
    { slug: 'rsvp', name: 'RSVP reader', desc: 'Words flashed at an adjustable pace' },
    { slug: 'schulte', name: 'Schulte tables', desc: 'Numbers in order, with side vision' },
    { slug: 'test', name: 'Reading-speed test', desc: 'Measured, adjusted for comprehension' },
  ],
}

const T = {
  ru: {
    trainers: 'Тренажёры', progress: 'Твой прогресс',
    empty: 'Пройди любой тренажёр — здесь появится прогресс.',
    rsvp: 'Ритм', schulte: 'Периферийка', wpm: 'Скорость',
    sessions: 'сессий', last: 'последняя', tests: 'тестов', best: 'лучшее',
    wpmU: 'сл/мин', sec: 'с', sizes: 'размеры', effective: 'эффективная', vsFirst: 'к первому',
    shards: 'осколков за тренировки',
  },
  en: {
    trainers: 'Trainers', progress: 'Your progress',
    empty: 'Try any trainer — your progress will show up here.',
    rsvp: 'Rhythm', schulte: 'Side vision', wpm: 'Speed',
    sessions: 'sessions', last: 'last', tests: 'tests', best: 'best',
    wpmU: 'wpm', sec: 's', sizes: 'sizes', effective: 'effective', vsFirst: 'vs first',
    shards: 'shards from training',
  },
}

const card: React.CSSProperties = {
  border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem',
  background: 'var(--bg-surface)', color: 'var(--text-primary)', textDecoration: 'none', display: 'block',
}

export function SpeedreadingHub({ locale }: { locale: Locale }) {
  const t = T[locale]
  const prefix = locale === 'en' ? '/en' : ''
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [shards, setShards] = useState(0)

  useEffect(() => {
    const rsvp = readRsvp(), schulte = readSchulte(), wpm = readWpmTest()
    const wallet = readWallet()
    const next = grantMilestoneCredits(wallet, rsvp, schulte, wpm)
    if (next.balance !== wallet.balance) writeWallet(next)
    setSummary(summarizeProgress(rsvp, schulte, wpm))
    const earned = new Set(earnedMilestoneKeys(rsvp, schulte, wpm))
    setShards(MILESTONES.filter(m => earned.has(m.key)).reduce((n, m) => n + m.cs, 0))
  }, [])

  const s = summary
  const has = s !== null && (s.rsvpSessions > 0 || s.schulteBestMs !== null || s.wpmCount > 0)

  return (
    <section style={{ marginTop: '2.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 .9rem', color: 'var(--text-primary)' }}>{t.trainers}</h2>
      <div style={{ display: 'grid', gap: '.6rem', marginBottom: '2rem' }}>
        {TRAINERS[locale].map(tr => (
          <a key={tr.slug} href={`${prefix}/speedreading/${tr.slug}`} style={card}>
            <span style={{ fontWeight: 600 }}>{tr.name}</span>
            <span style={{ display: 'block', fontSize: '.82rem', color: 'var(--text-secondary)', marginTop: '.2rem' }}>{tr.desc}</span>
          </a>
        ))}
      </div>

      <h2 style={{ fontSize: '1.1rem', margin: '0 0 .9rem', color: 'var(--text-primary)' }}>{t.progress}</h2>
      {!has ? (
        <p style={{ fontSize: '.9rem', color: 'var(--text-secondary)' }}>{t.empty}</p>
      ) : (
        <div style={{ display: 'grid', gap: '.5rem', fontSize: '.9rem', color: 'var(--text-secondary)' }}>
          {s!.rsvpSessions > 0 && (
            <div><b style={{ color: 'var(--text-primary)' }}>{t.rsvp}</b>: {s!.rsvpSessions} {t.sessions}{s!.rsvpLastWpm !== null ? ` · ${t.last} ${s!.rsvpLastWpm} ${t.wpmU}` : ''}</div>
          )}
          {s!.schulteBestMs !== null && (
            <div><b style={{ color: 'var(--text-primary)' }}>{t.schulte}</b>: {t.best} {(s!.schulteBestMs / 1000).toFixed(1)} {t.sec} · {t.sizes} {s!.schulteSizes.join(', ')}</div>
          )}
          {s!.wpmCount > 0 && (
            <div>
              <b style={{ color: 'var(--text-primary)' }}>{t.wpm}</b>: {t.effective} {s!.wpmLatestEff} {t.wpmU}
              {s!.wpmDelta !== null && s!.wpmCount > 1 ? ` · ${s!.wpmDelta >= 0 ? '+' : ''}${s!.wpmDelta} ${t.vsFirst}` : ''}
            </div>
          )}
          {shards > 0 && (
            <div style={{ fontSize: '.82rem', color: 'var(--text-accent)', marginTop: '.3rem' }}>+{shards} {t.shards}</div>
          )}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Wire the hub into the RU page**

Modify `app/speedreading/page.tsx` — add the import and render the hub below the syllabus. The full file becomes:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'
import { SpeedreadingHub } from '@/components/speedreading/speedreading-hub'

export const metadata: Metadata = {
  title: 'Скорочтение — Точка Сборки',
  description: 'Курс скорочтения (готовится).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="ru" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="ru" />
        <SpeedreadingHub locale="ru" />
      </main>
    </>
  )
}
```

- [ ] **Step 3: Wire the hub into the EN page**

Modify `app/en/speedreading/page.tsx` — the full file becomes:

```tsx
import type { Metadata } from 'next'
import { Nav } from '@/components/nav'
import { SpeedreadingSyllabus } from '@/components/speedreading-syllabus'
import { SpeedreadingHub } from '@/components/speedreading/speedreading-hub'

export const metadata: Metadata = {
  title: 'Speed Reading — Tochka Sborki',
  description: 'A speed-reading course (in preparation).',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <>
      <Nav locale="en" />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <SpeedreadingSyllabus locale="en" />
        <SpeedreadingHub locale="en" />
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
Expected: all tests pass; build succeeds and still statically exports `/speedreading` and `/en/speedreading`.

- [ ] **Step 6: Commit (PowerShell)**

```powershell
cd C:\telo\Efforts\Ongoing\mc_hub
git add LMS/tochka-sborki/web/components/speedreading/speedreading-hub.tsx LMS/tochka-sborki/web/app/speedreading/page.tsx LMS/tochka-sborki/web/app/en/speedreading/page.tsx
git commit -m @'
feat(speedreading): hub — trainer links + progress + CS grant (slice 5 task 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
'@
```

---

## Notes for the executor

- **Do not** add speedreading to `LMS/registry.json`, `components/nav.tsx`, or `content/`, and do NOT surface progress on the dashboard/character. The hub stays on `/speedreading`; both pages stay `noindex`.
- The only cross-module import is `progress.ts` → `@/lib/cs` (`applyCredit`, `Wallet`) and the hub → `@/lib/cs/wallet` (`readWallet`/`writeWallet`). Do not import speedreading anywhere under `@/lib/cs`.
- CS grant fires on hub mount and is idempotent (each `sr:*` key credited once ever via `applyCredit`). Do not add per-session or repeatable awards.
- No new npm dependencies.
- Hold the push until the user's "go" gate; commit locally per task.
```
