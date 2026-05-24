# SP3 — Cognitive Shards Economy — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-22 · **Owner:** Alexander Mamaev (master5d)

Replaces the placeholder **SP3 — XP / Leveling** slice in the RPG roadmap program with a single-currency
**Cognitive Shards (CS)** economy: CS is both the learner's score and a spendable resource. Progression
is driven by a learner-chosen **mode per unit** (a diagonal of the LeaderFactor Coaching × Accountability
matrix), and CS payouts are weighted toward the *thinking* phases (Reflection, Concept) over *doing*.

## Origin & framing

Derived from a learner-found document (LeaderFactor "Coaching & Accountability Matrix" × Kolb's
Experiential Learning Cycle). The matrix is, by that document's own admission, a wrapper over situational
leadership / cognitive-load theory. We adopt the useful kernel — **scaffolding that fades as competence
grows, with the learner choosing how much help to take** — and reject the branding and the heavy scenario
content (Boss Arenas, sandbox auto-grading).

**Kolb framing (already true):** the existing 4-phase unit loop maps onto Kolb and is the established base
loop — Activation ≈ Concrete Experience, Reflection ≈ Reflective Observation, Concept ≈ Abstract
Conceptualization, Practice ≈ Active Experimentation. SP3 adds an economy on top; it does not change the loop.

## Locked decisions (from brainstorming, 2026-05-22)

| # | Decision | Value |
|---|----------|-------|
| S1 | Currency | Single currency **Cognitive Shards (CS)** replaces XP — score + spendable resource |
| S2 | Payout weighting | Per-phase base weighted to Reflection + Concept (the "twist": thinking pays, not just doing) |
| S3 | Progression model | **Three diagonal modes** chosen per unit (not a full independent 3×3), faithful to the doc's Box1→Box5→Box9 diagonal |
| S4 | Modes | Commander/Task (1.0x), Co-Pilot/Process (1.5x), Silent Archmage/Outcome (2.5x) — less help = higher multiplier; help never paywalled |
| S5 | Accountability axis | **Intake-personalized applied challenge** (static templating from F2 niche + F3 outcome), ~9 module templates, not ×3 authored exercises |
| S6 | Storage | **Client-side localStorage** wallet (mirrors existing `unit-progress`); no server/D1 work |
| S7 | Sinks | Spend CS to unlock **alternate theme packs** (intake-assigned skin stays free); premium narration voices deferred |
| S8 | Out of scope | Leaderboards, companion-agent evolution, server persistence, premium-voice content, full independent 3×3 |

## Existing surface (integration points)

- **`web/components/unit-wizard.tsx`** — client; 4 phases `currentStep` 0..3, `done` state; already calls
  `useUnitProgress().markCompleted` and (SP2d) resolves the learner's skin + renders themed framing
  including the instructional **mentor hint** at Practice. This is where the mode selector, CS award, and
  hint-visibility gating live.
- **`web/lib/unit-progress.ts`** — the established **client localStorage** pattern (`unit_progress` key);
  the CS wallet mirrors it.
- **Intake profile** — `/api/intake/me` returns the `intake_profiles` row, including the `niche` column
  (F2) and the full `answers` JSON (F3 = `answers.F3`, free text, optional). SP2d already fetches this in
  UnitWizard, so the data is on hand.
- **SP2d skin packs** — `SkinPack.units['<module>/<unit>'] = { intro, mentorHint, outro }`; `SKINS_META`
  per-skin `mentor` persona. SP3 gates `mentorHint` visibility by mode (intro/outro always shown).
- **Module slugs** — 9 modules (`web/lib/rpg/modules.ts`), 38 units.

## Architecture

All client-side, pure where possible. New code under `web/lib/cs/`:

| File | Responsibility |
|------|----------------|
| `web/lib/cs/types.ts` | `Mode = 'commander' \| 'copilot' \| 'archmage'`; `Phase` indices; `Wallet`, `ModeConfig`, `AppliedChallenge` types |
| `web/lib/cs/modes.ts` | The 3 mode presets: label (Bi), multiplier, `hintVisible: boolean`, `challengeTier: 'task'\|'process'\|'outcome'` |
| `web/lib/cs/award.ts` | Pure: `PHASE_BASE` table + `computeUnitCS(mode): number` (sum of phase base × mode multiplier, rounded) |
| `web/lib/cs/wallet.ts` | localStorage ledger: read/write `{ balance, earnedUnits, unlocks, modeByUnit }`; `awardUnit(key, mode)` idempotent via `earnedUnits`; `spend(cost, unlockId)`; pure helpers split from the storage shell for testability |
| `web/lib/cs/use-shards.ts` | `useShards()` hook (mirrors `useUnitProgress`) exposing `balance`, `award`, `spend`, `setMode`, `getMode`, `unlocked`, `ready` |
| `web/lib/cs/applied-challenge.ts` | `getAppliedChallenge(profile, moduleSlug, tier, locale)` — pulls a per-module template, slot-fills `{niche}`/`{outcome}`, falls back to a niche-generic line when F3 empty |
| `web/lib/cs/challenge-templates.ts` | The ~9 per-module bilingual templates (data) |
| `web/components/cs/mode-selector.tsx` | 3-card chooser shown at unit start; persists via `setMode` |
| `web/components/cs/cycle-complete.tsx` | "NODE CLEARED · +N CS · <mode>" notification on `done` |
| `web/components/cs/shard-balance.tsx` | Small `💎 N` counter for nav/dashboard |
| `web/components/cs/vault.tsx` | Minimal spend surface (alternate skins) on the dashboard |

