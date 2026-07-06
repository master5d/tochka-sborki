# Progress hub + CS milestones — Slice 5 (final) of the «Скорочтение» epic

**Epic:** «Скорочтение» — an isolated hybrid speed-reading module for the S.A.S.H.A. academy
(course skeleton + interactive trainers). Slices 1 (skeleton), 2 (RSVP), 3 (Schulte), 4 (WPM test) shipped 2026-07-05.

**This slice (5, final):** turns `/speedreading` into the trainer **hub** — it (a) links the three trainers
(currently orphaned: reachable only by direct URL), (b) shows a self-contained **progress summary** read from
the three localStorage stores, and (c) awards **Cognitive Shards** for one-time trainer milestones. This closes
the epic.

## Scope decision

Progress + trainer links live on the **`/speedreading` hub** (self-contained — preserves the module's isolation
from the RPG/dashboard surfaces, consistent with S1–S4). The **CS award is a deliberate, one-way bridge**:
`lib/speedreading/progress.ts` imports `applyCredit`/`Wallet` from `@/lib/cs` and grants shards for milestones;
the CS/RPG layer has no knowledge of speedreading. Awards are **one-time, non-farmable milestones** (not
per-session), namespaced `sr:*` — the same idempotency pattern daily quests already use (`daily:<date>:<id>`).
Out of scope: any dashboard/character surfacing, per-session or repeatable CS, new backend, lesson prose.

## Architecture

New code under `lib/speedreading/` + `components/speedreading/`; the two `/speedreading` page routes gain the
hub component below the existing syllabus. Pure aggregation/grant logic + a thin client hub.

### `lib/speedreading/progress.ts`

The one intentional cross-module import (`@/lib/cs`) lives here; the component stays declarative.

```ts
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

// pure: which milestone keys the user has currently earned (one-time; based on ≥1 recorded session/result)
export function earnedMilestoneKeys(rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): string[]

// pure: fold applyCredit over earned milestones (idempotent by key via wallet.earnedUnits) → new wallet
export function grantMilestoneCredits(wallet: Wallet, rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): Wallet

export interface ProgressSummary {
  rsvpSessions: number
  rsvpLastWpm: number | null
  schulteBestMs: number | null   // min over the best-times map; null if none
  schulteSizes: number[]         // sizes with a best time, ascending
  wpmCount: number
  wpmLatestEff: number | null
  wpmFirstEff: number | null
  wpmDelta: number | null        // latest − first (null if < 1 result)
}

// pure aggregation for display
export function summarizeProgress(rsvp: RsvpState, schulte: SchulteState, wpm: WpmTestState): ProgressSummary
```

- `earnedMilestoneKeys`: `sr:rsvp:first` when `rsvp.sessions.length >= 1`; `sr:schulte:first` when
  `schulte.sessions.length >= 1`; `sr:wpm:first` when `wpm.results.length >= 1`. Returns the earned subset in
  `MILESTONES` order.
- `grantMilestoneCredits`: for each earned key, `wallet = applyCredit(wallet, milestone.key, milestone.cs)`.
  `applyCredit` no-ops when the key is already in `wallet.earnedUnits`, so this is safe to call on every hub visit
  and grants each milestone exactly once, ever.
- `summarizeProgress`: `rsvpLastWpm` = the last session's `wpm` (null if none); `schulteBestMs` = `min` of
  `Object.values(schulte.best)` (null if empty); `schulteSizes` = sorted numeric keys of `schulte.best`;
  `wpmLatestEff`/`wpmFirstEff` = `effectiveWpm` of the last/first result; `wpmDelta` = latest − first (null if 0 results).

### `components/speedreading/speedreading-hub.tsx` (`'use client'`)

Props `{ locale: Locale }`.
- On mount (after a `ready` flag): read the three stores (`readRsvp`, `readSchulte`, `readWpmTest`) and the wallet
  (`readWallet`); compute `next = grantMilestoneCredits(wallet, rsvp, schulte, wpm)`; if `next.balance !== wallet.balance`,
  `writeWallet(next)`. Hold `summarizeProgress(...)` and the newly-earned shard total in state.
