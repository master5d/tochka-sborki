# SP2c — Niche Dungeons — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-24 · **Owner:** Alexander Mamaev (master5d)

Completes the final SP2 sub-slice. An opt-in, niche-specific **challenge arc** on a dedicated `/dungeon`
page: once the learner completes their niche-mapped module, they enter their named dungeon — an intro, 3
escalating-tier stages on their domain's core skill, and a flavored boss — rewarding Cognitive Shards and
flipping their niche zone on the World Map to a "cleared" prestige marker. Deterministic, client-side,
themed via the World Skin.

## Origin & framing

SP2a surfaced the learner's niche only as an `isNiche` badge on one quest-log zone and explicitly deferred
"Niche Dungeon quest chains" to this slice. The niche (`profile.niche`, one of 8 F2 values: `coach`,
`massage`, `astrology`, `content`, `ecommerce`, `service`, `tech`, `other`) maps via `NICHE_MODULE`
(`web/lib/rpg/niche-map.ts`) to the module "most tied to that niche's first win." SP2c turns that mapping
into a depth arc, reusing SP3's per-module applied-challenge tiers and the SP2b CS-credit machinery.

## Locked decisions (from brainstorming, 2026-05-24)

| # | Decision | Value |
|---|----------|-------|
| Q1 | Structure + content | **Hybrid**: deterministic stage sequencing over existing infra + a small authored per-niche flavor layer |
| Q2 | Stage arc | **Depth on the niche module**: 3 stages = `NICHE_MODULE[niche]` applied challenge at escalating tiers `task → process → outcome`, + a boss |
| Q3 | Flavor layer | Per-niche `{ dungeonName, bossName, intro, bossChallenge }` (all bilingual `Bi`) |
| Q4 | Gating | Unlocks when `completedModules.includes(NICHE_MODULE[niche])`; locked teaser before |
| Q5 | Rewards + marker | Stages **+15** each, boss **+50** (~95 total), one-time idempotent; clearing the boss flips the niche zone on the World Map to a "cleared" marker |
| Q6 | Surface | Dedicated **`/dungeon`** route (+ `/en/dungeon`) + a dashboard **entry card** + the World Map flip |

## Structure

- **niche** = `profile.niche`; if null or not in the flavor bank, fall back to `other`. **module** =
  `NICHE_MODULE[niche]` (fallback `04-prompt-engineering`).
- **Stages 1–3** = `getAppliedChallenge({ niche, outcome }, module, tier, locale)` for `tier` in
  `['task', 'process', 'outcome']`. Each **+15 CS**, self-checked. (`niche`/`outcome` come from the live
  profile; `getAppliedChallenge` already fills `{niche}`/`{outcome}` with fallbacks.)
- **Boss** = the per-niche authored `bossChallenge`, slot-filled `{niche}`/`{outcome}` via the **same**
  fill logic as the stages (see DRY note below), shown under `bossName`. **+50 CS**. Presented last; **no
  hard inter-stage gate** (self-paced — any step is checkable once unlocked). "Dungeon cleared" ≡ boss
  cleared.
