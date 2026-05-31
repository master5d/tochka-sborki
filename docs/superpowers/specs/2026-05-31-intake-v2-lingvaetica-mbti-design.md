# Intake v2 — LINGVÆTICA-synthesis + MBTI bonding profile

**Date:** 2026-05-31
**Status:** Design brief (awaiting review → writing-plans)
**Owner:** Александр Мамаев

---

## 1. Context & Problem

The current intake is a **63-question instrument** (`web/lib/intake/questions.ts`, Modules A–G + OS),
sourced from "AJTBD × Cognitive Load Questionnaire". It is thorough and drives the whole RPG layer
(attributes → class → world-skin → niche → applied-challenge → companion). But:

- **It is long and clinical.** Likert scales, "your technical level", multi-part batteries.
  Completion fatigue is a real funnel leak (the funnel's real barrier is *imagination, not skill* —
  see `project_tochka_sborki_funnel`).
- **Its form contradicts the course's relational philosophy.** The course now teaches
  *co-thinking / co-working* and emotional partnership with an agent; the intake feels like an exam.

**LINGVÆTICA (PROFILUS HISPANICUS)** — a course participant's own agent manifesto — shows the alternative.
Three observations drive this design:

1. **Its intake IS its manifesto, enacted on the learner.** Micro-focus, fast dopamine, stimulus-switching,
   minimal overload. Questions are sensory/playful ("что цепляет?", "выбери ритм: *suave/fuego/libre/ritual*").
   It profiles *through experience*, not interrogation.
2. **Its manifesto structure = the 7-block agent-charter** shipped in Module 08
   (Identity → Profile → Principles → Use/Avoid → Cycle → Form → Laws → Goal). Proof that
   **the intake should *produce* a charter** for each student's companion. Intake → charter → bond.
3. **Its relational axes are emotional-bonding signal stronger than raw MBTI:** rhythm
   (suave/fuego/libre/ritual), error-reaction (спокойно / теряю мотивацию / нужен мягкий фидбек /
   люблю сразу исправлять), attention threshold, "что помогает не бросать". **Decision: MBTI *and*
   LINGVÆTICA axes together, not either/or.**

## 2. Goals

- A **v2 instrument**: a short (~12–15 Q) sensory "core" everyone completes, in LINGVÆTICA's voice,
  deriving everything the RPG layer + companion need; plus an **optional depth block** (`showIf`) that
  sharpens RPG attribute precision for those who opt in.
- **Capture MBTI** (self-report shortcut + 4 forced-choice pairs) and a **relational style** profile,
  fed into the companion ("Учиться с ИИ") prompt for emotional bonding.
- **Zero disruption to registered students mid-survey.** Version-snapshot the instrument: v1 frozen
  for anyone already in flight; v2 for new starts.
- The intake's **payoff is the student's generated companion charter** (the 7-block), shown at the end —
  the bonding moment, and the explicit tie to Module 08.

## 3. Non-goals

- Re-scoring or altering v1 results for existing students. v1 is frozen, untouched.
- Clinical/validated MBTI. We need a *tendency* profile to tune tone, not a diagnosis.
- Rewriting the RPG economy, dungeons, or companion architecture. v2 feeds the **same** derived fields.

## 4. The v2 instrument

