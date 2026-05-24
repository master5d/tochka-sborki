# Niche Dungeons (SP2c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in, niche-specific challenge arc on a dedicated `/dungeon` page — 3 escalating-tier stages on the learner's niche-mapped module plus an authored boss — gated behind niche-module completion, rewarding CS and flipping the niche zone on the World Map to "cleared."

**Architecture:** All client-side, deterministic. Pure modules under `web/lib/dungeon/` (types, authored flavor bank, `buildDungeon` assembler, localStorage store) + a `useDungeon` hook. Reuses SP3 `getAppliedChallenge` for stages (and a newly-extracted shared `fillNicheSlots` for the boss) and the SP2b CS `credit`. Surfaces: a `/dungeon` route (client-fetches profile like the dashboard), a dashboard entry card, and an additive World Map "cleared" marker.

**Tech Stack:** Next.js 16 App Router (`'use client'`), TypeScript, Vitest (pure logic only), localStorage.

**Spec:** `docs/superpowers/specs/2026-05-24-niche-dungeons-design.md`

**Conventions:**
- `Bi = { ru: string; en: string }` from `@/lib/rpg/types`; `Locale`, `WorldSkin` from `@/lib/intake/types`.
- UI copy as inline `Bi`/`Record<Locale,string>` constants in the dungeon modules (matches the SP2b/SP3 pattern).
- Run tests/typecheck from `web/`: `cd web && npx vitest run lib/dungeon/...` and `cd web && npx tsc --noEmit`. The full vitest run has pool-fork flakiness on slow workers — use `npx vitest run --no-file-parallelism` for a deterministic full run. `git add` with repo-relative paths from the repo root.
- Preserve Cyrillic exactly (genuine letters, no transliteration).
- CS credit keys are namespaced `dungeon:<niche>:s1|s2|s3|boss` (idempotent via the SP3 wallet `applyCredit`).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `web/lib/dungeon/types.ts` | `StageTier`, `DungeonStage`, `DungeonBoss`, `DungeonView`, `NicheFlavor`, `DungeonInput` |
| `web/lib/cs/applied-challenge.ts` | (modify) extract + export `fillNicheSlots`; use it internally |
| `web/lib/dungeon/flavor-bank.ts` | 8-niche authored `FLAVOR_BANK` (data) |
| `web/lib/dungeon/build-dungeon.ts` | pure `buildDungeon(input): DungeonView` |
| `web/lib/dungeon/dungeon-store.ts` | localStorage `niche_dungeon` store (pure helpers + shell) |
| `web/lib/dungeon/use-dungeon.ts` | `useDungeon(params)` + `useNicheDungeonCleared(niche)` |
| `web/components/dungeon/dungeon-view.tsx` | presentational page body (locked teaser / intro+stages+boss) |
| `web/components/dungeon/dungeon-card.tsx` | dashboard entry card |
| `web/app/dungeon/dungeon-client.tsx` | `/dungeon` orchestration (fetch profile, progress, hook, render view) |
| `web/app/dungeon/page.tsx` + `web/app/en/dungeon/page.tsx` | routes (pass `moduleTitles`) |
| `web/components/rpg/world-map.tsx` | (modify) add `nicheDungeonCleared?` → cleared marker on the niche zone |
| `web/app/dashboard/dashboard-client.tsx` | (modify) render `<DungeonCard>`, pass `nicheDungeonCleared` to `<WorldMap>` |

---

## Task 1: Dungeon types

**Files:** Create `web/lib/dungeon/types.ts`

- [ ] **Step 1: Write the file**

```ts
// web/lib/dungeon/types.ts
import type { Locale, WorldSkin } from '@/lib/intake/types'
import type { Bi } from '@/lib/rpg/types'

export type StageTier = 'task' | 'process' | 'outcome'

export interface DungeonStage { id: string; tier: StageTier; body: string; cs: number }
export interface DungeonBoss { id: string; name: string; body: string; cs: number }

export interface DungeonView {
  niche: string
  module: string
  locked: boolean
  dungeonName: string
  intro: string
  stages: DungeonStage[]
  boss: DungeonBoss
}

export interface NicheFlavor { dungeonName: Bi; bossName: Bi; intro: Bi; bossChallenge: Bi }

export interface DungeonInput {
  locale: Locale
  skin: WorldSkin
  niche: string | null
  outcome: string | null
  isModuleCompleted: (moduleSlug: string) => boolean
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/lib/dungeon/types.ts
git commit -m "feat(dungeon): add niche-dungeon types"
```

---

## Task 2: Extract `fillNicheSlots` from applied-challenge (DRY)

**Files:** Modify `web/lib/cs/applied-challenge.ts`; Test `web/lib/cs/applied-challenge.test.ts`

- [ ] **Step 1: Add the failing test**

Append inside `web/lib/cs/applied-challenge.test.ts` (add `fillNicheSlots` to the existing import from `./applied-challenge`):

