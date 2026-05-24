# RPG Roadmap Integration — Program Tracker

**Status:** Active · **Started:** 2026-05-19 · **Owner:** Alexander Mamaev (master5d)

This is the **program-level tracker** for integrating the AJTBD × Cognitive Load × Cultural
Scaffolding personalization system into Точка Сборки (`ai.mamaev.coach`). It is NOT a design spec —
it tracks decomposition, locked decisions, and where we are. Each sub-project gets its own
`spec → plan → implementation` cycle and its own design doc.

## Source documents

- `AJTBD × Cognitive Load Questionnaire — RPG Roadmap Design System for AI Course Learners.docx`
  — 50-question instrument (Modules A–F), 6 RPG attributes, 6 classes, RPG roadmap, 3 impl tiers.
- `ADDENDUM — Module G Cultural Scaffolding Layer.docx` — adds 12 questions (G1–G12),
  bringing total to **62 questions / 7 modules**; introduces **7 World Skins**, ты/вы register,
  aspirational identity (G11), language preference (G12), Telegram-first delivery emphasis.
- Both stored in `C:\Users\sasha\Downloads\` (not in repo).

## Locked decisions (program level)

| # | Decision | Value |
|---|----------|-------|
| D1 | Architecture | **Native** in platform (Next.js + CF Worker + D1) — no external SaaS (no Typeform/Make/Notion) |
| D2 | Scope shape | Decomposed into 4 sub-projects + 1 cross-cutting World Skin layer |
| D3 | First sub-project | **SP1 — Intake → Character Sheet**, full 62-question / 7-module instrument |
| D4 | World Skin in SP1 | Skin is only *assigned + stored + reflected in Character Sheet*; full multi-skin rendering is SP2 |
| D5 | Flow placement | Questionnaire at **`/quest-intake`**, shown after first login; **hard gate** — course content locked until completed (OS-onboarding reconciliation TBD in SP1 spec) |
| D6 | Generation engine | Deterministic scoring/class/skin-by-G9 in code; generative parts (G3 film classification, Character Sheet prose) via **Google Gemini API** (user's existing Google AI Studio Pro subscription), called from CF Worker with `GEMINI_API_KEY` secret |
| D7 | Questionnaire UX | **Wizard, one question at a time** (Typeform-style), progress bar, resumable mid-way; reuses spirit of existing `UnitWizard` |
| D8 | Character Sheet output | **In-app page `/character`** (shown right after questionnaire + accessible from nav); Telegram/email delivery deferred to a later sub-project |

## Decomposition

| Sub-project | Scope | Depends on | Status |
|-------------|-------|-----------|--------|
| **SP1 — Intake → Character Sheet** | 62q/7-module questionnaire (A–G), scoring → 6 attributes (INT/WIS/CON/DEX/CHA/STR), class assignment (6 + Wanderer), World Skin assignment (G3 inference + G9 override), register/language, G11 → backstory + legendary title. Output: Character Sheet artifact. | — | ✅ **Shipped 2026-05-20** (merged to main, deployed) → [SP1 design](./2026-05-19-rpg-sp1-intake-character-sheet-design.md) · [plan](../plans/2026-05-19-rpg-sp1-intake-character-sheet.md) |
| **SP2 — RPG Roadmap** | Quest Log, zones (mapped to modules 00–08), class-based module reordering, daily quests from COG budget, Niche Dungeons. Rendered through World Skin. | SP1 | 🟡 In progress — sliced. **SP2a** (Quest Log + World Map) ✅ **shipped 2026-05-20** (all 7 themed skin packs generated + live; **SP2d** unit framing packs generated + merged 2026-05-24) → [SP2a design](./2026-05-20-rpg-sp2a-quest-log-design.md) · [plan](../plans/2026-05-20-rpg-sp2a-quest-log.md). **SP2b** (Daily Quests) ✅ **shipped 2026-05-24** → [SP2b design](./2026-05-24-daily-quests-design.md) · [plan](../plans/2026-05-24-daily-quests.md). **SP2c** (Niche Dungeons) ✅ **shipped 2026-05-24** → [SP2c design](./2026-05-24-niche-dungeons-design.md) · [plan](../plans/2026-05-24-niche-dungeons.md). ✅ **SP2 COMPLETE.** |
| **SP3 — Cognitive Shards Economy** | Single currency **Cognitive Shards (CS)** replaces XP — score + spendable resource; per-phase base weighted to Reflection+Concept; 3 diagonal modes per unit (Commander 1.0x / Co-Pilot 1.5x / Archmage 2.5x, less help = higher multiplier, hint gated by mode); intake-personalized applied challenge at Practice; client-side localStorage wallet; sinks = alternate theme packs (300 CS, intake skin free). | SP1, SP2, SP2d | ✅ **Shipped 2026-05-23** → [design](./2026-05-22-cognitive-shards-economy-design.md) · [plan](../plans/2026-05-22-cognitive-shards-economy.md) |
| **SP4 — Burnout / Calibration / Re-engagement** | Anxiety interventions, mandatory rest days, post-Boss-Battle calibration, G11-anchored re-engagement. | SP1, SP2, SP3 | ⚪ Not started |
| **World Skin engine** (cross-cutting) | 7 skins as content data (names, tone, NPC archetypes, boss names, agent analogies): Slavic Myth, Dark Fantasy, Cyber Noir, Space Opera, Anime Quest, Soviet Heroic, Mystic Arcane + Wanderer fallback. Read by SP2–SP4. | grows with SP2+ | ⚪ Not started |
| **Content Demand Radar** (cross-cutting) | Intake free-text (F3, F2-other) → Gemini classify vs 9-module catalog → gaps become Gemini-drafted briefs in D1 → owner-gated `/admin/content-demand` (Quest Forge). Closes SP1 intake loop back into course evolution; brief API ready for future boss-agent-as-architect. | SP1 | ✅ **Shipped 2026-05-21** → [design](./2026-05-21-content-demand-radar-design.md) · [plan](../plans/2026-05-21-content-demand-radar.md) |

## Existing platform context (integration surface)

- **D1 schema:** `users` (id, email, created_at, language, source, telegram_handle), `magic_links`,
  `progress` (user_id, lesson_slug, viewed_at, completed_at). Migrations in `workers/migrations/`.
- **Auth:** magic-link via Resend; `/api/auth/*` on CF Worker.
- **Onboarding:** `/onboarding` (OS selection) + `03-stack-selection` module — see related specs
  `2026-05-15-onboarding-wizard-design.md`, `2026-05-15-cognitive-units-design.md`.
- **Content:** 9 modules `web/content/{ru,en}/00..08`; bilingual via `lib/dictionaries.ts`.
- **Progress:** `progress-provider`, `unit-progress`, 4-phase `UnitWizard`.

## Current position

> **2026-05-19** — Program kickoff; D1–D8 locked. SP1 spec + plan approved.
>
> **2026-05-20** — **SP1 implemented on branch `rpg-sp1-intake`** via subagent-driven execution.
> Tasks 1–15 of 16 done. Build green (119 pages); full web suite 41/41 green (fixed the 4 stale
> `lib/content.test.ts` slugs as part of this pass); workers gemini 3/3.
> **Local smoke (A):** `/quest-intake` + `/en/quest-intake` render correctly via dev server (wizard,
> 63-step counter, RU+EN, graceful API-404). **Final code review (B):** verdict SHIP-WITH-FIXES, no
> criticals; applied fixes — wizard persists on step-change + clamps step; `classifyFilmSkin` uses
> split keys; character sheet null-score guard.
> **SP1 SHIPPED 2026-05-20.** `GEMINI_API_KEY` set on prod Worker (via wrangler masked prompt);
> `intake_profiles` table created on remote D1 via Cloudflare dashboard console (local API token
> lacks D1 perms — code 7403/10000); merged `rpg-sp1-intake` → `main` (`--no-ff`, merge `f58b395`)
> and pushed. main build green (117 pages), 41/41 tests. CI deploying web + workers.
> **Branch `rpg-sp1-intake` still exists** (not deleted). **Next program step: SP2 — RPG Roadmap.**
>
> Post-deploy TODO: smoke the live flow (login → intake → /character → gated lessons) once CI finishes;
> the hard gate is now live for all users.
>
> **2026-05-20 (later)** — Started **SP2**, sliced it. **SP2a = Quest Log + World Map** brainstormed
> (replaces /dashboard; reorder+soft access; skin content via dev-time Gemini → static JSON packs;
> winding SVG map). Spec written: `2026-05-20-rpg-sp2a-quest-log-design.md`. Validated via visual
> companion (quest feed + winding-path zone map, Slavic-Myth example).
>
> **SP2a SHIPPED 2026-05-20** via subagent-driven execution (11 tasks, ~12 commits, 61/61 web tests,
> build green). Final opus review: SHIP-WITH-FIXES → fixes applied (localized zoneName fallback,
> progress `loaded` gate to stop X/9 flicker, fill-branch collapse). Merged `rpg-sp2a-quest-log` → main
> (`6682f49`) + pushed; CI deploying. **`/dashboard` is now the Quest Log for all users.**
> **Pending (T10): themed skin packs** — until generated, ALL skins use the neutral `wanderer.json`
> fallback (functional, generic names). To generate: run `node scripts/gen-skins.mjs` with
> `GEMINI_API_KEY` in local env (user's key), controller reviews + commits the 7 JSON packs.
> Branch `rpg-sp2a-quest-log` retained. Post-deploy: authed e2e (login → /dashboard quest log renders).
>
> **2026-05-20 (final) — SP2a COMPLETE.** All 7 themed skin packs generated via `gen-skins.mjs`
> (user's Gemini key), controller-reviewed (Cyrillic intact, distinct per-world tone, technical terms
> preserved), structural test 9/9, committed + deployed (CI success). `/dashboard` now renders the
> Quest Log with full World-Skin theming per learner. **SP2a fully shipped. Next: SP2b (daily quests
> from cog budget) or SP2c (Niche Dungeons).**
>
> **2026-05-21 — SP2d Themed Unit Framing SHIPPED (code).** Extends the World Skin engine: `SkinPack`
> gains optional `units` (`<module>/<unit>` → intro/mentorHint/outro), `SkinMeta` gains a named `mentor`
> persona. `UnitWizard` resolves the learner's skin and renders themed intro (Activation), mentor hint
> (Practice), and outro (done) around the neutral 4-phase core; graceful no-op when framing is absent.
> Pure `getUnitFraming` + coverage guard tested (web 74/74). `gen-skins.mjs --units` generates per-module
> framing. Final review SHIP. **DONE 2026-05-24:** ran `gen-skins.mjs --units` (controller, user's Gemini
> key) → all 7 themed packs populated with 38 unit keys each (intro/mentorHint/outro, RU+EN),
> coverage test 9/9, merged via PR #2. Themed framing now live for every learner.
>
> **2026-05-21 — Content Demand Radar SHIPPED** (cross-cutting, not an SP slice). Brainstorm → spec →
> plan → subagent-driven execution (11 tasks, haiku/sonnet implementers + final SHIP review). Fire-and-
> forget tail to `/api/intake/submit` via `ctx.waitUntil`: extracts F3/F2-other → Gemini flash classifies
> vs 9-module catalog (covered/gap/not_feasible + value_tier) → D1 `content_demand_signals`; high-value or
> 5+/90d gaps → Gemini pro drafts a brief in `content_demand_briefs` → owner-gated `/admin/content-demand`
> (Quest Forge) with accept/reject. Workers 53/53 green, tsc/web build clean. Merged `rpg-content-demand-radar`
> → main (`097f382`), CI success (45s). **OWNER_EMAIL set via wrangler.toml [vars] (mamaev.sasha@gmail.com).**
> **DONE 2026-05-24: migration 0004 applied to remote D1.** Root cause of the 7403 was a missing D1
> permission on the token (DB is in the SOVERN account all along, not a separate one); applied the
> idempotent `0004` directly via `wrangler d1 execute --remote --file` (not `migrations apply`, which would
> re-run non-idempotent `0002` ALTER TABLEs). Tables + indexes verified; admin endpoint returns 401 (gated),
> no longer 500. Pre-existing tsc error in auth.ts (`user!.id` null-guard) fixed in passing. Branch retained.

> **2026-05-23/24 — SP3 Cognitive Shards Economy SHIPPED.** Brainstorm → spec → plan → subagent-driven
> execution (14 tasks in batched implementer + two-stage review cycles; per-batch spec + quality review,
> final holistic review READY TO MERGE). Replaces the placeholder XP slice: single client-side CS currency
> (localStorage `cs_wallet`, mirrors `unit-progress`), phase-weighted award (70 base, 50 in
> Reflection+Concept → 70/105/175 by mode), 3 diagonal modes (Commander/Co-Pilot/Archmage) gating the SP2d
> mentor hint, intake-personalized applied challenge at Practice (9 module templates, F2 niche + F3 outcome
> slot-fill with fallbacks), Vault sink (alt skins 300 CS, intake skin free). All client-side, no
> server/D1. 95/95 web tests, tsc + next build clean. Merged PR #1 → main (`def20cb`), CI deploying.
> **On the same pass:** generated SP2d unit-framing packs (PR #2) and applied D1 migration 0004 (see above).
> Deprecated the 4 merged feature branches. **Next: SP2b (daily quests), SP2c (Niche Dungeons), or SP4.**
>
> **2026-05-24 — SP2b Daily Quests SHIPPED.** Brainstorm → spec → plan → subagent-driven execution
> (10 tasks, batched implementer + per-batch spec/quality review + final review). First consumer of intake
> `cogTier`. A client-side "Today" panel on the dashboard offers 1–3 quests scaled to cogTier (1/2/3/3):
> always 1 **advance** (next incomplete unit, derived from `unit_progress`, links into the wizard; its CS is
> the unit's own SP3 award) + **practice** (reuses SP3 `getAppliedChallenge`, +10 CS, self-checked) +
> **retrieval** (per-module recall bank, mentor-voiced, +10 CS) per tier, with a +15 all-done bonus.
> Deterministic (FNV-1a seed + mulberry32, stable within a local date, clean daily slate), themed via the
> skin accent + mentor. Reuses the SP3 wallet via a new flat `applyCredit`/`useShards.credit`. New
> `web/lib/quests/*` (types/seed/retrieval-bank/build-daily/daily-store/use-daily-quests) + `DailyPanel`,
> wired into RU+EN dashboards. Added `web/vitest.config.ts` (`@` alias — first test importing `@/` values).
> 123/123 web tests, tsc + next build clean. No streaks/server/Gemini (those → SP4). **Next: SP2c Niche
> Dungeons, or SP4.**
>
> **2026-05-24 — SP2c Niche Dungeons SHIPPED → SP2 COMPLETE.** Brainstorm → spec → plan →
> subagent-driven execution (12 tasks, batched implementer + per-batch spec/quality review + final
> review). An opt-in `/dungeon` arc (RU+EN), gated behind the learner's niche-mapped module
> (`NICHE_MODULE`) completion: an authored intro, 3 escalating-tier stages (`task→process→outcome` on the
> niche module, reusing SP3 `getAppliedChallenge`, +15 CS each), and an authored boss synthesis (+50 CS),
> per an 8-niche flavor bank (`dungeonName`/`bossName`/`intro`/`bossChallenge`). Clearing the boss flips the
> niche zone on the World Map to a 👑 marker. Deterministic, client-side (`niche_dungeon` localStorage),
> CS via the SP2b `applyCredit`; extracted a shared `fillNicheSlots` from applied-challenge (DRY). New
> `web/lib/dungeon/*` + `DungeonView`/`DungeonCard` + `/dungeon` route + dashboard card + WorldMap flip.
> 139/139 web tests, tsc + next build clean (121 pages). No XP/titles/leaderboards (out of scope). **SP2 (a/b/c/d)
> fully shipped. Next program slice: SP4 — Burnout / Calibration / Re-engagement.**
>
## How to resume if lost

1. Read this tracker top-to-bottom.
2. Check the **Current position** entry for the active sub-project + phase.
3. Open the active sub-project's design spec (if it exists) in `docs/superpowers/specs/`.
4. Continue from there. Update **Current position** + sub-project **Status** as work progresses.
