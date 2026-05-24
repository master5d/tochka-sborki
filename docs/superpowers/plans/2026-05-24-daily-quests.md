# Daily Quests (SP2b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a client-side "Today" panel to the dashboard offering 1–3 daily quests scaled to the learner's `cogTier` (1 advance + 0–2 practice/retrieval), themed via the World Skin, rewarding practice/retrieval with Cognitive Shards.

**Architecture:** All client-side, deterministic, no API. Pure modules under `web/lib/quests/` (types, seed PRNG, retrieval bank, `buildDaily` assembler, localStorage store) + a `useDailyQuests` hook + a `DailyPanel` component. Reuses SP3 `getAppliedChallenge` for practice quests and the SP3 CS wallet (extended with a flat `applyCredit`). The dashboard server page passes an ordered units manifest so the client can compute the "advance" target.

**Tech Stack:** Next.js 16 App Router (`'use client'`), TypeScript, Vitest (pure logic only), localStorage.

**Spec:** `docs/superpowers/specs/2026-05-24-daily-quests-design.md`

**Conventions:**
- `Bi = { ru: string; en: string }` from `@/lib/rpg/types`; `Locale = 'ru'|'en'`, `WorldSkin` from `@/lib/intake/types`.
- UI copy lives as inline `Bi` constants in the quests modules (matches the SP3 `cs/` pattern).
- Run all test/typecheck commands from `web/`: `cd web && npx vitest run lib/quests/...` and `cd web && npx tsc --noEmit`. Use the Bash tool; for `git add` use repo-relative paths from the repo root.
- Preserve Cyrillic exactly (genuine letters, no transliteration).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `web/lib/quests/types.ts` | `QuestKind`, `DailyQuest`, `DailySet`, `DailyInput` |
| `web/lib/cs/wallet.ts` | (modify) add pure `applyCredit(wallet, key, amount)` |
| `web/lib/cs/use-shards.ts` | (modify) expose `credit(key, amount)` |
| `web/lib/quests/seed.ts` | `dailySeed(key, date)` FNV-1a hash + `pick<T>(items, seed, n)` |
| `web/lib/quests/retrieval-bank.ts` | `RETRIEVAL_BANK: Record<string, Bi>` (9 module recall prompts) |
| `web/lib/quests/build-daily.ts` | pure `buildDaily(input): DailySet` + `localDate()` re-export consumer |
| `web/lib/quests/daily-store.ts` | localStorage `daily_quests` store: pure helpers + storage shell + `localDate()` |
| `web/lib/quests/use-daily-quests.ts` | `useDailyQuests(params)` hook |
| `web/components/quests/daily-panel.tsx` | the "Today" dashboard panel |
| `web/app/dashboard/page.tsx` | (modify) pass `unitsByModule` manifest |
| `web/app/en/dashboard/page.tsx` | (modify) pass `unitsByModule` manifest |
| `web/app/dashboard/dashboard-client.tsx` | (modify) render `<DailyPanel>` |

---

## Task 1: Quest types

**Files:**
- Create: `web/lib/quests/types.ts`

- [ ] **Step 1: Write the file**

```ts
// web/lib/quests/types.ts
import type { Locale, WorldSkin } from '@/lib/intake/types'

export type QuestKind = 'advance' | 'practice' | 'retrieval' | 'complete'

export interface DailyQuest {
  id: string          // stable: advance:<module>/<unit> | practice:<module> | retrieval:<module> | complete
  kind: QuestKind
  title: string       // localized heading
  body: string        // localized body (unit title, applied challenge, or recall prompt)
  cs: number          // CS awarded on self-complete (0 for advance/complete)
  module?: string     // owning module slug (absent for 'complete')
  unit?: string       // target unit slug (advance only)
  href?: string       // link to open (advance only)
}

export interface DailySet {
  date: string        // YYYY-MM-DD (local)
  quests: DailyQuest[]
}

export interface DailyInput {
  date: string
  locale: Locale
  skin: WorldSkin
  cogTier: number
  niche: string | null
  outcome: string | null
  unitsByModule: Record<string, { slug: string; title: string }[]> // ordered units per module slug
  isUnitDone: (moduleSlug: string, unitSlug: string) => boolean     // from unit_progress
  completedModules: string[]                                        // module-level 'completed' slugs
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/quests/types.ts
git commit -m "feat(quests): add daily-quest types"
```

---

## Task 2: SP3 wallet flat-credit extension

**Files:**
- Modify: `web/lib/cs/wallet.ts`
- Modify: `web/lib/cs/use-shards.ts`
- Test: `web/lib/cs/wallet.test.ts` (extend)

- [ ] **Step 1: Add the failing test**

Append inside `web/lib/cs/wallet.test.ts` (it already imports from `./wallet` and `./types` — add `applyCredit` to the existing import from `./wallet`):

