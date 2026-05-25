# Bisociation Reflection Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Activation + Reflection phase prompts of all 38 course units (RU + EN) as Koestler-style bisociative provocations that are clearly mental exercises (no false "type here" expectation), and add a localized in-`Phase` marker plus fix the hardcoded-RU phase labels.

**Architecture:** Two small UI/infra changes in `web/components` (a pure `phase-chrome` helper used by `Phase`, locale carried through `UnitWizardContext`), one content drift-guard test, then nine content-rewrite tasks (one per module) that edit only the text inside `<Phase type="activation">` and `<Phase type="reflection">` blocks of the MDX files. No new persistence; Concept and Practice phases are untouched.

**Tech Stack:** Next.js 16 (App Router, MDX via `next-mdx-remote`), React, TypeScript, Vitest.

**Reference spec:** `docs/superpowers/specs/2026-05-24-bisociation-reflection-prompts-design.md`

**Branch:** Create `bisociation-reflection-prompts` from `main` before Task 1 (do NOT build on `ux-help-niche-fix` / PR #5).

**Voice & rules for every prompt rewrite (applies to Tasks 3–11):**
- Pattern: **[anchor]** compressed "вспомни/think of…" into the learner's real situation → **[collision]** "не описывай как X, представь это как Y…" with the unit's assigned alien frame → **[spark]** invite replaying the collision *in the head* ("прокрути в голове / поймай / удержи / разгляди" · "run it in your head / catch / hold").
- **Banned** verbs implying typing into the wizard: RU `запиши / опиши / напиши / напечатай / введи`; EN `write down / type / jot / write (it/them/your)`. If something genuinely needs to be saved, address it to the **Practice** phase, not here.
- Keep the course voice (folk-mystical "ты", emoji accents by place); length comparable to the original; alien frames within a module must not repeat verbatim.
- Use Task 3 (Kickstart) as the calibrated voice reference for all later modules.

**Note on `npx vitest run`:** the suite is flaky under full parallelism — always pass `--no-file-parallelism`.

---

### Task 1: `phase-chrome` helper + locale-aware `Phase`

**Files:**
- Create: `web/components/phase-chrome.ts`
- Create: `web/components/phase-chrome.test.ts`
- Modify: `web/components/unit-wizard-context.tsx`
- Modify: `web/components/phase.tsx`
- Modify: `web/components/unit-wizard.tsx:118` (provider value)

- [ ] **Step 1: Write the failing test**

`web/components/phase-chrome.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { phaseLabel, phaseMarker, PHASE_META } from './phase-chrome'

describe('phase-chrome', () => {
  it('localizes phase chip labels', () => {
    expect(phaseLabel('activation', 'ru')).toBe('Активация')
    expect(phaseLabel('activation', 'en')).toBe('Activation')
    expect(phaseLabel('practice', 'en')).toBe('Practice')
    expect(phaseLabel('reflection', 'ru')).toBe('Рефлексия')
  })
  it('shows the mental marker only for activation and reflection', () => {
    expect(phaseMarker('activation', 'ru')).toMatch(/в уме/)
    expect(phaseMarker('reflection', 'en')).toMatch(/in your head/)
    expect(phaseMarker('concept', 'ru')).toBeNull()
    expect(phaseMarker('practice', 'en')).toBeNull()
  })
  it('keeps the existing icons and colors', () => {
    expect(PHASE_META.activation.icon).toBe('⚡')
    expect(PHASE_META.activation.color).toBe('#00ff88')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run components/phase-chrome.test.ts --no-file-parallelism`
Expected: FAIL — `Cannot find module './phase-chrome'`.

- [ ] **Step 3: Write the helper**

`web/components/phase-chrome.ts`:
```ts
import type { Locale } from '@/lib/dictionaries'

export type PhaseType = 'activation' | 'reflection' | 'concept' | 'practice'

export const PHASE_META: Record<PhaseType, { label: Record<Locale, string>; icon: string; color: string }> = {
  activation: { label: { ru: 'Активация', en: 'Activation' }, icon: '⚡', color: '#00ff88' },
  reflection: { label: { ru: 'Рефлексия', en: 'Reflection' }, icon: '👁', color: '#00aaff' },
  concept:    { label: { ru: 'Концепция', en: 'Concept' },    icon: '💡', color: '#ff9900' },
  practice:   { label: { ru: 'Практика', en: 'Practice' },    icon: '🛠', color: '#ff44aa' },
}

const MENTAL_MARKER: Record<Locale, string> = {
  ru: '💭 в уме · писать не нужно',
  en: '💭 in your head · nothing to type',
}

const MENTAL_PHASES: ReadonlySet<PhaseType> = new Set<PhaseType>(['activation', 'reflection'])

export function phaseLabel(type: PhaseType, locale: Locale): string {
  return PHASE_META[type].label[locale]
}

export function phaseMarker(type: PhaseType, locale: Locale): string | null {
  return MENTAL_PHASES.has(type) ? MENTAL_MARKER[locale] : null
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run components/phase-chrome.test.ts --no-file-parallelism`
Expected: PASS (3 tests).

- [ ] **Step 5: Add `locale` to the wizard context**

`web/components/unit-wizard-context.tsx` — full new content:
```tsx
'use client'

import { createContext, useContext } from 'react'
import type { Locale } from '@/lib/dictionaries'

interface UnitWizardContextValue {
  currentStep: number
  totalSteps: number
  locale: Locale
}

export const UnitWizardContext = createContext<UnitWizardContextValue>({
  currentStep: 0,
  totalSteps: 4,
  locale: 'ru',
})

export function useUnitWizard(): UnitWizardContextValue {
  return useContext(UnitWizardContext)
}
```

- [ ] **Step 6: Rewrite `Phase` to use the helper + context locale + render the marker**

`web/components/phase.tsx` — full new content:
```tsx
'use client'

import { useUnitWizard } from './unit-wizard-context'
import { PHASE_META, phaseLabel, phaseMarker, type PhaseType } from './phase-chrome'

const PHASE_ORDER: PhaseType[] = ['activation', 'reflection', 'concept', 'practice']

interface Props {
  type: PhaseType
  children: React.ReactNode
}

export function Phase({ type, children }: Props) {
  const { currentStep, locale } = useUnitWizard()
  const stepIndex = PHASE_ORDER.indexOf(type)

  if (stepIndex !== currentStep) return null

  const { icon, color } = PHASE_META[type]
  const label = phaseLabel(type, locale)
  const marker = phaseMarker(type, locale)

  return (
    <div>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: `${color}18`,
        borderLeft: `3px solid ${color}`,
        padding: '4px 14px',
        borderRadius: '0 4px 4px 0',
        marginBottom: marker ? '0.5rem' : '1.5rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.12em',
      }}>
        {icon} {label}
      </div>
      {marker && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
        }}>
          {marker}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
```

- [ ] **Step 7: Pass `locale` into the provider**

`web/components/unit-wizard.tsx` — change the provider opening tag (currently line 118):
```tsx
    <UnitWizardContext.Provider value={{ currentStep, totalSteps: TOTAL_STEPS, locale }}>
```
(`locale` is already a prop of `UnitWizard`, defaulting to `'ru'`.)

- [ ] **Step 8: Run the full component + lib test suite**

Run: `cd web && npx vitest run --no-file-parallelism`
Expected: PASS (existing suite + the 3 new phase-chrome tests). No type errors.

- [ ] **Step 9: Commit**

```bash
git add web/components/phase-chrome.ts web/components/phase-chrome.test.ts web/components/phase.tsx web/components/unit-wizard-context.tsx web/components/unit-wizard.tsx
git commit -m "feat(wizard): localize Phase labels + add mental-exercise marker"
```

---

### Task 2: Content drift-guard test (no "type here" verbs in reflection phases)

**Files:**
- Create: `web/lib/content/reflection-prompts.test.ts`

This test fails now (current content contains `опиши`, `запиши`, etc. in Activation/Reflection) and turns green module-by-module as Tasks 3–11 land. It is the machine-checkable definition of "done" for the content rewrites.

- [ ] **Step 1: Write the test**

`web/lib/content/reflection-prompts.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, statSync, readFileSync } from 'fs'
import { dirname, join, sep } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const CONTENT = join(HERE, '..', '..', 'content') // web/content

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.mdx') ? [p] : []
  })
}

function localeOf(path: string): 'ru' | 'en' {
  return path.includes(`${sep}en${sep}`) ? 'en' : 'ru'
}

function phaseBlocks(src: string, type: 'activation' | 'reflection'): string[] {
  const re = new RegExp(`<Phase type="${type}">([\\s\\S]*?)</Phase>`, 'g')
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) out.push(m[1])
  return out
}

const BANNED: Record<'ru' | 'en', RegExp> = {
  ru: /(запиш|опиш|напиш|напечата|\bвведи\b|перечисли)/i,
  en: /(\bwrite down\b|\btype\b|\bjot\b|\bwrite (it|them|your)\b|\benter your\b)/i,
}

const files = walk(CONTENT)

describe('reflection prompts contain no "type here" verbs', () => {
  it('discovers unit mdx files', () => {
    expect(files.length).toBeGreaterThan(30)
  })

  it.each(files)('%s', (file) => {
    const src = readFileSync(file, 'utf8')
    const locale = localeOf(file)
    const banned = BANNED[locale]
    for (const type of ['activation', 'reflection'] as const) {
      for (const block of phaseBlocks(src, type)) {
        expect(banned.test(block), `banned input verb in <Phase type="${type}"> of ${file}`).toBe(false)
      }
    }
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails (red baseline)**

Run: `cd web && npx vitest run lib/content/reflection-prompts.test.ts --no-file-parallelism`
Expected: FAIL on many files (current Activation/Reflection blocks use `опиши`, `запиши`, `describe`, etc.). The `discovers unit mdx files` case passes.

- [ ] **Step 3: Commit the failing guard**

```bash
git add web/lib/content/reflection-prompts.test.ts
git commit -m "test(content): add drift-guard for no-type-here reflection prompts"
```

---

### Task 3: Kickstart (module 00) content — pilot / voice reference

**Files:**
- Modify: `web/content/ru/00-kickstart/u1-map.mdx` (activation, reflection)
- Modify: `web/content/ru/00-kickstart/u2-tools.mdx` (activation, reflection)
- Modify: `web/content/ru/00-kickstart/u3-first-steps.mdx` (activation, reflection)
- Modify: `web/content/en/00-kickstart/u1-map.mdx` (activation, reflection)
- Modify: `web/content/en/00-kickstart/u2-tools.mdx` (activation, reflection)
- Modify: `web/content/en/00-kickstart/u3-first-steps.mdx` (activation, reflection)

Replace ONLY the body between the `<Phase type="activation">`/`</Phase>` and `<Phase type="reflection">`/`</Phase>` tags. Leave the tags, Concept, and Practice phases untouched.

- [ ] **Step 1: `u1-map.mdx` (RU) — activation + reflection**

Activation body becomes:
```mdx
Вспомни проект, приложение или автоматизацию, которую ты давно хотел сделать, но **откладывал** — «слишком сложно технически», «нужен программист», «нет полугода на Python».

Теперь не описывай её как проект. Представь свою идею-призрак как **рецепт блюда, которое ещё никто не пробовал**. Какие два-три ингредиента в нём обязательны? Какой вкус ты обещаешь тому, кто попробует? Прокрути это в голове — на стыке «моя идея» и «рецепт» проступает то, чего в лоб не видно.
```
Reflection body becomes:
```mdx
В старом мире (до 2024) этот замысел стоил бы тебе **3–6 месяцев** на основы программирования, или **$2000–5000** фрилансеру, или **десятки часов** отладки чужих багов.

Представь этот барьер как **поднятый разводной мост** перед твоим городом-идеей: ров, стража, плата за проход. А теперь мост опустили, стража ушла. Поймай в голове это переключение: что ты впервые решишься перевезти на ту сторону, когда переправа бесплатна? Vibe coding и есть тот, кто опустил мост.
```

- [ ] **Step 2: `u1-map.mdx` (EN) — activation + reflection**

Activation body becomes:
```mdx
Think of a project, app, or automation you've long wanted to build but kept **putting off** — "too hard technically", "I'd need a programmer", "no six months for Python".

Now don't describe it as a project. Picture your ghost idea as a **recipe for a dish no one has tasted yet**. Which two or three ingredients are non-negotiable? What flavour do you promise whoever tries it? Run it in your head — at the seam between "my idea" and "a recipe", something surfaces that you can't see head-on.
```
Reflection body becomes:
```mdx
In the old world (before 2024) making this idea real would have cost you **3–6 months** learning programming basics, or **$2000–5000** for a freelancer, or **dozens of hours** debugging errors you don't understand.

Picture that barrier as a **raised drawbridge** in front of your idea-city: the moat, the guards, the toll. Now the bridge is down, the guards are gone. Catch the switch in your head: what would you finally dare to carry across once the crossing is free? Vibe coding is what lowered the bridge.
```

- [ ] **Step 3: `u2-tools.mdx` (RU) — activation + reflection**

Activation body becomes:
```mdx
Посмотри на поток AI-инструментов, которые рекламируют каждый день: ChatGPT, Claude, Cursor, Lovable, Bolt…

Представь, что это не софт, а **полки гипермаркета без ценников и табличек отделов**. Ты стоишь с тележкой посреди прохода. По какому одному признаку ты бы расставил эти банки и коробки, чтобы перестать тонуть? Прокрути в голове — на стыке «AI-инструменты» и «навигация по магазину» проступает другой вопрос: не «какой инструмент», а «какую полку я вообще ищу».
```
Reflection body becomes:
```mdx
Большинство пробуют всё подряд и бросают, не получив результата.

Представь это как **шведский стол, где ты накладываешь всего по чуть-чуть** — и уходишь объевшимся, не распробовав ни одного блюда. Квадранты — это как разделить стол на «горячее / салаты / десерт», чтобы выбирать осознанно. Удержи в голове: какой один «квадрант» закрыл бы твой голод прямо сейчас?
```

- [ ] **Step 4: `u2-tools.mdx` (EN) — activation + reflection**

Activation body becomes:
```mdx
Look at the flood of AI tools advertised every day: ChatGPT, Claude, Cursor, Lovable, Bolt…

Picture them not as software but as the **shelves of a hypermarket with no price tags and no aisle signs**. You're standing in the aisle with a cart. By what single rule would you sort these jars and boxes to stop drowning? Run it in your head — at the seam between "AI tools" and "navigating a store" a different question surfaces: not "which tool", but "which shelf am I even looking for".
```
Reflection body becomes:
```mdx
Most people try everything at once and quit before any result.

Picture it as a **buffet where you pile on a little of everything** — and leave stuffed, having truly tasted nothing. Quadrants are like splitting the table into "mains / salads / dessert" so you can choose on purpose. Hold this in your head: which single "quadrant" would satisfy your hunger right now?
```

- [ ] **Step 5: `u3-first-steps.mdx` (RU) — activation + reflection**

Activation body becomes:
```mdx
Вспомни список задач, который ты прикинул в прошлом юните.

Представь, что ты не ученик, а **кастинг-директор**, и эти задачи — актёры на пробах. Одной из них играть **главную роль** твоего первого AI-проекта. Кого ты утвердишь: самую реалистичную? самую ценную, если бы она заработала уже на этой неделе? Прокрути пробы в голове — на стыке «мои задачи» и «кастинг» сразу видно, кто тянет на главную роль, а кто на эпизод.
```
Reflection body becomes:
```mdx
Ты только что выбрал главную роль — свой первый AI-проект, конкретный и нужный именно тебе.

Представь его как **семечко, которое ты кладёшь в карман** и носишь, пока идёшь по курсу. Каждый Meeting — это дождь и свет: к Meeting 5–6 оно прорастёт, и ты будешь готов его высадить. Поймай в голове: в каком модуле ты почувствуешь первый росток?
```

- [ ] **Step 6: `u3-first-steps.mdx` (EN) — activation + reflection**

Activation body becomes:
```mdx
Recall the list of tasks you sketched in the previous unit.

Picture yourself not as a student but as a **casting director**, with those tasks as actors at an audition. One of them gets the **lead role** in your first AI project. Who do you cast: the most realistic one? the most valuable if it shipped this very week? Run the audition in your head — at the seam between "my tasks" and "casting" it's instantly clear who carries the lead and who's a bit part.
```
Reflection body becomes:
```mdx
You've just cast the lead — your first AI project, concrete and yours alone.

Picture it as a **seed you slip into your pocket** and carry as you move through the course. Every Meeting is rain and light: by Meeting 5–6 it sprouts and you'll be ready to plant it. Catch this in your head: in which module will you feel the first shoot?
```

- [ ] **Step 7: Run the drift-guard — Kickstart files now green**

Run: `cd web && npx vitest run lib/content/reflection-prompts.test.ts --no-file-parallelism`
Expected: all `00-kickstart` RU+EN cases PASS (other modules still fail).

- [ ] **Step 8: Commit**

```bash
git add web/content/ru/00-kickstart web/content/en/00-kickstart
git commit -m "content(00-kickstart): bisociative reflection prompts (RU+EN)"
```

---

### Tasks 4–11: Per-module content rewrites

For each module task below: for every listed unit, open the RU and EN `.mdx`, read the current Activation and Reflection blocks for the anchor, then rewrite **only** those two blocks following the **Voice & rules** at the top of this plan and the unit's **assigned alien frame**. Use Task 3 as the voice reference. After editing all units in the module, run the drift-guard and commit.

**Standard per-module steps (apply to each of Tasks 4–11):**
- [ ] Step A: Rewrite Activation + Reflection (RU + EN) for every unit in the module, each using its assigned frame.
- [ ] Step B: Run `cd web && npx vitest run lib/content/reflection-prompts.test.ts --no-file-parallelism` — confirm this module's RU+EN cases now PASS.
- [ ] Step C: Commit: `git add web/content/ru/<module> web/content/en/<module> && git commit -m "content(<module>): bisociative reflection prompts (RU+EN)"`

#### Task 4: module `01-introduction`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | заказ в ресторане на языке, который знаешь наполовину (ordering in a half-known language) |
| `u2-four-shifts` | смена времён года / смена караула (turning seasons / changing of the guard) |
| `u3-clones` | зеркальная комната и дублёры (hall of mirrors / understudies) |
| `u4-practice` | генеральная репетиция перед премьерой (dress rehearsal before opening night) |

#### Task 5: module `02-setup-guide`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-env-check` | сборы в экспедицию, проверка снаряжения в базовом лагере (gear check at base camp) |
| `u2-install` | обустройство мастерской / mise en place на кухне (setting up a workshop / mise en place) |
| `u3-first-project` | первый кирпич в кладке / спуск бумажного кораблика (laying the first brick / paper boat) |

#### Task 6: module `03-stack-selection`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | выбор пути на гору: канатка или тропа (cable car vs trail up a mountain) |
| `u2-stack-matrix` | дегустационное меню vs à la carte (degustation vs à la carte) |
| `u3-behind-gfw` | маршрут контрабандиста через закрытую границу (smuggler's route across a closed border) |
| `u4-hermes-sovereign` | свой огород vs покупка на рынке (your own garden vs the market) |
| `u5-migrate` | переезд / смена лошадей на переправе (moving house / changing horses mid-river) |

#### Task 7: module `04-prompt-engineering`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | заказ костюма у портного бормотанием (ordering a bespoke suit by mumbling) |
| `u2-spec-formula` | рецептурная карточка vs «сделай повкуснее» (a recipe card vs "make it tasty") |
| `u3-magic-words` | заклинания и их компоненты (incantations / spell components) |
| `u4-sins` | признание в суде в совершённых ошибках (a courtroom confession) |
| `u5-practice` | торг с джинном об условиях желаний (negotiating wishes with a genie) |

#### Task 8: module `05-context-memory`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | коллега вернулся из отпуска без памяти о проекте (a colleague back from holiday with no memory) |
| `u2-context-vs-prompt` | папка с уликами детектива vs один вопрос (a detective's case folder vs a single question) |
| `u3-memory` | показания свидетеля / дневник (a witness's testimony / a diary) |
| `u4-practice` | инструктаж нового ассистента в первый день (briefing a new assistant on day one) |

#### Task 9: module `06-audio-pipeline`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | заводской конвейер (a factory assembly line) |
| `u2-pipeline-theory` | кухонная бригада передаёт блюдо со станции на станцию (a kitchen brigade, station to station) |
| `u3-build` | сантехника: соединение труб (plumbing: connecting pipes) |
| `u4-reflect` | эстафета: передача палочки (a relay-race baton handoff) |

#### Task 10: module `07-tools`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | пояс инструментов мастера / швейцарский нож (a craftsman's tool belt / Swiss army knife) |
| `u2-mcp` | порты USB / переходники для розеток в путешествии (USB ports / travel power adapters) |
| `u3-hooks` | мышеловка, срабатывающая на триггер / рефлекс (a mousetrap that springs on a trigger / a reflex) |
| `u4-skills` | мышечная память бойца (a martial artist's muscle memory) |
| `u5-practice` | оснащение мастерской приспособлениями (outfitting a workshop with jigs) |

#### Task 11: module `08-agent-engineering`
| Unit | Assigned alien frame |
|------|----------------------|
| `u1-activation` | ограбление, которому нужна команда, а не одиночка (a heist needing a crew, not a lone burglar) |
| `u2-jagged-intelligence` | савант: то гениален, то беспомощен (a savant, brilliant then clueless by turns) |
| `u3-orchestration` | дирижёр с оркестром (a conductor with an orchestra) |
| `u4-production-infra` | закулисная команда театра / электросеть за стеной (a theatre's backstage crew / the power grid behind the wall) |
| `u5-practice` | генерал, разворачивающий кампанию подразделениями (a general staging a campaign with units) |

---

### Task 12: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full drift-guard green**

Run: `cd web && npx vitest run lib/content/reflection-prompts.test.ts --no-file-parallelism`
Expected: ALL files PASS.

- [ ] **Step 2: Full test suite**

Run: `cd web && npx vitest run --no-file-parallelism`
Expected: PASS.

- [ ] **Step 3: Production build (MDX compiles, no broken frontmatter)**

Run: `cd web && npm run build`
Expected: build succeeds (static export), no MDX parse errors.

- [ ] **Step 4: Hand off to `superpowers:finishing-a-development-branch`.**

---

## Self-Review

**Spec coverage:**
- Ritual «Сборка двух миров» (spec §1) → embedded in Voice & rules + Task 3 examples. ✓
- Prompt pattern (spec §2) → Voice & rules + worked Kickstart + per-unit frame tables. ✓
- Frame palette per module (spec §2) → concrete per-unit frames in Tasks 4–11. ✓
- Visual marker in `Phase` (spec §3) → Task 1 (phase-chrome + phase.tsx). ✓
- Locale fix (spec §4) → Task 1 (context + provider + phaseLabel). ✓
- Drift-guard test (spec Testing) → Task 2. ✓
- Phase unit test (spec Testing) → Task 1 phase-chrome.test.ts. ✓
- Out of scope (no input field, Concept/Practice untouched) → honored; edits restricted to activation/reflection bodies. ✓

**Placeholder scan:** No TBD/TODO. Content tasks specify concrete frames + full worked examples + exact verification commands; per-unit prose is the delegated creative execution, constrained by pattern + frame + drift test (not a placeholder).

**Type consistency:** `PhaseType`, `phaseLabel`, `phaseMarker`, `PHASE_META`, `UnitWizardContextValue.locale`, `Locale` used consistently across Tasks 1–2 and the test.
