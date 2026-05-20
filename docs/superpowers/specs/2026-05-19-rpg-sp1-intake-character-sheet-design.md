# SP1 — Intake → Character Sheet (Design Spec)

**Program:** [RPG Roadmap Integration](./2026-05-19-rpg-roadmap-program.md) · **Sub-project:** SP1
**Status:** Design — awaiting user review · **Date:** 2026-05-19

## 1. Goal

Build the foundational profiling layer of the RPG personalization system: a 62-question / 7-module
onboarding questionnaire that, on completion, deterministically scores the learner into 6 RPG
attributes, assigns a character class and World Skin, and produces an in-app **Character Sheet** —
with generative prose (legendary title, backstory, first quest, final boss) from the Google Gemini
API. Course content is hard-gated behind questionnaire completion.

Everything is native to the existing platform (Next.js export + CF Worker + D1). No external SaaS.

Out of scope (later sub-projects): full multi-skin roadmap rendering (SP2), XP/leveling (SP3),
burnout/calibration/re-engagement (SP4), Telegram/email delivery of the sheet.

## 2. Architecture & data flow

```
Login (magic-link) → verify-client checks intake profile
  └─ no completed profile → /quest-intake (wizard, 62q, HARD GATE)
        → submit → POST /api/intake/submit
              → deterministic scoring (6 attributes) + class + skin (G9>G3>Wanderer)
              → Gemini API: classify G3 film (if no G9) + generate sheet prose
              → persist to D1 (intake_profiles)
              → redirect → /character
        → course content unlocked (IntakeGuard passes)
  └─ has completed profile → normal (/lessons/...)
```

| Layer | What | Location |
|-------|------|----------|
| Questionnaire UI | Wizard page, one question at a time, progress bar, resume | `web/app/quest-intake/` (+ `/en/quest-intake/`), `web/components/intake/` |
| Questions data | 62 typed questions (RU+EN): id, module, format, options, scoring weights, `showIf` | `web/lib/intake/questions.ts` |
| Scoring engine | Pure functions: answers → attributes → class → skin → cog_tier → register/lang. No network. | `web/lib/intake/scoring.ts` (+ `scoring.test.ts`) |
| Attribute meta | Friendly names + meanings (RU/EN) keyed by attribute | `web/lib/intake/attributes.ts` |
| API | `POST /api/intake/submit`, `GET /api/intake/me`, `PATCH /api/intake/progress` | `workers/src/handlers/intake.ts` (+ tests) |
| Gemini client | G3 classification + sheet prose, with template fallback | `workers/src/lib/gemini.ts` |
| Storage | `intake_profiles` table | `workers/migrations/0003_intake_profiles.sql` |
| Character Sheet | Page reading `GET /api/intake/me` | `web/app/character/` (+ `/en/character/`) |
| Gate | `IntakeGuard` composed over `AuthGuard` | `web/components/intake-guard.tsx` |

**Principle:** scoring is pure & deterministic (testable, thresholds calibratable per doc disclaimer);
Gemini touches only generative prose — its failure must not block sheet rendering.

## 3. Data model (D1 migration 0003)

```sql
CREATE TABLE IF NOT EXISTS intake_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'in_progress',  -- in_progress | completed
  answers        TEXT NOT NULL DEFAULT '{}',           -- JSON: {"A1":"...","C3":2,"C2":["chatgpt"],"G1":1987,...}
  current_step   INTEGER NOT NULL DEFAULT 0,           -- resume cursor

  int_score INTEGER, wis_score INTEGER, con_score INTEGER,
  dex_score INTEGER, cha_score INTEGER, str_score INTEGER,
  char_class    TEXT,   -- artificer|mage|operator|healer|sovereign|wanderer
  char_level    INTEGER,-- 0–4 from C1
  world_skin    TEXT,   -- slavic-myth|dark-fantasy|cyber-noir|space-opera|anime-quest|soviet-heroic|mystic-arcane|wanderer
  cog_tier      INTEGER,-- 1–4
  register      TEXT,   -- ty|vy|playful|terse|adaptive (G8)
  sheet_language TEXT,  -- ru|en|ru-tech|mix (G12)
  niche         TEXT,   -- from F2
  os            TEXT,   -- mac|windows (folded-in OS question)

  legendary_title TEXT, backstory TEXT, first_quest TEXT, final_boss TEXT,
  prose_source  TEXT,   -- gemini | template (for later regeneration)

  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, completed_at INTEGER
);
```