```ts
describe('applyCredit', () => {
  it('adds a flat amount once for a given key', () => {
    const w = applyCredit(DEFAULT_WALLET, 'daily:2026-05-24:p0', 10)
    expect(w.balance).toBe(10)
    expect(w.earnedUnits).toContain('daily:2026-05-24:p0')
  })

  it('is idempotent for a repeated key', () => {
    const once = applyCredit(DEFAULT_WALLET, 'daily:2026-05-24:bonus', 15)
    const twice = applyCredit(once, 'daily:2026-05-24:bonus', 15)
    expect(twice.balance).toBe(15)
    expect(twice.earnedUnits.filter(k => k === 'daily:2026-05-24:bonus')).toHaveLength(1)
  })

  it('does not mutate the input wallet', () => {
    applyCredit(DEFAULT_WALLET, 'k', 5)
    expect(DEFAULT_WALLET.balance).toBe(0)
  })
})
```

Update the existing import line at the top of the file from:
```ts
import { applyAward, applySpend, setModeFor } from './wallet'
```
to:
```ts
import { applyAward, applySpend, setModeFor, applyCredit } from './wallet'
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/cs/wallet.test.ts`
Expected: FAIL ("applyCredit is not a function" / not exported).

- [ ] **Step 3: Add `applyCredit` to `web/lib/cs/wallet.ts`**

Insert after the existing `applyAward` function:

```ts
// Flat idempotent credit (e.g. daily-quest rewards). Reuses earnedUnits as the idempotency ledger
// via namespaced synthetic keys like "daily:2026-05-24:p0" — no mode, unlike applyAward.
export function applyCredit(wallet: Wallet, key: string, amount: number): Wallet {
  if (wallet.earnedUnits.includes(key)) return wallet
  return {
    ...wallet,
    balance: wallet.balance + amount,
    earnedUnits: [...wallet.earnedUnits, key],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/cs/wallet.test.ts`
Expected: PASS (existing wallet tests + 3 new applyCredit tests).

- [ ] **Step 5: Expose `credit` on the hook**

In `web/lib/cs/use-shards.ts`: add `applyCredit` to the import from `./wallet`, add a `credit` callback, and include it in the returned object.

Change the import:
```ts
import { readWallet, writeWallet, applyAward, applySpend, setModeFor } from './wallet'
```
to:
```ts
import { readWallet, writeWallet, applyAward, applySpend, setModeFor, applyCredit } from './wallet'
```

Add this callback alongside the existing `award`/`spend`/`setMode` callbacks:
```ts
  const credit = useCallback((key: string, amount: number) => {
    setWallet(prev => {
      const next = applyCredit(prev, key, amount)
      writeWallet(next)
      return next
    })
  }, [])
```

Add `credit` to the returned object:
```ts
  return {
    balance: wallet.balance,
    award,
    spend,
    setMode,
    getMode,
    unlocked,
    credit,
    ready,
  }
```

- [ ] **Step 6: Typecheck + retest**

Run: `cd web && npx tsc --noEmit && npx vitest run lib/cs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/lib/cs/wallet.ts web/lib/cs/wallet.test.ts web/lib/cs/use-shards.ts
git commit -m "feat(cs): add flat applyCredit + useShards.credit for daily rewards"
```

---

## Task 3: Deterministic daily seed

**Files:**
- Create: `web/lib/quests/seed.ts`
- Test: `web/lib/quests/seed.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/quests/seed.test.ts
import { describe, it, expect } from 'vitest'
import { dailySeed, pick } from './seed'

describe('dailySeed', () => {
  it('is stable for the same key + date', () => {
    expect(dailySeed('slavic-myth', '2026-05-24')).toBe(dailySeed('slavic-myth', '2026-05-24'))
  })
  it('differs across dates', () => {
    expect(dailySeed('slavic-myth', '2026-05-24')).not.toBe(dailySeed('slavic-myth', '2026-05-25'))
  })
  it('differs across keys', () => {
    expect(dailySeed('a', '2026-05-24')).not.toBe(dailySeed('b', '2026-05-24'))
  })
})

describe('pick', () => {
  const items = ['00', '01', '02', '03', '04']
  it('returns n items for n <= length', () => {
    expect(pick(items, 123, 2)).toHaveLength(2)
  })
  it('returns all items (copy) when n >= length', () => {
    const out = pick(items, 123, 10)
    expect(out).toHaveLength(5)
    expect(out).not.toBe(items)
  })
  it('is deterministic for the same seed', () => {
    expect(pick(items, 999, 3)).toEqual(pick(items, 999, 3))
  })
  it('only returns items from the input set', () => {
    for (const x of pick(items, 7, 3)) expect(items).toContain(x)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/quests/seed.test.ts`
