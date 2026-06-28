# Anti-Dependency Review Lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a `## Anti-Dependency Review Lens` section (design-for-graduation / teach-to-fish / learner-owns-resources / honest-progression — as binding review checks) into the course authoring skill `skills/tochka-sborki-update/SKILL.md`, beside the Content-Design Review Lens.

**Architecture:** Pure content. One new Markdown section is inserted immediately after the existing "## Content-Design Review Lens" section and before "## Operations". English instruction voice (the skill's + the sibling lens's). No code, no test, no other file.

**Tech Stack:** Markdown (a Claude Code skill file).

## Global Constraints

- File: `skills/tochka-sborki-update/SKILL.md` — a REPO-LEVEL skill, NOT under `LMS/tochka-sborki/web/`. Repo artifact; no web/worker deploy, no CI job, no build.
- English instruction voice to match the skill file and the sibling Content-Design Review Lens.
- Additive: insert ONE new section; every existing skill section (front-matter, Project Map, Style Conventions, Content-Design Review Lens, Operations, Cascade Checklist, Important Notes) stays byte-identical.
- Use the approved section copy (in the spec) VERBATIM.
- Cross-references must resolve to real, shipped artifacts — do not invent mechanisms. (Personal Learning Plan + Companion Charter cards on `/character`, the learn-with-AI handoff, the free→builder→academy→mentor progression, the optional exercise tracks, clarity-first — all already exist.)

---

### Task 1: insert the Anti-Dependency Review Lens section

**Files:**
- Modify: `skills/tochka-sborki-update/SKILL.md`

**Interfaces:** none (Markdown content).

- [ ] **Step 1: Read the target file to confirm the insertion point**

Read `skills/tochka-sborki-update/SKILL.md`. Confirm the "## Content-Design Review Lens" section exists and ends with its `> Use this lens as a review pass, not a rigid gate …` blockquote, immediately followed by `## Operations`. The new section goes between that blockquote and `## Operations`.

- [ ] **Step 2: Insert the section verbatim**

Insert the following block so it sits between the end of "## Content-Design Review Lens" (its closing blockquote) and the "## Operations" heading (one blank line before and after the inserted section):

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

- [ ] **Step 3: Verify placement and that nothing else changed**

Re-read the file region around the insertion. Confirm:
- The new `## Anti-Dependency Review Lens` heading sits after the Content-Design Review Lens's closing blockquote and before `## Operations`.
- No existing section was altered, reordered, or dropped (front-matter, Project Map, Style Conventions, Content-Design Review Lens, Operations, Cascade Checklist, Important Notes all intact).
- All four sub-headings (`### 1.` … `### 4.`) and all `- [ ]` checks are present, and the closing blockquote is present.

Run: `git diff --stat skills/tochka-sborki-update/SKILL.md`
Expected: one file changed, only insertions (no deletions).

- [ ] **Step 4: Commit**

```bash
git add skills/tochka-sborki-update/SKILL.md
git commit -m "docs(skill): anti-dependency review lens for authoring (fb_9f6458a284bc)"
```

---

## Self-Review

**Spec coverage:**
- New `## Anti-Dependency Review Lens` section in the authoring skill → Task 1 (Step 2). ✓
- 4 principles as `- [ ]` checks with cross-references → Task 1 (Step 2) verbatim block. ✓
- Placement after Content-Design Review Lens, before Operations → Task 1 (Steps 1, 3). ✓
- Additive, no other section changed → Task 1 (Step 3). ✓
- Approved copy verbatim → Task 1 (Step 2). ✓
- No automated test (skill Markdown) → review verification via Step 3. ✓
- Carve (no wellbeing-nudge / learner-surface / dark-pattern guard / engine) → respected. ✓

**Placeholder scan:** none — the full section is inline and complete.

**Type consistency:** N/A (Markdown). The cross-referenced artifacts (Personal Learning Plan, Companion Charter, learn-with-AI handoff, the progression ladder, the optional tracks, clarity-first) are real, shipped names.
