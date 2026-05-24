# SP2b — Daily Quests — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-24 · **Owner:** Alexander Mamaev (master5d)

Completes the SP2 sub-slice deferred by SP2a: **daily-quest decomposition from the learner's cognitive
budget**. Adds a client-side "Today" panel to the dashboard offering 1–3 daily quests scaled to the
learner's `cogTier`, themed via the World Skin, rewarding practice/retrieval with Cognitive Shards (SP3).

## Origin & framing

`cogTier` (1–4) is computed at intake (`web/lib/intake/scoring.ts: computeCogTier`) from D2 (daily time
available: `5_10`→1, `15_20`→2, `30_45`→3, `60_plus`→4; capped to 1 when G6=`under3`) and stored on
`intake_profiles`, but **no UI consumes it yet** — SP2b is its first consumer. The daily loop is the
recurring engagement layer over the existing course spine, deliberately capped to avoid the burnout that
SP4 will address; SP2b does not build streaks or re-engagement (those are SP4).

## Locked decisions (from brainstorming, 2026-05-24)

| # | Decision | Value |
|---|----------|-------|
| Q1 | Quest model | **Blend**: 1 "advance" quest (spine) + 0–2 practice/retrieval quests |
| Q2 | Production | **Deterministic, runtime, client-side** from progress + template bank; no API, offline, free |
| Q3 | cogTier scaling | 1→1, 2→2, 3→3, 4→3 quests (always exactly 1 advance; cap total at 3) |
| Q4 | Rewards | Practice/retrieval = **+10 CS** each (self-checked); all-done **+15 CS** bonus; advance pays nothing extra (its unit already awards SP3 CS) |
| Q5 | Reset | **Clean daily slate** by local date; advance re-derives from live progress, practice/retrieval re-seeded; no backlog, no penalty |
| Q6 | Content | Practice **reuses SP3 applied-challenge templates**; retrieval = new **9-entry per-module bank** (bilingual), prefixed with the skin's mentor name (light theming) |

## Quest kinds

- **advance** — points at the learner's next incomplete unit, derived live from `unit_progress` (the first
  unit in course order not marked complete). Renders the unit title + a link to open it. Marked done when
  that unit completes (read from progress, not self-checked). **No separate CS** — the SP3 unit-completion
  award (70/105/175 by mode) is its reward.
- **practice** — "today's rep": calls `getAppliedChallenge(profile, moduleSlug, tier, locale)` (SP3) for a
  module the learner has **reached**, framed as a daily action. Self-checked via a "Mark done" button →
  **+10 CS**. The challenge tier defaults to `'task'` (daily reps are low-friction; mode selection stays a
  per-unit concept in the wizard).
- **retrieval** — a recall prompt for a **completed** module pulled from `retrieval-bank.ts`, displayed
  prefixed with the skin's mentor name (`SKINS_META[skin].mentor.name[locale]`). Self-rated via a "Mark
  done" button → **+10 CS**. (No "got it / fuzzy" branching — a single done action; SM-2 scheduling is out
  of scope.)
- **all-done bonus** — when every quest in today's set is complete, a one-time **+15 CS** credit.

## cogTier → daily set

| cogTier | advance | practice | retrieval | total |
|---------|---------|----------|-----------|-------|
| 1 | 1 | 0 | 0 | 1 |
| 2 | 1 | 1 | 0 | 2 |
| 3 | 1 | 1 | 1 | 3 |
| 4 | 1 | 1 | 1 | 3 |