Expected: FAIL ("Cannot find module './seed'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/quests/seed.ts

// FNV-1a 32-bit hash of `${key}|${date}` → uint32 seed.
export function dailySeed(key: string, date: string): number {
  let h = 2166136261 >>> 0
  const s = `${key}|${date}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

// Deterministic subset of `n` items via a mulberry32 PRNG seeded by `seed` (partial Fisher–Yates).
export function pick<T>(items: T[], seed: number, n: number): T[] {
  if (items.length <= n) return [...items]
  const arr = [...items]
  let s = seed >>> 0
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 0; i < n; i++) {
    const j = i + Math.floor(rand() * (arr.length - i))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr.slice(0, n)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/quests/seed.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/quests/seed.ts web/lib/quests/seed.test.ts
git commit -m "feat(quests): add deterministic daily seed + pick"
```

---

## Task 4: Retrieval bank

**Files:**
- Create: `web/lib/quests/retrieval-bank.ts`

- [ ] **Step 1: Write the file**

One recall prompt per of the 9 module slugs (from `web/lib/rpg/modules.ts`). Bilingual.

```ts
// web/lib/quests/retrieval-bank.ts
import type { Bi } from '@/lib/rpg/types'

// One retrieval (recall) prompt per module. Shown only for COMPLETED modules, prefixed with the
// skin's mentor name. Neutral copy; theming is the mentor-name prefix (light, per SP2d philosophy).
export const RETRIEVAL_BANK: Record<string, Bi> = {
  '00-kickstart': { ru: 'что на «карте местности» оказалось для тебя самым неожиданным — и почему?', en: 'what on the "map of the territory" surprised you most — and why?' },
  '01-introduction': { ru: 'назови своими словами четыре сдвига Software 3.0.', en: 'name the four shifts of Software 3.0 in your own words.' },
  '02-setup-guide': { ru: 'какие инструменты ты поставил и какой из них уже пригодился?', en: 'which tools did you install, and which has already proven useful?' },
  '03-stack-selection': { ru: 'какой стек ты выбрал и какой главный аргумент за него?', en: 'which stack did you pick, and what was the main argument for it?' },
  '04-prompt-engineering': { ru: 'какие «магические слова» в промпте дают тебе самый заметный эффект?', en: 'which prompt "magic words" give you the most noticeable effect?' },
  '05-context-memory': { ru: 'что стоит держать в памяти агента между сессиями, а что — нет?', en: 'what is worth keeping in an agent\'s memory across sessions, and what is not?' },
  '06-audio-pipeline': { ru: 'из каких шагов состоит твой пайплайн «сырьё → инсайты»?', en: 'what are the steps of your "raw → insights" pipeline?' },
  '07-tools': { ru: 'чем отличаются MCP-серверы, Skills и Hooks — и когда что брать?', en: 'how do MCP servers, Skills and Hooks differ — and when do you reach for each?' },
  '08-agent-engineering': { ru: 'как ты разложишь одну свою задачу на нескольких агентов?', en: 'how would you split one of your tasks across several agents?' },
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/quests/retrieval-bank.ts
git commit -m "feat(quests): add per-module retrieval prompt bank"
```

---

## Task 5: Daily set assembler (`buildDaily`)

**Files:**
- Create: `web/lib/quests/build-daily.ts`
- Test: `web/lib/quests/build-daily.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/quests/build-daily.test.ts
import { describe, it, expect } from 'vitest'
import { buildDaily } from './build-daily'
import type { DailyInput } from './types'

const units = {
  '00-kickstart': [{ slug: 'u1', title: 'K1' }, { slug: 'u2', title: 'K2' }],
  '01-introduction': [{ slug: 'u1', title: 'I1' }],
  '04-prompt-engineering': [{ slug: 'u1', title: 'P1' }],
}

function base(over: Partial<DailyInput> = {}): DailyInput {
  return {
    date: '2026-05-24',
    locale: 'ru',
    skin: 'slavic-myth',
    cogTier: 3,
    niche: 'legal',
    outcome: null,
    unitsByModule: units,
    isUnitDone: () => false,
    completedModules: [],
    ...over,
  }
}

describe('buildDaily', () => {
  it('tier 1 → exactly one advance quest', () => {
    const set = buildDaily(base({ cogTier: 1 }))
    expect(set.quests).toHaveLength(1)
    expect(set.quests[0].kind).toBe('advance')
  })

  it('advance targets the first not-done unit in module order', () => {
    const set = buildDaily(base({ cogTier: 1 }))
    expect(set.quests[0].id).toBe('advance:00-kickstart/u1')
    expect(set.quests[0].href).toBe('/lessons/00-kickstart/u1/')
    expect(set.quests[0].cs).toBe(0)
  })

  it('advance skips completed units', () => {
    const set = buildDaily(base({ cogTier: 1, isUnitDone: (m, u) => m === '00-kickstart' }))
    expect(set.quests[0].id).toBe('advance:01-introduction/u1')
  })

  it('en locale produces an /en advance href', () => {
    const set = buildDaily(base({ cogTier: 1, locale: 'en' }))
    expect(set.quests[0].href).toBe('/en/lessons/00-kickstart/u1/')
  })

  it('whole course complete → a single complete quest, no advance', () => {
    const set = buildDaily(base({ cogTier: 1, isUnitDone: () => true }))
    expect(set.quests).toHaveLength(1)
    expect(set.quests[0].kind).toBe('complete')
  })

  it('tier 2 adds a practice quest from a reached module with a niche-filled body', () => {
    const set = buildDaily(base({ cogTier: 2 }))
    const practice = set.quests.find(q => q.kind === 'practice')
    expect(practice).toBeTruthy()
    expect(practice!.cs).toBe(10)
    expect(practice!.body).toContain('legal')   // applied-challenge {niche} slot filled
    expect(practice!.body).not.toContain('{niche}')
  })

  it('tier 3 with a completed module adds a retrieval quest prefixed by the mentor name', () => {
    const set = buildDaily(base({ cogTier: 3, isUnitDone: (m) => m === '00-kickstart', completedModules: ['00-kickstart'] }))
    const retrieval = set.quests.find(q => q.kind === 'retrieval')
    expect(retrieval).toBeTruthy()
    expect(retrieval!.cs).toBe(10)
    expect(retrieval!.body).toContain('Домовой') // slavic-myth mentor name (ru)
  })

  it('tier 3 day-1 (no completed modules) yields no retrieval quest', () => {
    const set = buildDaily(base({ cogTier: 3, completedModules: [] }))
    expect(set.quests.some(q => q.kind === 'retrieval')).toBe(false)
  })

  it('is deterministic for the same inputs', () => {
    expect(buildDaily(base({ cogTier: 3, completedModules: ['00-kickstart', '01-introduction'], isUnitDone: (m) => m !== '04-prompt-engineering' })))
      .toEqual(buildDaily(base({ cogTier: 3, completedModules: ['00-kickstart', '01-introduction'], isUnitDone: (m) => m !== '04-prompt-engineering' })))
  })

  it('invalid cogTier falls back to 2 (advance + practice)', () => {
    const set = buildDaily(base({ cogTier: 99 }))
    expect(set.quests).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/quests/build-daily.test.ts`
Expected: FAIL ("Cannot find module './build-daily'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/quests/build-daily.ts
import type { DailyInput, DailyQuest, DailySet } from './types'
import { MODULE_SLUGS } from '@/lib/rpg/modules'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { getAppliedChallenge } from '@/lib/cs/applied-challenge'
import { RETRIEVAL_BANK } from './retrieval-bank'
import { dailySeed, pick } from './seed'

const ADVANCE_TITLE = { ru: 'Продвижение', en: 'Advance' }
const PRACTICE_TITLE = { ru: 'Сегодняшний подход', en: "Today's rep" }
const RETRIEVAL_TITLE = { ru: 'Вспомни', en: 'Recall' }
const COMPLETE_TITLE = { ru: 'Все зоны пройдены', en: 'All zones cleared' }
const COMPLETE_BODY = {
  ru: 'Ты прошёл весь курс. Возвращайся за подходами и повторением — или начни свой проект.',
  en: 'You have cleared the whole course. Come back for reps and recall — or start your own project.',
}

function clampTier(t: number): number {
  return Number.isInteger(t) && t >= 1 && t <= 4 ? t : 2
}

function lessonHref(moduleSlug: string, unitSlug: string, locale: 'ru' | 'en'): string {
  return `${locale === 'en' ? '/en' : ''}/lessons/${moduleSlug}/${unitSlug}/`
}

function nextUnit(
  unitsByModule: DailyInput['unitsByModule'],
  isUnitDone: DailyInput['isUnitDone'],
): { module: string; unit: string; title: string } | null {
  for (const m of MODULE_SLUGS) {
    for (const u of unitsByModule[m] ?? []) {
      if (!isUnitDone(m, u.slug)) return { module: m, unit: u.slug, title: u.title }
    }
  }
  return null
}

export function buildDaily(input: DailyInput): DailySet {
  const { date, locale, skin, niche, outcome, unitsByModule, isUnitDone, completedModules } = input
  const tier = clampTier(input.cogTier)
  const quests: DailyQuest[] = []

  // --- advance (or course-complete) ---
  const advance = nextUnit(unitsByModule, isUnitDone)
  if (advance) {
    quests.push({
      id: `advance:${advance.module}/${advance.unit}`,
      kind: 'advance',
      title: ADVANCE_TITLE[locale],
      body: advance.title,
      cs: 0,
      module: advance.module,
      unit: advance.unit,
      href: lessonHref(advance.module, advance.unit, locale),
    })
  } else {
    quests.push({ id: 'complete', kind: 'complete', title: COMPLETE_TITLE[locale], body: COMPLETE_BODY[locale], cs: 0 })
  }

  const reached = advance ? Array.from(new Set([...completedModules, advance.module])) : [...completedModules]
  const used = new Set<string>()

  const wantPractice = tier >= 2 ? 1 : 0
  const wantRetrieval = tier >= 3 ? 1 : 0

  // --- practice (reuses SP3 applied-challenge templates) ---
  for (let i = 0; i < wantPractice; i++) {
    const pool = reached.filter(m => !used.has(m) && getAppliedChallenge({ niche, outcome }, m, 'task', locale) !== null)
    const mod = pick(pool, dailySeed(`${skin}:p${i}`, date), 1)[0]
    if (!mod) break
    used.add(mod)
    quests.push({
      id: `practice:${mod}`,
      kind: 'practice',
      title: PRACTICE_TITLE[locale],
      body: getAppliedChallenge({ niche, outcome }, mod, 'task', locale)!,
      cs: 10,
      module: mod,
    })
  }

  // --- retrieval (completed modules only; otherwise omitted) ---
  for (let i = 0; i < wantRetrieval; i++) {
    const pool = completedModules.filter(m => RETRIEVAL_BANK[m])
    const mod = pick(pool, dailySeed(`${skin}:r${i}`, date), 1)[0]
    if (!mod) continue
    const mentor = SKINS_META[skin]?.mentor
    const prompt = RETRIEVAL_BANK[mod][locale]
    quests.push({
      id: `retrieval:${mod}`,
      kind: 'retrieval',
      title: RETRIEVAL_TITLE[locale],
      body: mentor ? `${mentor.name[locale]}: ${prompt}` : prompt,
      cs: 10,
      module: mod,
    })
  }

  return { date, quests }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/quests/build-daily.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/quests/build-daily.ts web/lib/quests/build-daily.test.ts
git commit -m "feat(quests): add deterministic daily set assembler"
```

---

## Task 6: Daily store (localStorage)

**Files:**
- Create: `web/lib/quests/daily-store.ts`
- Test: `web/lib/quests/daily-store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// web/lib/quests/daily-store.test.ts
import { describe, it, expect } from 'vitest'
import { rolloverIfStale, markDone, isDone, localDate } from './daily-store'

describe('rolloverIfStale', () => {
  it('keeps the store when the date matches today', () => {
    const s = { date: '2026-05-24', completedIds: ['practice:00-kickstart'] }
    expect(rolloverIfStale(s, '2026-05-24')).toBe(s)
  })
  it('resets completedIds when the stored date is stale', () => {
    const s = { date: '2026-05-23', completedIds: ['practice:00-kickstart'] }
    const next = rolloverIfStale(s, '2026-05-24')
    expect(next.date).toBe('2026-05-24')
    expect(next.completedIds).toEqual([])
  })
})

describe('markDone / isDone', () => {
  it('marks an id once and reports it done', () => {
    const s = { date: '2026-05-24', completedIds: [] as string[] }
    const next = markDone(s, 'practice:00-kickstart')
    expect(isDone(next, 'practice:00-kickstart')).toBe(true)
  })
  it('is idempotent for a repeated id', () => {
    const s = { date: '2026-05-24', completedIds: ['x'] }
    const next = markDone(s, 'x')
    expect(next.completedIds).toEqual(['x'])
  })
  it('does not mutate the input', () => {
    const s = { date: '2026-05-24', completedIds: [] as string[] }
    markDone(s, 'y')
    expect(s.completedIds).toEqual([])
  })
})

describe('localDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(localDate(new Date(2026, 4, 9))).toBe('2026-05-09') // month is 0-based; padded
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/quests/daily-store.test.ts`
Expected: FAIL ("Cannot find module './daily-store'").

- [ ] **Step 3: Write the implementation**

```ts
// web/lib/quests/daily-store.ts

export interface DailyStore {
  date: string
  completedIds: string[]
}

const STORAGE_KEY = 'daily_quests'

export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function rolloverIfStale(store: DailyStore, today: string): DailyStore {
  return store.date === today ? store : { date: today, completedIds: [] }
}

export function markDone(store: DailyStore, id: string): DailyStore {
  if (store.completedIds.includes(id)) return store
  return { ...store, completedIds: [...store.completedIds, id] }
}

export function isDone(store: DailyStore, id: string): boolean {
  return store.completedIds.includes(id)
}

// ---- storage shell (browser only) ----

export function readDaily(today: string): DailyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { date: today, completedIds: [] }
    const parsed = JSON.parse(raw) as Partial<DailyStore>
    const store: DailyStore = {
      date: typeof parsed.date === 'string' ? parsed.date : today,
      completedIds: Array.isArray(parsed.completedIds) ? parsed.completedIds : [],
    }
    return rolloverIfStale(store, today)
  } catch {
    return { date: today, completedIds: [] }
  }
}

export function writeDaily(store: DailyStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/quests/daily-store.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/quests/daily-store.ts web/lib/quests/daily-store.test.ts
git commit -m "feat(quests): add daily-quest localStorage store"
```

---

## Task 7: `useDailyQuests` hook

**Files:**
- Create: `web/lib/quests/use-daily-quests.ts`

No unit test (thin React/storage wrapper over the tested pure modules; mirrors `useShards`/`useUnitProgress`). Verified by typecheck + downstream usage.

- [ ] **Step 1: Write the file**

```ts
// web/lib/quests/use-daily-quests.ts
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { Locale, WorldSkin } from '@/lib/intake/types'
import type { DailyQuest } from './types'
import { buildDaily } from './build-daily'
import { readDaily, writeDaily, markDone, localDate, type DailyStore } from './daily-store'
import { useShards } from '@/lib/cs/use-shards'

interface Params {
  locale: Locale
  skin: WorldSkin
  cogTier: number
  niche: string | null
  outcome: string | null
  unitsByModule: Record<string, { slug: string; title: string }[]>
  isUnitDone: (moduleSlug: string, unitSlug: string) => boolean
  completedModules: string[]
}

export function useDailyQuests(params: Params) {
  const { credit, ready: shardsReady } = useShards()
  const [today] = useState(() => localDate())
  const [store, setStore] = useState<DailyStore | null>(null)

  useEffect(() => {
    setStore(readDaily(today))
  }, [today])

  const set = useMemo(
    () => buildDaily({ date: today, ...params }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      today,
      params.locale,
      params.skin,
      params.cogTier,
      params.niche,
      params.outcome,
      params.unitsByModule,
      params.isUnitDone,
      params.completedModules,
    ],
  )

  const isDone = useCallback(
    (q: DailyQuest): boolean => {
      if (q.kind === 'complete') return true
      if (q.kind === 'advance') return q.module && q.unit ? params.isUnitDone(q.module, q.unit) : false
      return store?.completedIds.includes(q.id) ?? false
    },
    [store, params],
  )

  const complete = useCallback(
    (q: DailyQuest) => {
      if (q.cs <= 0) return // advance/complete are not self-checked
      setStore(prev => {
        const base = prev ?? { date: today, completedIds: [] }
        if (base.completedIds.includes(q.id)) return base
        const next = markDone(base, q.id)
        writeDaily(next)
        return next
      })
      credit(`daily:${today}:${q.id}`, q.cs)
    },
    [today, credit],
  )

  const allDone = set.quests.length > 0 && set.quests.every(q => isDone(q))
  const hasRewardable = set.quests.some(q => q.cs > 0)

  // All-done bonus: fires once (credit key is idempotent), only when the set has a rewardable quest
  // (so a tier-1 advance-only day doesn't grant a free bonus on top of the unit's own CS).
  useEffect(() => {
    if (shardsReady && store !== null && allDone && hasRewardable) {
      credit(`daily:${today}:bonus`, 15)
    }
  }, [shardsReady, store, allDone, hasRewardable, today, credit])

  return {
    set,
    isDone,
    complete,
    allDone,
    ready: store !== null && shardsReady,
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/quests/use-daily-quests.ts
git commit -m "feat(quests): add useDailyQuests hook"
```

---

## Task 8: DailyPanel component

**Files:**
- Create: `web/components/quests/daily-panel.tsx`

- [ ] **Step 1: Write the file**

```tsx
// web/components/quests/daily-panel.tsx
'use client'

import Link from 'next/link'
import type { Locale, WorldSkin } from '@/lib/intake/types'
import { useDailyQuests } from '@/lib/quests/use-daily-quests'

const HEADING: Record<Locale, string> = { ru: 'Сегодня', en: 'Today' }
const OPEN: Record<Locale, string> = { ru: 'Открыть', en: 'Open' }
const MARK_DONE: Record<Locale, string> = { ru: 'Готово', en: 'Mark done' }
const DONE: Record<Locale, string> = { ru: 'выполнено', en: 'done' }
const ALL_DONE: Record<Locale, string> = { ru: 'Все задания на сегодня выполнены 🎉', en: "Today's quests are all done 🎉" }

function questsLabel(n: number, locale: Locale): string {
  if (locale === 'en') return `${n} ${n === 1 ? 'quest' : 'quests'}`
  const mod10 = n % 10, mod100 = n % 100
  const word = mod10 === 1 && mod100 !== 11 ? 'задание'
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'задания' : 'заданий'
  return `${n} ${word}`
}

interface Props {
  locale: Locale
  skin: WorldSkin
  accent: string
  cogTier: number
  niche: string | null
  outcome: string | null
  unitsByModule: Record<string, { slug: string; title: string }[]>
  isUnitDone: (moduleSlug: string, unitSlug: string) => boolean
  completedModules: string[]
}

export function DailyPanel({ locale, skin, accent, cogTier, niche, outcome, unitsByModule, isUnitDone, completedModules }: Props) {
  const { set, isDone, complete, allDone, ready } = useDailyQuests({
    locale, skin, cogTier, niche, outcome, unitsByModule, isUnitDone, completedModules,
  })

  if (!ready || set.quests.length === 0) return null

  const totalCs = set.quests.reduce((n, q) => n + q.cs, 0)

  return (
    <section style={{ border: `1px solid ${accent}`, borderRadius: 12, padding: '1.1rem 1.25rem', marginBottom: '1.5rem', background: 'var(--bg-surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.9rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: accent }}>☀ {HEADING[locale]}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
          {questsLabel(set.quests.length, locale)}{totalCs > 0 ? ` · +${totalCs} 💎` : ''}
        </span>
      </div>

      <div style={{ display: 'grid', gap: '0.6rem' }}>
        {set.quests.map(q => {
          const done = isDone(q)
          return (
            <div key={q.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', opacity: done ? 0.6 : 1 }}>
              <span aria-hidden="true" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: accent, marginTop: '0.15rem' }}>
                {q.kind === 'advance' ? '▶' : q.kind === 'complete' ? '★' : '◇'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                  {q.title}{q.cs > 0 ? ` · +${q.cs} 💎` : ''}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.15rem' }}>{q.body}</div>
                <div style={{ marginTop: '0.45rem' }}>
                  {q.kind === 'advance' && q.href && (
                    <Link href={q.href} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: accent }}>
                      {done ? `✓ ${DONE[locale]}` : `${OPEN[locale]} ↗`}
                    </Link>
                  )}
                  {q.cs > 0 && (
                    done
                      ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: accent }}>✓ {DONE[locale]}</span>
                      : <button type="button" onClick={() => complete(q)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', padding: '0.35rem 0.7rem', borderRadius: 6, border: `1px solid ${accent}`, background: 'transparent', color: accent, cursor: 'pointer' }}>{MARK_DONE[locale]}</button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {allDone && (
        <div style={{ marginTop: '0.9rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: accent }}>
          {ALL_DONE[locale]}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/quests/daily-panel.tsx
git commit -m "feat(quests): add DailyPanel dashboard component"
```

---

## Task 9: Wire DailyPanel into the dashboard

**Files:**
- Modify: `web/app/dashboard/page.tsx`
- Modify: `web/app/en/dashboard/page.tsx`
- Modify: `web/app/dashboard/dashboard-client.tsx`

- [ ] **Step 1: Pass the units manifest from the RU server page**

Read `web/app/dashboard/page.tsx`. Replace its body so it also builds `unitsByModule`:

```tsx
// web/app/dashboard/page.tsx
import { getAllModules } from '@/lib/content'
import { DashboardClient } from './dashboard-client'

export default function Page() {
  const mods = getAllModules('ru')
  const modules = Object.fromEntries(mods.map(m => [m.slug, { title: m.title, duration: m.duration }]))
  const unitsByModule = Object.fromEntries(mods.map(m => [m.slug, m.units]))
  return <DashboardClient modules={modules} unitsByModule={unitsByModule} locale="ru" />
}
```

- [ ] **Step 2: Pass the units manifest from the EN server page**

Read `web/app/en/dashboard/page.tsx` first to match its exact structure (it renders `<DashboardClient ... locale="en" />`). Apply the same change using `getAllModules('en')`: build `mods`, `modules`, and `unitsByModule`, and add `unitsByModule={unitsByModule}` to the `<DashboardClient>` props. Keep everything else (locale, imports) as-is.

- [ ] **Step 3: Accept the prop and render the panel in `dashboard-client.tsx`**

Add the import (group with the other component imports):
```tsx
import { DailyPanel } from '@/components/quests/daily-panel'
import { useUnitProgress } from '@/lib/unit-progress'
```

Extend the `Props` interface to include the manifest:
```tsx
interface Props {
  modules: Record<string, { title: string; duration: string }>
  unitsByModule: Record<string, { slug: string; title: string }[]>
  locale: Locale
}
```

Update the component signature to destructure it:
```tsx
export function DashboardClient({ modules, unitsByModule, locale }: Props) {
```

Inside the component body, after the existing `const { getState, loaded } = useProgress()` line, add the unit-progress hook:
```tsx
  const { isCompleted } = useUnitProgress()
```

Then, in the returned JSX, insert `<DailyPanel>` directly after the `<CharacterStrip>` line and before the `<WorldMap>` wrapper `<div>`. Use the already-computed `accent` and `completed` (the module-level completed slugs) and the intake fields from `profile`:
```tsx
        <DailyPanel
          locale={locale}
          skin={profile.world_skin as WorldSkin}
          accent={accent}
          cogTier={typeof profile.cog_tier === 'number' ? profile.cog_tier : 2}
          niche={profile.niche ?? null}
          outcome={(() => { try { const a = typeof profile.answers === 'string' ? JSON.parse(profile.answers) : profile.answers; return typeof a?.F3 === 'string' ? a.F3 : null } catch { return null } })()}
          unitsByModule={unitsByModule}
          isUnitDone={isCompleted}
          completedModules={completed}
        />
```

> Note: `profile` is `any`-typed in this file (see the existing `profile.world_skin as keyof typeof SKINS_META` usage), so reading `profile.cog_tier`, `profile.niche`, `profile.answers` requires no new types. `completed` is the existing `const completed = Object.keys(modules).filter(s => getState(s) === 'completed')`. `WorldSkin` is already imported in this file (used by the `Vault` wiring). `isCompleted(module, unit)` from `useUnitProgress` matches the `isUnitDone` signature exactly.

- [ ] **Step 4: Verify the intake profile exposes `cog_tier`**

The panel reads `profile.cog_tier`. Confirm the `/api/intake/me` payload includes it (the scoring stores `cogTier`). Run:

```bash
cd /c/telo/Efforts/Ongoing/MDS_AI_COURSE && grep -rn "cog_tier\|cogTier" workers/src | head
```

Expected: a column/field `cog_tier` written on intake submit and returned by `/api/intake/me`. If the field is named differently (e.g. the API returns `cogTier` camelCase), adjust the prop in Step 3 to read that exact key and note it. If it is genuinely absent from the payload, the `typeof … === 'number' ? … : 2` guard falls back to tier 2 — acceptable, but report it so a follow-up can surface the stored value.

- [ ] **Step 5: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Build (static export gate)**

Run: `cd web && npx next build`
Expected: PASS — `/dashboard` and `/en/dashboard` prerender without errors.

- [ ] **Step 7: Commit**

```bash
git add web/app/dashboard/page.tsx web/app/en/dashboard/page.tsx web/app/dashboard/dashboard-client.tsx
git commit -m "feat(quests): surface the daily quest panel on the dashboard"
```

---

## Task 10: Tracker update + final verification

**Files:**
- Modify: `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`

- [ ] **Step 1: Mark SP2b in the tracker**

Read the file. In the decomposition table's **SP2** row, update the "Later: SP2b daily-quests, SP2c Niche Dungeons" note to mark SP2b shipped (match the file's status convention), and add a dated **Current position** entry near the other entries summarizing SP2b: daily quest panel (cogTier 1/2/3/3, advance + practice/retrieval), client-side deterministic, reuses SP3 applied-challenge + `applyCredit`, links to spec `./2026-05-24-daily-quests-design.md` and plan `../plans/2026-05-24-daily-quests.md`. Match the existing prose format; do not invent a new structure.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md
git commit -m "docs: mark SP2b Daily Quests shipped in program tracker"
```

- [ ] **Step 3: Final verification**

Run: `cd web && npx tsc --noEmit && npx vitest run && npx next build`
Expected: tsc clean; all suites pass (existing + new `lib/quests/*` + extended `lib/cs/wallet`); build succeeds.

- [ ] **Step 4: Request code review** via superpowers:requesting-code-review against the spec.

---

## Self-Review notes (author)

- **Spec coverage:** Q1 blend → Task 5 (advance/practice/retrieval in `buildDaily`). Q2 deterministic client-side → Tasks 3,5,6 (no API). Q3 tier table → Task 5 `wantPractice`/`wantRetrieval` + tests. Q4 rewards → Task 2 (`applyCredit`/`credit`), Task 5 (`cs: 10`), Task 7 (per-quest credit + all-done bonus). Q5 clean slate → Task 6 (`rolloverIfStale`) + Task 5 (advance re-derives, no stored picks). Q6 practice reuses SP3 templates → Task 5 (`getAppliedChallenge`); retrieval bank → Task 4. Theming (mentor prefix, accent) → Tasks 5,8. Dashboard integration → Task 9. Out-of-scope respected (no streaks/server/Gemini/SM-2). Testing → Tasks 2,3,5,6 + final.
- **Type consistency:** `DailyQuest`/`DailySet`/`DailyInput` defined once (Task 1) and used verbatim. `buildDaily(input)`, `dailySeed(key,date)`/`pick(items,seed,n)`, `rolloverIfStale`/`markDone`/`isDone`/`readDaily`/`writeDaily`/`localDate`, `applyCredit(wallet,key,amount)`, `useShards().credit`, `useDailyQuests(params)` surface — all consistent across tasks. Quest-id scheme (`advance:<m>/<u>`, `practice:<m>`, `retrieval:<m>`, `complete`) and CS credit keys (`daily:<date>:<id>`, `daily:<date>:bonus`) consistent between Tasks 5 and 7.
- **Open assumption for executor (Task 9 Step 4):** the exact key for cogTier in the `/api/intake/me` payload (`cog_tier` vs `cogTier`) is verified at execution; the panel guards with a fallback to tier 2 either way.
```
