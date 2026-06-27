# Personal Learning Plan Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate a learner-owned, copyable Personal Learning Plan (the Edupunks 6-part plan) from the intake profile + quest-log zones, rendered as a card on `/character`.

**Architecture:** Mirror of the existing charter builder+card. A pure Markdown builder (`buildLearningPlan`) + a profile wrapper (`profileToLearningPlan`, supplying Точка Сборки defaults) in `lib/intake/learning-plan.ts`; a `'use client'` card (`learning-plan-card.tsx`, `<pre>` + copy) wired into `ProfileClient`. Additive — no existing behavior changes.

**Tech Stack:** Next.js (static export), TypeScript, Vitest.

## Global Constraints

- Files under `LMS/tochka-sborki/web/`. Static export. Run tests from there: `npx vitest run`. Build: `npm run build`.
- Bilingual ru + en (both branches in the builder + wrapper defaults).
- Mirror the established charter builder+card pattern (`lib/intake/charter.ts` + `components/intake/charter-card.tsx`); no new dependency.
- Additive: new builder + new card + a 2-line injection into `ProfileClient`; the charter, quest-log, World Map, transformation arc, and all existing `/character` content stay unchanged.
- Use the approved plan copy (in the spec) VERBATIM.
- Frontend-only: LMS `web` CI job. No worker, no migration, no DB.
- `Locale` from `@/lib/intake/types`; `ZoneVM` from `@/lib/rpg/types`; `SKINS_META` from `@/lib/rpg/skins-meta`; `parseOutcome` from `./parse-outcome`.

---

### Task 1: learning-plan builder + wrapper

**Files:**
- Create: `LMS/tochka-sborki/web/lib/intake/learning-plan.ts`
- Test: `LMS/tochka-sborki/web/lib/intake/learning-plan.test.ts` (new)

**Interfaces:**
- Consumes: `Locale` from `./types`; `ZoneVM` from `@/lib/rpg/types`; `SKINS_META` from `@/lib/rpg/skins-meta`; `parseOutcome` from `./parse-outcome`.
- Produces: `interface PlanStep`; `interface LearningPlanInput`; `function buildLearningPlan(i: LearningPlanInput): string`; `function profileToLearningPlan(profile: any, zones: ZoneVM[], locale: Locale): string`.

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/intake/learning-plan.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildLearningPlan, profileToLearningPlan, type LearningPlanInput } from './learning-plan'
import type { ZoneVM } from '@/lib/rpg/types'

const base: LearningPlanInput = {
  locale: 'ru', outcome: 'запустить свой продукт', niche: 'коуч', level: 3,
  completedCount: 2, total: 9,
  steps: [{ name: 'Промпт-инжиниринг', transform: { from: 'прошу не то', to: 'формулирую точно' } }],
  experiential: ['Упражнения 1–8 — закрепи навыки (/exercises)'],
  accountability: ['напарник — ИИ для со-мышления'],
}

describe('buildLearningPlan', () => {
  it('renders the title, all 6 sections, and the variable content (ru)', () => {
    const md = buildLearningPlan(base)
    expect(md).toContain('# Личный план обучения')
    expect(md).toContain('## 🎯 Цель')
    expect(md).toContain('запустить свой продукт')
    expect(md).toContain('Дедлайн: ___ (поставь свой)')
    expect(md).toContain('## 📍 Где я сейчас')
    expect(md).toContain('пройдено 2 из 9 модулей')
    expect(md).toContain('## 📚 Шаги обучения (следующие)')
    expect(md).toContain('- Промпт-инжиниринг: из прошу не то → в формулирую точно')
    expect(md).toContain('## 🛠 Шаги через опыт')
    expect(md).toContain('- Упражнения 1–8 — закрепи навыки (/exercises)')
    expect(md).toContain('## 🤝 Кто может помочь')
    expect(md).toContain('- напарник — ИИ для со-мышления')
    expect(md).toContain('## 🔁 Ревью')
    expect(md).toContain('> Этот план — твой.')
  })

  it('uses the goal fallback when outcome is null and the all-done line when steps is empty', () => {
    const md = buildLearningPlan({ ...base, outcome: null, steps: [] })
    expect(md).toContain('— (впиши свой результат)')
    expect(md).toContain('Все модули пройдены — выбери, что углубить.')
  })

  it('renders English headers and connectives', () => {
    const md = buildLearningPlan({ ...base, locale: 'en' })
    expect(md).toContain('# Personal Learning Plan')
    expect(md).toContain('## 🎯 Goal')
    expect(md).toContain('## 🔁 Review')
    expect(md).toContain('from прошу не то → to формулирую точно')
  })
})

