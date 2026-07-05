# Синергема mentor — sovereign group-facilitation prompt-builder

**Ticket:** fb_c3a3d02458df (#2 of the "all" sequence; a synergem-epic pillar)
**Date:** 2026-07-04
**Status:** approved

## Goal

Ship a **self-contained, sovereign** synergem-mentor: a prompt-builder
(`buildSynergemMentorPrompt`) that produces a group-facilitation role-prompt a
синергема pastes into their OWN agent — the group variant of the shipped
`buildCompanionRolePrompt`. It reuses the warm-but-firm anti-sycophancy mentor
persona (`lib/mentor-persona.ts`) and the anti-dependency ethic, and renders
on the live `/alumni` synergem surface. No backend, no per-cluster data, no
hosted LLM.

## Context (grep-verified)

- **`lib/mentor-persona.ts`** is the single source of truth for the mentor's
  warm-but-firm, anti-sycophancy voice: `mentorFirmness(locale)` +
  `mentorStateAdaptation(locale)` (4 learner-state archetypes as keyed data).
  Both prompt builders import it so the persona can't drift. **REUSE — never
  duplicate.**
- **`lib/intake/companion-role-prompt.ts`** `buildCompanionRolePrompt(profile,
  locale)` is the exact precedent: a role-prompt the learner pastes ONCE into
  their agent's persistent memory. Composed of a header + role sentence +
  `mentorFirmness` + `mentorStateAdaptation` + `academyCompanionLayer` + a
  closing "start with one question" line. Sovereign — the learner's own agent
  runs it; no hosted LLM.
- **`lib/academy/companion.ts`** `academyCompanionLayer` + `PEER_PRINCIPLES`
  is the engine+keyed-data precedent (bilingual `directive` data + a builder).
- **Synergem surface:** `/alumni` (`components/alumni-client.tsx`) already
  hosts the self-contained `IgiRitual` card; the synergem-mentor card sits
  beside it.

## Scope decision (the tension resolved)

The ticket's aspirational framing ("analyzes member-development patterns,
adapts to group dynamics") presupposes a formed cluster + a member-development
data store + live group state — none of which exist (matching shipped, but no
membership/state backend, no per-cluster data, no hosted LLM). That is a
deeper dormant sub-project.

**Buildable now (this spec):** the sovereign group-mentor **prompt-builder** —
the group runs it in their own agent, bringing their own context. **Deferred:**
a live per-cluster mentor that ingests member-development data + real group
state (needs the dormant membership/tracking backend).

## Constraints

- **Reuse `mentorFirmness`** from `lib/mentor-persona.ts` — do not duplicate
  the persona. Anti-dependency / graduation-not-retention ethic.
- **Engine + keyed-data:** `Bi { ru; en }` group-dynamics moves + a builder,
  mirroring `PEER_PRINCIPLES` / `LEARNER_STATES`. `Bi` from `@/lib/course`;
  `Locale` from `@/lib/dictionaries`.
- **Sovereign:** no hosted LLM — the group's own agent runs the prompt.
- **Authenticity / de-hustle:** every string passes `lintDehustle` (`[]` =
  clean). No manipulation/urgency/scarcity/vanity.
- **Live surface:** renders on `/alumni` (content-track-on-live-surface).
- **No-Mermaid; sole-prop; trunk-based** on `main`; TDD; commit per task.

## Architecture

### 1. `lib/synergem-mentor.ts` — engine + keyed-data + builder

```ts
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'
import { mentorFirmness } from '@/lib/mentor-persona'

export interface GroupMove { key: string; directive: Bi }

export const GROUP_MOVES: GroupMove[] = [ /* 5, below */ ]

export function buildSynergemMentorPrompt(locale: Locale): string
```

`buildSynergemMentorPrompt` composes (mirror `buildCompanionRolePrompt`
guest branch): header + role sentence + a "how to lead the group" bulleted
list of the 5 `GROUP_MOVES` directives + `mentorFirmness(locale)` (reused) +
a closing one-question line. Generic — the group brings its own context (the
shared effort it gathered around); no data injection.

#### Exact `GROUP_MOVES` content (owner-authored draft — confirm at spec review)

1. `voices`
   - ru: `Балансируй эфирное время: вытягивай тихих одним конкретным вопросом, мягко притормаживай тех, кто заполняет всё собой.`
   - en: `Balance the airtime: draw out the quiet with one concrete question, gently slow those who fill all the space.`
2. `friction`
   - ru: `Разногласие — топливо: не гаси его и не давай перейти на личности; спроси, какой вопрос стоит за спором.`
   - en: `Disagreement is fuel: don't smother it and don't let it turn personal; ask what question sits underneath the argument.`
3. `goal`
   - ru: `Возвращай группу к общему усилию, вокруг которого вы собрались; мягко отсекай уводящее в сторону.`
   - en: `Bring the group back to the shared effort you gathered around; gently cut what drifts away.`
4. `rotate`
   - ru: `Не давай роли ведущего залипнуть на одном человеке — предлагай передавать ведение по кругу.`
   - en: `Don't let the facilitator role stick to one person — suggest passing the lead around the circle.`
5. `graduation`
   - ru: `Расти группу к автономии: цель — чтобы синергема вела себя сама, без тебя. Меньше веди — больше передавай.`
   - en: `Grow the group toward autonomy: the goal is for the synergem to lead itself, without you. Lead less — hand off more.`

#### Exact prompt shape (`buildSynergemMentorPrompt`)

**ru:**
```
# ИИ-наставник нашей синергемы

Запомни эту роль на все наши будущие встречи. Ты — ведущий-наставник нашей синергемы: автономной группы соучеников, что собрались вокруг общего усилия и усиливают друг друга.

Твоя работа — вести групповую динамику, а не давать ответы за нас. Веди встречу к общему инсайту и следующему шагу; держи фокус на усилии, вокруг которого мы собрались.

Как вести группу:
- <GROUP_MOVES[voices].ru>
- <friction.ru>
- <goal.ru>
- <rotate.ru>
- <graduation.ru>

<mentorFirmness('ru')>

Начни с одного вопроса: над чем синергема работает сейчас и кто ещё не высказался.
```

**en:** the mirror, header `# AI mentor for our synergem`, closing `Start with
one question: what the synergem is working on now and who hasn't spoken yet.`

### 2. `components/synergem-mentor.tsx` — live card on `/alumni`

- **`'use client'`** (needs a copy button). Props `{ locale: Locale }`; calls
  `buildSynergemMentorPrompt(locale)`. Mirrors `IgiRitual` chrome (a
  `<section>` with heading + short intro), plus the role-prompt in a
  `<pre>`/monospace block and a "Copy" button (mirror the
  `components/intake/companion-setup.tsx` copy affordance). Inline CSS-vars.
- A short intro line: the group pastes this into their own shared agent; the
  mentor facilitates, it doesn't decide for the group (sovereign, anti-dependency).

### 3. Wire into `components/alumni-client.tsx`

One import + one `<SynergemMentor locale={locale} />` element, placed after
the existing `<IgiRitual locale={locale} />` (both are self-contained synergem
tools). No other change.

## Testing

- `lib/synergem-mentor.test.ts` (env=node):
  - `GROUP_MOVES` has exactly 5 entries; keys unique and equal
    `['voices','friction','goal','rotate','graduation']`.
  - `buildSynergemMentorPrompt('ru'|'en')` returns a non-empty string that
    contains: the header, every one of the 5 directives (for that locale),
    and the `mentorFirmness(locale)` fragment (proves the persona is reused,
    not duplicated).
  - a sampled output differs between ru and en.
  - de-hustle: `lintDehustle` returns `[]` for every `GROUP_MOVES` directive
    (both locales) and for the full built prompt (both locales).
- Component: build-validated (`npx tsc --noEmit` + `npx next build`), no unit
  test (mirror `IgiRitual` precedent).

## Decomposition → SDD tasks (writing-plans finalizes)

1. `lib/synergem-mentor.ts` engine + keyed-data + builder + `lib/synergem-mentor.test.ts`.
2. `components/synergem-mentor.tsx` + wire into `alumni-client.tsx`, build-validated.

## Out of scope

- A live per-cluster mentor that ingests member-development data / real group
  state (needs the dormant membership + development-tracking backend).
- Any hosted per-synergem LLM; injecting cluster membership/data into the
  prompt.
- Duplicating the mentor persona (reuse `mentor-persona.ts`).
- Any nonprofit framing.