```ts
describe('fillNicheSlots', () => {
  it('fills {niche} with the value and {outcome} with the value', () => {
    expect(fillNicheSlots('do {niche} → {outcome}', 'legal', 'win', 'en')).toBe('do legal → win')
  })
  it('falls back to the locale niche word when niche is empty, and {outcome} to empty', () => {
    expect(fillNicheSlots('for {niche}: {outcome}', '  ', null, 'en')).toBe('for your field: ')
    expect(fillNicheSlots('для {niche}', null, null, 'ru')).toBe('для твоей сфере')
  })
})
```

- [ ] **Step 2: Run → FAIL**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts`
Expected: FAIL (`fillNicheSlots` not exported).

- [ ] **Step 3: Refactor `web/lib/cs/applied-challenge.ts`**

Replace the file body with (extracts `fillNicheSlots`, `getAppliedChallenge` now uses it):

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

// Shared {niche}/{outcome} slot-fill: {niche} → value or the locale fallback word; {outcome} → value or ''.
export function fillNicheSlots(text: string, niche: string | null, outcome: string | null, locale: Locale): string {
  const n = clean(niche)
  const o = clean(outcome)
  return text.replace(/\{niche\}/g, n ?? NICHE_FALLBACK[locale]).replace(/\{outcome\}/g, o ?? '')
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
    if (outcome) line = tmpl.outcome[locale]
    else if (niche) line = tmpl.outcomeGeneric[locale]
    else line = tmpl.task[locale]
  }

  return fillNicheSlots(line, profile.niche, profile.outcome, locale)
}
```

- [ ] **Step 4: Run → PASS**

