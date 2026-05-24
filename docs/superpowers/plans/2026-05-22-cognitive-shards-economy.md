# Cognitive Shards Economy (SP3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder XP/leveling slice with a single-currency **Cognitive Shards (CS)** economy — earned per-unit (weighted to thinking phases), scaled by a learner-chosen diagonal mode, and spendable on alternate theme packs.

**Architecture:** All client-side, no server/D1 work. Pure logic modules under `web/lib/cs/` (types, modes, award math, applied-challenge templating) backed by a `localStorage` wallet that mirrors the existing `web/lib/unit-progress.ts` pattern. React surfaces (`web/components/cs/`) wire into the existing `UnitWizard` (mode selector, hint gating, cycle-complete) and dashboard (balance, vault).

**Tech Stack:** Next.js 16 App Router (`'use client'`), TypeScript, Vitest (pure logic only — no DOM/network tests), localStorage.

**Spec:** `docs/superpowers/specs/2026-05-22-cognitive-shards-economy-design.md`

**Conventions for this plan:**
- `Bi = { ru: string; en: string }` (already exported from `web/lib/rpg/types.ts`).
- `Locale = 'ru' | 'en'` from `@/lib/intake/types`.
- CS UI copy lives inline as `Bi` constants in the `cs/` modules (matches the existing inline RPG pattern in `skins-meta.ts`/`unit-framing` rather than `dictionaries.ts`).
- `unitKey` is always `` `${moduleSlug}/${unitSlug}` `` (same key shape SP2d uses for `SkinPack.units`).
- Run all test commands from the `web/` directory: `cd web && npx vitest run <path>`.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `web/lib/cs/types.ts` | `Mode`, `ModeConfig`, `Wallet`, `IntakeLite`, `ChallengeTier`, `ChallengeFraming` types + constants (`STORAGE_KEY`, `DEFAULT_WALLET`, `SKIN_UNLOCK_COST`) |
| `web/lib/cs/modes.ts` | The 3 mode presets (`MODE` record): multiplier, `hintVisible`, `challengeTier`, bilingual `label` + `desc` |
| `web/lib/cs/award.ts` | `PHASE_BASE` table + pure `computeUnitCS(mode)` |
| `web/lib/cs/wallet.ts` | Pure ledger helpers (`applyAward`, `applySpend`, `setModeFor`) split from storage shell (`readWallet`/`writeWallet`) |
| `web/lib/cs/challenge-templates.ts` | The 9 per-module bilingual `ChallengeFraming` templates (data only) |
| `web/lib/cs/applied-challenge.ts` | `getAppliedChallenge(profile, moduleSlug, tier, locale)` — slot-fill + fallback |
| `web/lib/cs/use-shards.ts` | `useShards()` hook mirroring `useUnitProgress()` |
| `web/components/cs/shard-balance.tsx` | `💎 N` counter |
| `web/components/cs/mode-selector.tsx` | 3-card mode chooser |
| `web/components/cs/cycle-complete.tsx` | "NODE CLEARED · +N CS" line |
| `web/components/cs/vault.tsx` | Alternate-skin spend surface |
| `web/components/unit-wizard.tsx` | (modify) wire mode selector, hint gating, applied challenge, award |
| `web/app/dashboard/dashboard-client.tsx` | (modify) render balance + vault |

---

## Task 1: CS types and constants

**Files:**
- Create: `web/lib/cs/types.ts`

- [ ] **Step 1: Write the file**

```ts
// web/lib/cs/types.ts
import type { Bi } from '@/lib/rpg/types'

export type Mode = 'commander' | 'copilot' | 'archmage'
export type ChallengeTier = 'task' | 'process' | 'outcome'

export interface ModeConfig {
  multiplier: number
  hintVisible: boolean
  challengeTier: ChallengeTier
  label: Bi
  desc: Bi
}

export interface Wallet {
  balance: number
  earnedUnits: string[]          // unitKeys already awarded (idempotency guard)
  unlocks: string[]              // unlocked alternate skin ids
  modeByUnit: Record<string, Mode>
}

// Minimal slice of the intake profile the challenge templating needs.
export interface IntakeLite {
  niche?: string | null
  outcome?: string | null
}

export interface ChallengeFraming {
  task: Bi
  process: Bi
  outcome: Bi          // uses {niche} and/or {outcome} slots
  outcomeGeneric: Bi   // uses {niche}; fallback when learner has no F3 outcome
}

export const STORAGE_KEY = 'cs_wallet'

export const DEFAULT_WALLET: Wallet = {
  balance: 0,
  earnedUnits: [],
  unlocks: [],
  modeByUnit: {},
}

export const SKIN_UNLOCK_COST = 300
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (no errors referencing `lib/cs/types.ts`).

- [ ] **Step 3: Commit**

```bash
git add web/lib/cs/types.ts
git commit -m "feat(cs): add Cognitive Shards types and constants"
```

---

## Task 2: Mode presets

**Files:**
- Create: `web/lib/cs/modes.ts`
- Test: `web/lib/cs/modes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/cs/modes.test.ts
import { describe, it, expect } from 'vitest'
import { MODE } from './modes'
import type { Mode } from './types'

const ALL: Mode[] = ['commander', 'copilot', 'archmage']