- `answers` = JSON blob (62 heterogeneous answers). Computed fields are columns for analytics /
  calibration / SP2 consumption.
- Generative prose cached in-row (Gemini called once at submit).
- One row per user; re-take overwrites with new `updated_at`.
- Open-text answers live only in `answers`; they do NOT feed scoring (Gemini prose + future SPs only).

## 4. Questionnaire (delivery, content, branching)

- **Question types:** `number`, `single` (MC), `multi` (multi-select), `likert` (1–5), `text` (open).
- **Modules A→B→C→D→E→F→G** with intro screens. Order is fixed (doc: functional → cognitive →
  motivational → contextual → cultural; G last as cool-down, avoids framing bias).
- **Delivery:** wizard, one question per screen, progress bar `Модуль C · 23/62`. Each answer →
  `PATCH /api/intake/progress` (resumable). Module-boundary intro screens.
- **Branching (minimal):** `F2` (niche) reveals 1–2 niche sub-questions via `showIf` in config.
  `G3` and `G9` both always asked (no branching); G3 classified post-submit by Gemini, G9 overrides.
- **Validation:** scoring-relevant MC/Likert required; open-text optional (e.g. C10 "No, haven't tried").
- **OS reconciliation:** OS (Mac/Windows) becomes a `single` question inside Module C; the standalone
  `/onboarding` page + `OnboardingForm` are retired. OS persists to `localStorage.os` AND the profile.
- **i18n:** all question/option/intro text carries RU+EN fields in `questions.ts` (domain content kept
  out of `dictionaries.ts` due to volume, same bilingual principle).
- **Privacy/consent:** intake start shows a short consent line (why we ask, how data is used) — per
  doc disclaimer (GDPR / RF data protection).

## 5. Scoring engine (deterministic)

Pure functions in `web/lib/intake/scoring.ts`; weights in a calibratable config table.

**Attributes** — weighted sum of MC/Likert points, normalized `round(raw / rawMax * rangeMax)`:

| Attr | Range | Source questions |
|------|-------|------------------|
| 🧠 INT | 0–30 | C1, C3, C4, C8, D3, D7 |
| 📚 WIS | 0–25 | D1, D5, D9, E3, E4 |
| 🛡 CON | 0–25 | E1, E2, E7, B7, B8 |
| ⚡ DEX | 0–20 | A9, F5, E5, B6 |
| 🌟 CHA | 0–20 | A5, A6, F2, E3 |
| 🔨 STR | 0–20 | F4, A9 + proxies (low-confidence) |

`SCORING[questionId][optionValue] = points` (doc values: C1 Tier0=0…Tier4=12; C3 0/1/3/5;
C4 0/2/4/6; C8 5/3/1/0; D3 6/4/2/1/0; D7 0/2/4/6; etc.).

**Class** — ordered threshold check, first match wins, else Wanderer:
```
Artificer: INT≥20 && STR≥15 && CON≥18
Mage:      WIS≥18 && INT≥15 && CHA≥15
Sovereign: WIS≥20 && CHA≥18 && CON≥20
Operator:  DEX≥15 && STR≥12 && INT≥10 && WIS<15
Healer:    CHA≥15 && CON≥15 && INT<15
else → Wanderer
```

**Other:** `char_level` ← C1 (0–4); `cog_tier` ← D2 primary + D3/D7 cross-check + **G6 cross-validation**
(if D2="20 min" but G6="<3 min" → downshift to Shorts-native); `register` ← G8; `sheet_language` ← G12;
`niche` ← F2; `world_skin` ← G9 else G3-classified (Gemini) else Wanderer.