Run: `cd web && npx vitest run lib/cs/applied-challenge.test.ts`
Expected: PASS (existing applied-challenge tests + 2 new `fillNicheSlots` tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/cs/applied-challenge.ts web/lib/cs/applied-challenge.test.ts
git commit -m "refactor(cs): extract shared fillNicheSlots from getAppliedChallenge"
```

---

## Task 3: Niche flavor bank

**Files:** Create `web/lib/dungeon/flavor-bank.ts`

- [ ] **Step 1: Write the file** (8 niche keys; bilingual)

```ts
// web/lib/dungeon/flavor-bank.ts
import type { NicheFlavor } from './types'

// Per-niche dungeon identity. Skin-neutral (skin = accent/chrome); niche is the identity axis.
// `other` is both its own niche and the fallback for null/unknown niches.
export const FLAVOR_BANK: Record<string, NicheFlavor> = {
  coach: {
    dungeonName: { ru: 'Чертог Резонанса', en: 'Hall of Resonance' },
    bossName: { ru: 'Эхо Сомнения', en: 'The Echo of Doubt' },
    intro: { ru: 'Здесь слова становятся опорой для другого. Пройди вглубь — и научи агента слушать так, как слушаешь ты.', en: 'Here words become a foothold for another. Go deeper — and teach an agent to listen the way you do.' },
    bossChallenge: { ru: 'Собери агентский поток для {niche}: от первого сообщения клиента до структурированного инсайта, который двигает к {outcome}.', en: 'Assemble an agentic flow for {niche}: from a client\'s first message to a structured insight that moves toward {outcome}.' },
  },
  massage: {
    dungeonName: { ru: 'Грот Прикосновения', en: 'Grotto of Touch' },
    bossName: { ru: 'Узел Напряжения', en: 'The Knot of Tension' },
    intro: { ru: 'Тело помнит то, что забывает ум. Спустись и собери инструмент, что освободит твоё время для рук.', en: 'The body remembers what the mind forgets. Descend and build a tool that frees your time for your hands.' },
    bossChallenge: { ru: 'Спроектируй агента для {niche}, который ведёт запись, историю и follow-up клиентов — так, чтобы приблизить {outcome}.', en: 'Design an agent for {niche} that handles booking, client history and follow-ups — to bring {outcome} closer.' },
  },
  astrology: {
    dungeonName: { ru: 'Обсерватория Знаков', en: 'Observatory of Signs' },
    bossName: { ru: 'Молчание Звёзд', en: 'The Silence of Stars' },
    intro: { ru: 'Карты неба бесконечны, а часов в сутках мало. Сделай агента, что читает узор вместе с тобой.', en: 'The sky\'s charts are endless, the day\'s hours few. Make an agent that reads the pattern alongside you.' },
    bossChallenge: { ru: 'Построй для {niche} агентский разбор: входные данные клиента → персональная трактовка → шаг к {outcome}.', en: 'Build an agentic reading for {niche}: client inputs → a personal interpretation → a step toward {outcome}.' },
  },
  content: {
    dungeonName: { ru: 'Лабиринт Потока', en: 'Labyrinth of Feed' },
    bossName: { ru: 'Алгоритм-Пожиратель', en: 'The Devouring Algorithm' },
    intro: { ru: 'Лента ненасытна. Спустись и собери конвейер, что превращает идею в серию, пока ты спишь.', en: 'The feed is insatiable. Descend and build a pipeline that turns one idea into a series while you sleep.' },
    bossChallenge: { ru: 'Собери для {niche} пайплайн «идея → серия постов → распространение», нацеленный на {outcome}.', en: 'Assemble an "idea → post series → distribution" pipeline for {niche}, aimed at {outcome}.' },
  },
  ecommerce: {
    dungeonName: { ru: 'Хранилище Витрин', en: 'Vault of Storefronts' },
    bossName: { ru: 'Брошенная Корзина', en: 'The Abandoned Cart' },
    intro: { ru: 'Каждая карточка — это бой за внимание. Спустись и выкуй агента, что продаёт, пока ты считаешь прибыль.', en: 'Every listing is a fight for attention. Descend and forge an agent that sells while you count profit.' },
    bossChallenge: { ru: 'Спроектируй для {niche} агента: описания товаров, ответы покупателям и работа с возражениями — ради {outcome}.', en: 'Design an agent for {niche}: product copy, buyer replies, and objection handling — for {outcome}.' },
  },
  service: {
    dungeonName: { ru: 'Мастерская Услуг', en: 'Workshop of Services' },
    bossName: { ru: 'Очередь Без Конца', en: 'The Endless Queue' },
    intro: { ru: 'Клиенты приходят быстрее, чем уходят. Спустись и собери систему, что держит поток без выгорания.', en: 'Clients arrive faster than they leave. Descend and build a system that holds the flow without burnout.' },
    bossChallenge: { ru: 'Построй для {niche} агентский узел: заявка → квалификация → расписание → follow-up, ведущий к {outcome}.', en: 'Build an agentic hub for {niche}: lead → qualification → scheduling → follow-up that leads to {outcome}.' },
  },
  tech: {
    dungeonName: { ru: 'Ядро Систем', en: 'The Systems Core' },
    bossName: { ru: 'Легаси-Левиафан', en: 'The Legacy Leviathan' },
    intro: { ru: 'Ты строишь то, что строит другое. Спустись и собери агента, что берёт на себя черновую работу.', en: 'You build what builds other things. Descend and assemble an agent that takes the grunt work.' },
    bossChallenge: { ru: 'Спроектируй для {niche} мультиагентную систему, автоматизирующую повторяемый рабочий цикл к {outcome}.', en: 'Design a multi-agent system for {niche} that automates a repeatable work cycle toward {outcome}.' },
  },
  other: {
    dungeonName: { ru: 'Безымянный Предел', en: 'The Nameless Reach' },
    bossName: { ru: 'Туман Неопределённости', en: 'The Fog of the Undefined' },
    intro: { ru: 'Твой путь ещё не на картах — тем интереснее. Спустись и собери агента под свою собственную задачу.', en: 'Your path isn\'t on the maps yet — all the better. Descend and build an agent for your own task.' },
    bossChallenge: { ru: 'Спроектируй агента под {niche}, который закрывает твою главную повторяемую задачу — ради {outcome}.', en: 'Design an agent for {niche} that closes your single biggest repeatable task — for {outcome}.' },
  },
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/lib/dungeon/flavor-bank.ts
git commit -m "feat(dungeon): add per-niche flavor bank (8 niches)"
```

---

## Task 4: `buildDungeon` assembler

**Files:** Create `web/lib/dungeon/build-dungeon.ts`; Test `web/lib/dungeon/build-dungeon.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/dungeon/build-dungeon.test.ts
import { describe, it, expect } from 'vitest'
import { buildDungeon } from './build-dungeon'
import type { DungeonInput } from './types'

function base(over: Partial<DungeonInput> = {}): DungeonInput {
  return {
    locale: 'ru',
    skin: 'slavic-myth',
    niche: 'coach',
    outcome: null,
    isModuleCompleted: () => true,
    ...over,
  }
}

describe('buildDungeon', () => {
  it('maps niche to its module and names from the flavor bank', () => {
    const v = buildDungeon(base())
    expect(v.niche).toBe('coach')
    expect(v.module).toBe('04-prompt-engineering') // NICHE_MODULE['coach']
    expect(v.dungeonName).toBe('Чертог Резонанса')
    expect(v.boss.name).toBe('Эхо Сомнения')
  })

  it('produces 3 stages at escalating tiers with cs 15', () => {
    const v = buildDungeon(base())
    expect(v.stages.map(s => s.tier)).toEqual(['task', 'process', 'outcome'])
    expect(v.stages.map(s => s.id)).toEqual(['dungeon:coach:s1', 'dungeon:coach:s2', 'dungeon:coach:s3'])
    expect(v.stages.every(s => s.cs === 15)).toBe(true)
    expect(v.stages.every(s => s.body.length > 0)).toBe(true)
  })

  it('boss has cs 50, namespaced id, and slot-filled body', () => {
    const v = buildDungeon(base({ niche: 'coach', outcome: 'more clients' }))
    expect(v.boss.id).toBe('dungeon:coach:boss')
    expect(v.boss.cs).toBe(50)
    expect(v.boss.body).toContain('more clients')
    expect(v.boss.body).not.toContain('{outcome}')
    expect(v.boss.body).not.toContain('{niche}')
  })

  it('is locked when the niche module is not completed', () => {
    expect(buildDungeon(base({ isModuleCompleted: () => false })).locked).toBe(true)
    expect(buildDungeon(base({ isModuleCompleted: () => true })).locked).toBe(false)
  })

  it('falls back to the "other" flavor for an unknown/null niche', () => {
    const v = buildDungeon(base({ niche: null }))
    expect(v.niche).toBe('other')
    expect(v.dungeonName).toBe('Безымянный Предел')
    expect(v.boss.id).toBe('dungeon:other:boss')
  })

  it('is deterministic for the same input', () => {
    expect(buildDungeon(base())).toEqual(buildDungeon(base()))
  })
})
```

- [ ] **Step 2: Run → FAIL** — `cd web && npx vitest run lib/dungeon/build-dungeon.test.ts` (module not found).

- [ ] **Step 3: Write `web/lib/dungeon/build-dungeon.ts`**

```ts
// web/lib/dungeon/build-dungeon.ts
import type { DungeonInput, DungeonView, StageTier } from './types'
import { NICHE_MODULE } from '@/lib/rpg/niche-map'
import { getAppliedChallenge, fillNicheSlots } from '@/lib/cs/applied-challenge'
import { FLAVOR_BANK } from './flavor-bank'

const TIERS: StageTier[] = ['task', 'process', 'outcome']
const FALLBACK_MODULE = '04-prompt-engineering'

export function buildDungeon(input: DungeonInput): DungeonView {
  const { locale, niche: rawNiche, outcome } = input
  const niche = rawNiche && FLAVOR_BANK[rawNiche] ? rawNiche : 'other'
  const module = NICHE_MODULE[niche] ?? FALLBACK_MODULE
  const flavor = FLAVOR_BANK[niche]
  const locked = !input.isModuleCompleted(module)

  const stages = TIERS.map((tier, i) => ({
    id: `dungeon:${niche}:s${i + 1}`,
    tier,
    body: getAppliedChallenge({ niche: rawNiche, outcome }, module, tier, locale) ?? '',
    cs: 15,
  }))

  const boss = {
    id: `dungeon:${niche}:boss`,
    name: flavor.bossName[locale],
    body: fillNicheSlots(flavor.bossChallenge[locale], rawNiche, outcome, locale),
    cs: 50,
  }

  return { niche, module, locked, dungeonName: flavor.dungeonName[locale], intro: flavor.intro[locale], stages, boss }
}
```

- [ ] **Step 4: Run → PASS** — `cd web && npx vitest run lib/dungeon/build-dungeon.test.ts` (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/dungeon/build-dungeon.ts web/lib/dungeon/build-dungeon.test.ts
git commit -m "feat(dungeon): add buildDungeon assembler"
```

---

## Task 5: Dungeon store (localStorage)

**Files:** Create `web/lib/dungeon/dungeon-store.ts`; Test `web/lib/dungeon/dungeon-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/dungeon/dungeon-store.test.ts
import { describe, it, expect } from 'vitest'
import { markCleared, isCleared } from './dungeon-store'

describe('markCleared / isCleared', () => {
  it('marks an id once and reports it cleared', () => {
    const s = { clearedIds: [] as string[] }
    const next = markCleared(s, 'dungeon:coach:s1')
    expect(isCleared(next, 'dungeon:coach:s1')).toBe(true)
  })
  it('is idempotent for a repeated id', () => {
    const s = { clearedIds: ['x'] }
    expect(markCleared(s, 'x').clearedIds).toEqual(['x'])
  })
  it('does not mutate the input', () => {
    const s = { clearedIds: [] as string[] }
    markCleared(s, 'y')
    expect(s.clearedIds).toEqual([])
  })
  it('isCleared is false for unknown id', () => {
    expect(isCleared({ clearedIds: ['a'] }, 'b')).toBe(false)
  })
})
```

- [ ] **Step 2: Run → FAIL** — `cd web && npx vitest run lib/dungeon/dungeon-store.test.ts`.

- [ ] **Step 3: Write `web/lib/dungeon/dungeon-store.ts`**

```ts
// web/lib/dungeon/dungeon-store.ts

export interface DungeonStore { clearedIds: string[] }

const STORAGE_KEY = 'niche_dungeon'

export function markCleared(store: DungeonStore, id: string): DungeonStore {
  if (store.clearedIds.includes(id)) return store
  return { clearedIds: [...store.clearedIds, id] }
}

export function isCleared(store: DungeonStore, id: string): boolean {
  return store.clearedIds.includes(id)
}

// ---- storage shell (browser only) ----

export function readDungeon(): DungeonStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { clearedIds: [] }
    const parsed = JSON.parse(raw) as Partial<DungeonStore>
    return { clearedIds: Array.isArray(parsed.clearedIds) ? parsed.clearedIds : [] }
  } catch {
    return { clearedIds: [] }
  }
}

export function writeDungeon(store: DungeonStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {}
}
```

- [ ] **Step 4: Run → PASS** (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/dungeon/dungeon-store.ts web/lib/dungeon/dungeon-store.test.ts
git commit -m "feat(dungeon): add niche-dungeon localStorage store"
```

---

## Task 6: `useDungeon` hook

**Files:** Create `web/lib/dungeon/use-dungeon.ts` (no unit test — thin React/storage wrapper over tested pure modules; verified by tsc + downstream usage)

- [ ] **Step 1: Write the file**

```ts
// web/lib/dungeon/use-dungeon.ts
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { DungeonInput } from './types'
import { buildDungeon } from './build-dungeon'
import { FLAVOR_BANK } from './flavor-bank'
import { readDungeon, writeDungeon, markCleared, type DungeonStore } from './dungeon-store'
import { useShards } from '@/lib/cs/use-shards'

export function useDungeon(params: DungeonInput) {
  const { credit, ready: shardsReady } = useShards()
  const [store, setStore] = useState<DungeonStore | null>(null)

  useEffect(() => {
    setStore(readDungeon())
  }, [])

  const view = useMemo(
    () => buildDungeon(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.locale, params.skin, params.niche, params.outcome, params.isModuleCompleted],
  )

  const isCleared = useCallback(
    (id: string): boolean => store?.clearedIds.includes(id) ?? false,
    [store],
  )

  const clear = useCallback(
    (id: string, cs: number) => {
      setStore(prev => {
        const base = prev ?? { clearedIds: [] }
        if (base.clearedIds.includes(id)) return base
        const next = markCleared(base, id)
        writeDungeon(next)
        return next
      })
      credit(id, cs) // key is already namespaced (dungeon:<niche>:…); applyCredit is idempotent
    },
    [credit],
  )

  const bossCleared = isCleared(view.boss.id)

  return { view, isCleared, clear, bossCleared, ready: store !== null && shardsReady }
}

// Lightweight read for the World Map flip (no CS, no build).
export function useNicheDungeonCleared(niche: string | null): boolean {
  const [cleared, setCleared] = useState(false)
  useEffect(() => {
    const n = niche && FLAVOR_BANK[niche] ? niche : 'other'
    setCleared(readDungeon().clearedIds.includes(`dungeon:${n}:boss`))
  }, [niche])
  return cleared
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/lib/dungeon/use-dungeon.ts
git commit -m "feat(dungeon): add useDungeon + useNicheDungeonCleared hooks"
```

---

## Task 7: DungeonView component (presentational)

**Files:** Create `web/components/dungeon/dungeon-view.tsx`

Pure presentational: receives the view + handlers; no hook, no fetch.

- [ ] **Step 1: Write the file**

```tsx
// web/components/dungeon/dungeon-view.tsx
'use client'

import type { Locale } from '@/lib/intake/types'
import type { DungeonView } from '@/lib/dungeon/types'

const TIER_LABEL: Record<string, Record<Locale, string>> = {
  task: { ru: 'задача', en: 'task' },
  process: { ru: 'процесс', en: 'process' },
  outcome: { ru: 'результат', en: 'outcome' },
}
const MARK_DONE: Record<Locale, string> = { ru: 'Готово', en: 'Mark done' }
const DONE: Record<Locale, string> = { ru: 'пройдено', en: 'cleared' }
const BOSS: Record<Locale, string> = { ru: 'БОСС', en: 'BOSS' }
const CLEARED_BANNER: Record<Locale, string> = { ru: 'Подземелье пройдено 🏆', en: 'Dungeon cleared 🏆' }
const lockedLine = (locale: Locale, moduleTitle: string, name: string) =>
  locale === 'en' ? `Complete “${moduleTitle}” to enter ${name}.` : `Пройди «${moduleTitle}», чтобы войти в ${name}.`

interface Props {
  view: DungeonView
  locale: Locale
  accent: string
  moduleTitle: string
  isCleared: (id: string) => boolean
  onClear: (id: string, cs: number) => void
}

export function DungeonView({ view, locale, accent, moduleTitle, isCleared, onClear }: Props) {
  if (view.locked) {
    return (
      <section style={{ border: `1px solid var(--border-color)`, borderRadius: 12, padding: '1.5rem', textAlign: 'center', background: 'var(--bg-surface)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
          <span aria-hidden="true">🔒</span> {view.dungeonName}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{lockedLine(locale, moduleTitle, view.dungeonName)}</p>
      </section>
    )
  }

  const bossDone = isCleared(view.boss.id)

  return (
    <section>
      <h1 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', color: accent, marginBottom: '0.4rem' }}>
        <span aria-hidden="true">🗝</span> {view.dungeonName}
      </h1>
      <p style={{ fontStyle: 'italic', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>{view.intro}</p>

      <div style={{ display: 'grid', gap: '0.9rem' }}>
        {view.stages.map((s, i) => {
          const done = isCleared(s.id)
          return (
            <div key={s.id} style={{ border: `1px solid ${done ? accent : 'var(--border-color)'}`, borderRadius: 10, padding: '0.9rem 1.1rem', opacity: done ? 0.7 : 1, background: 'var(--bg-surface)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                {locale === 'en' ? `Stage ${i + 1}` : `Этап ${i + 1}`} · {TIER_LABEL[s.tier][locale]} · +{s.cs} <span aria-hidden="true">💎</span>
              </div>
              <div style={{ fontSize: '0.95rem', margin: '0.35rem 0 0.6rem' }}>{s.body}</div>
              {done
                ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: accent }}>✓ {DONE[locale]}</span>
                : <button type="button" onClick={() => onClear(s.id, s.cs)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.4rem 0.8rem', borderRadius: 6, border: `1px solid ${accent}`, background: 'transparent', color: accent, cursor: 'pointer' }}>{MARK_DONE[locale]}</button>}
            </div>
          )
        })}

        <div style={{ border: `2px solid ${bossDone ? accent : 'var(--text-accent)'}`, borderRadius: 10, padding: '1rem 1.1rem', background: 'var(--bg-surface)', opacity: bossDone ? 0.75 : 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', letterSpacing: '0.06em', color: accent }}>
            <span aria-hidden="true">☠</span> {BOSS[locale]}: {view.boss.name} · +{view.boss.cs} <span aria-hidden="true">💎</span>
          </div>
          <div style={{ fontSize: '0.98rem', margin: '0.4rem 0 0.7rem' }}>{view.boss.body}</div>
          {bossDone
            ? <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: accent }}>{CLEARED_BANNER[locale]}</div>
            : <button type="button" onClick={() => onClear(view.boss.id, view.boss.cs)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '0.5rem 1rem', borderRadius: 6, border: 'none', background: accent, color: '#000', fontWeight: 700, cursor: 'pointer' }}>{MARK_DONE[locale]}</button>}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/components/dungeon/dungeon-view.tsx
git commit -m "feat(dungeon): add presentational DungeonView component"
```

---

## Task 8: DungeonCard component (dashboard entry)

**Files:** Create `web/components/dungeon/dungeon-card.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/dungeon/dungeon-card.tsx
'use client'

import Link from 'next/link'
import type { Locale, WorldSkin } from '@/lib/intake/types'
import { useDungeon } from '@/lib/dungeon/use-dungeon'

const ENTER: Record<Locale, string> = { ru: 'Войти', en: 'Enter' }
const CLEARED: Record<Locale, string> = { ru: '✓ Пройдено', en: '✓ Cleared' }
const lockedLine = (locale: Locale, moduleTitle: string) =>
  locale === 'en' ? `Complete “${moduleTitle}” to unlock` : `Пройди «${moduleTitle}», чтобы открыть`

interface Props {
  locale: Locale
  accent: string
  skin: WorldSkin
  niche: string | null
  outcome: string | null
  moduleTitle: string
  isModuleCompleted: (moduleSlug: string) => boolean
}

export function DungeonCard({ locale, accent, skin, niche, outcome, moduleTitle, isModuleCompleted }: Props) {
  const { view, bossCleared, ready } = useDungeon({ locale, skin, niche, outcome, isModuleCompleted })
  if (!ready) return null

  const prefix = locale === 'en' ? '/en' : ''
  const cleared = bossCleared

  return (
    <section style={{ border: `1px solid ${view.locked ? 'var(--border-color)' : accent}`, borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: view.locked ? 'var(--text-secondary)' : accent }}>
          <span aria-hidden="true">{view.locked ? '🔒' : '🗝'}</span> {view.dungeonName}
        </div>
        {view.locked && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{lockedLine(locale, moduleTitle)}</div>}
      </div>
      {view.locked
        ? null
        : cleared
          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: accent }}>{CLEARED[locale]}</span>
          : <Link href={`${prefix}/dungeon/`} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', padding: '0.45rem 0.9rem', borderRadius: 6, background: accent, color: '#000', fontWeight: 700, textDecoration: 'none' }}>{ENTER[locale]} →</Link>}
    </section>
  )
}
```

- [ ] **Step 2: Typecheck** — `cd web && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit**

```bash
git add web/components/dungeon/dungeon-card.tsx
git commit -m "feat(dungeon): add DungeonCard dashboard entry component"
```

---

## Task 9: World Map cleared marker

**Files:** Modify `web/components/rpg/world-map.tsx`

- [ ] **Step 1: Read the file** to confirm the props signature and the zone `<g>` block.

- [ ] **Step 2: Add the `nicheDungeonCleared` prop**

Change the signature:
```tsx
export function WorldMap({ zones, accent, glyph }: { zones: ZoneVM[]; accent: string; glyph: string }) {
```
to:
```tsx
export function WorldMap({ zones, accent, glyph, nicheDungeonCleared = false }: { zones: ZoneVM[]; accent: string; glyph: string; nicheDungeonCleared?: boolean }) {
```

- [ ] **Step 3: Render a cleared marker on the niche zone**

In the zone `<g>` block, after the existing `<text … >{glyph}</text>` line (the glyph at `p.y + 2.2`), add a small crown/check above the niche zone when cleared:

```tsx
              {z.isNiche && nicheDungeonCleared && (
                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={5} aria-hidden="true">👑</text>
              )}
```

(Place it inside the same `<g>` so it inherits the zone transform/opacity; it renders just above the node circle.)

- [ ] **Step 4: Typecheck + build**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (default `false` keeps every existing caller valid).

- [ ] **Step 5: Commit**

```bash
git add web/components/rpg/world-map.tsx
git commit -m "feat(dungeon): add cleared-marker on the niche zone in WorldMap"
```

---

## Task 10: `/dungeon` route + client orchestration

**Files:** Create `web/app/dungeon/dungeon-client.tsx`, `web/app/dungeon/page.tsx`, `web/app/en/dungeon/page.tsx`

- [ ] **Step 1: Write the client orchestrator `web/app/dungeon/dungeon-client.tsx`**

```tsx
// web/app/dungeon/dungeon-client.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { NICHE_MODULE } from '@/lib/rpg/niche-map'
import { FLAVOR_BANK } from '@/lib/dungeon/flavor-bank'
import { useDungeon } from '@/lib/dungeon/use-dungeon'
import { DungeonView } from '@/components/dungeon/dungeon-view'
import type { Locale, WorldSkin } from '@/lib/intake/types'

export function DungeonClient({ moduleTitles, locale }: { moduleTitles: Record<string, string>; locale: Locale }) {
  const router = useRouter()
  const { getState, loaded } = useProgress()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (!p || p.status !== 'completed') { router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'); return }
        setProfile(p)
      })
      .catch(() => router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'))
  }, [router, locale])

  if (!profile || !loaded) {
    return (<><Nav locale={locale} /><main style={{ maxWidth: 660, margin: '0 auto', padding: '4rem 1.5rem' }}><p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>…</p></main></>)
  }

  const skin = profile.world_skin as WorldSkin
  const accent = SKINS_META[skin]?.accent ?? 'var(--text-accent)'
  const niche: string | null = profile.niche ?? null
  let outcome: string | null = null
  try { const a = typeof profile.answers === 'string' ? JSON.parse(profile.answers) : profile.answers; outcome = typeof a?.F3 === 'string' ? a.F3 : null } catch { outcome = null }

  const resolvedNiche = niche && FLAVOR_BANK[niche] ? niche : 'other'
  const nicheModule = NICHE_MODULE[resolvedNiche] ?? '04-prompt-engineering'
  const moduleTitle = moduleTitles[nicheModule] ?? nicheModule

  return <DungeonInner skin={skin} accent={accent} niche={niche} outcome={outcome} moduleTitle={moduleTitle} locale={locale} isModuleCompleted={(slug) => getState(slug) === 'completed'} />
}

function DungeonInner(props: { skin: WorldSkin; accent: string; niche: string | null; outcome: string | null; moduleTitle: string; locale: Locale; isModuleCompleted: (slug: string) => boolean }) {
  const { skin, accent, niche, outcome, moduleTitle, locale, isModuleCompleted } = props
  const { view, isCleared, clear, ready } = useDungeon({ locale, skin, niche, outcome, isModuleCompleted })
  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {ready
          ? <DungeonView view={view} locale={locale} accent={accent} moduleTitle={moduleTitle} isCleared={isCleared} onClear={clear} />
          : <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>…</p>}
      </main>
    </>
  )
}
```

> Note: `useDungeon` (which calls `useShards`) is invoked inside `DungeonInner`, which only renders once `profile` + `loaded` are ready in the parent — so hooks run unconditionally within `DungeonInner`. `getState`/`loaded` come from the global `ProgressProvider` (`app/layout.tsx`).

- [ ] **Step 2: Write `web/app/dungeon/page.tsx`**

```tsx
// web/app/dungeon/page.tsx
import { getAllModules } from '@/lib/content'
import { DungeonClient } from './dungeon-client'

export default function Page() {
  const moduleTitles = Object.fromEntries(getAllModules('ru').map(m => [m.slug, m.title]))
  return <DungeonClient moduleTitles={moduleTitles} locale="ru" />
}
```

- [ ] **Step 3: Write `web/app/en/dungeon/page.tsx`**

```tsx
// web/app/en/dungeon/page.tsx
import { getAllModules } from '@/lib/content'
import { DungeonClient } from '../../dungeon/dungeon-client'

export default function Page() {
  const moduleTitles = Object.fromEntries(getAllModules('en').map(m => [m.slug, m.title]))
  return <DungeonClient moduleTitles={moduleTitles} locale="en" />
}
```

- [ ] **Step 4: Typecheck + build**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: PASS — `/dungeon` and `/en/dungeon` prerender as static pages.

- [ ] **Step 5: Commit**

```bash
git add web/app/dungeon/dungeon-client.tsx web/app/dungeon/page.tsx web/app/en/dungeon/page.tsx
git commit -m "feat(dungeon): add /dungeon route (RU + EN) with client orchestration"
```

---

## Task 11: Dashboard wiring (card + World Map flip)

**Files:** Modify `web/app/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Read the file** to confirm the current imports, `accent`/`completed`/`modules` vars, and the `<main>` JSX.

- [ ] **Step 2: Add imports** (group with existing imports):

```tsx
import { DungeonCard } from '@/components/dungeon/dungeon-card'
import { useNicheDungeonCleared } from '@/lib/dungeon/use-dungeon'
import { NICHE_MODULE } from '@/lib/rpg/niche-map'
import { FLAVOR_BANK } from '@/lib/dungeon/flavor-bank'
```

- [ ] **Step 3: Compute the flip flag + niche module title**

After the existing `const completed = …` line and the existing `niche/outcome` handling (the file already reads `profile` and uses `useUnitProgress`'s `isCompleted` for the DailyPanel), add:

```tsx
  const dungeonNiche = profile.niche && FLAVOR_BANK[profile.niche] ? profile.niche : 'other'
  const dungeonModule = NICHE_MODULE[dungeonNiche] ?? '04-prompt-engineering'
  const nicheDungeonCleared = useNicheDungeonCleared(profile.niche ?? null)
```

> `useNicheDungeonCleared` is a hook — it must be called unconditionally at the top level of the component (the file already returns early for the loading state *before* the main render but *after* hooks; place this call alongside the other hook calls, not inside a conditional). If the existing early-return sits above where `profile` is defined, compute `nicheDungeonCleared = useNicheDungeonCleared(profile?.niche ?? null)` with optional chaining so the hook runs every render.

- [ ] **Step 4: Render the card and pass the flip to WorldMap**

In the `<main>` JSX: pass `nicheDungeonCleared` to the existing `<WorldMap … />`:
```tsx
        <div style={{ margin: '1.5rem 0' }}><WorldMap zones={vm.zones} accent={accent} glyph={glyph} nicheDungeonCleared={nicheDungeonCleared} /></div>
```
And render `<DungeonCard>` after the `<QuestFeed>` line and before `<Vault>`:
```tsx
        <DungeonCard
          locale={locale}
          accent={accent}
          skin={profile.world_skin as WorldSkin}
          niche={profile.niche ?? null}
          outcome={(() => { try { const a = typeof profile.answers === 'string' ? JSON.parse(profile.answers) : profile.answers; return typeof a?.F3 === 'string' ? a.F3 : null } catch { return null } })()}
          moduleTitle={modules[dungeonModule]?.title ?? dungeonModule}
          isModuleCompleted={(slug) => getState(slug) === 'completed'}
        />
```

> `modules` is the existing `Record<string,{title;duration}>` prop; `getState` is from the existing `useProgress()`. `WorldSkin` is already imported. `dungeonModule` is from Step 3.

- [ ] **Step 5: Typecheck + build**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: PASS — `/dashboard` and `/en/dashboard` prerender without errors.

- [ ] **Step 6: Commit**

```bash
git add web/app/dashboard/dashboard-client.tsx
git commit -m "feat(dungeon): surface DungeonCard + niche-zone cleared flip on the dashboard"
```

---

## Task 12: Tracker update + final verification

**Files:** Modify `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`

- [ ] **Step 1: Mark SP2c shipped + SP2 complete**

Read the file. In the **SP2** decomposition row, change the status note from "Later: SP2c Niche Dungeons" to mark **SP2c shipped** and **SP2 complete** (match the file's convention), linking the SP2c design `./2026-05-24-niche-dungeons-design.md` and plan `../plans/2026-05-24-niche-dungeons.md`. Add a dated **Current position** entry near the others summarizing SP2c: `/dungeon` arc (3 escalating-tier stages on the niche module + authored boss, 8-niche flavor bank), gated behind niche-module completion, 15/15/15/50 CS via `applyCredit`, World Map niche-zone cleared marker. Match the existing prose format.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md
git commit -m "docs: mark SP2c Niche Dungeons shipped, SP2 complete"
```

- [ ] **Step 3: Final verification**

Run: `cd web && npx tsc --noEmit && npx vitest run --no-file-parallelism && npx next build`
Expected: tsc clean; all suites pass (existing + new `lib/dungeon/*` + the `fillNicheSlots` test); build succeeds (`/dungeon`, `/en/dungeon`, `/dashboard`, `/en/dashboard` all prerender).

- [ ] **Step 4: Request code review** via superpowers:requesting-code-review against the spec.

---

## Self-Review notes (author)

- **Spec coverage:** Q1 hybrid (deterministic + flavor) → Tasks 3,4. Q2 depth-on-module escalating tiers → Task 4 (`TIERS`). Q3 flavor `{dungeonName,bossName,intro,bossChallenge}` → Task 3. Q4 gating + locked teaser → Task 4 (`locked`), Tasks 7,8 (teaser UI). Q5 CS 15/15/15/50 + idempotent + World Map flip → Tasks 4 (cs values), 6 (`clear`/credit), 9 (marker), 11 (flip wiring). Q6 dedicated route + card + flip → Tasks 7,8,9,10,11. DRY `fillNicheSlots` → Task 2. Testing → Tasks 2,4,5 + final. Program linkage → Task 12.
- **Type consistency:** `DungeonView`/`DungeonStage`/`DungeonBoss`/`NicheFlavor`/`DungeonInput` defined once (Task 1), used verbatim. `buildDungeon(input)`, `fillNicheSlots(text,niche,outcome,locale)`, `markCleared`/`isCleared`/`readDungeon`/`writeDungeon`, `useDungeon`/`useNicheDungeonCleared`, the `clear(id, cs)` signature, and the id scheme `dungeon:<niche>:s1|s2|s3|boss` are consistent across tasks. `FLAVOR_BANK` keyed by the 8 niches; `other` is both an entry and the fallback. `NICHE_MODULE` reused from SP2a.
- **Open assumptions for executor:** (a) Task 11 — exact placement of the `useNicheDungeonCleared` hook call relative to the existing early-return; use optional chaining so it runs unconditionally. (b) `getAllModules(locale)` returns `{slug,title}` so `moduleTitles` is buildable (confirmed in content.ts). (c) `/api/intake/me` returns `niche` + `answers` (parsed for F3) — same shape SP2b already consumes.
```