describe('MODE presets', () => {
  it('defines all three modes with a multiplier, hintVisible and challengeTier', () => {
    for (const m of ALL) {
      expect(MODE[m].multiplier).toBeGreaterThan(0)
      expect(typeof MODE[m].hintVisible).toBe('boolean')
      expect(['task', 'process', 'outcome']).toContain(MODE[m].challengeTier)
      expect(MODE[m].label.ru.length).toBeGreaterThan(0)
      expect(MODE[m].label.en.length).toBeGreaterThan(0)
    }
  })

  it('multipliers ascend 1.0 / 1.5 / 2.5 as help decreases', () => {
    expect(MODE.commander.multiplier).toBe(1.0)
    expect(MODE.copilot.multiplier).toBe(1.5)
    expect(MODE.archmage.multiplier).toBe(2.5)
  })

  it('only archmage hides the instructional hint', () => {
    expect(MODE.commander.hintVisible).toBe(true)
    expect(MODE.copilot.hintVisible).toBe(true)
    expect(MODE.archmage.hintVisible).toBe(false)
  })

  it('maps each mode to a distinct challenge tier', () => {
    expect(MODE.commander.challengeTier).toBe('task')
    expect(MODE.copilot.challengeTier).toBe('process')
    expect(MODE.archmage.challengeTier).toBe('outcome')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/cs/modes.test.ts`
Expected: FAIL ("Cannot find module './modes'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/cs/modes.ts
import type { Mode, ModeConfig } from './types'

export const MODE: Record<Mode, ModeConfig> = {
  commander: {
    multiplier: 1.0,
    hintVisible: true,
    challengeTier: 'task',
    label: { ru: 'Командир', en: 'Commander' },
    desc: {
      ru: 'Чёткие шаги и подсказка наставника. Базовый темп.',
      en: 'Clear steps with the mentor hint. Baseline pace.',
    },
  },
  copilot: {
    multiplier: 1.5,
    hintVisible: true,
    challengeTier: 'process',
    label: { ru: 'Со-пилот', en: 'Co-Pilot' },
    desc: {
      ru: 'Подсказка остаётся, но задачу ведёшь ты. ×1.5 шардов.',
      en: 'Hint stays, but you drive the process. ×1.5 shards.',
    },
  },
  archmage: {
    multiplier: 2.5,
    hintVisible: false,
    challengeTier: 'outcome',
    label: { ru: 'Архимаг', en: 'Silent Archmage' },
    desc: {
      ru: 'Без подсказки — только цель. ×2.5 шардов.',
      en: 'No hint — only the outcome. ×2.5 shards.',
    },
  },
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/cs/modes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/cs/modes.ts web/lib/cs/modes.test.ts
git commit -m "feat(cs): add three diagonal mode presets"
```

---

## Task 3: CS award math (the twist)

**Files:**
- Create: `web/lib/cs/award.ts`
- Test: `web/lib/cs/award.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/cs/award.test.ts
import { describe, it, expect } from 'vitest'
import { PHASE_BASE, BASE_TOTAL, computeUnitCS } from './award'

describe('CS award math', () => {
  it('weights the base toward the thinking phases', () => {
    expect(PHASE_BASE.reflection + PHASE_BASE.concept).toBeGreaterThan(
      PHASE_BASE.activation + PHASE_BASE.practice,
    )
  })

  it('base total is the sum of the four phases (70)', () => {
    const sum = PHASE_BASE.activation + PHASE_BASE.reflection + PHASE_BASE.concept + PHASE_BASE.practice
    expect(sum).toBe(70)
    expect(BASE_TOTAL).toBe(70)
  })

  it('computes 70 / 105 / 175 for commander / copilot / archmage', () => {
    expect(computeUnitCS('commander')).toBe(70)
    expect(computeUnitCS('copilot')).toBe(105)
    expect(computeUnitCS('archmage')).toBe(175)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/cs/award.test.ts`
Expected: FAIL ("Cannot find module './award'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/cs/award.ts
import type { Mode } from './types'
import { MODE } from './modes'

// Base CS per phase. 50 of the 70 sit in Reflection+Concept — thinking pays, not just doing.
export const PHASE_BASE = { activation: 5, reflection: 25, concept: 25, practice: 15 } as const

export const BASE_TOTAL =
  PHASE_BASE.activation + PHASE_BASE.reflection + PHASE_BASE.concept + PHASE_BASE.practice // 70

export function computeUnitCS(mode: Mode): number {
  return Math.round(BASE_TOTAL * MODE[mode].multiplier) // 70 / 105 / 175
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/cs/award.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/cs/award.ts web/lib/cs/award.test.ts
git commit -m "feat(cs): add phase-weighted CS award math"
```

---

## Task 4: Wallet ledger (pure helpers + storage shell)

**Files:**
- Create: `web/lib/cs/wallet.ts`
- Test: `web/lib/cs/wallet.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/cs/wallet.test.ts
import { describe, it, expect } from 'vitest'
import { applyAward, applySpend, setModeFor } from './wallet'
import { DEFAULT_WALLET } from './types'

describe('applyAward', () => {
  it('adds the unit CS once and records the unit + mode', () => {
    const w = applyAward(DEFAULT_WALLET, '04-prompt-engineering/u1', 'copilot')
    expect(w.balance).toBe(105)
    expect(w.earnedUnits).toContain('04-prompt-engineering/u1')
    expect(w.modeByUnit['04-prompt-engineering/u1']).toBe('copilot')
  })

  it('is idempotent for a repeated unit key', () => {
    const once = applyAward(DEFAULT_WALLET, 'm/u', 'archmage')
    const twice = applyAward(once, 'm/u', 'commander')
    expect(twice.balance).toBe(175) // unchanged; first award stands
    expect(twice.earnedUnits.filter(k => k === 'm/u')).toHaveLength(1)
  })

  it('does not mutate the input wallet', () => {
    applyAward(DEFAULT_WALLET, 'm/u', 'commander')
    expect(DEFAULT_WALLET.balance).toBe(0)
    expect(DEFAULT_WALLET.earnedUnits).toHaveLength(0)
  })
})

describe('applySpend', () => {
  const funded = { ...DEFAULT_WALLET, balance: 400 }

  it('decrements balance and records the unlock when affordable', () => {
    const { wallet, ok } = applySpend(funded, 300, 'dark-fantasy')
    expect(ok).toBe(true)
    expect(wallet.balance).toBe(100)
    expect(wallet.unlocks).toContain('dark-fantasy')
  })

  it('refuses when balance < cost', () => {
    const { wallet, ok } = applySpend({ ...DEFAULT_WALLET, balance: 50 }, 300, 'dark-fantasy')
    expect(ok).toBe(false)
    expect(wallet.balance).toBe(50)
    expect(wallet.unlocks).not.toContain('dark-fantasy')
  })

  it('refuses a duplicate unlock without charging again', () => {
    const first = applySpend(funded, 300, 'cyber-noir').wallet
    const { wallet, ok } = applySpend(first, 300, 'cyber-noir')
    expect(ok).toBe(false)
    expect(wallet.balance).toBe(100) // not charged twice
  })
})

describe('setModeFor', () => {
  it('records the chosen mode for a unit without touching balance', () => {
    const w = setModeFor(DEFAULT_WALLET, 'm/u', 'archmage')
    expect(w.modeByUnit['m/u']).toBe('archmage')
    expect(w.balance).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/cs/wallet.test.ts`
Expected: FAIL ("Cannot find module './wallet'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/cs/wallet.ts
import type { Mode, Wallet } from './types'
import { STORAGE_KEY, DEFAULT_WALLET } from './types'
import { computeUnitCS } from './award'

// ---- Pure ledger helpers (testable, no storage) ----

export function applyAward(wallet: Wallet, unitKey: string, mode: Mode): Wallet {
  if (wallet.earnedUnits.includes(unitKey)) return wallet
  return {
    ...wallet,
    balance: wallet.balance + computeUnitCS(mode),
    earnedUnits: [...wallet.earnedUnits, unitKey],
    modeByUnit: { ...wallet.modeByUnit, [unitKey]: mode },
  }
}

export function applySpend(
  wallet: Wallet,
  cost: number,
  unlockId: string,
): { wallet: Wallet; ok: boolean } {
  if (wallet.unlocks.includes(unlockId)) return { wallet, ok: false }
  if (wallet.balance < cost) return { wallet, ok: false }
  return {
    wallet: { ...wallet, balance: wallet.balance - cost, unlocks: [...wallet.unlocks, unlockId] },
    ok: true,
  }
}

export function setModeFor(wallet: Wallet, unitKey: string, mode: Mode): Wallet {
  return { ...wallet, modeByUnit: { ...wallet.modeByUnit, [unitKey]: mode } }
}

// ---- Storage shell (browser only) ----

export function readWallet(): Wallet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_WALLET
    const parsed = JSON.parse(raw) as Partial<Wallet>
    return {
      balance: parsed.balance ?? 0,
      earnedUnits: parsed.earnedUnits ?? [],
      unlocks: parsed.unlocks ?? [],
      modeByUnit: parsed.modeByUnit ?? {},
    }
  } catch {
    return DEFAULT_WALLET
  }
}

export function writeWallet(wallet: Wallet): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet))
  } catch {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/cs/wallet.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/cs/wallet.ts web/lib/cs/wallet.test.ts
git commit -m "feat(cs): add wallet ledger helpers and localStorage shell"
```

---

## Task 5: Challenge templates (data)

**Files:**
- Create: `web/lib/cs/challenge-templates.ts`

- [ ] **Step 1: Write the file**

Nine entries, one per module slug from `web/lib/rpg/modules.ts`. Each `task`/`process`/`outcome`/`outcomeGeneric` is a `Bi`. `{niche}` and `{outcome}` are slots filled at runtime by Task 6.

```ts
// web/lib/cs/challenge-templates.ts
import type { ChallengeFraming } from './types'

// One applied-challenge template per module. The mode's challengeTier selects task|process|outcome.
// {niche} = learner's F2 niche, {outcome} = learner's F3 desired outcome.
export const CHALLENGE_TEMPLATES: Record<string, ChallengeFraming> = {
  '00-kickstart': {
    task: { ru: 'Назови три задачи в {niche}, которые сегодня съедают больше всего времени.', en: 'Name three tasks in {niche} that eat the most of your time today.' },
    process: { ru: 'Опиши, как ты сейчас решаешь одну рутину в {niche} — по шагам.', en: 'Describe, step by step, how you currently handle one routine in {niche}.' },
    outcome: { ru: 'Сформулируй, как агент приблизит тебя к цели: {outcome}.', en: 'State how an agent moves you toward your goal: {outcome}.' },
    outcomeGeneric: { ru: 'Сформулируй один результат в {niche}, который хочешь получить с помощью агента.', en: 'State one result in {niche} you want an agent to help you reach.' },
  },
  '01-introduction': {
    task: { ru: 'Выпиши один процесс в {niche}, где «software 3.0» заменит ручной труд.', en: 'Write down one process in {niche} where "software 3.0" replaces manual work.' },
    process: { ru: 'Разложи этот процесс в {niche} на «что делает человек» и «что отдать модели».', en: 'Split that {niche} process into "human does" vs "hand to the model".' },
    outcome: { ru: 'Опиши, как четыре сдвига приближают тебя к: {outcome}.', en: 'Describe how the four shifts move you toward: {outcome}.' },
    outcomeGeneric: { ru: 'Опиши, к какому сдвигу в {niche} ты стремишься в первую очередь.', en: 'Describe which shift in {niche} you are aiming for first.' },
  },
  '02-setup-guide': {
    task: { ru: 'Установи инструменты и запусти первый промпт по задаче из {niche}.', en: 'Install the tools and run a first prompt on a {niche} task.' },
    process: { ru: 'Настрой рабочее окружение под повторяемую задачу в {niche}.', en: 'Set up your environment around a repeatable {niche} task.' },
    outcome: { ru: 'Доведи окружение до состояния, в котором можешь начать: {outcome}.', en: 'Get your environment ready enough to begin: {outcome}.' },
    outcomeGeneric: { ru: 'Доведи окружение до первого рабочего результата в {niche}.', en: 'Get your environment to a first working result in {niche}.' },
  },
  '03-stack-selection': {
    task: { ru: 'Выбери стек (Claude / Sovereign / Cloud-OSS / Behind-GFW) под бюджет и {niche}.', en: 'Pick a stack (Claude / Sovereign / Cloud-OSS / Behind-GFW) for your budget and {niche}.' },
    process: { ru: 'Сравни два стека по критериям, важным для {niche}, и обоснуй выбор.', en: 'Compare two stacks against criteria that matter for {niche} and justify the pick.' },
    outcome: { ru: 'Обоснуй, какой стек быстрее приведёт к: {outcome}.', en: 'Justify which stack reaches this fastest: {outcome}.' },
    outcomeGeneric: { ru: 'Обоснуй стек, который лучше всего подходит твоей работе в {niche}.', en: 'Justify the stack that best fits your work in {niche}.' },
  },
  '04-prompt-engineering': {
    task: { ru: 'Напиши промпт с магическими словами для одной задачи из {niche}.', en: 'Write a prompt with the magic words for one {niche} task.' },
    process: { ru: 'Итерируй промпт для {niche}: фиксируй, что улучшает каждый прогон.', en: 'Iterate a {niche} prompt: note what each pass improves.' },
    outcome: { ru: 'Сконструируй промпт, выдающий результат для: {outcome}.', en: 'Engineer a prompt that yields a result for: {outcome}.' },
    outcomeGeneric: { ru: 'Сконструируй промпт под самый частый запрос в {niche}.', en: 'Engineer a prompt for your most frequent {niche} request.' },
  },
  '05-context-memory': {
    task: { ru: 'Собери файл контекста (PERSONAL-CONTEXT) для агента под {niche}.', en: 'Assemble a context file (PERSONAL-CONTEXT) for an agent in {niche}.' },
    process: { ru: 'Спроектируй, что держать в памяти агента между сессиями для {niche}.', en: 'Design what the agent should keep in memory across {niche} sessions.' },
    outcome: { ru: 'Настрой память так, чтобы агент сам двигал тебя к: {outcome}.', en: 'Tune memory so the agent keeps moving you toward: {outcome}.' },
    outcomeGeneric: { ru: 'Настрой память агента под повторяющийся рабочий цикл в {niche}.', en: 'Tune agent memory for a recurring work cycle in {niche}.' },
  },
  '06-audio-pipeline': {
    task: { ru: 'Прогони пайплайн скрапинг→анализ на одном источнике из {niche}.', en: 'Run the scrape→analyze pipeline on one {niche} source.' },
    process: { ru: 'Спроектируй пайплайн «сырьё → инсайты» для данных {niche}.', en: 'Design a "raw → insights" pipeline for {niche} data.' },
    outcome: { ru: 'Построй пайплайн, который выдаёт инсайты для: {outcome}.', en: 'Build a pipeline that surfaces insights for: {outcome}.' },
    outcomeGeneric: { ru: 'Построй пайплайн, превращающий источник {niche} в полезные инсайты.', en: 'Build a pipeline turning a {niche} source into useful insights.' },
  },
  '07-tools': {
    task: { ru: 'Подключи один MCP-сервер или Skill под задачу из {niche}.', en: 'Wire up one MCP server or Skill for a {niche} task.' },
    process: { ru: 'Спланируй набор инструментов (MCP / Skills / Hooks) под рабочий цикл {niche}.', en: 'Plan a toolset (MCP / Skills / Hooks) for your {niche} work cycle.' },
    outcome: { ru: 'Собери инструменты, чтобы агент сам делал шаги к: {outcome}.', en: 'Assemble tools so the agent itself takes steps toward: {outcome}.' },
    outcomeGeneric: { ru: 'Собери минимальный набор инструментов под частую задачу в {niche}.', en: 'Assemble a minimal toolset for a frequent {niche} task.' },
  },
  '08-agent-engineering': {
    task: { ru: 'Опиши одного агента, который закроет повторяемую задачу в {niche}.', en: 'Describe one agent that closes a repeatable {niche} task.' },
    process: { ru: 'Спроектируй оркестрацию нескольких агентов под процесс {niche}.', en: 'Design multi-agent orchestration for a {niche} process.' },
    outcome: { ru: 'Спроектируй агентскую систему, выдающую: {outcome}.', en: 'Design an agentic system that delivers: {outcome}.' },
    outcomeGeneric: { ru: 'Спроектируй агентскую систему под ключевой результат в {niche}.', en: 'Design an agentic system for a key result in {niche}.' },
  },
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/cs/challenge-templates.ts
git commit -m "feat(cs): add per-module applied-challenge templates"
```

---

## Task 6: Applied-challenge resolver

**Files:**
- Create: `web/lib/cs/applied-challenge.ts`
- Test: `web/lib/cs/applied-challenge.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/cs/applied-challenge.test.ts
import { describe, it, expect } from 'vitest'
import { getAppliedChallenge } from './applied-challenge'

const M = '04-prompt-engineering'

describe('getAppliedChallenge', () => {
  it('slot-fills {niche} for the task tier', () => {
    const out = getAppliedChallenge({ niche: 'юриспруденции', outcome: null }, M, 'task', 'ru')
    expect(out).toContain('юриспруденции')
    expect(out).not.toContain('{niche}')
  })

  it('slot-fills {outcome} for the outcome tier when F3 is present', () => {
    const out = getAppliedChallenge(
      { niche: 'legal', outcome: 'cut review time in half' }, M, 'outcome', 'en',
    )
    expect(out).toContain('cut review time in half')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the niche-generic line when F3 outcome is empty', () => {
    const out = getAppliedChallenge({ niche: 'legal', outcome: '   ' }, M, 'outcome', 'en')
    // outcomeGeneric mentions the niche, not an {outcome} slot
    expect(out).toContain('legal')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the task framing when both niche and outcome are absent (outcome tier)', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'outcome', 'ru')
    const taskNoSlot = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'ru')
    expect(out).toBe(taskNoSlot)
  })

  it('uses a neutral niche word when niche is absent', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'en')
    expect(out).not.toContain('{niche}')
  })

  it('returns null for an unknown module', () => {
    expect(getAppliedChallenge({ niche: 'x', outcome: 'y' }, 'no-such-module', 'task', 'ru')).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts`
Expected: FAIL ("Cannot find module './applied-challenge'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/cs/applied-challenge.ts
import type { ChallengeTier, IntakeLite } from './types'
import type { Locale } from '@/lib/intake/types'
import { CHALLENGE_TEMPLATES } from './challenge-templates'

const NICHE_FALLBACK: Record<Locale, string> = { ru: 'твоей сфере', en: 'your field' }

function clean(v?: string | null): string | null {
  const t = v?.trim()
  return t ? t : null
}

export function getAppliedChallenge(
  profile: IntakeLite,
  moduleSlug: string,
  tier: ChallengeTier,
  locale: Locale,
): string | null {
  const tmpl = CHALLENGE_TEMPLATES[moduleSlug]
  if (!tmpl) return null

  const niche = clean(profile.niche)
  const outcome = clean(profile.outcome)

  let line: string
  if (tier === 'task') {
    line = tmpl.task[locale]
  } else if (tier === 'process') {
    line = tmpl.process[locale]
  } else {
    // outcome tier
    if (outcome) line = tmpl.outcome[locale]
    else if (niche) line = tmpl.outcomeGeneric[locale]
    else line = tmpl.task[locale] // both absent → safe task framing
  }

  return line
    .replace(/\{niche\}/g, niche ?? NICHE_FALLBACK[locale])
    .replace(/\{outcome\}/g, outcome ?? '')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/cs/applied-challenge.ts web/lib/cs/applied-challenge.test.ts
git commit -m "feat(cs): add applied-challenge resolver with intake slot-fill"
```

---

## Task 7: useShards hook

**Files:**
- Create: `web/lib/cs/use-shards.ts`

No unit test (thin React/storage wrapper over the Task 4 helpers, which are already tested — mirrors the untested `useUnitProgress`). Verified via typecheck and downstream component usage.

- [ ] **Step 1: Write the file**

```ts
// web/lib/cs/use-shards.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Mode, Wallet } from './types'
import { readWallet, writeWallet, applyAward, applySpend, setModeFor } from './wallet'
import { DEFAULT_WALLET } from './types'

export function useShards() {
  const [wallet, setWallet] = useState<Wallet>(DEFAULT_WALLET)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setWallet(readWallet())
    setReady(true)
  }, [])

  const award = useCallback((unitKey: string, mode: Mode) => {
    setWallet(prev => {
      const next = applyAward(prev, unitKey, mode)
      writeWallet(next)
      return next
    })
  }, [])

  const spend = useCallback((cost: number, unlockId: string): boolean => {
    let ok = false
    setWallet(prev => {
      const res = applySpend(prev, cost, unlockId)
      ok = res.ok
      if (res.ok) writeWallet(res.wallet)
      return res.wallet
    })
    return ok
  }, [])

  const setMode = useCallback((unitKey: string, mode: Mode) => {
    setWallet(prev => {
      const next = setModeFor(prev, unitKey, mode)
      writeWallet(next)
      return next
    })
  }, [])

  const getMode = useCallback(
    (unitKey: string): Mode | undefined => wallet.modeByUnit[unitKey],
    [wallet],
  )

  const unlocked = useCallback(
    (unlockId: string): boolean => wallet.unlocks.includes(unlockId),
    [wallet],
  )

  return {
    balance: wallet.balance,
    award,
    spend,
    setMode,
    getMode,
    unlocked,
    ready,
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/cs/use-shards.ts
git commit -m "feat(cs): add useShards hook over the wallet"
```

---

## Task 8: ShardBalance component

**Files:**
- Create: `web/components/cs/shard-balance.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/cs/shard-balance.tsx
'use client'

import { useShards } from '@/lib/cs/use-shards'

export function ShardBalance({ accent }: { accent?: string }) {
  const { balance, ready } = useShards()
  if (!ready) return null
  return (
    <span
      title="Cognitive Shards"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        color: accent ?? 'var(--text-accent)',
      }}
    >
      <span aria-hidden="true">💎</span>
      {balance}
    </span>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/cs/shard-balance.tsx
git commit -m "feat(cs): add ShardBalance counter component"
```

---

## Task 9: ModeSelector component

**Files:**
- Create: `web/components/cs/mode-selector.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/cs/mode-selector.tsx
'use client'

import type { Mode } from '@/lib/cs/types'
import type { Locale } from '@/lib/intake/types'
import { MODE } from '@/lib/cs/modes'
import { computeUnitCS } from '@/lib/cs/award'

const ORDER: Mode[] = ['commander', 'copilot', 'archmage']

const HEADING: Record<Locale, string> = {
  ru: 'Выбери режим прохождения',
  en: 'Choose your mode',
}

export function ModeSelector({
  locale,
  accent,
  selected,
  onSelect,
}: {
  locale: Locale
  accent: string
  selected?: Mode
  onSelect: (mode: Mode) => void
}) {
  return (
    <div style={{ margin: '0 0 2rem' }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        marginBottom: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {HEADING[locale]}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
        {ORDER.map(m => {
          const cfg = MODE[m]
          const active = selected === m
          return (
            <button
              key={m}
              onClick={() => onSelect(m)}
              style={{
                textAlign: 'left',
                padding: '0.9rem 1.1rem',
                background: active ? 'var(--bg-surface)' : 'transparent',
                border: `1px solid ${active ? accent : 'var(--border-color)'}`,
                borderRadius: 10,
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: active ? accent : 'var(--text-primary)' }}>
                  {cfg.label[locale]}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  +{computeUnitCS(m)} 💎
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                {cfg.desc[locale]}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/cs/mode-selector.tsx
git commit -m "feat(cs): add ModeSelector 3-card chooser"
```

---

## Task 10: CycleComplete component

**Files:**
- Create: `web/components/cs/cycle-complete.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/cs/cycle-complete.tsx
'use client'

import type { Mode } from '@/lib/cs/types'
import type { Locale } from '@/lib/intake/types'
import { MODE } from '@/lib/cs/modes'
import { computeUnitCS } from '@/lib/cs/award'

const LABEL: Record<Locale, string> = { ru: 'УЗЕЛ ПРОЙДЕН', en: 'NODE CLEARED' }

export function CycleComplete({
  mode,
  locale,
  accent,
}: {
  mode: Mode
  locale: Locale
  accent: string
}) {
  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '0.8rem 1.1rem',
      borderRadius: 8,
      background: 'var(--bg-surface)',
      border: `1px solid ${accent}`,
      fontFamily: 'var(--font-mono)',
      fontSize: '0.8rem',
      color: accent,
    }}>
      {LABEL[locale]} · +{computeUnitCS(mode)} CS · {MODE[mode].label[locale]}
    </div>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/cs/cycle-complete.tsx
git commit -m "feat(cs): add CycleComplete award notification"
```

---

## Task 11: Vault component

**Files:**
- Create: `web/components/cs/vault.tsx`

The intake-assigned skin is always free (never listed as locked). All other non-`wanderer` skins are unlockable for `SKIN_UNLOCK_COST`.

- [ ] **Step 1: Write the file**

```tsx
// web/components/cs/vault.tsx
'use client'

import type { Locale, WorldSkin } from '@/lib/intake/types'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { SKIN_UNLOCK_COST } from '@/lib/cs/types'
import { useShards } from '@/lib/cs/use-shards'

const TITLE: Record<Locale, string> = { ru: 'Хранилище', en: 'Vault' }
const SUBTITLE: Record<Locale, string> = {
  ru: 'Открывай альтернативные миры за шарды.',
  en: 'Unlock alternate worlds with shards.',
}
const OWNED: Record<Locale, string> = { ru: 'активный мир', en: 'active world' }
const UNLOCKED: Record<Locale, string> = { ru: 'открыто', en: 'unlocked' }
const UNLOCK: Record<Locale, string> = { ru: 'Открыть', en: 'Unlock' }

// Selectable theme skins (exclude the neutral 'wanderer' fallback).
const SELECTABLE: WorldSkin[] = [
  'slavic-myth', 'dark-fantasy', 'cyber-noir', 'space-opera',
  'anime-quest', 'soviet-heroic', 'mystic-arcane',
]

export function Vault({ activeSkin, locale }: { activeSkin: WorldSkin; locale: Locale }) {
  const { balance, spend, unlocked, ready } = useShards()
  if (!ready) return null

  return (
    <section style={{ marginTop: '2rem' }}>
      <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', marginBottom: '0.25rem' }}>{TITLE[locale]}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>{SUBTITLE[locale]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem' }}>
        {SELECTABLE.map(skin => {
          const meta = SKINS_META[skin]
          const isActive = skin === activeSkin
          const isUnlocked = isActive || unlocked(skin)
          const canAfford = balance >= SKIN_UNLOCK_COST
          return (
            <div
              key={skin}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                padding: '0.7rem 1rem',
                border: `1px solid ${isUnlocked ? meta.accent : 'var(--border-color)'}`,
                borderRadius: 8,
                opacity: isUnlocked ? 1 : 0.85,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{meta.glyph}</span>
                <span style={{ fontSize: '0.9rem' }}>{meta.displayName[locale]}</span>
              </span>
              {isActive ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: meta.accent }}>{OWNED[locale]}</span>
              ) : isUnlocked ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: meta.accent }}>{UNLOCKED[locale]}</span>
              ) : (
                <button
                  onClick={() => spend(SKIN_UNLOCK_COST, skin)}
                  disabled={!canAfford}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    padding: '0.4rem 0.7rem',
                    borderRadius: 6,
                    border: 'none',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    background: canAfford ? meta.accent : 'var(--border-color)',
                    color: canAfford ? '#000' : 'var(--text-secondary)',
                  }}
                >
                  {UNLOCK[locale]} · {SKIN_UNLOCK_COST} 💎
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/cs/vault.tsx
git commit -m "feat(cs): add Vault spend surface for alternate skins"
```

---

## Task 12: Wire CS economy into UnitWizard

**Files:**
- Modify: `web/components/unit-wizard.tsx`

Integrates: capture intake `niche`/`F3`; choose a mode (gates hint + challenge tier); render the applied challenge at Practice; award CS on completion; show CycleComplete.

- [ ] **Step 1: Add CS imports**

After the existing import block (the `getUnitFraming` import on line 9, before the `import type { SkinPack, WorldSkin }` line is fine too), add:

```tsx
import { useShards } from '@/lib/cs/use-shards'
import { MODE } from '@/lib/cs/modes'
import { getAppliedChallenge } from '@/lib/cs/applied-challenge'
import { ModeSelector } from '@/components/cs/mode-selector'
import { CycleComplete } from '@/components/cs/cycle-complete'
import type { Mode } from '@/lib/cs/types'
import { SKINS_META } from '@/lib/rpg/skins-meta' // already imported — keep one copy
```

> Note: `SKINS_META` is already imported on line 8. Do not duplicate it — only add the lines that aren't already present.

- [ ] **Step 2: Add CS state and capture intake niche/outcome**

Replace the intake-fetch effect (lines 45-60) so it also stores `niche` and the F3 outcome. The block currently is:

```tsx
  const [skin, setSkin] = useState<WorldSkin | null>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p?.world_skin) return
        setSkin(p.world_skin as WorldSkin)
        try {
          const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`)
          setPack(mod.default as SkinPack)
        } catch { setPack(null) }
      })
      .catch(() => {})
  }, [])
```

Replace with:

```tsx
  const [skin, setSkin] = useState<WorldSkin | null>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)
  const [niche, setNiche] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<string | null>(null)

  const unitKey = `${moduleSlug}/${unitSlug}`
  const { award, setMode, getMode, ready: shardsReady } = useShards()
  const chosenMode: Mode | undefined = getMode(unitKey)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p?.world_skin) return
        setSkin(p.world_skin as WorldSkin)
        setNiche(p.niche ?? null)
        try {
          const ans = typeof p.answers === 'string' ? JSON.parse(p.answers) : p.answers
          const f3 = ans?.F3
          setOutcome(typeof f3 === 'string' ? f3 : null)
        } catch { setOutcome(null) }
        try {
          const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`)
          setPack(mod.default as SkinPack)
        } catch { setPack(null) }
      })
      .catch(() => {})
  }, [])
```

- [ ] **Step 3: Update handleComplete to award CS**

Replace the existing `handleComplete` (lines 79-82):

```tsx
  function handleComplete() {
    markCompleted(moduleSlug, unitSlug)
    setDone(true)
  }
```

with:

```tsx
  function handleComplete() {
    markCompleted(moduleSlug, unitSlug)
    if (chosenMode) award(unitKey, chosenMode)
    setDone(true)
  }
```

- [ ] **Step 4: Render the mode selector at unit start**

Immediately after the breadcrumb `</div>` (currently line 103, before the `{currentStep === 0 && framing?.intro && ...}` block), insert:

```tsx
      {shardsReady && !done && !chosenMode && (
        <ModeSelector
          locale={locale}
          accent={skin ? (SKINS_META[skin]?.accent ?? 'var(--text-accent)') : 'var(--text-accent)'}
          selected={chosenMode}
          onSelect={(m) => setMode(unitKey, m)}
        />
      )}
```

- [ ] **Step 5: Gate the mentor hint by mode and render the applied challenge at Practice**

Replace the Practice-phase hint block (currently lines 146-163, the `{currentStep === 3 && framing?.mentorHint && mentor && (...)}` block) with a version that (a) gates the hint by the chosen mode's `hintVisible`, and (b) renders the applied challenge:

```tsx
        {currentStep === 3 && (() => {
          const tier = chosenMode ? MODE[chosenMode].challengeTier : 'task'
          const hintVisible = chosenMode ? MODE[chosenMode].hintVisible : true
          const challenge = getAppliedChallenge({ niche, outcome }, moduleSlug, tier, locale)
          return (
            <>
              {challenge && (
                <div style={{
                  marginTop: '1.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px dashed var(--text-accent)',
                  borderRadius: 10,
                  padding: '0.9rem 1.1rem',
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                    {locale === 'en' ? 'Your applied challenge' : 'Твой прикладной вызов'}
                  </div>
                  <div style={{ fontSize: '0.92rem' }}>{challenge}</div>
                </div>
              )}
              {hintVisible && framing?.mentorHint && mentor && (
                <div style={{
                  display: 'flex',
                  gap: '0.6rem',
                  alignItems: 'flex-start',
                  marginTop: '1.5rem',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 10,
                  padding: '0.9rem 1.1rem',
                }}>
                  <span aria-hidden="true" style={{ fontSize: '1.3rem', lineHeight: 1 }}>{mentor.glyph}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-accent)' }}>{mentor.name[locale]}</div>
                    <div style={{ fontSize: '0.9rem' }}>«{framing.mentorHint[locale]}»</div>
                  </div>
                </div>
              )}
            </>
          )
        })()}
```

- [ ] **Step 6: Render CycleComplete in the done state**

Immediately after the `{done && framing?.outro && (...)}` block (currently ends line 178), insert:

```tsx
      {done && chosenMode && (
        <CycleComplete
          mode={chosenMode}
          locale={locale}
          accent={skin ? (SKINS_META[skin]?.accent ?? 'var(--text-accent)') : 'var(--text-accent)'}
        />
      )}
```

- [ ] **Step 7: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 8: Run the full web test suite (no regressions)**

Run: `cd web && npx vitest run`
Expected: PASS (all existing suites + the new CS suites green).

- [ ] **Step 9: Commit**

```bash
git add web/components/unit-wizard.tsx
git commit -m "feat(cs): wire mode selector, hint gating, applied challenge and award into UnitWizard"
```

---

## Task 13: Wire ShardBalance + Vault into the dashboard

**Files:**
- Modify: `web/app/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Add imports**

After the existing imports (after line 13 `import type { Locale } from '@/lib/intake/types'`), add:

```tsx
import { ShardBalance } from '@/components/cs/shard-balance'
import { Vault } from '@/components/cs/vault'
import type { WorldSkin } from '@/lib/intake/types'
```

- [ ] **Step 2: Render the balance in the header and the Vault below the feed**

Replace the returned `<main>...</main>` block (lines 47-51):

```tsx
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <CharacterStrip summary={vm.summary} accent={accent} locale={locale} />
        <div style={{ margin: '1.5rem 0' }}><WorldMap zones={vm.zones} accent={accent} glyph={glyph} /></div>
        <QuestFeed zones={vm.zones} accent={accent} locale={locale} />
      </main>
```

with:

```tsx
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem' }}>
          <ShardBalance accent={accent} />
        </div>
        <CharacterStrip summary={vm.summary} accent={accent} locale={locale} />
        <div style={{ margin: '1.5rem 0' }}><WorldMap zones={vm.zones} accent={accent} glyph={glyph} /></div>
        <QuestFeed zones={vm.zones} accent={accent} locale={locale} />
        <Vault activeSkin={profile.world_skin as WorldSkin} locale={locale} />
      </main>
```

- [ ] **Step 3: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: Build the static export (catches App Router/export breakage)**

Run: `cd web && npx next build`
Expected: PASS (export completes; no prerender errors on `/dashboard` or `/en/dashboard`).

- [ ] **Step 5: Commit**

```bash
git add web/app/dashboard/dashboard-client.tsx
git commit -m "feat(cs): surface shard balance and Vault on the dashboard"
```

---

## Task 14: Update the program tracker

**Files:**
- Modify: `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`

- [ ] **Step 1: Mark SP3 done**

Open the tracker and locate the **SP3 — XP / Leveling** row. Replace its title/description with **SP3 — Cognitive Shards Economy** and set its status to shipped (match the status convention the file already uses for SP1/SP2a/SP2d — e.g. ✅ / "Done"). Add a link to this plan and to the spec:

- Spec: `docs/superpowers/specs/2026-05-22-cognitive-shards-economy-design.md`
- Plan: `docs/superpowers/plans/2026-05-22-cognitive-shards-economy.md`

(Read the file first to match its exact row format; do not invent a new table shape.)

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md
git commit -m "docs: mark SP3 as Cognitive Shards Economy (shipped) in program tracker"
```

---

## Final verification

- [ ] **All CS unit tests pass**

Run: `cd web && npx vitest run lib/cs`
Expected: PASS (modes, award, wallet, applied-challenge suites).

- [ ] **Full suite + typecheck + build**

Run: `cd web && npx tsc --noEmit && npx vitest run && npx next build`
Expected: all PASS.

- [ ] **Request code review** via superpowers:requesting-code-review against the spec.

---

## Self-Review notes (author)

- **Spec coverage:** S1 currency → Tasks 1,3,4. S2 weighting → Task 3 (`PHASE_BASE`). S3/S4 diagonal modes → Tasks 2,9,12. S5 intake challenge → Tasks 5,6,12. S6 localStorage wallet → Tasks 4,7. S7 sinks (alt skins, intake skin free, voices deferred) → Task 11. S8 out-of-scope respected (no leaderboards/server/voices/full-3×3). Testing section → Tasks 2,3,4,6 + Final. Program linkage → Task 14.
- **Type consistency:** `Mode`, `Wallet`, `ChallengeTier`, `IntakeLite`, `ChallengeFraming`, `STORAGE_KEY`, `DEFAULT_WALLET`, `SKIN_UNLOCK_COST` defined once in Task 1 and used verbatim downstream. `computeUnitCS(mode)`, `applyAward`/`applySpend`/`setModeFor`, `getAppliedChallenge(profile, moduleSlug, tier, locale)`, `useShards()` surface (`balance/award/spend/setMode/getMode/unlocked/ready`) consistent across tasks.
- **Open assumption for executor:** `/api/intake/me` returns `niche` (column) and `answers` (JSON or string) with `F3` free text — Task 12 parses both shapes defensively. If the live payload omits `niche`/`answers`, the applied challenge falls back gracefully (never throws) per Task 6.
```
