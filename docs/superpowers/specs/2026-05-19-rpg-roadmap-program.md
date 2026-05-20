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

## Decomposition

| Sub-project | Scope | Depends on | Status |
|-------------|-------|-----------|--------|
| **SP1 — Intake → Character Sheet** | 62q/7-module questionnaire (A–G), scoring → 6 attributes (INT/WIS/CON/DEX/CHA/STR), class assignment (6 + Wanderer), World Skin assignment (G3 inference + G9 override), register/language, G11 → backstory + legendary title. Output: Character Sheet artifact. | — | 🟡 Brainstorming |
| **SP2 — RPG Roadmap** | Quest Log, zones (mapped to modules 00–08), class-based module reordering, daily quests from COG budget, Niche Dungeons. Rendered through World Skin. | SP1 | ⚪ Not started |
| **SP3 — XP / Leveling** | XP economy, 5 levels, unlocks, reward ceremony design (G10). | SP1, SP2 | ⚪ Not started |
| **SP4 — Burnout / Calibration / Re-engagement** | Anxiety interventions, mandatory rest days, post-Boss-Battle calibration, G11-anchored re-engagement. | SP1, SP2, SP3 | ⚪ Not started |
| **World Skin engine** (cross-cutting) | 7 skins as content data (names, tone, NPC archetypes, boss names, agent analogies): Slavic Myth, Dark Fantasy, Cyber Noir, Space Opera, Anime Quest, Soviet Heroic, Mystic Arcane + Wanderer fallback. Read by SP2–SP4. | grows with SP2+ | ⚪ Not started |

## Existing platform context (integration surface)

- **D1 schema:** `users` (id, email, created_at, language, source, telegram_handle), `magic_links`,
  `progress` (user_id, lesson_slug, viewed_at, completed_at). Migrations in `workers/migrations/`.
- **Auth:** magic-link via Resend; `/api/auth/*` on CF Worker.
- **Onboarding:** `/onboarding` (OS selection) + `03-stack-selection` module — see related specs
  `2026-05-15-onboarding-wizard-design.md`, `2026-05-15-cognitive-units-design.md`.
- **Content:** 9 modules `web/content/{ru,en}/00..08`; bilingual via `lib/dictionaries.ts`.
- **Progress:** `progress-provider`, `unit-progress`, 4-phase `UnitWizard`.

## Current position

> **2026-05-19** — Program kickoff. D1–D4 locked. Brainstorming **SP1**: clarifying questions in
> progress (flow placement, scoring approach, data model, Character Sheet output, resumability,
> gating). Visual companion accepted (will be used for Character Sheet / World Skin mockups).
> Next deliverable: SP1 design spec at `docs/superpowers/specs/2026-05-19-rpg-sp1-intake-character-sheet-design.md`.

## How to resume if lost

1. Read this tracker top-to-bottom.
2. Check the **Current position** entry for the active sub-project + phase.
3. Open the active sub-project's design spec (if it exists) in `docs/superpowers/specs/`.
4. Continue from there. Update **Current position** + sub-project **Status** as work progresses.
