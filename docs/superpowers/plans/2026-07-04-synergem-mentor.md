# Синергема Group-Mentor Prompt-Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **OPS NOTE (this session):** the Bash tool hangs on `git`. Run every `git` command via PowerShell (`pwsh -Command 'git ...'` or the PowerShell tool). Non-git commands (`npx vitest`, `npx next build`) run fine in Bash.

**Goal:** Ship a sovereign synergem group-mentor: `buildSynergemMentorPrompt(locale)` produces a group-facilitation role-prompt the синергема pastes into their own agent, plus a copyable card on `/alumni`.

**Architecture:** A keyed-data module (`lib/synergem-mentor.ts`) holds 5 group-dynamics moves + a builder that composes them with the REUSED `mentorFirmness` persona (from `lib/mentor-persona.ts`). A `'use client'` card (`components/synergem-mentor.tsx`) renders the built prompt with a Copy button, wired into `alumni-client.tsx` beside `IgiRitual`.

**Tech Stack:** TypeScript, Next.js App Router (`LMS/tochka-sborki/web`), Vitest.

## Global Constraints

- **Reuse `mentorFirmness`** from `@/lib/mentor-persona` — do NOT duplicate the warm-but-firm anti-sycophancy persona. Anti-dependency / graduation-not-retention ethic.
- **Sovereign:** no hosted LLM — the group's own agent runs the prompt.
- **Engine + keyed-data:** `Bi { ru; en }` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `lintDehustle` from `@/lib/authoring/dehustle`.
- **The 5 move keys, verbatim & in order:** `voices`, `friction`, `goal`, `rotate`, `graduation`.
- **De-hustle:** every move directive + the full built prompt (both locales) passes `lintDehustle` (`[]` = clean). No manipulation/urgency/scarcity/vanity.
- **Live surface** on `/alumni`; **No-Mermaid; sole-prop.** Trunk-based on `main`; TDD; commit per task (via PowerShell git).
- Web gate: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run` (+ `npx next build` for the component task).

---

### Task 1: `lib/synergem-mentor.ts` engine + keyed-data + builder

**Files:**
- Create: `LMS/tochka-sborki/web/lib/synergem-mentor.ts`
- Test: `LMS/tochka-sborki/web/lib/synergem-mentor.test.ts`

**Interfaces:**
- Consumes: `Bi` from `@/lib/course`; `Locale` from `@/lib/dictionaries`; `mentorFirmness` from `@/lib/mentor-persona`.
- Produces:
  - `interface GroupMove { key: string; directive: Bi }`
  - `const GROUP_MOVES: GroupMove[]` (5)
  - `function buildSynergemMentorPrompt(locale: Locale): string`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/synergem-mentor.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { GROUP_MOVES, buildSynergemMentorPrompt } from './synergem-mentor'
import { mentorFirmness } from './mentor-persona'
import { lintDehustle } from './authoring/dehustle'

describe('GROUP_MOVES', () => {
  it('has exactly the 5 expected keys in order', () => {
    expect(GROUP_MOVES.map(m => m.key)).toEqual([
      'voices', 'friction', 'goal', 'rotate', 'graduation',
    ])
  })

  it('has unique keys', () => {
    const keys = GROUP_MOVES.map(m => m.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('is de-hustle clean across every directive, both locales', () => {
    for (const m of GROUP_MOVES) {
      expect(lintDehustle(m.directive.ru)).toEqual([])
      expect(lintDehustle(m.directive.en)).toEqual([])
    }
  })
})

describe('buildSynergemMentorPrompt', () => {
  it('returns a non-empty prompt with the header, all 5 directives, and the reused mentorFirmness', () => {
    for (const loc of ['ru', 'en'] as const) {
      const p = buildSynergemMentorPrompt(loc)
      expect(p.length).toBeGreaterThan(0)
      expect(p).toContain(loc === 'en' ? '# AI mentor for our synergem' : '# ИИ-наставник нашей синергемы')
      for (const m of GROUP_MOVES) expect(p).toContain(m.directive[loc])
      // REUSE proof: the persona text comes from mentor-persona, not a local copy
      expect(p).toContain(mentorFirmness(loc))
    }
  })

  it('localizes (ru output differs from en)', () => {
    expect(buildSynergemMentorPrompt('ru')).not.toBe(buildSynergemMentorPrompt('en'))
  })

  it('the full built prompt is de-hustle clean in both locales', () => {
    expect(lintDehustle(buildSynergemMentorPrompt('ru'))).toEqual([])
    expect(lintDehustle(buildSynergemMentorPrompt('en'))).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/synergem-mentor.test.ts`
