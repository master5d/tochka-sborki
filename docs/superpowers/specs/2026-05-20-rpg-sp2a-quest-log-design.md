# SP2a — Quest Log + World Map (Design Spec)

**Program:** [RPG Roadmap Integration](./2026-05-19-rpg-roadmap-program.md) · **Sub-project:** SP2, slice **a**
**Status:** Design — awaiting user review · **Date:** 2026-05-20
**Builds on:** [SP1 — Intake → Character Sheet](./2026-05-19-rpg-sp1-intake-character-sheet-design.md) (shipped)

## 1. Goal

Turn the post-intake landing into a personalized **Quest Log + World Map**: the learner's 9 course
modules, reordered by their RPG class, named in the voice of their World Skin, shown as a winding
zone map (visual) above a detailed quest feed (list), with progress and a highlighted "current quest".
Module order is a **soft recommendation** — every module stays openable (SDT autonomy).

Replaces the generic `/dashboard`. No access/gating changes.

**Out of scope (later SP2 slices / sub-projects):** daily-quest decomposition from cognitive budget,
Niche Dungeon quest chains (only a niche *badge* here), XP/levels (SP3), boss-battle gating (SP3).

## 2. Architecture & data flow

No new D1. The Quest Log is pure composition of three sources:

```
/dashboard (→ Quest Log) — client component
  ├─ profile:  GET /api/intake/me  → char_class, world_skin, niche, char_level, legendary_title
  ├─ progress: progress-provider (existing) → per-module-slug state (none|viewed|completed)
  └─ content:  static repo data (web/lib/rpg/*) → skin packs, class quest-lines, niche map
       → render CharacterStrip + WorldMap + QuestFeed
```

| Concern | Where |
|---------|-------|
| Class → ordered module slugs | `web/lib/rpg/quest-lines.ts` (authored from doc's per-class main quest lines) |
| Niche → relevant module slug | `web/lib/rpg/niche-map.ts` |
| Skin content packs (zone names + quest titles, RU+EN) | `web/lib/rpg/skins/<skin>.json` (Gemini-generated, reviewed) |
| Skin meta (accent, glyph, display name) | `web/lib/rpg/skins-meta.ts` (authored) |
| Quest-log assembly (profile+content+progress → view model) | `web/lib/rpg/quest-log.ts` (pure, tested) |
| Generation script | `scripts/gen-skins.mjs` (dev-time only) |
| UI | `web/components/rpg/{character-strip,world-map,quest-feed}.tsx` + rewritten `web/app/dashboard/dashboard-client.tsx` |

The 9 modules come from existing `getAllModules(locale)` (slugs `00-…`–`08-…`, each with `module` order, `title`, `duration`, `units`).

## 3. Content pipeline (Gemini offload)

`scripts/gen-skins.mjs` (Node, run manually during dev):
- For each of the 7 skins (slavic-myth, dark-fantasy, cyber-noir, space-opera, anime-quest,
  soviet-heroic, mystic-arcane), calls Google Gemini once with: the skin's tone/sample-quest/boss/NPC
  spec (from the Module G addendum) + the list of 9 real module titles + descriptions.
- Gemini returns JSON: `{ zoneNames: {<slug>: {ru,en}}, questTitles: {<slug>: {ru,en}} }`.
- Script writes `web/lib/rpg/skins/<skin>.json`. **Controller (Claude) reviews each pack** for Cyrillic
  fidelity, tone, and that all 9 module slugs are covered RU+EN, then commits.
- Reads `GEMINI_API_KEY` from env locally (same key already on the prod Worker; for the script the user
  exports it in their shell). The `wanderer` skin pack is authored neutral (no Gemini), used as fallback.
- Runtime never calls Gemini — the site imports the committed JSON. Fast, free, deterministic.

Pack schema (`web/lib/rpg/types.ts`): `interface SkinPack { skin: WorldSkin; zoneNames: Record<string,{ru,en}>; questTitles: Record<string,{ru,en}> }`.

## 4. Class quest-lines (`quest-lines.ts`)

A `Record<CharacterClass, string[]>` mapping each class to an ordered array of the 9 module slugs,
derived from the doc's per-class main quest lines (e.g. Healer front-loads fundamentals + niche-relevant
prompt module; Artificer front-loads automation/agents). `wanderer` = default ascending module order.
Every array is a permutation of all 9 slugs (soft reorder — nothing dropped). Authored by controller;
exact arrays defined in the implementation plan.

## 5. Quest-log assembly (`quest-log.ts`, pure)

`buildQuestLog(profile, modulesBySlug, progress, locale): QuestLogVM` returns:
- `zones: ZoneVM[]` in class order, each `{ slug, order, zoneName, questTitle, status, isNiche, durationLabel, href }`
- `status`: `completed` (all units done) | `current` (first non-completed in class order) | `todo`
- exactly one `current` (the first non-completed; if all done → none, show "complete" state)
- `isNiche`: slug === niche-map[profile.niche]
- `summary`: `{ completedCount, total: 9, legendaryTitle, className, skin, level }`

Pure, deterministic, no I/O — fully unit-tested.

## 6. UI components (`web/components/rpg/`)

- **`CharacterStrip`** — skin label + class + level + legendary title + `→ /character` link + `X/9` counter. Skin accent via CSS var.
- **`WorldMap`** — **winding SVG path** (option B) through 9 zone nodes in class order: an SVG `<path>` snaking between node positions, nodes = circles/rounded-rects with zone glyph; completed filled, current pulsing (CSS animation, respects `prefers-reduced-motion`), todo muted. Click a node → smooth-scroll to that quest in the feed (`#quest-<slug>`). Responsive (wraps/scales).
- **`QuestFeed`** — ordered list; each row `id="quest-<slug>"` with status icon, skin quest title, real module subtitle, duration, niche badge; the `current` row is expanded with a `Продолжить →` / `Continue →` CTA linking to `/lessons/<slug>/` (locale-aware). All rows link to their module (soft access).
- Rewritten `dashboard-client.tsx` composes the three, fetching profile + using progress provider; RU/EN via locale. Existing `/dashboard` + `/en/dashboard` routes reused.

## 7. Logic, edge cases, testing

- **Soft order:** all modules openable; Quest Log only sorts/highlights. `IntakeGuard`/access unchanged.
- **Wanderer class** → default ascending order. **Wanderer skin** → neutral authored pack.
- **No profile** (shouldn't happen behind the gate) → redirect to `/quest-intake/` (mirror existing dashboard auth redirect).
- **Missing skin pack / missing slug entry** → fall back to the real module title (never blank).
- **Testing (Vitest):** `quest-lines` (each class is a full 9-slug permutation; wanderer = ascending);
  `buildQuestLog` (status mapping incl. all-completed, exactly-one-current, niche flag, fallback titles);
  skin-pack structural test (every committed pack covers all 9 module slugs with non-empty ru+en).

## 8. Decisions locked (this slice)

SP2a scope = Quest Log feed + World Map · reorder + soft access · replaces `/dashboard` · skin content
via dev-time Gemini → static JSON packs (reviewed) · class ordering authored from doc · winding SVG map
(option B) · no new D1.

## 9. Open items for implementation plan

- Exact `quest-lines.ts` arrays per class (6 + wanderer).
- `niche-map.ts` entries (massage, astrology, coaching, content, ecommerce, service, tech → module slug).
- `skins-meta.ts` accents/glyphs per skin.
- `gen-skins.mjs` prompt templates seeded per skin from the addendum.
- WorldMap SVG node-position math (9 nodes, winding path, responsive).
