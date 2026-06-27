# Content-Design Review Lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a `## Content-Design Review Lens` section (curse-of-knowledge, Must/Should/Could, andragogy — as a binding review checklist) into the course authoring skill `skills/tochka-sborki-update/SKILL.md`.

**Architecture:** Pure content. A single new Markdown section is inserted between the skill's "Style Conventions" and "Operations" sections. The section is authored in English (the skill's instruction voice), with Russian only where it names real course content. No code, no test, no other file.

**Tech Stack:** Markdown (a Claude Code skill file).

## Global Constraints

- File: `skills/tochka-sborki-update/SKILL.md` — a REPO-LEVEL skill, NOT under `LMS/tochka-sborki/web/`. Repo artifact; no web/worker deploy, no CI job touched, no build.
- English instruction voice to match the skill file; Russian only for course-content terms (e.g. `Активация`, `выбирай в любом порядке`, `токен`).
- Additive: insert ONE new section; every existing skill section (front-matter, Project Map, Style Conventions, Operations, Cascade Checklist, Important Notes) stays byte-identical.
- Use the approved section copy (in the spec) VERBATIM.
- Cross-references must resolve to real, shipped artifacts — do not invent mechanisms. (`lib/content/kolb-coverage.test.ts`, `<WillWont>`, `onboarding-bridge`, the Kolb phases, modes commander/copilot/archmage, applied-challenge, the Kickstart minimal vocabulary, the optional exercise tracks, clarity-first `fb_39f6ccee8c5e` — all already exist.)

---

### Task 1: insert the Content-Design Review Lens section

**Files:**
- Modify: `skills/tochka-sborki-update/SKILL.md`

**Interfaces:** none (Markdown content).

- [ ] **Step 1: Read the target file to confirm the insertion point**

Read `skills/tochka-sborki-update/SKILL.md`. Confirm the "## Style Conventions" section ends just before "## Operations" (the line `## Operations` exists). The new section goes between them: after the last bullet of Style Conventions (`- **Section separators**: Use \`---\` between major sections`) and before `## Operations`.

- [ ] **Step 2: Insert the section verbatim**

Insert the following block so that it sits between the end of "## Style Conventions" and the "## Operations" heading (one blank line before and after the inserted section):

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

- [ ] **Step 3: Verify placement and that nothing else changed**

Re-read the file region around the insertion. Confirm:
- The new `## Content-Design Review Lens` heading sits after the Style Conventions bullets and before `## Operations`.
- No existing section was altered, reordered, or dropped (front-matter, Project Map, Style Conventions, Operations, Cascade Checklist, Important Notes all intact).
- The three sub-headings (`### 1.` / `### 2.` / `### 3.`) and all `- [ ]` checks are present, and the closing blockquote is present.

Run: `git diff --stat skills/tochka-sborki-update/SKILL.md`
Expected: one file changed, only insertions (no deletions).

- [ ] **Step 4: Verify cross-references resolve (no invented mechanisms)**

Confirm each referenced artifact exists:
- `LMS/tochka-sborki/web/lib/content/kolb-coverage.test.ts` exists.
- `<WillWont>` component / `onboarding-bridge` exist in the web app.
- The Kolb phase types (`activation`/`reflection`/`concept`/`practice`) exist (`components/phase-chrome.ts`).

Run (from repo root): `ls LMS/tochka-sborki/web/lib/content/kolb-coverage.test.ts && grep -rl "onboarding-bridge" LMS/tochka-sborki/web/components | head -1 && grep -rl "WillWont" LMS/tochka-sborki/web/components | head -1`
Expected: the test file path prints and both greps return at least one path.

- [ ] **Step 5: Commit**

```bash
git add skills/tochka-sborki-update/SKILL.md
git commit -m "docs(skill): content-design review lens for authoring (fb_cea25e03d3db)"
```

---

## Self-Review

**Spec coverage:**
- New `## Content-Design Review Lens` section in the authoring skill → Task 1 (Step 2). ✓
- 3 principles as `- [ ]` checks with cross-references → Task 1 (Step 2) verbatim block. ✓
- Placement between Style Conventions and Operations → Task 1 (Steps 1, 3). ✓
- Cross-references resolve to real artifacts → Task 1 (Step 4). ✓
- Additive, no other section changed → Task 1 (Step 3). ✓
- Approved copy verbatim → Task 1 (Step 2). ✓
- No automated test (skill Markdown) → review verification via Steps 3–4. ✓
- Carve (no engine / glossary / re-ship / lesson-content change) → respected. ✓

**Placeholder scan:** none — the full section is inline and complete.

**Type consistency:** N/A (Markdown). The cross-referenced identifiers (`lib/content/kolb-coverage.test.ts`, `<WillWont>`, `onboarding-bridge`, Kolb phase names, modes, applied-challenge) are the real, shipped names; Step 4 verifies the load-bearing ones exist.
