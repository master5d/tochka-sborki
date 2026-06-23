# "You are here" Progress Locator — Design

**Ticket:** `fb_669070c676be` (locator on World Map / learning roadmap).

**Date:** 2026-06-22

## Goal

Make the learner's current position on the World Map unmistakable — an explicit
"Вы тут / You are here" star marker on the current module node plus a text caption
below the map — replacing the current subtle-pulse-only affordance.

## Honest-triage note (verified)

- `lib/rpg/quest-log.ts buildQuestLog` already computes the current module:
  `currentIdx = statuses.findIndex(s => s !== 'completed')` → sets `status:'current'`
  on exactly one `ZoneVM`. `ZoneVM` carries `slug, order (0-based), zoneName
  (localized), moduleTitle, status, isNiche, href`.
- `components/rpg/world-map.tsx` already renders the `current` node with a pulse
  (`.wm-cur` keyframes, `prefers-reduced-motion` respected) + a stronger stroke. There
  is **no explicit labeled locator** and the component does **not** receive `locale`.
- `app/character/profile-client.tsx` is the only consumer: `<WorldMap zones={vm.zones}
  accent glyph nicheDungeonCleared />`. It already has `locale` in scope.
- `/roadmap` is a static MDX page, not an interactive map — out of scope.
- All client-side (localStorage progress). No server, data, or migration changes.

The "current position" already exists; this ticket is a focused presentation
enhancement, not new tracking.

## Decisions locked during brainstorming

1. **Form = star marker on the current node + text caption below the map** (the Smart
   "Карта обучения / Вы тут" pattern). The on-map ✦ gives visual locate; the caption is
   real DOM text (screen-reader accessible).
2. **Bilingual** — `WorldMap` gains a `locale: 'ru' | 'en'` prop; all locator strings
   come from the pure `buildLocator(zones, locale)` helper.
3. **Finished state** (all modules completed → no `current` zone): no star marker;
   caption becomes a finish line (`🏁 Курс пройден` / `🏁 Course complete`).
4. **No collision with the niche crown** (👑 renders at `cy - 7` when `isNiche &&
   nicheDungeonCleared`): the ✦ renders higher at `cy - 9`, stacking cleanly above it.

## Components

### `lib/rpg/locator.ts` (pure, the only logic)

```ts
import type { ZoneVM } from './types'

export interface LocatorVM {
  finished: boolean
  hereIndex: number | null   // 1-based position of the current module; null when finished
  total: number
  zoneName: string | null    // localized name of the current zone; null when finished
  caption: string            // ready-to-render line shown under the map
}

export function buildLocator(zones: ZoneVM[], locale: 'ru' | 'en'): LocatorVM
```

Logic:
- `total = zones.length`.
- `current = zones.find(z => z.status === 'current')`.
- If `current`: `finished = false`, `hereIndex = current.order + 1`,
  `zoneName = current.zoneName`,
  caption = `📍 Вы тут: ${zoneName} · модуль ${hereIndex} из ${total}` (ru) /
  `📍 You are here: ${zoneName} · module ${hereIndex} of ${total}` (en).
- Else (no current zone — every module completed): `finished = true`,
  `hereIndex = null`, `zoneName = null`,
  caption = `🏁 Курс пройден` (ru) / `🏁 Course complete` (en).

### `components/rpg/world-map.tsx` (modified)

- New prop: `locale: 'ru' | 'en'`.
- Compute `const loc = buildLocator(zones, locale)` once.
- For the `current` node (when `!loc.finished`), render a `✦` star marker at
  `(p.x, p.y - 9)` (above the niche 👑 at `p.y - 7`), inside the existing `.wm-cur`
  pulsing group, `aria-hidden="true"`.
- Below the `<svg>`, render the caption as real text:
  `<p>` styled with the existing CSS vars (e.g. `var(--text-secondary)`, mono font),
  centered, `loc.caption`.
- Enrich the SVG `aria-label`: `World map` → ru `Карта обучения — Вы тут: ${zoneName}`
  / en `Learning map — you are here: ${zoneName}` (or the finish text when finished).
- All other rendering (nodes, snakePath, pulse, crown, click-to-scroll) unchanged.

### `app/character/profile-client.tsx` (one-line change)

Pass `locale` to the map: `<WorldMap zones={vm.zones} accent={accent} glyph={glyph}
nicheDungeonCleared={nicheDungeonCleared} locale={locale} />`.

## Data flow

```
profile-client: buildQuestLog(...) → vm.zones (one has status:'current')
  → <WorldMap zones locale .../>
      → buildLocator(zones, locale) → LocatorVM
        → ✦ marker on current node (skipped if finished)
        → caption <p> under the svg
```

## Edge cases

- **All completed** → `finished:true` → no ✦, finish caption. (Reachable: a learner
  who completed every module.)
- **Current node is also the niche node, dungeon cleared** → both ✦ (`cy-9`) and 👑
  (`cy-7`) render, stacked, no overlap.
- **Empty zones** (defensive) → `total:0`, no current → treated as finished; caption is
  the finish line. Not expected in practice (a profile always has modules), but the
  helper must not throw.

## Testing (vitest env=node — pure helper only)

`lib/rpg/locator.test.ts`:
- current at order 5 of 9 zones (ru) → `finished:false`, `hereIndex:6`, `total:9`,
  `zoneName` matches, caption contains `модуль 6 из 9` and the zone name.
- en → caption contains `module 6 of 9` and `You are here`.
- first module (order 0) → `hereIndex:1`, caption contains `модуль 1 из 9`.
- finished (no zone has status `current`) → `finished:true`, `hereIndex:null`,
  `zoneName:null`, caption contains `Курс пройден` (ru) / `Course complete` (en).

The SVG marker/caption rendering is not unit-tested (consistent with the repo — only
`map-layout.test.ts` covers geometry); the `profile-client` wiring is verified by a
green static build (`npm run build`).

## Files

| File | Responsibility |
|---|---|
| `lib/rpg/locator.ts` | `buildLocator` (current-position → LocatorVM + bilingual caption) |
| `lib/rpg/locator.test.ts` | helper tests |
| `components/rpg/world-map.tsx` | `+ locale` prop, ✦ marker on current node, caption, aria |
| `app/character/profile-client.tsx` | pass `locale` to `<WorldMap>` |

No server, data, migration, or new dependency. ~3 TDD tasks.

## Out of scope

- A locator on the static MDX `/roadmap` page (it has no interactive map).
- Reworking the snake-path geometry or zone layout.
- Per-unit (sub-module) positioning — the locator is module-granularity.