- Render three parts, all bilingual inline:
  1. **Trainer links** — three cards linking `/speedreading/rsvp`, `/speedreading/schulte`, `/speedreading/test`
     (locale-prefixed for EN), each with a short name + one-line description.
  2. **Progress summary** — RSVP (session count + last WPM), Schulte (best time in seconds + sizes tried), WPM
     (latest effective WPM + delta vs first), each shown only when data exists; a gentle empty-state line otherwise.
  3. **Shards** — a quiet "+N shards" line reflecting milestone credits earned so far (from `MILESTONES` whose keys
     are earned), no grind/vanity framing.
- a11y: links are real `<a href>`; no autoplay/timers.
- All copy `lintDehustle`-clean.

### `app/speedreading/page.tsx` (RU) + `app/en/speedreading/page.tsx` (EN)

Add `<SpeedreadingHub locale=… />` below the existing `<SpeedreadingSyllabus locale=… />` inside the same `<main>`.
The pages remain server components rendering the client hub as a child. No metadata change (still `noindex`).

## Testing

- `lib/speedreading/progress.test.ts` —
  - `MILESTONES`: 3 entries, unique keys all prefixed `sr:`, every `cs > 0`, every `label.ru`/`.en` non-empty.
  - `earnedMilestoneKeys`: empty states → `[]`; a state with one RSVP session → `['sr:rsvp:first']`; one Schulte
    session → `['sr:schulte:first']`; one WPM result → `['sr:wpm:first']`; all three present → all three keys in order.
  - `grantMilestoneCredits`: from a fresh wallet with all three earned, balance increases by 60 and `earnedUnits`
    gains the three keys; calling it a **second** time adds nothing (idempotent); a state with only RSVP earned grants
    only 20.
  - `summarizeProgress`: session counts, `rsvpLastWpm` = last session wpm, `schulteBestMs` = min of best map,
    `schulteSizes` sorted, `wpmLatestEff`/`wpmFirstEff`/`wpmDelta` from first & last results; all-empty → nulls/zeros.
- Component: thin (logic in `progress.ts`) → no render test (no RTL precedent); correctness via `next build` + a manual
  smoke of `/speedreading` (links present, progress shows after using a trainer, shards granted once).

## Global constraints

- Progress + links live only on the `/speedreading` hub. No dashboard/character/nav changes. Pages stay `noindex`.
- One-way CS bridge: `progress.ts` may import `@/lib/cs` (`applyCredit`, `Wallet`); nothing in `@/lib/cs` imports speedreading. CS keys are namespaced `sr:*`. Grants are idempotent (via `applyCredit`'s `earnedUnits` ledger) and one-time (milestones, never per-session — non-farmable).
- Pure aggregation/grant: no DOM in `progress.ts`; the hub component delegates all computation to it.
- Reuse the shipped stores: `readRsvp`/`readSchulte`/`readWpmTest` and `readWallet`/`writeWallet` — do not add a new store.
- `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `Wallet`/`applyCredit`/`readWallet`/`writeWallet` from `@/lib/cs/*` — not redefined.
- De-hustle: every user-facing string (milestone labels, link copy, progress/empty-state labels) passes `lintDehustle []`; no grind/scarcity/vanity/shaming.
- Authenticity: counts, times, and speeds are real; shard amounts are modest and fixed; no fabricated metrics.
- Bilingual RU (primary) + EN; both pages.
- Sovereign: zero backend, zero LLM, no new dependencies.
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run && npx next build` (build still exports `/speedreading` and `/en/speedreading`).
- Trunk-based `main`, one commit per task. **Ops:** git only via the PowerShell tool (bash-git hangs this session).

## Out of scope

Dashboard/character surfacing, per-session or repeatable CS, additional milestones beyond the three, any backend, lesson prose, un-noindexing the routes.
