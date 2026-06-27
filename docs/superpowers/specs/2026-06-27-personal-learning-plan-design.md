# Personal Learning Plan generator — Design

**Ticket:** `fb_8724dc87679d` (Personal Learning Plan generator from intake:
goal/status/steps/experiential/accountability/review).

**Date:** 2026-06-27

## Goal

Generate a living, learner-owned Personal Learning Plan (PLP) from the intake profile — the
Edupunks' Guide 6-part plan (Goal+deadline / Current status / Learning steps / Experiential steps
/ Who-can-help / Review cadence) — rendered as a copyable Markdown card on `/character`. It
composes data already shipped (the F3 outcome, the quest-log zones with their micro-transformations,
the optional exercise tracks, the companion) into a DIY artifact the learner takes with them
("resources in your hands" — the anti-dependency thread, `fb_9f6458a284bc`; a LEARN-frame
artifact).

## Scope (carved by honest triage)

Distinct from the companion charter (`profileToCharter` → identity/role prompt) — the PLP is an
actionable plan. It mirrors the charter's builder+card pattern (`buildCompanionCharter` /
`CharterCard`): a pure Markdown builder + a `'use client'` card with copy-to-clipboard.

- **In scope:** a `lib/intake/learning-plan.ts` builder (`buildLearningPlan` pure + generic;
  `profileToLearningPlan` wrapper supplying Точка Сборки defaults) + tests; a
  `components/intake/learning-plan-card.tsx` (`<pre>` + copy, mirroring `CharterCard`) wired into
  `ProfileClient` on `/character`.
- **Out of scope (carved):**
  - A deadline input / persistence (deadline is a learner-fill blank `___`; intake captures no
    deadline — no fabrication).
  - Fake community / office-hours (those are planned tickets — the plan does NOT promise them;
    accountability names only what exists: companion, `/ask`, "find one person").
  - A dedicated `/plan` route (YAGNI — the card lives on `/character` beside the charter).
  - Editable / DB-persisted plan (DIY = copy-out, not stored; consistent with the charter).
  - Re-shipping referenced mechanisms (transformations, tracks, companion — all shipped).

## Architecture

Mirror of `charter.ts` + `charter-card.tsx`:

1. **Builder** `lib/intake/learning-plan.ts`:
   - `buildLearningPlan(input)` — pure, generic, returns the 6-section Markdown string. Localized
     headers/connectives/fixed text live here; variable items arrive pre-localized.
   - `profileToLearningPlan(profile, zones, locale)` — wrapper deriving the input from the saved
     profile + the quest-log zones, supplying Точка Сборки experiential/accountability defaults.
2. **Card** `components/intake/learning-plan-card.tsx` — `'use client'`, renders the Markdown in a
   `<pre>` with a copy button (mirrors `CharterCard`).
3. **Wiring** — `ProfileClient` already builds `vm = buildQuestLog(...)`; it passes `profile` +
   `vm.zones` to `<LearningPlanCard>`.

## Components

### `lib/intake/learning-plan.ts` (new)