- **Total ≈ 95 CS**, one-time. Idempotent CS keys: `dungeon:<niche>:s1|s2|s3|boss` (credited via the SP2b
  `useShards().credit`; the wallet's `applyCredit` is idempotent per key).

## DRY note — shared slot-fill

The boss challenge needs the identical `{niche}`/`{outcome}` slot-filling that `getAppliedChallenge` does
internally (niche → value or locale fallback word; outcome → value or empty). To avoid duplicating that
logic, **extract a small exported helper from `web/lib/cs/applied-challenge.ts`**:

```ts
export function fillNicheSlots(text: string, niche: string | null, outcome: string | null, locale: Locale): string
```

Refactor `getAppliedChallenge` to use it internally (behavior unchanged — covered by its existing tests),
and call it from `build-dungeon.ts` for the boss. Additive, low-risk; the existing applied-challenge tests
guard the refactor.

## Flavor bank (authored, 8 niches)

`web/lib/dungeon/flavor-bank.ts`:

```ts
export interface NicheFlavor { dungeonName: Bi; bossName: Bi; intro: Bi; bossChallenge: Bi }
export const FLAVOR_BANK: Record<string, NicheFlavor> // keyed by the 8 niche values
```

Each entry: a short bilingual dungeon name, boss name, one-line atmospheric intro, and a synthesis
`bossChallenge` (with `{niche}`/`{outcome}` slots) that asks the learner to combine the skill into a real
deliverable for their domain. Neutral-of-skin (skin theming is the accent + the page chrome); niche is the
identity axis here. `other` is a real niche value and gets its own (generic-professional) entry; it is also
the fallback when `niche` is null/unknown.

## Gating

`locked = !isModuleCompleted(module)`, where `isModuleCompleted(slug)` = module-level progress-provider
`getState(slug) === 'completed'` (the same signal SP2b uses; `ProgressProvider` is global in
`web/app/layout.tsx`, so `/dungeon` can read it). Locked state (both the dashboard card and the `/dungeon`
page) shows: "Complete **[module title]** to enter **[Dungeon Name]**." The module title comes from the
server page (passed as a prop), not refetched.

## Architecture

| File | Responsibility |
|------|----------------|
| `web/lib/dungeon/types.ts` | `StageTier`, `DungeonStage`, `DungeonBoss`, `DungeonView`, `NicheFlavor`, `DungeonInput` |
| `web/lib/dungeon/flavor-bank.ts` | the 8-niche authored `FLAVOR_BANK` (data) |
| `web/lib/dungeon/build-dungeon.ts` | pure `buildDungeon(input: DungeonInput): DungeonView` |
| `web/lib/dungeon/dungeon-store.ts` | localStorage `niche_dungeon` = `{ clearedIds: string[] }`; pure `markCleared`/`isCleared` + `readDungeon`/`writeDungeon` shell (mirrors SP2b `daily-store`, but **no date rollover** — clears are permanent) |
| `web/lib/dungeon/use-dungeon.ts` | `useDungeon(params)` hook → `{ view, isCleared, clear, bossCleared, ready }`; plus a lightweight `useNicheDungeonCleared(niche): boolean` for the World Map flip |
| `web/lib/cs/applied-challenge.ts` | (modify) extract + export `fillNicheSlots` |
| `web/components/dungeon/dungeon-view.tsx` | the `/dungeon` page body (locked teaser OR intro + 3 stages + boss, with Mark-done / ✓ states) |
| `web/components/dungeon/dungeon-card.tsx` | dashboard entry card (locked / "Enter →" / "✓ Cleared") |
| `web/app/dungeon/page.tsx` + `web/app/en/dungeon/page.tsx` | routes (server page passes `moduleTitles`; a client component fetches `/api/intake/me` like the dashboard) |
| `web/components/rpg/world-map.tsx` | (modify) add optional `nicheDungeonCleared?: boolean`; when true, render the `isNiche` zone with a "cleared" marker |
| `web/app/dashboard/dashboard-client.tsx` | (modify) render `<DungeonCard>`; pass `nicheDungeonCleared` to `<WorldMap>` |

### Types

```ts
// web/lib/dungeon/types.ts
import type { Locale, WorldSkin } from '@/lib/intake/types'
import type { Bi } from '@/lib/rpg/types'

export type StageTier = 'task' | 'process' | 'outcome'
export interface DungeonStage { id: string; tier: StageTier; body: string; cs: number }
export interface DungeonBoss { id: string; name: string; body: string; cs: number }
export interface DungeonView {
  niche: string; module: string; locked: boolean
  dungeonName: string; intro: string
  stages: DungeonStage[]; boss: DungeonBoss
}
export interface NicheFlavor { dungeonName: Bi; bossName: Bi; intro: Bi; bossChallenge: Bi }
export interface DungeonInput {
  locale: Locale; skin: WorldSkin
  niche: string | null; outcome: string | null
  isModuleCompleted: (moduleSlug: string) => boolean
}
```

`buildDungeon` resolves niche→`other` fallback, computes `module`, `locked`, the 3 stages (tiers
task/process/outcome, cs 15), and the boss (cs 50, `fillNicheSlots` on the flavor `bossChallenge`). Pure;
no storage or fetch.

### Route client flow

`/dungeon` server page: `const moduleTitles = Object.fromEntries(getAllModules(locale).map(m => [m.slug, m.title]))`,
render `<DungeonView moduleTitles={moduleTitles} locale={...} />`. The `DungeonView` client component
fetches `/api/intake/me` (redirect to quest-intake if `status !== 'completed'`, like `dashboard-client`),
derives `skin`/`niche`/`outcome`, reads module completion from `useProgress()`, and drives `useDungeon`.

## World Map flip

`dashboard-client.tsx` calls `useNicheDungeonCleared(profile.niche)` and passes the boolean as
`nicheDungeonCleared` to `<WorldMap>`. `world-map.tsx` gains the optional prop; for the zone where
`z.isNiche` is true and `nicheDungeonCleared`, it renders a distinct "cleared" marker (e.g. a check glyph /
the skin accent ring) instead of the plain niche badge. Additive — default `false` preserves current
rendering. The `DungeonCard` links to `/dungeon`; the niche zone remains the World Map's existing
scroll-to-quest affordance.

## Testing

Pure logic (vitest):
- `build-dungeon`: `locked` true when module not completed, false when completed; 3 stages with tiers
  task/process/outcome and cs 15; stage bodies slot-filled (contain niche, no `{niche}` literal); boss from
  the flavor bank with cs 50 and slots filled; unknown/null niche → `other` fallback (name + module);
  namespaced ids `dungeon:<niche>:s1|s2|s3|boss`; deterministic (same input → same view).
- `dungeon-store`: `markCleared` adds once + idempotent + immutable; `isCleared` reflects it; `readDungeon`
  defends against malformed JSON; **no** date rollover (clears persist).
- `flavor-bank`: all 8 niche keys present, each with the 4 bilingual fields.
- `fillNicheSlots` (in the cs suite): niche value / null→fallback word; outcome value / null→empty;
  existing `getAppliedChallenge` tests still pass after the refactor.

`dungeon-view.tsx` / `dungeon-card.tsx` / `world-map.tsx` changes are presentational — covered by
`tsc --noEmit` + `next build`.

## Out of scope (YAGNI)

- XP / titles / leaderboards / badges beyond the World Map "cleared" marker.
- Hard inter-stage gating (boss requiring stages first).
- Multiple dungeons per learner; breadth-across-modules arcs (we ship depth-on-one-module).
- Gemini-generated dungeon content (authored flavor bank only).
- Server/D1 persistence (client localStorage only).
- Dungeon retry/reset.
- Re-theming the boss copy per skin (niche is the identity axis; skin = accent/chrome only).

## Program linkage

Closes **SP2c — Niche Dungeons**, the final sub-slice of **SP2 — RPG Roadmap**
(`docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`) — SP2 complete after this. Depends on SP1
(intake niche/F3/skin), SP2a (`NICHE_MODULE`, quest-log `isNiche` zone, `world-map.tsx`), SP3
(applied-challenge tiers + CS wallet `applyCredit`), and SP2b (`useShards().credit`, the
build/store/hook/panel patterns this mirrors). SP4 (burnout/calibration/re-engagement) remains the next
program slice.