**Calibration honesty:** STR's doc-sources are mostly open-text (A2/A10/F3). SP1 scores STR from
available numeric proxies (F4, A9, F1) and flags it low-confidence. All thresholds live in config,
labeled as doc hypotheses to calibrate over 2–3 cohorts. No Gemini inside scoring.

### Friendly attribute names (`attributes.ts`)

| Code | RU name + meaning | EN name + meaning |
|------|-------------------|-------------------|
| INT | 🧠 Тех-разум — глубина в технике и абстракциях | Tech-Mind — depth in tech & abstraction |
| WIS | 📚 Самообучение — учиться самому, без подсказок | Self-Learning — learning on your own |
| CON | 🛡 Стойкость — не бросаешь, анти-выгорание | Stamina — persistence, anti-burnout |
| DEX | ⚡ Темп — как быстро хочешь результат | Tempo — how fast you want results |
| CHA | 🌟 Харизма — клиенты и сообщество | Charisma — client & community orientation |
| STR | 🔨 Размах — масштаб того, что строишь | Ambition — scope of what you build |

Sheet shows: friendly name (primary) + one-line meaning + faint RPG abbreviation (variant A).

## 6. Character Sheet (`/character`)

Layout (validated mockup): header (World Skin + class + level + Gemini legendary title, subclass/niche);
6 attribute bars (friendly names + meanings + faint abbr); 3 generative blocks (backstory from G11,
first quest from A2/F3, final boss from A10/G11) marked as Gemini-sourced; meta chips (COG budget,
motivation type, register, Solo/Party, language). Styled in `ai.mamaev.coach` aesthetic, lightly
themed by skin accent.

**Gemini generation (Worker `gemini.ts`):** structured input (class, skin, attributes, niche,
register, language + key open-text G11/A2/A10/F3) → JSON `{title, backstory, first_quest, final_boss}`
in the right language/register/skin tone. Called once at submit; result cached in-row.

## 7. Gating, errors, testing

**Gating:** `IntakeGuard` (mirrors `AuthGuard`) wraps `/lessons/*`, `/dashboard`; checks
`GET /api/intake/me` → no completed profile → redirect `/quest-intake`. Composition:
`AuthGuard → IntakeGuard → content`. `/quest-intake` needs auth only (no profile, avoids loop);
`/character` needs completed profile. `verify-client` post-login: new user → `/quest-intake`
(the old `!os → /onboarding` branch is removed). Symmetric RU/EN routes.

**Errors:** Gemini failure/limit → template fallback prose (slot-filled); sheet always renders;
`prose_source` flag allows later regeneration. Network drop mid-questionnaire → resume via
`current_step` + `answers`. Required-question validation client + server (no holes for scoring).
Re-submit overwrites (idempotent).

**Testing:** Vitest on `scoring.ts` (attribute calc, class thresholds, skin G9>G3>Wanderer, cog_tier
+ G6 cross-validation, edge cases: Wanderer fallback, low-confidence STR). Worker `intake.ts`
(submit/me/progress). `gemini.ts` mocked + fallback path verified.

## 8. Locked decisions (from program tracker)

D1 native build · D2 4-SP decomposition · D3 SP1 first (full 62q) · D4 skin assign+display only ·
D5 `/quest-intake` hard gate · D6 Gemini for generative parts · D7 wizard one-at-a-time/resumable ·
D8 in-app `/character`, Telegram later.

## 9. Open items for implementation plan

- Exact `SCORING` weight table for every MC/Likert option (transcribe from doc, fill gaps explicitly).
- Gemini model choice (Flash for G3 classify, Pro for prose) + prompt templates per skin/register/language.
- Template fallback prose per class×skin.
- F2 niche sub-question set for SP1 (massage, astrology at minimum, per doc short-term priority).
