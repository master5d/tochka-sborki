# Themed Unit Framing (SP2d) — Design Spec

**Status:** Approved (design) · **Date:** 2026-05-21 · **Owner:** Alexander Mamaev (master5d)

A light theming layer that wraps the neutral lesson core with World-Skin-voiced **intro/outro** and a
single **mentor hint** per unit. The 4-phase lesson content itself is untouched and identical across all
7 skins. Extends the cross-cutting **World Skin engine** (SP2-series); the slice name is **SP2d**.

## Motivation

After the intake questionnaire, the World Skin currently surfaces only in the Character Sheet
(`/character`) and the Quest Log + World Map (`/dashboard`) — navigation and identity are themed, but the
lessons are neutral for everyone. Immersion drops sharply when a learner clicks a themed quest and lands
on an unthemed unit. This slice restores continuity by bracketing each unit with themed framing while
keeping the expensive lesson core single-source. Full content theming (×7) was rejected as a YAGNI/cost trap.

## Locked decisions (from brainstorming, 2026-05-21)

| # | Decision | Value |
|---|----------|-------|
| F1 | Granularity | **Per-unit** intro + outro (all 38 units), not per-module |
| F2 | Mentor hint | **One contextual hint per unit**, anchored to the unit topic, shown on the Practice phase |
| F3 | Core | Lesson core (4-phase MDX) stays **neutral**; only framing is themed |
| F4 | Storage | Static JSON skin packs (existing pattern), zero runtime latency |
| F5 | Mentor identity | Each skin gets a named mentor persona (name + glyph) in `SkinMeta` |
| F6 | Generation | Dev-time via extended `gen-skins.mjs`, **per-module batches** (9×7=63 calls), owner's Gemini key |

## Existing surface (integration points)

- **`web/components/unit-wizard.tsx`** — client component, already receives `moduleSlug` + `unitSlug` +
  `locale`; renders a 4-phase flow (`currentStep` 0–3: Activation, Reflection, Concept, Practice) with a
  `done` state after Practice. This is the host for the framing.
- **`web/components/pages/unit-page.tsx`** — server component; passes the props above and the MDX `children`.
- **`web/lib/rpg/types.ts`** — `SkinPack` (`zoneNames`, `questTitles`), `SkinMeta`, `Bi = {ru,en}`.
- **`web/lib/rpg/skins-meta.ts`** — `SKINS_META` (accent, glyph, displayName per skin).
- **`web/lib/rpg/skins/<skin>.json`** — 7 generated packs + `wanderer.json` (hand-authored fallback).
- **Skin-resolution pattern (from `dashboard-client.tsx`):** fetch `/api/intake/me` → read `world_skin` →
  `await import('@/lib/rpg/skins/${world_skin}.json')` with `wanderer.json` static fallback.
- **Unit grounding:** each `web/content/<locale>/<module>/<unit>.mdx` has frontmatter `title` + `duration`.
- **38 units total** across 9 modules (3–5 each).

## Data model

Extend `SkinPack` with a `units` map keyed by `"<moduleSlug>/<unitSlug>"`:

```ts
// web/lib/rpg/types.ts
export interface UnitFraming {
  intro: Bi        // 1–2 sentences, shown at Activation
  mentorHint: Bi   // one contextual line, shown at Practice
  outro: Bi        // 1–2 sentences, shown in the done state
}

export interface SkinPack {
  skin: WorldSkin
  zoneNames: Record<string, Bi>
  questTitles: Record<string, Bi>
  units: Record<string, UnitFraming>   // NEW — 38 keys "<module>/<unit>"
}

export interface SkinMeta {
  skin: WorldSkin
  accent: string
  glyph: string
  displayName: Bi
  mentor: { name: Bi; glyph: string }  // NEW — named persona, e.g. {name:{ru:'Домовой',en:'House-Spirit'}, glyph:'🪆'}
}
```

`Bi` is the existing `{ ru: string; en: string }`.

## Rendering flow

`UnitWizard` (already a client component) resolves the framing itself:

1. On mount, fetch `/api/intake/me` (credentials included) → read `world_skin`. (Reuses the dashboard pattern.)
2. `await import('@/lib/rpg/skins/${world_skin}.json')`; on any failure fall back to the statically
   imported `wanderer.json`.