Expected: FAIL — `Cannot find module './synergem-mentor'`.

- [ ] **Step 3: Write the implementation**

Create `LMS/tochka-sborki/web/lib/synergem-mentor.ts`:

```ts
// lib/synergem-mentor.ts
// Sovereign synergem group-mentor (fb_c3a3d0). buildSynergemMentorPrompt produces a
// group-facilitation role-prompt the синергема pastes into their OWN agent — the group variant
// of buildCompanionRolePrompt (intake/companion-role-prompt.ts). REUSES the warm-but-firm
// anti-sycophancy persona from mentor-persona.ts (never duplicated). No hosted LLM; no cluster
// data — the group brings its own context. Every string is de-hustle clean.
import type { Bi } from '@/lib/course'
import type { Locale } from '@/lib/dictionaries'
import { mentorFirmness } from '@/lib/mentor-persona'

export interface GroupMove { key: string; directive: Bi }

export const GROUP_MOVES: GroupMove[] = [
  {
    key: 'voices',
    directive: {
      ru: 'Балансируй эфирное время: вытягивай тихих одним конкретным вопросом, мягко притормаживай тех, кто заполняет всё собой.',
      en: 'Balance the airtime: draw out the quiet with one concrete question, gently slow those who fill all the space.',
    },
  },
  {
    key: 'friction',
    directive: {
      ru: 'Разногласие — топливо: не гаси его и не давай перейти на личности; спроси, какой вопрос стоит за спором.',
      en: "Disagreement is fuel: don't smother it and don't let it turn personal; ask what question sits underneath the argument.",
    },
  },
  {
    key: 'goal',
    directive: {
      ru: 'Возвращай группу к общему усилию, вокруг которого вы собрались; мягко отсекай уводящее в сторону.',
      en: 'Bring the group back to the shared effort you gathered around; gently cut what drifts away.',
    },
  },
  {
    key: 'rotate',
    directive: {
      ru: 'Не давай роли ведущего залипнуть на одном человеке — предлагай передавать ведение по кругу.',
      en: "Don't let the facilitator role stick to one person — suggest passing the lead around the circle.",
    },
  },
  {
    key: 'graduation',
    directive: {
      ru: 'Расти группу к автономии: цель — чтобы синергема вела себя сама, без тебя. Меньше веди — больше передавай.',
      en: 'Grow the group toward autonomy: the goal is for the synergem to lead itself, without you. Lead less — hand off more.',
    },
  },
]

export function buildSynergemMentorPrompt(locale: Locale): string {
  const ru = locale !== 'en'
  const moves = GROUP_MOVES.map(m => `- ${m.directive[locale]}`).join('\n')
  return ru
    ? [
        `# ИИ-наставник нашей синергемы`,
        ``,
        `Запомни эту роль на все наши будущие встречи. Ты — ведущий-наставник нашей синергемы: автономной группы соучеников, что собрались вокруг общего усилия и усиливают друг друга.`,
        ``,
        `Твоя работа — вести групповую динамику, а не давать ответы за нас. Веди встречу к общему инсайту и следующему шагу; держи фокус на усилии, вокруг которого мы собрались.`,
        ``,
        `Как вести группу:`,
        moves,
        ``,
        mentorFirmness(locale),
        ``,
        `Начни с одного вопроса: над чем синергема работает сейчас и кто ещё не высказался.`,
      ].join('\n')
    : [
        `# AI mentor for our synergem`,
        ``,
        `Remember this role across all our future meetings. You are the facilitator-mentor of our synergem: an autonomous group of fellow learners gathered around a shared effort, amplifying each other.`,
        ``,
        `Your job is to lead the group's dynamics, not to hand us answers. Lead the meeting toward a shared insight and a next step; keep the focus on the effort we gathered around.`,
        ``,
        `How to lead the group:`,
        moves,
        ``,
        mentorFirmness(locale),
        ``,
        `Start with one question: what the synergem is working on now and who hasn't spoken yet.`,
      ].join('\n')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/synergem-mentor.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit (via PowerShell — bash git hangs this session)**