**Fallbacks (never throw, never empty for tier ≥ 1):**
- `cogTier` missing/invalid → treat as 2.
- No **reached** modules (shouldn't happen post-intake, but guard) → omit practice.
- No **completed** modules (e.g. day 1) → the retrieval slot is **omitted** (tier 3/4 may yield 2 total on
  day 1). (We do not substitute a second practice quest: on day 1 the only reached module is the current
  one, already used by the practice slot, so a substitution would have nothing distinct to draw from —
  YAGNI. Retrieval naturally appears once the learner completes a module.)
- **Whole course complete** (no next unit) → advance is replaced by a terminal "all zones cleared" quest
  (informational, no CS); practice/retrieval still offered per tier from completed modules.

**Reached vs completed (definitions):**
- **completed module** = the module's lesson is `completed` per the progress provider (`getState(slug) ===
  'completed'`), OR all its units are done per `unit_progress` — SP2b uses the **module-level progress
  provider state** (`completed`) as the source of truth for "completed module", consistent with how the
  dashboard `buildQuestLog` computes `completed`.
- **reached module** = every module up to and including the one containing the next incomplete unit, in
  course order. Concretely: all completed modules **plus** the current in-progress module. Simplest
  implementation: reached = completed modules ∪ { module of the advance quest's target unit }.

## Architecture

All client-side, pure where possible. New code under `web/lib/quests/` and `web/components/quests/`.

| File | Responsibility |
|------|----------------|
| `web/lib/quests/types.ts` | `QuestKind = 'advance' \| 'practice' \| 'retrieval' \| 'complete'`; `DailyQuest { id; kind; title: string; body: string; href?: string; cs: number; module?: string }`; `DailySet { date: string; quests: DailyQuest[] }`; `DailyInput` (the inputs `build-daily` needs) |
| `web/lib/quests/retrieval-bank.ts` | `RETRIEVAL_BANK: Record<string, Bi>` — one recall prompt per of the 9 module slugs (data only) |
| `web/lib/quests/seed.ts` | `dailySeed(key: string, date: string): number` + a small deterministic `pick<T>(items, seed, n)` helper — stable within a date, rotates across dates |
| `web/lib/quests/build-daily.ts` | **pure** `buildDaily(input: DailyInput): DailySet` — applies the tier table, computes advance target, reuses `getAppliedChallenge`, picks retrieval via seed; assigns stable `id`s |
| `web/lib/quests/daily-store.ts` | localStorage `daily_quests` = `{ date, completedIds: string[] }`; pure helpers (`markDone`, `isDone`, `rolloverIfStale`) split from a `readDaily`/`writeDaily` storage shell (mirrors `web/lib/cs/wallet.ts`) |
| `web/lib/quests/use-daily-quests.ts` | hook: fetches nothing itself (fed by caller), builds today's set via `buildDaily`, tracks completion via `daily-store`, awards CS via `useShards().credit`, exposes `{ set, isDone, complete, allDone, ready }` |
| `web/components/quests/daily-panel.tsx` | the "Today" dashboard panel; renders quests, checkmarks, CS badges, all-done state |

**Quest IDs (stable, for completion tracking):** `advance` → `advance:<module>/<unit>`; practice →
`practice:<module>`; retrieval → `retrieval:<module>`; complete → `complete`. Because the day's picks are
deterministic from `(skin, date)`, the same ids regenerate on reload within a day, so `completedIds`
matches correctly without storing the quest objects.

**Daily date string:** local calendar date as `YYYY-MM-DD` from the browser (`new Date()` local), computed
once in the hook and passed into pure functions (so tests inject a fixed date).

## SP3 wallet extension (additive)

SP3's `applyAward(wallet, unitKey, mode)` derives CS from the mode. Daily quests need a **flat** credit.
Add to `web/lib/cs/wallet.ts` (pure, additive — existing award/spend untouched):

```ts
// idempotent flat credit; reuses the earnedUnits ledger with synthetic keys (e.g. "daily:2026-05-24:p0")
export function applyCredit(wallet: Wallet, key: string, amount: number): Wallet {
  if (wallet.earnedUnits.includes(key)) return wallet
  return { ...wallet, balance: wallet.balance + amount, earnedUnits: [...wallet.earnedUnits, key] }
}
```

And expose on `useShards` (`web/lib/cs/use-shards.ts`):

```ts
const credit = useCallback((key: string, amount: number) => {
  setWallet(prev => { const next = applyCredit(prev, key, amount); writeWallet(next); return next })
}, [])
// ...return { ...existing, credit }
```

`earnedUnits` remains the single idempotency ledger for all non-spend credits (unit awards + daily
credits); the `daily:`/`advance:` etc. prefixes keep the namespaces distinct. Daily CS credit keys:
`daily:<date>:<questId>` for per-quest, `daily:<date>:bonus` for the all-done bonus.

## Integration

`web/app/dashboard/dashboard-client.tsx` renders `<DailyPanel>` near the top of `<main>`, **above** the
World Map (below the shard balance / character strip). It passes:
- `cogTier`, `niche`, `outcome` (from `profile`; outcome parsed from `profile.answers.F3` as in UnitWizard),
- `skin` (`profile.world_skin`),
- `completedModules` (from the progress provider — the same `completed` array the file already computes for
  `buildQuestLog`),
- `moduleSlugs` in course order (from `web/lib/rpg/modules.ts` `MODULE_SLUGS`) to derive the advance target,
- `unitProgress` (the panel/hook reads `web/lib/unit-progress.ts` to find the next incomplete unit and to
  mark the advance quest done).

The advance target = the first unit (in module order, then unit order from the content tree) not present in
`unit_progress` as completed. The panel links to `/lessons/<module>/<unit>/` (locale-prefixed), matching
`UnitWizard`'s navigation.

## Theming

Light, consistent with SP2d: the panel uses the skin `accent` (`SKINS_META[skin].accent`); retrieval quests
prefix the mentor name + glyph (`SKINS_META[skin].mentor`). No per-skin quest copy is generated — the
practice text comes from the (already niche-personalized) SP3 templates, retrieval from the neutral 9-entry
bank wrapped in the mentor voice. UI strings (panel heading "Today" / "Mark done" / "+N CS" / all-done line)
go in `web/lib/dictionaries.ts` (RU+EN) per project convention, OR as inline `Bi` constants consistent with
the `cs/` components — **decision: inline `Bi` constants in the quests modules**, matching the SP3 component
pattern (the dictionaries route is reserved for `UnitWizard`-family copy).

## Testing

Pure logic (vitest, no DOM/network):
- `build-daily`: tier table (1/2/3/3 counts); always exactly one advance when a next unit exists; practice
  reuses `getAppliedChallenge` (non-null for a reached module); retrieval only from completed modules;
  determinism — same `(skin, date, progress)` → identical set (ids + picks); day-1 fallback (no completed →
  retrieval becomes practice or omitted); whole-course-complete → `complete` quest, no advance.
- `seed`: `dailySeed` stable for same `(key, date)`, differs across dates; `pick` returns stable subset.
- `daily-store`: `rolloverIfStale` clears `completedIds` when stored date ≠ today; `markDone`/`isDone`
  idempotent; storage shell defends against malformed JSON.
- `applyCredit`: adds the amount once, idempotent for a repeated key, immutable input, distinct from
  `applyAward` (does not require a mode).

`daily-panel.tsx` is presentational — covered by `tsc --noEmit` + `next build`.

## Out of scope (YAGNI)

- Streaks, consecutive-day multipliers, multi-day re-engagement (→ SP4).
- Server/D1 persistence (client localStorage only).
- Notifications / reminders / email.
- Gemini-generated daily quests (deterministic templates only).
- Spaced-repetition scheduling (SM-2 etc.) — retrieval is simple daily random over completed modules.
- "got it / fuzzy" retrieval self-rating — a single done action only.
- Mode selection for daily practice reps (stays a per-unit wizard concept; daily practice uses `task` tier).

## Program linkage

Closes the **SP2b daily-quests** sub-slice of **SP2 — RPG Roadmap**
(`docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`). Depends on SP1 (intake `cogTier`, `niche`, F3
outcome, skin), SP2a (dashboard surface + progress + `MODULE_SLUGS`), SP2d (`SKINS_META.mentor`), and SP3
(applied-challenge templates + CS wallet, extended here with `applyCredit`). Sibling SP2c (Niche Dungeons)
remains independent; SP4 (burnout/streaks/re-engagement) builds on this daily loop later.
