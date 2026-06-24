# AI-mentor Anti-sycophancy Persona Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bake a warm-but-firm, anti-sycophancy contract into the course's two live mentor prompt builders so the learner's agent (and the standing companion role) holds the standard and pushes back honestly instead of flattering.

**Architecture:** A single shared source of truth (`lib/mentor-persona.ts`) exports the bilingual firmness contract (full + compact). Both prompt builders import it and inject it additively — no change to existing co-thinking / Kolb / scaffolding / bonding content.

**Tech Stack:** TypeScript, Next.js 16 app under `LMS/tochka-sborki/web/`, vitest. Pure string-builder functions; no runtime/data/network change.

## Global Constraints

- All files are under `LMS/tochka-sborki/web/`. Run tests from there: `cd LMS/tochka-sborki/web && npx vitest run`.
- Bilingual: every added string and every builder branch (guest/profile, ru/en) carries the contract in both ru and en.
- **Verbatim contract wording** (from the spec — do not paraphrase):
  - `mentorFirmness` **en**: `Be warm but firm: support me without flattering. Hold the standard — if I am wrong or cutting corners, tell me plainly instead of validating everything. Honest truth helps me more than pleasant agreement.`
  - `mentorFirmness` **ru**: `Будь тёплым, но твёрдым: поддерживай, не льстя. Держи планку — если я ошибаюсь или халтурю, скажи прямо, а не подтверждай всё подряд. Честная правда полезнее приятного согласия.`
  - `mentorFirmnessCompact` **en**: `be honest, don't flatter, hold the standard`
  - `mentorFirmnessCompact` **ru**: `будь честным, не льсти, держи планку`
- Authenticity: warm-but-firm (caring-firmness), NOT rude or cold.
- Additive only: do NOT alter the existing co-thinking laws, Kolb framing, scaffolding modes, or bonding lines. Only add the tone contract.
- Single source of truth: both builders import the contract from `lib/mentor-persona.ts` (no inline duplication).
- `buildBootstrapDeepLink` output MUST stay `<= MAX_BOOTSTRAP` (1500).
- Test idiom: `import { describe, it, expect } from 'vitest'`. Anti-flattery marker — ru: `льст` (matches `льсти`/`льстя`); en: `flatter` (matches `flatter`/`flattering`).
- All existing tests must stay green.

---

### Task 1: Shared firmness contract (`lib/mentor-persona.ts`)

**Files:**
- Create: `LMS/tochka-sborki/web/lib/mentor-persona.ts`
- Test: `LMS/tochka-sborki/web/lib/mentor-persona.test.ts`

**Interfaces:**
- Consumes: `Locale` (`'ru' | 'en'`) from `./dictionaries` (existing).
- Produces:
  - `mentorFirmness(locale: Locale): string` — the full 1–2 sentence contract.
  - `mentorFirmnessCompact(locale: Locale): string` — the short clause.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/mentor-persona.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { mentorFirmness, mentorFirmnessCompact } from './mentor-persona'

describe('mentorFirmness', () => {
  it('returns a non-empty anti-flattery contract in both locales', () => {
    expect(mentorFirmness('ru')).toMatch(/льст/)
    expect(mentorFirmness('en')).toMatch(/flatter/)
    expect(mentorFirmness('ru').length).toBeGreaterThan(0)
    expect(mentorFirmness('en').length).toBeGreaterThan(0)
  })

  it('reads as caring-firmness, not coldness (warm marker present)', () => {
    expect(mentorFirmness('ru')).toMatch(/тёплым|поддерживай/)
    expect(mentorFirmness('en')).toMatch(/warm|support/)
  })
})

