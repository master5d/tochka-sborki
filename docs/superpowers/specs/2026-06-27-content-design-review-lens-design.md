# Content-Design Review Lens — Design

**Ticket:** `fb_cea25e03d3db` (Content-design principles: curse-of-knowledge, Must/Should/Could
prioritization, andragogy — as an authoring/review lens).

**Date:** 2026-06-27

## Goal

Formalize three content-design principles — curse-of-knowledge, Must/Should/Could (MoSCoW), and
andragogy — as a binding review lens inside the course authoring skill
(`skills/tochka-sborki-update/SKILL.md`), so every lesson written or reviewed is checked against
them. Each principle cross-references the concrete, already-shipped mechanism that carries it, so
the lens is actionable rather than abstract.

## Scope (carved by honest triage)

The ticket explicitly asks for "checklist / review-lens" feeding the authoring engine
(`fb_8e8eaf0a`, which does not exist yet). The honest home is the existing authoring skill —
an operational artifact invoked on every course edit (its trigger covers "добавь в курс / поправь
урок / новый Meeting"). The skill today has structure/cascade/style conventions but NO
pedagogical content-design lens. That gap is the delta.

- **In scope:** a new `## Content-Design Review Lens` section in
  `skills/tochka-sborki-update/SKILL.md`, between "Style Conventions" and "Operations", holding
  the 3 principles as `- [ ]` review checks with cross-references to the concrete backbones.
- **Out of scope (deferred / done / overlap):**
  - The generic authoring engine (`fb_8e8eaf0a`) — does not exist; the lens is written to feed
    it later.
  - A learner-facing glossary / term-definition component (considered; overlaps `HelpTip` +
    needs owner term definitions — a separate ticket if wanted).
  - Re-shipping the mechanisms the lens references (Kolb coverage guard, `<WillWont>`,
    `onboarding-bridge`, clarity-first/plain-mode, Kickstart vocabulary, modes,
    applied-challenge) — all already shipped; the lens only points at them.
  - Any automated test — this is skill Markdown; verification is review (cross-refs resolve,
    prose accurate).

## Architecture

Pure content. A single new section is inserted into `skills/tochka-sborki-update/SKILL.md`. The
section is authored in English to match the skill file's instruction voice (the skill is
Claude-facing instructions written in English, with Russian shown only in course-content
examples); its content mirrors the approved draft 1:1, keeping Russian terms where they name real
course content. No code, no component, no test, no other file.

## Component

### `skills/tochka-sborki-update/SKILL.md` (modified)

Insert this section verbatim after the "## Style Conventions" section and before "## Operations":

```markdown
## Content-Design Review Lens

Apply this lens whenever you write or review a lesson, section, or exercise — for any course under `LMS/`. These three principles (from the Google Facilitation Bootcamp, de-funneled) are the pedagogical guardrails that turn "is this good content?" into concrete checks. Each cross-reference points to the mechanism that already carries the principle, so the lens is actionable, not abstract.

### 1. Curse of knowledge — design from the novice's seat

The author knows too much; the learner does not. (Live-validated by a test-user: "if it's clear to you, you assume it's clear to everyone — but it isn't.") Write from the beginner's point of view and show the menu before the meal.

- [ ] Jargon is defined on first use (or linked to the Kickstart minimal vocabulary). No undefined LLM / токен / MCP / agent / deploy assumed.
- [ ] The lesson opens by orienting — a map or menu of what's coming — before diving into detail. The Kolb `activation` phase carries this; the coverage guard `lib/content/kolb-coverage.test.ts` enforces that every unit has it.
- [ ] Expectations are honest and explicit — use `<WillWont>` (what this will / won't give).
- [ ] RPG and domain jargon is disarmed for non-gamers (`onboarding-bridge`), and a plain reading path exists (clarity-first, `fb_39f6ccee8c5e`).

### 2. Must / Should / Could — prioritize against cognitive overload

Not everything is equally important. MoSCoW keeps the core path lean so an overloaded learner isn't drowned.

- [ ] The **Must** (core takeaway) of each unit is unmistakable — one clear idea, not ten.
- [ ] **Should / Could** material is marked optional and movable off the core path (electives — "выбирай в любом порядке"; the optional exercise tracks; bonus sections; the opt-in Kickstart).
- [ ] No unit front-loads Could-level depth before the Must has landed.
- [ ] Cognitive load per phase is bounded — if a `concept` phase sprawls, split it or demote material.

### 3. Andragogy — adults learn differently

Adults are self-directed, bring prior experience, and learn what's relevant to a real problem now.

- [ ] **Self-directed**: order is flexible where possible (electives); the learner chooses depth (modes commander / copilot / archmage).
- [ ] **Experience-first**: concrete experience precedes abstraction (Kolb `activation` → `reflection` → `concept` → `practice` — never concept-first).
- [ ] **Problem-centered & relevant**: tied to the learner's real goal or niche (intake profile, applied-challenge personalization), not theory for its own sake.
- [ ] **Respects prior knowledge**: no condescension; offer skip / accelerate paths.

> Use this lens as a review pass, not a rigid gate — if a lesson violates a check, fix the lesson or note why the exception holds.
```

## Data flow

None — static skill Markdown, read by Claude Code when the `tochka-sborki-update` skill is
invoked.

## Authenticity (binding)

- Principles are de-funneled (the source infographic's Telegram-channel CTA stripped). No hype.
- The lens reinforces clarity-first (`fb_39f6ccee8c5e`) and the anti-jargon stance — it does not
  add new learner-facing jargon (it lives in the authoring skill, not in lesson content).
- "Review pass, not rigid gate" framing keeps it a helpful lens, not a bureaucratic blocker.

## Testing

No automated test (skill Markdown). Verification is a review pass:
- Every cross-referenced artifact exists: `lib/content/kolb-coverage.test.ts` (shipped today),
  `<WillWont>`, `onboarding-bridge`, the Kolb phases, modes (commander/copilot/archmage),
  applied-challenge, the Kickstart minimal vocabulary, the optional exercise tracks.
- Ticket reference `fb_39f6ccee8c5e` (clarity-first) is valid.
- The section is placed between "Style Conventions" and "Operations"; surrounding skill content
  is unchanged.
- Prose matches the approved draft 1:1 (English voice, Russian terms where they name real
  content).

## Global constraints

- File: `skills/tochka-sborki-update/SKILL.md` (repo-level skill — not under `LMS/.../web`).
  Repo artifact; no web/worker deploy, no CI job touched.
- English instruction voice to match the skill file; Russian only for course-content terms.
- Additive: a single new section inserted; all existing skill sections (front-matter, Project
  Map, Style Conventions, Operations, Cascade Checklist, Important Notes) stay unchanged.
- Cross-references must resolve to real, shipped artifacts (no inventing mechanisms).

## Files

| File | Responsibility |
|---|---|
| `skills/tochka-sborki-update/SKILL.md` | insert the `## Content-Design Review Lens` section |

## Out of scope

- Authoring engine `fb_8e8eaf0a`; learner-facing glossary; re-shipping referenced mechanisms;
  automated test; any change to lesson content or other skill sections.