All core questions pass for everyone; **every question is `required: false`** (honors "почти любое можно
пропустить" + removes any submit-rejection risk for cached clients — see §7). Voice: micro, sensory, playful,
≤1 idea per question, rhythm-varied. New question IDs use a distinct namespace (no collision with v1 `A1…G12`).

### 4.1 Core (~12–15 Q, everyone)

| # | ID | Question (theme) | Derives |
|---|----|----|----|
| 1 | `V_WHY` | Зачем тебе это сейчас? (sensory motivation options) | outcome intent (≈ A/F3 seed) |
| 2 | `V_HOOK` | Что цепляет сильнее? | domain pull |
| 3 | `V_NICHE` | Твоя сфера / где ты себя видишь (7 niches, playful framing) | **niche** (F2-equiv) |
| 4 | `V_RHYTHM` | Твой ритм: suave / fuego / libre / ritual | tempo + energy (→ pacing, CON proxy) |
| 5 | `V_ERR` | Реакция на ошибку: спокойно / теряю мотивацию / нужен мягкий фидбек / люблю сразу исправлять | **bonding** error-style |
| 6 | `V_ATTN` | Порог внимания: 3–5 / 10–15 / 20+ мин | **cogTier** + pacing |
| 7 | `V_MODE` | Как легче воспринимать: видео / аудио / визуал / диалоги / игра | learning modality |
| 8 | `V_ANCHOR` | Что помогает не бросать: поддержка / интересные темы / быстрые победы / структура / свобода | motivation anchor + bonding |
| 9 | `V_MBTI_SR` | Знаешь свой тип? (16 types + «не знаю / не уверен») | **MBTI** (shortcut) |
| 10–13 | `V_MBTI_EI` `V_MBTI_SN` `V_MBTI_TF` `V_MBTI_JP` | 4 forced-choice pairs, experiential framing. **`showIf` V_MBTI_SR == "unknown"** | **MBTI** (derived) |
| 14 | `V_SKIN` | Мир / эстетика, которая ближе (8 skins, sensory) | **worldSkin** (G9-equiv) |
| 15 | `V_OS` | OS (mac / windows) | **os** (for `<OsBlock>`) |

**MBTI flow is adaptive:** known-type users answer **1** question (`V_MBTI_SR`); others answer
`V_MBTI_SR=unknown` → 4 pairs revealed via `showIf`. Type assembled from the 4 axes or taken from self-report.

### 4.2 Optional depth (`showIf` gate)

A single gate question `V_DEEPEN` ("Хочешь точнее собрать персонажа? Пара минут — и атрибуты станут острее")
→ if "yes", reveal a **compact scored battery** (subset of the strongest v1 scored items, reframed in v2 voice)
that sharpens INT / WIS / CON / DEX / CHA / STR. If skipped, attributes derive from **core proxies** at lower
confidence — the existing `strLowConfidence` mechanism already models partial-data scoring and is generalized here.

## 5. MBTI → relational bonding → companion

MBTI type + rhythm + error-style compose a **relational style** consumed by `buildLearnPrompt`
(`web/lib/learn-prompt.ts`), alongside the existing 3×3 mode + skin + niche + outcome:

| Signal | Companion behavior |
|---|---|
| E / I | how much the agent initiates vs. waits for the learner |
| S / N | concrete examples vs. patterns & metaphors (reinforces the skin-metaphor channel) |
| T / F | feedback framed as logic vs. as meaning/encouragement |
| J / P | structured roadmap vs. open exploration |
| rhythm (suave→ritual) | session length / intensity / cadence |
| error-style | how gently to correct — *«ошибка = настройка»* when "теряю мотивацию"/"мягкий фидбек" |

Implementation: extend `LearnPromptInput` with `mbti?` + `relationalStyle?`, add an `MBTI_DIRECTIVE` /
`RELATIONAL_DIRECTIVE` block. Additive — does not change existing prompt assembly when absent. RU + EN.

## 6. The charter reveal (payoff)

On submit, v2 shows the student a generated **companion charter** in the Module-08 7-block format,
filled from their answers (Identity = their co-thinking partner; Profile = niche + rhythm + MBTI;
Principles/Laws = error-style + anchor; Loop = the companion cycle; Goal = their outcome). This is the
emotional bond moment and a concrete artifact they can paste into any agent. Reuses the charter language
already in `my-templates/agent-charter.md`.

## 7. Versioning architecture (the resume-safety core)

**Verified facts about the current backend:**
- Answers persist as a **JSON blob keyed by question ID** (`JSON.stringify(answers)` →
  `intake_profiles.answers`). New IDs need **no schema migration**.
- `current_step` is a **positional index into the *visible* list**, which preserves `QUESTIONS` order.
- `REQUIRED` is derived from `required:true` (`workers/src/handlers/intake.ts`).
- Scoring reads a **fixed ID set (A–G)**; unknown IDs are ignored.

**Mechanism:**
1. Migration `0006_instrument_version.sql`:
   `ALTER TABLE intake_profiles ADD COLUMN instrument_version INTEGER NOT NULL DEFAULT 1;`
   → **all existing rows become v1** and keep the old instrument, frozen.
2. **v1 questions are frozen in code** (`questions.v1.ts`, the current file, untouched).
   **v2 lives in `questions.v2.ts`.** The wizard loads the set by version.
3. **Version is decided at first-progress-write and frozen thereafter.** A brand-new student has no row;
   their first `/api/intake/progress` PATCH inserts with `instrument_version = 2`. Existing rows
   (`current_step > 0`, version=1) stay on v1 until they submit. A registered user who never started
   (`current_step = 0` / no row) safely gets v2 — nothing invested.
4. `/api/intake/me` returns `instrument_version`; client picks `QUESTIONS_V1` / `QUESTIONS_V2`.
5. **Scoring & REQUIRED are version-routed.** `scoreProfile` stays for v1; `scoreProfileV2` reads v2 IDs
   with v2 weights. Submit handler picks REQUIRED + scorer by the row's version.

**Result:** no reset, no migration of answer data, no broken resume — and v2 is free to redesign the bank
fully (not append-bound), exactly as requested.

## 8. Data model changes

- `intake_profiles.instrument_version INTEGER NOT NULL DEFAULT 1` (additive migration `0006`).
- MBTI 4-letter type + relational style: **derived on read** from the answers JSON (no extra columns).
  Optional later: a derived `mbti TEXT` column for CRM/analytics (additive, deferred — not in v1 of this work).

## 9. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Partial-data scoring yields weak attributes | Core proxies + generalized `strLowConfidence`; optional depth for precision-seekers |
| New student tagged v1 by stale default | Version stamped at first-progress-write = 2; migration default 1 only touches *existing* rows |
| v2 niche/skin mapping drifts from RPG enums | v2 options reuse the **same** `niche` / `WorldSkin` value keys; tested |
| MBTI feels gimmicky / clinical | Experiential framing + self-report shortcut; positioned as bonding, not diagnosis |
| Two question banks diverge in maintenance | v1 is **frozen** (never edited again); only v2 evolves |

## 10. Testing

- `questions.v2.test.ts` — every v2 question has ru+en, valid `showIf` targets, value keys match
  `niche`/`WorldSkin`/`os` enums; MBTI pairs cover all 4 axes.
- `scoring-v2.test.ts` — full core, core-only (no depth), and core+depth produce valid `ScoreResult`;
  partial data sets `strLowConfidence`.
- `mbti.test.ts` — 4-pair answers + self-report both yield a valid 4-letter type; ties resolved deterministically.
- `learn-prompt.test.ts` — extend: mbti + relationalStyle vary the prompt; absent → unchanged baseline.
- `visible.test.ts` — MBTI `showIf` (self-report → pairs) and `V_DEEPEN` gate behave.
- Worker `intake.test.ts` — version routing: v1 row scores via v1, v2 via v2; new insert stamps version 2;
  required-check uses the right set.

## 11. Open questions (resolve during planning)

- Exact wording of the 15 core questions (RU first, then EN mirror) — copy pass in LINGVÆTICA voice.
- Which v1 scored items survive into the optional depth battery (pick the highest-information items per attribute).
- Whether the charter reveal is a new screen or an extension of the existing post-submit result page.
