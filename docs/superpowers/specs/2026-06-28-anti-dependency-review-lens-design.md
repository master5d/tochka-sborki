# Anti-Dependency Review Lens — Design

**Ticket:** `fb_9f6458a284bc` (Anti-dependency pedagogy: design for graduation/agency, not
retention — teach-to-fish).

**Date:** 2026-06-28

## Goal

Formalize the anti-dependency pedagogy — design for graduation and agency, not retention — as a
binding review lens in the course authoring skill (`skills/tochka-sborki-update/SKILL.md`),
sitting beside the Content-Design Review Lens. It is a distinct axis: where the content-design
lens governs clarity / cognitive load / learning science, this lens governs the
learner-relationship ethic (graduation over retention, agency over dependence, no retention
dark-patterns). Each principle cross-references the shipped mechanism that already embodies it.

## Scope (carved by honest triage)

The principle is heavily embodied already (Personal Learning Plan's DIY copy-out, the companion
charter's "co-thinking partner, not do-it-for-me", learn-with-AI's bring-your-own-AI, the de-guru
thread, the content-design lens's andragogy). The ticket's uncovered, on-spec delta is the
authoring side it names explicitly — "движок/авторинг оптимизируют на ВЫПУСК/агентность, не
удержание; против retention dark-patterns" — i.e. a review lens, the same operational-artifact
home chosen for the content-design principles.

- **In scope:** a new `## Anti-Dependency Review Lens` section in
  `skills/tochka-sborki-update/SKILL.md`, immediately after the Content-Design Review Lens, with
  4 principles as `- [ ]` review checks cross-referencing the shipped embodiments.
- **Out of scope (carved):**
  - A wellbeing agency-nudge (the nudge system is pacing-state-triggered — poor fit; the
    "respond≠react" framing is companion-reflection, not a pacing nudge).
  - A learner-facing surface (overlaps the PLP / charter / closing lines already shipped).
  - A dark-pattern drift-guard test (the project's OWN anti-manipulation copy quotes the banned
    phrases as negative examples — e.g. the optional tracks say "без «осталось 2 места»" — so a
    naive scanner would false-fail on our own honest copy; too fragile).
  - The authoring engine (`fb_8e8eaf0a`) — does not exist; the lens feeds it later.
  - Re-shipping the referenced embodiments (PLP, charter, learn-with-AI — all shipped).

## Architecture

Pure content. A single new section is inserted into `skills/tochka-sborki-update/SKILL.md`,
immediately after the "## Content-Design Review Lens" section and before "## Operations". English
instruction voice (matching the skill file and the sibling lens); content mirrors the approved
draft 1:1. No code, no test, no other file.

## Component

### `skills/tochka-sborki-update/SKILL.md` (modified)

Insert this section verbatim after the "## Content-Design Review Lens" section (which ends with
its `> Use this lens as a review pass…` blockquote) and before "## Operations":

```markdown
## Anti-Dependency Review Lens

Apply this lens to anything shaping the learner's relationship with the course — lessons, the companion, progression, CTAs. The course graduates people into agency (teach-to-fish, "the teacher makes teachers"); it does not retain them. Optimize every choice for the learner's eventual independence.

### 1. Design for graduation, not retention

- [ ] Success is the learner becoming able and leaving — not staying engaged. No retention dark-patterns: no streak guilt, no manufactured FOMO, no countdowns, no "you'll lose progress" pressure.
- [ ] If a feature raises "time on site" but not the learner's capability, cut it.

### 2. Teach to fish — build agency

- [ ] The learner does the thinking; the companion assists, never replaces (charter: "co-thinking partner, not do-it-for-me", "never take the decision").
- [ ] Lessons hand over transferable skill, not dependence on this platform's UI.

### 3. The learner owns the resources

- [ ] Artifacts are portable and copy-out, not locked in our DB (the Personal Learning Plan and the Companion Charter are both copyable).
- [ ] No key or vendor lock-in — bring-your-own-AI (the learn-with-AI handoff), no walled garden.

### 4. Honest progression, not a funnel

- [ ] free → builder → academy → mentor is an honest ladder of value; the free tier is genuinely complete, never crippled to force an upgrade.
- [ ] No manipulative sales — no scarcity, no fake deadlines, no "last spots" (matches the optional tracks' framing and the clarity-first stance).

> When a choice trades the learner's independence for our retention, choose independence. A graduate who no longer needs us is the success metric.
```

## Data flow

None — static skill Markdown, read by Claude Code when the `tochka-sborki-update` skill is
invoked.

## Authenticity (binding)

- The lens IS the anti-dependency / de-guru ethic made operational; it reinforces the
  authenticity-sacred constraints (no scarcity / countdown / manipulative funnel) the project
  already holds.
- It lives in the authoring skill, not in learner-facing content — adds no new learner jargon.

## Testing

No automated test (skill Markdown). Verification is a review pass:
- The section is placed immediately after "## Content-Design Review Lens" and before
  "## Operations"; surrounding skill content unchanged.
- All 4 principles present as `- [ ]` checks; the closing blockquote present.
- Cross-references name real shipped artifacts: the Personal Learning Plan + Companion Charter
  (copyable cards on `/character`), the learn-with-AI handoff, the free→builder→academy→mentor
  progression, the optional exercise tracks, clarity-first.
- Prose matches the approved draft 1:1 (English voice).

## Global constraints

- File: `skills/tochka-sborki-update/SKILL.md` (repo-level skill — not under `LMS/.../web`).
  Repo artifact; no web/worker deploy, no CI job, no build.
- English instruction voice to match the skill file and the sibling Content-Design lens.
- Additive: a single new section inserted; all existing skill sections (front-matter, Project
  Map, Style Conventions, Content-Design Review Lens, Operations, Cascade Checklist, Important
  Notes) stay unchanged.
- Cross-references must resolve to real, shipped artifacts (no inventing mechanisms).

## Files

| File | Responsibility |
|---|---|
| `skills/tochka-sborki-update/SKILL.md` | insert the `## Anti-Dependency Review Lens` section |

## Out of scope

- Wellbeing agency-nudge; learner-facing surface; dark-pattern drift-guard; authoring engine
  `fb_8e8eaf0a`; re-shipping referenced mechanisms.