UnitWizard wiring: render `<ModeSelector>` before phase content when no mode chosen for this unit; gate the
SP2d mentor hint with the chosen mode's `hintVisible`; render the applied challenge at Practice using the
mode's `challengeTier`; on `handleComplete`, call `award(unitKey, mode)` and show `<CycleComplete>`.

## Earning CS (the twist)

```ts
// award.ts
export const PHASE_BASE = { activation: 5, reflection: 25, concept: 25, practice: 15 } // sum 70
export function computeUnitCS(mode: Mode): number {
  const base = 5 + 25 + 25 + 15 // 70
  return Math.round(base * MODE[mode].multiplier) // 70 / 105 / 175
}
```

CS is awarded **once per unit** on completion (`earnedUnits` guards double-award). Because 50 of the 70
base sits in Reflection+Concept, the payout structurally rewards the thinking phases; a learner who rushes
Practice still had to pass the weighted phases to complete the unit. (Phase completion is the existing
4-step gate in UnitWizard — SP3 does not add per-phase partial credit; it awards the unit total on `done`.)

## Modes (the diagonal)

```ts
// modes.ts
export const MODE = {
  commander: { multiplier: 1.0, hintVisible: true,  challengeTier: 'task',
               label: { ru: 'Командир', en: 'Commander' } },
  copilot:   { multiplier: 1.5, hintVisible: true,  challengeTier: 'process',
               label: { ru: 'Со-пилот', en: 'Co-Pilot' } },
  archmage:  { multiplier: 2.5, hintVisible: false, challengeTier: 'outcome',
               label: { ru: 'Архимаг', en: 'Silent Archmage' } },
}
```

- `hintVisible` gates the **SP2d instructional mentor hint** only. Themed `intro`/`outro` (immersion, not
  help) always render — SP3 does not touch them.
- The learner picks a mode per unit; default suggestion is `commander` but any mode is selectable from the
  start (self-paced agency). Choice persists in `modeByUnit`.

## Accountability axis — intake-personalized applied challenge

The mode's `challengeTier` selects how the Practice phase's applied challenge is framed, pulled from a
per-module template and slot-filled from the learner's intake:

```ts
// applied-challenge.ts
export function getAppliedChallenge(
  profile: { niche?: string | null; outcome?: string | null },
  moduleSlug: string,
  tier: 'task' | 'process' | 'outcome',
  locale: Locale,
): string | null
```

- `outcome` is read by the caller from `JSON.parse(profile.answers).F3` (free text); `niche` from the
  `niche` column (F2).
- **Fallback:** when F3 is empty, the `outcome` tier uses a niche-generic objective from the template
  (every template provides a `{nicheGeneric}` line per niche bucket); when both are absent, falls back to
  the `task` framing. Never throws, never shows an empty challenge.
- Templates live in `challenge-templates.ts`: one entry per module slug, each with `task`/`process`/
  `outcome` framings (Bi) containing `{niche}` / `{outcome}` slots. ~9 entries; may be Gemini-generated
  dev-time (like skins) or hand-authored. (Generation tooling, if used, is a plan-level concern, not part
  of this spec's runtime.)

## Spending CS (sinks)

- **Alternate theme packs:** the 6 non-intake skins are unlockable for a flat cost (default **300 CS**
  each). The intake-assigned skin is always free and active by default. Unlocking sets an entry in
  `wallet.unlocks`; switching the active skin is a separate UI affordance that only offers unlocked skins.
- Premium narration voices: **deferred** (no per-voice content exists; not invented now).
- `vault.tsx` on the dashboard lists locked/unlocked skins with cost and an unlock button (disabled when
  `balance < cost`).

> Note: client-side CS is editable by a determined user. Acceptable — this is motivational gamification for
> a self-paced course, not a paid economy; leaderboards (which would require authority) are out of scope.

## UI surfaces

- **`shard-balance.tsx`** — `💎 {balance}` in the nav (authed) and/or dashboard header.
- **`mode-selector.tsx`** — 3 cards (label, multiplier, one-line description of help level + challenge
  framing) shown at the top of a unit before the learner proceeds; updates `setMode(unitKey, mode)`.
- **`cycle-complete.tsx`** — on `done`: themed line `NODE CLEARED · +{cs} CS · {modeLabel}` using the
  skin accent; non-blocking, sits with the existing outro/next-unit actions.
- **`vault.tsx`** — dashboard spend surface for alternate skins.

## Testing

Pure logic (vitest, no DOM/network):
- `computeUnitCS`: returns 70 / 105 / 175 for commander / copilot / archmage; respects `PHASE_BASE` sum.
- `wallet` pure helpers: `awardUnit` adds CS once and is idempotent for a repeated unit key; `spend`
  decrements and records the unlock, and refuses when `balance < cost`.
- `getAppliedChallenge`: slot-fills `{niche}`/`{outcome}`; F3-empty falls back to niche-generic; both-empty
  falls back to task framing; unknown module → null.
- `modes`: each mode has a multiplier, `hintVisible`, and a `challengeTier`; archmage hides the hint.

## Out of scope (YAGNI)

- Leaderboards and any social/ranking surface (requires server authority).
- Companion-agent evolution / pets.
- Server/D1 persistence of the wallet (client localStorage only).
- Premium narration voices as authored content.
- A full independent 3×3 matrix (we ship the 3-point diagonal; off-diagonal cells are low-value).
- Per-phase partial CS credit (award is whole-unit on completion).

## Program linkage

Replaces the **SP3 — XP / Leveling** row in the program tracker
(`docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`). Depends on SP1 (intake data: niche, F3),
SP2a (skins + `SKINS_META`), and SP2d (themed unit framing / mentor hint it gates). Sibling slices SP2b
(daily quests) and SP2c (Niche Dungeons) remain independent and unaffected.
