# lib/course — course-data layer

Course-**specific** data the LMS engine reads. The engine (components, hooks, the rest of `lib/`)
imports from here; a future course swaps these files instead of editing the engine. First step
toward the multi-course platform (see `LMS/_template/`, `docs/curriculum-backlog.md`).

## Here now (Phase 1)
- `showcase.ts` — possibilities gallery data (`getShowcase`, `videoEmbedUrl`).
- `dungeon-flavor.ts` — niche dungeon flavor bank (`FLAVOR_BANK`).
- `niche-map.ts` — niche → module / slot mapping (`NICHE_MODULE`, `NICHE_SLOT`).

## Convention
- Course data lives here; engine logic stays in `lib/`. Import data via `@/lib/course/*`.
- These modules are **web-only** (not consumed by `workers/`), so the `@/` alias is safe.
  Anything `workers/` cross-imports (skins-meta, intake) must use **relative** paths (Gotcha 2)
  and is handled separately in Phase 2 (`fb_f2c7279911ca`).

## Coming (Phase 2 — `fb_f2c7279911ca`)
- `rpg/skins-meta` (split `SKINS_META` data from decoder/companion/mentor helpers; workers cross-import).
- `intake/questions.v2` + scoring (workers cross-import). Higher risk — kept out of Phase 1.