```ts
import type { Locale } from './types'
import type { ZoneVM } from '@/lib/rpg/types'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { parseOutcome } from './parse-outcome'

export interface PlanStep { name: string; transform?: { from: string; to: string } }

export interface LearningPlanInput {
  locale: Locale
  outcome: string | null
  niche: string | null
  level: number
  completedCount: number
  total: number
  steps: PlanStep[]          // current + next todo modules (already ordered)
  experiential: string[]     // pre-localized bullet lines
  accountability: string[]   // pre-localized bullet lines
}

export function buildLearningPlan(i: LearningPlanInput): string {
  const ru = i.locale !== 'en'
  const t = ru ? {
    title: 'Личный план обучения',
    goal: '🎯 Цель', outcomeFallback: '— (впиши свой результат)', deadline: 'Дедлайн: ___ (поставь свой)',
    status: '📍 Где я сейчас', field: 'Сфера', level: 'уровень', doneA: 'пройдено', doneB: 'из', doneC: 'модулей',
    steps: '📚 Шаги обучения (следующие)', from: 'из', to: 'в', allDone: 'Все модули пройдены — выбери, что углубить.',
    exp: '🛠 Шаги через опыт', help: '🤝 Кто может помочь',
    review: '🔁 Ревью',
    reviewBody: 'После каждого модуля вернись к этому плану и обнови. Раз в неделю спроси себя: что сдвинулось, что застряло, какой следующий шаг.',
    closing: 'Этот план — твой. Скопируй его, держи под рукой, переписывай по мере роста.',
  } : {
    title: 'Personal Learning Plan',
    goal: '🎯 Goal', outcomeFallback: '— (write your own outcome)', deadline: 'Deadline: ___ (set your own)',
    status: '📍 Where I am now', field: 'Field', level: 'level', doneA: '', doneB: 'of', doneC: 'modules done',
    steps: '📚 Learning steps (next)', from: 'from', to: 'to', allDone: 'All modules done — pick what to deepen.',
    exp: '🛠 Experiential steps', help: '🤝 Who can help',
    review: '🔁 Review',
    reviewBody: 'After each module, return to this plan and update it. Once a week, ask yourself: what moved, what is stuck, what is the next step.',
    closing: 'This plan is yours. Copy it, keep it close, rewrite it as you grow.',
  }

  const statusLine = ru
    ? `${t.field}: ${i.niche ?? '—'} · ${t.level} ${i.level} · ${t.doneA} ${i.completedCount} ${t.doneB} ${i.total} ${t.doneC}`
    : `${t.field}: ${i.niche ?? '—'} · ${t.level} ${i.level} · ${i.completedCount} ${t.doneB} ${i.total} ${t.doneC}`

  const stepsBlock = i.steps.length
    ? i.steps.map(s => `- ${s.name}${s.transform ? `: ${t.from} ${s.transform.from} → ${t.to} ${s.transform.to}` : ''}`).join('\n')
    : t.allDone

  return [
    `# ${t.title}`,
    ``,
    `## ${t.goal}`,
    i.outcome ?? t.outcomeFallback,
    t.deadline,
    ``,
    `## ${t.status}`,
    statusLine,
    ``,
    `## ${t.steps}`,
    stepsBlock,
    ``,
    `## ${t.exp}`,
    i.experiential.map(e => `- ${e}`).join('\n'),
    ``,
    `## ${t.help}`,
    i.accountability.map(a => `- ${a}`).join('\n'),
    ``,
    `## ${t.review}`,
    t.reviewBody,
    ``,
    `> ${t.closing}`,
  ].join('\n')
}

export function profileToLearningPlan(profile: any, zones: ZoneVM[], locale: Locale): string {
  const ru = locale !== 'en'
  const completedCount = zones.filter(z => z.status === 'completed').length
  const curIdx = zones.findIndex(z => z.status === 'current')
  const picked = curIdx >= 0 ? zones.slice(curIdx, curIdx + 3) : []
  const steps: PlanStep[] = picked.map(z => ({ name: z.zoneName, transform: z.transform }))

  const meta = SKINS_META[profile?.world_skin as keyof typeof SKINS_META]
  const companion = meta?.mentor?.name?.[locale] ?? (ru ? 'твой со-мыслящий напарник' : 'your co-thinking partner')

  const experiential = ru ? [
    'Упражнения 1–8 — закрепи навыки (/exercises)',
    'Опц. трек: упакуй свою экспертизу в продукт',
    'Опц. трек: задокументируй и автоматизируй свою практику',
  ] : [
    'Exercises 1–8 — consolidate the skills (/exercises)',
    'Optional track: package your expertise into a product',
    'Optional track: document and automate your practice',
  ]

  const accountability = ru ? [
    `${companion} — ИИ-напарник для со-мышления (устав на этой странице)`,
    'Спроси автора: команда /ask в боте',
    'Найди одного человека, кому покажешь прогресс',
  ] : [
    `${companion} — an AI partner for co-thinking (charter on this page)`,
    'Ask the author: the /ask command in the bot',
    'Find one person to show your progress to',
  ]

  return buildLearningPlan({
    locale,
    outcome: parseOutcome(profile),
    niche: profile?.niche ?? null,
    level: profile?.char_level ?? 1,
    completedCount,
    total: zones.length,
    steps,
    experiential,
    accountability,
  })
}
```

### `components/intake/learning-plan-card.tsx` (new)

Mirror of `CharterCard` — `'use client'`, `<pre>` + copy button.

```tsx
'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/intake/types'
import type { ZoneVM } from '@/lib/rpg/types'
import { profileToLearningPlan } from '@/lib/intake/learning-plan'

