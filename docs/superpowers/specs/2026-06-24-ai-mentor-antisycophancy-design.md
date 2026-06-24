# AI-mentor anti-sycophancy persona — Design

**Ticket:** `fb_e3d6506231a8` (AI-mentor persona: warm-but-firm, anti-sycophantic — hold the
standard, don't flatter).

**Date:** 2026-06-24

## Goal

Bake an explicit anti-sycophancy + caring-firmness contract into the course's two live
mentor prompt builders, so the learner's own agent (and the standing companion role) holds
the standard and pushes back honestly instead of flattering. LLMs are sycophantic by
default; the persona must counter that while staying warm ("caring, compassionate, kind —
but firm"), de-guru'd from the source framing.

## Scope (carved by honest triage of the B3 pedagogy batch)

This is one slice of the B3 pedagogy-doctrine cluster. Honest triage split that cluster by
landing surface; this slice is the only one with a **live code consumer**:

- **In scope:** the anti-sycophancy/firmness contract in the two web prompt builders
  (`lib/intake/companion-role-prompt.ts` — memory layer; `lib/learn-prompt.ts` — session
  layer), both of which are shipped and tested.
- **Out of scope (deferred):**
  - The Telegram bot (`fb_5e4afe37`) — verified: its `/ask` is lead-capture, not an
    AI-mentor LLM reply, so there is no mentor persona to contract. Excluded.
  - Doctrine corpus / authoring-checklist tickets (`fb_cea25e03d3db`, `fb_9f6458a284bc`,
    `fb_33cc76000a86`, `fb_66e487821773`) — these feed the **unbuilt** authoring engine
    (`fb_8e8eaf0a`); their artifact is a doc, not a feature.
  - Facilitation learner-state adaptation (`fb_c3471241279e`) — the prompts don't model
    learner state yet.
  - Course transformation retrofit (`fb_c4396f1b830a`).

## Architecture

A single shared source of truth for the firmness voice, imported by both builders, so the
persona cannot drift between the memory-layer and session-layer surfaces. The contract is
**additive** — it adds a tone directive and does not alter the existing co-thinking, Kolb,
scaffolding, or bonding behavior of either prompt.

## Components

### `LMS/tochka-sborki/web/lib/mentor-persona.ts` (new)

Two bilingual functions — one full, one compact (for the length-capped bootstrap):

```ts
import type { Locale } from './dictionaries'

/** Full warm-but-firm, anti-sycophancy contract (1–2 sentences). For the standing
 *  companion role and the full learn prompt. De-guru'd; caring-firmness, not coldness. */
export function mentorFirmness(locale: Locale): string {
  return locale === 'en'
    ? 'Be warm but firm: support me without flattering. Hold the standard — if I am wrong or cutting corners, tell me plainly instead of validating everything. Honest truth helps me more than pleasant agreement.'
    : 'Будь тёплым, но твёрдым: поддерживай, не льстя. Держи планку — если я ошибаюсь или халтурю, скажи прямо, а не подтверждай всё подряд. Честная правда полезнее приятного согласия.'
}

/** Compact clause for the space-capped bootstrap deep-link persona line (~30 chars). */
export function mentorFirmnessCompact(locale: Locale): string {
  return locale === 'en'
    ? "be honest, don't flatter, hold the standard"
    : 'будь честным, не льсти, держи планку'
}
```

The `Locale` type is `'ru' | 'en'`. Note `learn-prompt.ts` imports `Locale` from
`./dictionaries`; `companion-role-prompt.ts` imports it from `./types`. The new module
sits at `lib/mentor-persona.ts`, so it imports `Locale` from `./dictionaries` (same
directory level as `learn-prompt.ts`).

### `LMS/tochka-sborki/web/lib/learn-prompt.ts` (modified)

- `buildLearnPrompt` (full clipboard charter): add `mentorFirmness(i.locale)` as its own
  line in the `lines[]` array, placed just after the opening co-thinking-laws line (the
  `'Ты — мой со-мыслящий партнёр…'` / `'You are my co-thinking learning partner…'` line),
  with a blank-line separator. Both the ru and en branches.
- `buildBootstrapDeepLink` (compact, capped at `MAX_BOOTSTRAP = 1500`): append
  `mentorFirmnessCompact(i.locale)` into the persona/co-thinking clause before the final
  `cap(text, MAX_BOOTSTRAP)`. The compact form is ~30 chars; `cap()` still guards the
  total length.

### `LMS/tochka-sborki/web/lib/intake/companion-role-prompt.ts` (modified)

Add `mentorFirmness(locale)` to **both** branches so the standing role always carries the
contract:

- Guest branch (no profile): add it to the "Laws"/"Законы" area — either extend the
  `Законы: …` / `Laws: …` line or add it as an adjacent line.
- Profile branch: add it to the closing directive block (after the charter, alongside the
  "lead me through the loop / keep the charter across sessions" line).

Import path: `companion-role-prompt.ts` is in `lib/intake/`, so it imports from
`../mentor-persona`.

## Data flow

No runtime/data-flow change. These are pure string builders; the contract is concatenated
into the assembled prompt the learner copies (or pastes once into persistent memory). No
endpoint, no storage, no network.

## Error handling

Pure functions over a closed `Locale` union; no failure modes. The only quantitative
guard is the bootstrap length cap, enforced by `cap()` and asserted by a test.

## Testing

- **`lib/mentor-persona.test.ts` (new):** `mentorFirmness` and `mentorFirmnessCompact`
  each return a non-empty string for `'ru'` and `'en'`; each contains an anti-flattery
  marker (ru: `льст`; en: `flatter`); `mentorFirmness(l) !== mentorFirmnessCompact(l)` for
  both locales.
- **`lib/intake/companion-role-prompt.test.ts` (extended):** for both branches (guest +
  profile) and both locales, the built prompt contains the firmness marker (ru: `льст`;
  en: `flatter`). Existing assertions stay green.
- **`lib/learn-prompt.test.ts` (extended):** `buildLearnPrompt` output contains the
  firmness marker (ru + en); `buildBootstrapDeepLink` output contains the compact marker
  (ru: `льст`; en: `flatter`) AND its length is `<= MAX_BOOTSTRAP`. Existing assertions
  stay green.

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/mentor-persona.test.ts lib/intake/companion-role-prompt.test.ts lib/learn-prompt.test.ts`
(and the full `npx vitest run` to confirm nothing else regressed).

## Global constraints

- Bilingual ru + en in every added string and every builder branch.
- Authenticity: the contract is about honesty and holding the standard, NOT rudeness —
  "warm but firm" (caring-firmness), never cold or harsh.
- Bootstrap length: `buildBootstrapDeepLink` output must stay `<= MAX_BOOTSTRAP` (1500).
- Additive only: do not change the existing co-thinking / Kolb / scaffolding / bonding
  content of either builder — only add the tone contract.
- Single source of truth: both builders import the contract from `lib/mentor-persona.ts`
  (no inline duplication, so the persona cannot drift).

## Files

| File | Responsibility |
|---|---|
| `lib/mentor-persona.ts` | shared bilingual firmness contract (full + compact) |
| `lib/mentor-persona.test.ts` | unit tests for the two functions |
| `lib/learn-prompt.ts` | inject contract into `buildLearnPrompt` + `buildBootstrapDeepLink` |
| `lib/learn-prompt.test.ts` | assert contract present + bootstrap ≤ cap |
| `lib/intake/companion-role-prompt.ts` | inject contract into both branches |
| `lib/intake/companion-role-prompt.test.ts` | assert contract present in both branches |

## Out of scope

- Telegram bot persona (no mentor LLM reply exists).
- Doctrine corpus / authoring checklist (feeds the unbuilt authoring engine).
- Facilitation learner-state archetypes.
- Course transformation retrofit.
- Any change to scaffolding modes, bonding lines, Kolb framing, or the co-thinking laws
  themselves.