describe('profileToLearningPlan', () => {
  const zones: ZoneVM[] = [
    { slug: '00', order: 0, zoneName: 'Старт', questTitle: '', moduleTitle: '', durationLabel: '', status: 'completed', isNiche: false, href: '#' },
    { slug: '01', order: 1, zoneName: 'Знакомство', questTitle: '', moduleTitle: '', durationLabel: '', status: 'current', isNiche: false, href: '#', transform: { from: 'ИИ это код', to: 'четыре сдвига' } },
    { slug: '02', order: 2, zoneName: 'Сетап', questTitle: '', moduleTitle: '', durationLabel: '', status: 'todo', isNiche: false, href: '#' },
  ]
  const profile = { answers: JSON.stringify({ F3: 'стать AI-generalist' }), char_level: 4, niche: 'предприниматель', world_skin: 'wanderer' }

  it('composes outcome, status, and the current step from the profile + zones', () => {
    const md = profileToLearningPlan(profile, zones, 'ru')
    expect(md).toContain('стать AI-generalist')         // outcome from F3
    expect(md).toContain('предприниматель')              // niche
    expect(md).toContain('пройдено 1 из 3 модулей')      // 1 completed of 3 zones
    expect(md).toContain('- Знакомство: из ИИ это код → в четыре сдвига') // current zone + transform
    expect(md).toContain('/exercises')                   // course experiential default
    expect(md).toContain('/ask')                         // accountability default
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/intake/learning-plan.test.ts`
Expected: FAIL — `learning-plan.ts` does not exist (import error).

- [ ] **Step 3: Create the builder + wrapper**

Create `LMS/tochka-sborki/web/lib/intake/learning-plan.ts` exactly:

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
  steps: PlanStep[]
  experiential: string[]
  accountability: string[]
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

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/intake/learning-plan.test.ts`
Expected: PASS — all assertions green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/intake/learning-plan.ts LMS/tochka-sborki/web/lib/intake/learning-plan.test.ts
git commit -m "feat(intake): personal learning plan builder + wrapper (fb_8724dc87679d)"
```

---

### Task 2: LearningPlanCard component + wire into ProfileClient

**Files:**
- Create: `LMS/tochka-sborki/web/components/intake/learning-plan-card.tsx`
- Modify: `LMS/tochka-sborki/web/app/character/profile-client.tsx`

**Interfaces:**
- Consumes: `profileToLearningPlan` from `@/lib/intake/learning-plan` (Task 1); `Locale` from `@/lib/intake/types`; `ZoneVM` from `@/lib/rpg/types`. In `ProfileClient`: `profile` + `vm.zones` (both already in scope).
- Produces: `export function LearningPlanCard({ profile, zones, locale }: { profile: any; zones: ZoneVM[]; locale: Locale })`.

The component is not unit-tested (mirrors `CharterCard`); validated by the full suite (Task 1 tests stay green) + `npm run build`.

- [ ] **Step 1: Create the card component**

Create `LMS/tochka-sborki/web/components/intake/learning-plan-card.tsx` exactly:

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

- [ ] **Step 2: Wire it into ProfileClient**

In `LMS/tochka-sborki/web/app/character/profile-client.tsx`:

(a) Add the import near the other `@/components/intake/*` imports (next to `CharterCard`):

```tsx
import { LearningPlanCard } from '@/components/intake/learning-plan-card'
```

(b) Render it immediately before the existing `<CharterCard ... />` line:

```tsx
      <LearningPlanCard profile={profile} zones={vm.zones} locale={locale} />
      <CharterCard profile={profile} locale={locale} />
```

(`vm` and `profile` are already in scope from the existing `const vm = buildQuestLog(...)` and the `profile` state. No other change.)

- [ ] **Step 3: Run the full suite (no regression)**

Run: `cd LMS/tochka-sborki/web && npx vitest run`
Expected: PASS — full suite green (Task 1 tests included; no existing test touches `ProfileClient`/`LearningPlanCard` render).

- [ ] **Step 4: Typecheck + static export build**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — TypeScript accepts the new component + props; static export of `/character` and `/en/character` compiles with the plan card rendered before the charter card.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/components/intake/learning-plan-card.tsx LMS/tochka-sborki/web/app/character/profile-client.tsx
git commit -m "feat(intake): surface the personal learning plan on /character (fb_8724dc87679d)"
```

---

## Self-Review

**Spec coverage:**
- `buildLearningPlan` (pure, 6-section Markdown) → Task 1 (Step 3). ✓
- `profileToLearningPlan` wrapper (outcome/niche/level/steps from profile+zones + Точка defaults) → Task 1 (Step 3). ✓
- `LearningPlanCard` (`<pre>` + copy, mirror CharterCard) → Task 2 (Step 1). ✓
- Wire into `ProfileClient` before `<CharterCard>` → Task 2 (Step 2). ✓
- Tests: builder (full + null-outcome/empty-steps + en) + wrapper composition → Task 1 (Step 1). ✓
- Build-validated card/wiring → Task 2 (Step 4). ✓
- Approved copy verbatim → Task 1 (Step 3) literal block. ✓
- Additive (charter/quest-log/map/arc unchanged) → respected. ✓
- Carve (no deadline persist / fake community / /plan route / DB) → nothing added. ✓

**Placeholder scan:** none — all code complete and verbatim.

**Type consistency:** `LearningPlanInput`/`PlanStep`/`buildLearningPlan`/`profileToLearningPlan` defined in Task 1 are consumed unchanged in Task 2. `profileToLearningPlan(profile, zones, locale)` matches the card's call; `LearningPlanCard` props (`profile`, `zones: ZoneVM[]`, `locale: Locale`) match what `ProfileClient` passes (`profile`, `vm.zones`, `locale`). `ZoneVM` carries `status`/`zoneName`/`transform` (all read by the wrapper). `SKINS_META[...]?.mentor?.name?.[locale]` matches the optional `mentor` shape in `SkinMeta`. The test's synthetic `ZoneVM` objects include every required field of the interface. ✓