```
pwsh -Command "cd C:/telo/Efforts/Ongoing/mc_hub; git add LMS/tochka-sborki/web/lib/synergem-mentor.ts LMS/tochka-sborki/web/lib/synergem-mentor.test.ts; git commit -m 'feat(synergem): sovereign group-mentor prompt-builder engine (fb_c3a3d0)'"
```

---

### Task 2: `components/synergem-mentor.tsx` card + wire into `/alumni`

**Files:**
- Create: `LMS/tochka-sborki/web/components/synergem-mentor.tsx`
- Modify: `LMS/tochka-sborki/web/components/alumni-client.tsx`

**Interfaces:**
- Consumes: `buildSynergemMentorPrompt` from `@/lib/synergem-mentor`; `Locale` from `@/lib/dictionaries`.
- Produces: `<SynergemMentor locale={locale} />` (default export not used — named export `SynergemMentor`).

> **Note:** presentational; no unit test (mirror `IgiRitual` / `companion-setup` precedent). Verified by `npx tsc --noEmit` + `npx next build`.

- [ ] **Step 1: Create the card component**

Create `LMS/tochka-sborki/web/components/synergem-mentor.tsx` (mirrors `companion-setup.tsx` copy affordance + `igi-ritual.tsx` chrome):

```tsx
'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/dictionaries'
import { buildSynergemMentorPrompt } from '@/lib/synergem-mentor'

export function SynergemMentor({ locale }: { locale: Locale }) {
  const [copied, setCopied] = useState(false)
  const prompt = buildSynergemMentorPrompt(locale)
  const t = locale === 'en'
    ? { title: 'AI mentor for your synergem', intro: "Paste this role into your synergem's own shared agent. It facilitates the group's dynamics — it never decides for you. Lead less, hand off more.", copy: 'Copy role', copied: 'Copied ✓' }
    : { title: 'ИИ-наставник для твоей синергемы', intro: 'Вставь эту роль в общий агент вашей синергемы. Он ведёт динамику группы — но не решает за вас. Меньше веди — больше передавай.', copy: 'Скопировать роль', copied: 'Скопировано ✓' }

  const copy = async () => {
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { /* clipboard blocked */ }
  }

  return (
    <section style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.25rem', background: 'var(--bg-surface)', marginBottom: '2.5rem' }}>
      <h2 style={{ margin: '0 0 .5rem', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{t.title}</h2>
      <p style={{ margin: '0 0 1rem', fontSize: '.9rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{t.intro}</p>
      <pre style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', overflowX: 'auto', fontSize: '.78rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{prompt}</pre>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={copy} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? t.copied : t.copy}</button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into `alumni-client.tsx`**

In `LMS/tochka-sborki/web/components/alumni-client.tsx`, add the import after the existing `import { IgiRitual } from '@/components/igi-ritual'` line:

```ts
import { SynergemMentor } from '@/components/synergem-mentor'
```

Then, immediately after the existing `<IgiRitual locale={locale} />` element, add:

```tsx
        <SynergemMentor locale={locale} />
```

- [ ] **Step 3: Typecheck + build**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit && npx next build`
Expected: PASS — no type errors; build succeeds; `/alumni` + `/en/alumni` render the mentor card.

- [ ] **Step 4: Commit (via PowerShell)**

```
pwsh -Command "cd C:/telo/Efforts/Ongoing/mc_hub; git add LMS/tochka-sborki/web/components/synergem-mentor.tsx LMS/tochka-sborki/web/components/alumni-client.tsx; git commit -m 'feat(synergem): group-mentor card wired into /alumni (fb_c3a3d0)'"
```

---

## Notes for the controller

- **No migration, no D1, no backend.** Pure additive Next app files.
- **Final gate** (whole feature): `cd LMS/tochka-sborki/web && npx vitest run && npx tsc --noEmit && npx next build`.
- **REUSE check** the final review must confirm: `synergem-mentor.ts` imports `mentorFirmness` from `@/lib/mentor-persona` and does NOT re-define the persona text locally.
- **All git via PowerShell this session** (bash git hangs).