export function LearningPlanCard({ profile, zones, locale }: { profile: any; zones: ZoneVM[]; locale: Locale }) {
  const [copied, setCopied] = useState(false)
  const plan = profileToLearningPlan(profile, zones, locale)
  const t = locale === 'en'
    ? { title: 'Personal learning plan', copy: 'Copy plan', copied: 'Copied ✓' }
    : { title: 'Личный план обучения', copy: 'Скопировать план', copied: 'Скопировано ✓' }
  const btn: React.CSSProperties = { background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }

  return (
    <section style={{ maxWidth: 640, margin: '2rem auto 1rem', padding: '0 1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '.6rem' }}>{t.title}</h2>
      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', overflowX: 'auto', fontSize: '.8rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{plan}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: '1rem', flexWrap: 'wrap' }}>
        <button style={btn} onClick={async () => { try { await navigator.clipboard.writeText(plan); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }}>{copied ? t.copied : t.copy}</button>
      </div>
    </section>
  )
}
```

### `app/character/profile-client.tsx` (modified)

Add the import (next to `CharterCard`):

```tsx
import { LearningPlanCard } from '@/components/intake/learning-plan-card'
```

Render it after the map `<div>` (and the `TransformationArc`/`WorldMap`), before `<CharterCard>`:

```tsx
      <LearningPlanCard profile={profile} zones={vm.zones} locale={locale} />
      <CharterCard profile={profile} locale={locale} />
```

(`vm` and `profile` already exist in scope; no other change.)

## Data flow

Static / client. `ProfileClient` builds `vm` (quest-log) from the intake profile + progress; the
card derives the Markdown at render. Copy uses `navigator.clipboard`. No endpoint, no persistence.

## Error handling

`profileToLearningPlan` tolerates a sparse profile: `parseOutcome` returns `null` → goal
fallback; missing `niche`/`char_level` → `—` / `1`; no current zone (all done) → empty steps →
"all done" line. No throw.

## Authenticity (binding)

- DIY / learner-owned: the closing line ("this plan is yours … rewrite it as you grow") embodies
  anti-dependency (`fb_9f6458a284bc`) — copy-out, not locked in a DB.
- No fabricated deadline (learner-fill blank); no promised community/office-hours (only real
  accountability named).
- Honest status (real completed count, real niche/outcome or an explicit blank).

## Testing

- **`lib/intake/learning-plan.test.ts` (new):**
  - `buildLearningPlan` with a full synthetic input → the string contains the title, all 6
    section headers (`🎯 Цель`/`🎯 Goal` … `🔁 Ревью`/`🔁 Review`), the outcome, a step line with
    `из … → в …` / `from … → to …`, every experiential + accountability bullet, the review body,
    and the closing line.
  - `buildLearningPlan` with `outcome: null` → goal fallback present; with `steps: []` → the
    "all done" line present.
  - `profileToLearningPlan` with a fake profile (answers JSON with `F3`, `char_level`, `niche`,
    `world_skin`) + fake `zones` (a `current` + `todo` with `transform`, plus a `completed`) →
    outcome from F3, completed count correct, the current zone's name + transform present, the
    companion line present.
- The `LearningPlanCard` component is validated by `npm run build` (mirrors `CharterCard`, which
  is not unit-tested).

Run: `cd LMS/tochka-sborki/web && npx vitest run` and `npm run build`.

## Global constraints

- Files under `LMS/tochka-sborki/web/`. Static export.
- Bilingual ru + en (both branches in the builder + wrapper defaults).
- Mirror the established charter builder+card pattern; no new dependency.
- Additive: new builder + new card + a 2-line injection into `ProfileClient`; the charter,
  quest-log, World Map, transformation arc, and all existing `/character` content unchanged.
- Use the approved plan copy (above) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration, no DB.

## Files

| File | Responsibility |
|---|---|
| `lib/intake/learning-plan.ts` (new) | `buildLearningPlan` (pure) + `profileToLearningPlan` (wrapper, Точка defaults) |
| `lib/intake/learning-plan.test.ts` (new) | builder + wrapper composition tests |
| `components/intake/learning-plan-card.tsx` (new) | `<pre>` + copy card (mirror CharterCard) |
| `app/character/profile-client.tsx` | render `<LearningPlanCard>` before `<CharterCard>` |

## Out of scope

- Deadline input/persistence; fake community/office-hours; `/plan` route; editable/DB-stored
  plan; re-shipping transformations/tracks/companion.