describe('mentorFirmnessCompact', () => {
  it('returns a short anti-flattery clause in both locales', () => {
    expect(mentorFirmnessCompact('ru')).toMatch(/льст/)
    expect(mentorFirmnessCompact('en')).toMatch(/flatter/)
  })

  it('is shorter than the full contract and distinct from it', () => {
    for (const l of ['ru', 'en'] as const) {
      expect(mentorFirmnessCompact(l).length).toBeLessThan(mentorFirmness(l).length)
      expect(mentorFirmnessCompact(l)).not.toBe(mentorFirmness(l))
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/mentor-persona.test.ts`
Expected: FAIL — `Failed to resolve import './mentor-persona'`.

- [ ] **Step 3: Write the implementation**

Create `LMS/tochka-sborki/web/lib/mentor-persona.ts`:

```ts
// web/lib/mentor-persona.ts
// Single source of truth for the mentor's warm-but-firm, anti-sycophancy voice.
// Imported by both prompt builders (learn-prompt.ts session layer + intake/
// companion-role-prompt.ts memory layer) so the persona can't drift between surfaces.
// De-guru'd: caring-firmness, never rude or cold.
import type { Locale } from './dictionaries'

/** Full warm-but-firm, anti-sycophancy contract (1–2 sentences). */
export function mentorFirmness(locale: Locale): string {
  return locale === 'en'
    ? 'Be warm but firm: support me without flattering. Hold the standard — if I am wrong or cutting corners, tell me plainly instead of validating everything. Honest truth helps me more than pleasant agreement.'
    : 'Будь тёплым, но твёрдым: поддерживай, не льстя. Держи планку — если я ошибаюсь или халтурю, скажи прямо, а не подтверждай всё подряд. Честная правда полезнее приятного согласия.'
}

/** Compact clause for the space-capped bootstrap deep-link persona line (~30–45 chars). */
export function mentorFirmnessCompact(locale: Locale): string {
  return locale === 'en'
    ? "be honest, don't flatter, hold the standard"
    : 'будь честным, не льсти, держи планку'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/mentor-persona.test.ts`
Expected: PASS — all four cases green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/mentor-persona.ts LMS/tochka-sborki/web/lib/mentor-persona.test.ts
git commit -m "feat(lms): shared mentor anti-sycophancy firmness contract"
```

---

### Task 2: Inject contract into `learn-prompt.ts`

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/learn-prompt.ts`
- Test: `LMS/tochka-sborki/web/lib/learn-prompt.test.ts`

**Interfaces:**
- Consumes: `mentorFirmness`, `mentorFirmnessCompact` from `./mentor-persona` (Task 1).
- Produces: no new exports — `buildLearnPrompt` and `buildBootstrapDeepLink` now carry the contract.

The session-layer prompt. `buildLearnPrompt` assembles a `lines[]` array (ru branch and en branch); inject the full contract right after the opening co-thinking line. `buildBootstrapDeepLink` is length-capped (`MAX_BOOTSTRAP = 1500`); inject the compact clause into the persona sentence before the final `cap()`.

- [ ] **Step 1: Write the failing test**

Append to `LMS/tochka-sborki/web/lib/learn-prompt.test.ts` (inside the existing file; add as new `it` blocks within the relevant `describe`, or a new `describe`):

```ts
describe('anti-sycophancy contract', () => {
  it('buildLearnPrompt carries the firmness contract (ru + en)', () => {
    expect(buildLearnPrompt(base)).toMatch(/льст/)
    expect(buildLearnPrompt({ ...base, locale: 'en' })).toMatch(/flatter/)
  })

  it('buildBootstrapDeepLink carries the compact clause and stays within the cap', () => {
    const ru = buildBootstrapDeepLink(base)
    const en = buildBootstrapDeepLink({ ...base, locale: 'en' })
    expect(ru).toMatch(/льст/)
    expect(en).toMatch(/flatter/)
    expect(ru.length).toBeLessThanOrEqual(1500)
    expect(en.length).toBeLessThanOrEqual(1500)
  })
})
```

(`base`, `buildLearnPrompt`, `buildBootstrapDeepLink` are already imported/defined at the top of this test file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/learn-prompt.test.ts`
Expected: FAIL — the new `льст`/`flatter` assertions fail (contract not yet present).

- [ ] **Step 3: Add the import**

At the top of `LMS/tochka-sborki/web/lib/learn-prompt.ts`, after the existing imports (the file already imports from `./cs/types`, `./dictionaries`, `./intake/types`), add:

```ts
import { mentorFirmness, mentorFirmnessCompact } from './mentor-persona'
```

- [ ] **Step 4: Inject the compact clause into `buildBootstrapDeepLink`**

In `buildBootstrapDeepLink`, the `text` is built from a `persona` string plus a co-thinking parenthetical. Find the ru and en template literals. Append the compact clause to the co-thinking parenthetical in each.

Change the **ru** opening fragment from:

```ts
    ? `${persona}, мой наставник со-мышления (не пиши и не решай за меня — веди меня думать). ` +
```
to:
```ts
    ? `${persona}, мой наставник со-мышления (не пиши и не решай за меня — веди меня думать; ${mentorFirmnessCompact(i.locale)}). ` +
```

Change the **en** opening fragment from:

```ts
    : `${persona}, my co-thinking mentor (don't write or decide for me — guide me to think). ` +
```
to:
```ts
    : `${persona}, my co-thinking mentor (don't write or decide for me — guide me to think; ${mentorFirmnessCompact(i.locale)}). ` +
```

The function already ends with `return cap(text, MAX_BOOTSTRAP)`, so the length guard is preserved.

- [ ] **Step 5: Inject the full contract into `buildLearnPrompt`**

In `buildLearnPrompt`, the **ru** branch builds a `lines` array whose first element is the opening co-thinking line (`'Ты — мой со-мыслящий партнёр…'`) followed by `''`. Insert the contract as a new line right after that opening line. Change the start of the ru `lines` array from:

```ts
    const lines = [
      'Ты — мой со-мыслящий партнёр по обучению, не репетитор и не «сделай за меня». Мы co-thinking и co-working: инструмент и роль человека разделены — ты держишь рамку и задаёшь вопросы, а смысл, выбор и решения остаются за мной.',
      '',
```
to:
```ts
    const lines = [
      'Ты — мой со-мыслящий партнёр по обучению, не репетитор и не «сделай за меня». Мы co-thinking и co-working: инструмент и роль человека разделены — ты держишь рамку и задаёшь вопросы, а смысл, выбор и решения остаются за мной.',
      '',
      mentorFirmness(i.locale),
      '',
```

In the **en** branch, change the start of its `lines` array from:

```ts
  const lines = [
    'You are my co-thinking learning partner — not a tutor and not a "do-it-for-me." We co-think and co-work: tool and human role are separate — you hold the frame and ask questions, while meaning, choices, and decisions stay with me.',
    '',
```
to:
```ts
  const lines = [
    'You are my co-thinking learning partner — not a tutor and not a "do-it-for-me." We co-think and co-work: tool and human role are separate — you hold the frame and ask questions, while meaning, choices, and decisions stay with me.',
    '',
    mentorFirmness(i.locale),
    '',
```

The existing `.replace(/\n{3,}/g, '\n\n')` collapses any extra blank lines, so spacing stays clean. Do not touch the Kolb / learning-loop / bonding / mode lines.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/learn-prompt.test.ts`
Expected: PASS — the new contract assertions pass AND all pre-existing `buildLearnPrompt`/`buildBootstrapDeepLink`/`agentUrl` assertions stay green.

- [ ] **Step 7: Commit**

```bash
git add LMS/tochka-sborki/web/lib/learn-prompt.ts LMS/tochka-sborki/web/lib/learn-prompt.test.ts
git commit -m "feat(lms): firmness contract in learn prompt + bootstrap"
```

---

### Task 3: Inject contract into `companion-role-prompt.ts`

**Files:**
- Modify: `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.ts`
- Test: `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.test.ts`

**Interfaces:**
- Consumes: `mentorFirmness` from `../mentor-persona` (Task 1).
- Produces: no new exports — `buildCompanionRolePrompt` now carries the contract in both the guest and profile branches.

The memory-layer standing role. `buildCompanionRolePrompt` has a guest branch (no profile) and a profile branch, each with a ru and en variant. Add the contract to all four so the standing role always carries it.

- [ ] **Step 1: Write the failing test**

Append to `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.test.ts` a new `describe`:

```ts
describe('anti-sycophancy contract', () => {
  it('carries the firmness contract in the profile branch (ru + en)', () => {
    expect(buildCompanionRolePrompt(profile, 'ru')).toMatch(/льст/)
    expect(buildCompanionRolePrompt(profile, 'en')).toMatch(/flatter/)
  })

  it('carries the firmness contract in the guest branch (ru + en)', () => {
    expect(buildCompanionRolePrompt(null, 'ru')).toMatch(/льст/)
    expect(buildCompanionRolePrompt(null, 'en')).toMatch(/flatter/)
  })
})
```

(`buildCompanionRolePrompt` and `profile` are already imported/defined at the top of this test file.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/intake/companion-role-prompt.test.ts`
Expected: FAIL — the four new `льст`/`flatter` assertions fail.

- [ ] **Step 3: Add the import**

At the top of `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.ts`, after the existing imports (`./types`, `./charter`), add:

```ts
import { mentorFirmness } from '../mentor-persona'
```

- [ ] **Step 4: Inject into the guest branch (both locales)**

In the `if (!profile) { return ru ? [...] : [...] }` block, add the contract as a line right after the "Laws"/"Законы" line in each array.

**ru** guest — change:

```ts
          `Законы: co-thinking, не «сделай за меня»; решение и голос всегда за мной; меньше помощи — больше рост.`,
          ``,
          `Начни с одного вопроса: над чем я сейчас работаю.`,
```
to:
```ts
          `Законы: co-thinking, не «сделай за меня»; решение и голос всегда за мной; меньше помощи — больше рост.`,
          ``,
          mentorFirmness(locale),
          ``,
          `Начни с одного вопроса: над чем я сейчас работаю.`,
```

**en** guest — change:

```ts
          `Laws: co-thinking, not "do it for me"; the decision and the voice always stay with me; less help — more growth.`,
          ``,
          `Start with one question: what I'm working on right now.`,
```
to:
```ts
          `Laws: co-thinking, not "do it for me"; the decision and the voice always stay with me; less help — more growth.`,
          ``,
          mentorFirmness(locale),
          ``,
          `Start with one question: what I'm working on right now.`,
```

- [ ] **Step 5: Inject into the profile branch (both locales)**

In the profile branch (after `const charter = profileToCharter(profile, locale)`), add the contract into the closing directive block of each array, right before the final loop-directive line.

**ru** profile — change:

```ts
        `---`,
        `Когда я приношу урок или задачу — веди по циклу: намерение → системное мышление → дизайн → шаг → todo. Держи устав между сессиями; начни с вопроса, над чем я сейчас работаю.`,
```
to:
```ts
        `---`,
        mentorFirmness(locale),
        ``,
        `Когда я приношу урок или задачу — веди по циклу: намерение → системное мышление → дизайн → шаг → todo. Держи устав между сессиями; начни с вопроса, над чем я сейчас работаю.`,
```

**en** profile — change:

```ts
        `---`,
        `When I bring a lesson or task, lead me through the loop: intent → systems thinking → design → step → todo. Keep the charter across sessions; start by asking what I'm working on now.`,
```
to:
```ts
        `---`,
        mentorFirmness(locale),
        ``,
        `When I bring a lesson or task, lead me through the loop: intent → systems thinking → design → step → todo. Keep the charter across sessions; start by asking what I'm working on now.`,
```

Do not touch the charter, the persistent-memory directive, or the co-thinking laws themselves.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/intake/companion-role-prompt.test.ts`
Expected: PASS — the four new assertions pass AND all pre-existing assertions (charter identity, persistent-memory directive, co-thinking law, generic fallback, English variant) stay green.

- [ ] **Step 7: Run the full suite**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — the whole web suite green (mentor-persona, learn-prompt, companion-role-prompt, and everything else).

- [ ] **Step 8: Commit**

```bash
git add LMS/tochka-sborki/web/lib/intake/companion-role-prompt.ts LMS/tochka-sborki/web/lib/intake/companion-role-prompt.test.ts
git commit -m "feat(lms): firmness contract in standing companion role (both branches)"
```

---

## Out of scope

- Telegram bot persona (its `/ask` is lead-capture, no mentor LLM reply).
- Doctrine corpus / authoring checklist (feeds the unbuilt authoring engine `fb_8e8eaf0a`).
- Facilitation learner-state archetypes (`fb_c3471241279e`).
- Course transformation retrofit (`fb_c4396f1b830a`).
- Any change to scaffolding modes, bonding lines, Kolb framing, or the co-thinking laws.