3. Look up `framing = pack.units['${moduleSlug}/${unitSlug}']` and `mentor = SKINS_META[world_skin].mentor`.
4. Render around the neutral `children`:
   - **intro** — a themed card above the phase progress bar, rendered **only when `currentStep === 0`**.
   - **mentorHint** — a persona box `{mentor.glyph} {mentor.name[locale]}: «{framing.mentorHint[locale]}»`,
     rendered **only when `currentStep === 3` (Practice)**.
   - **outro** — a themed card in the `done` state, above the "next unit" action.

Framing is purely additive markup; the existing 4-step navigation, progress bar, and completion logic are
unchanged.

### Pure helper (testable)

```ts
// web/lib/rpg/unit-framing.ts
import type { SkinPack, UnitFraming, Locale } from './types'

export function getUnitFraming(
  pack: SkinPack | null,
  moduleSlug: string,
  unitSlug: string,
): UnitFraming | null {
  return pack?.units?.[`${moduleSlug}/${unitSlug}`] ?? null
}
```

The component renders nothing for a section whose text is missing — a unit with no framing entry shows the
plain neutral lesson (graceful degradation; no errors).

## Fallback behaviour

- No profile / not logged in / fetch fails → `wanderer.json` (which has **no** `units` entries) → no framing.
- Skin pack present but missing this unit's key → `getUnitFraming` returns `null` → no framing.
- `SKINS_META[skin].mentor` missing → mentor box not rendered (intro/outro still render if present).

The neutral lesson is always fully functional regardless of theming state.

## Generation (extended `scripts/gen-skins.mjs`)

The script gains an additive pass that fills `units` without overwriting `zoneNames`/`questTitles`:

- **Grounding:** read each unit's `title` (and `duration`) from `web/content/ru/<module>/<unit>.mdx`
  frontmatter; read module title from `_meta.json` (already done).
- **Batching:** one Gemini call **per module per skin** (9 × 7 = 63 calls). Each call passes that module's
  unit list (slug + real title) and the skin tone, and returns framing for that module's 3–5 units only —
  small, reliable responses. Russian primary; keep technical terms (API, prompt, agent, MCP) untranslated;
  intro/outro ≤ 2 sentences, mentorHint ≤ 1 sentence.
- **Merge:** load the existing `<skin>.json`, set `pack.units[...]` for each unit, re-validate that all 38
  keys are covered, write back.
- **Mentor personas:** authored by hand in `skins-meta.ts` (7 entries) — not generated (identity, not bulk
  prose). The slice ships these as a curated table.

Generation runs on the owner's Gemini key (dev tokens). The controller spot-reviews tone, Cyrillic
integrity, and technical-term preservation before committing the packs (same gate as SP2a skin packs).

## Testing

- **`getUnitFraming`** (vitest, pure): returns the entry for a present key; `null` for a missing key;
  `null` when `pack` is `null`.
- **Pack coverage** (structural test): every generated `<skin>.json` has a `units` entry with non-empty
  `intro.ru`, `mentorHint.ru`, `outro.ru` for all 38 `"<module>/<unit>"` keys.
- **`SKINS_META`** test: every non-wanderer skin has a `mentor.name.ru` and `mentor.glyph`.
- Gemini generation in the script is dev-time only — not unit-tested at runtime (mirrors existing
  `gen-skins.mjs`).

## Out of scope (YAGNI)

- No theming of the lesson core (phase text, examples, prompts, screenshots) — explicitly rejected.
- No per-phase mentor hints (rejected: ×4 content explosion).
- No runtime Gemini calls — all framing is pre-generated static JSON.
- No `wanderer` framing — wanderer stays neutral by design.
- No editing UI for framing text — packs are regenerated, not hand-edited in-app.

## Program linkage

Extends the **World Skin engine** cross-cutting layer under the RPG roadmap program
(`docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`). Depends on SP1 (skin assignment) and SP2a
(skin packs + `SKINS_META` + skin-resolution pattern). Sibling slices: SP2b (daily quests), SP2c (Niche
Dungeons).
