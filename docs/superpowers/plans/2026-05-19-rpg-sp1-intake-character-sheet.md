# SP1 — Intake → Character Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native 62-question onboarding questionnaire that deterministically scores learners into 6 RPG attributes / class / World Skin, generates a Character Sheet (Gemini prose), and hard-gates course content until completion.

**Architecture:** Pure deterministic scoring lives in `web/lib/intake` (shared, unit-tested). The CF Worker exposes `/api/intake/*`, persists to D1, and calls Google Gemini for generative prose with a template fallback. The Next.js frontend renders a resumable one-question wizard at `/quest-intake` and the sheet at `/character`, gated by `IntakeGuard`.

**Tech Stack:** Next.js 16 (App Router, static export), Cloudflare Workers + D1 (SQLite), Vitest, Google Gemini API (`gemini-2.0-flash` for classification, `gemini-2.5-pro` for prose).

**Spec:** `docs/superpowers/specs/2026-05-19-rpg-sp1-intake-character-sheet-design.md`
**Program tracker:** `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`

---

## File Structure

**Shared logic (`web/lib/intake/`)** — pure, no network, unit-tested:
- `types.ts` — TS types for questions, answers, profile, scoring output.
- `attributes.ts` — friendly RU/EN names + meanings + ranges per attribute.
- `questions.ts` — 62 typed questions (RU+EN), `showIf` branching.
- `scoring-weights.ts` — `SCORING` point table per MC/Likert option (calibratable).
- `scoring.ts` — pure functions: answers → attributes → class → skin → cog_tier → register/lang/niche.

**Worker (`workers/src/`)**:
- `handlers/intake.ts` — `POST /api/intake/submit`, `GET /api/intake/me`, `PATCH /api/intake/progress`.
- `lib/gemini.ts` — Gemini client: G3 classification + sheet prose + template fallback.
- `migrations/0003_intake_profiles.sql` — new table.
- wire routes in `src/index.ts`.

**Frontend (`web/`)**:
- `components/intake/intake-wizard.tsx` — one-question wizard, progress, resume.
- `components/intake/question-renderer.tsx` — renders a question by format.
- `components/intake-guard.tsx` — gate over AuthGuard.
- `components/character-sheet.tsx` — sheet rendering.
- `app/quest-intake/page.tsx` + `app/en/quest-intake/page.tsx`.
- `app/character/page.tsx` + `app/en/character/page.tsx`.
- Modify `app/auth/verify/verify-client.tsx` (redirect new users to `/quest-intake`).
- Modify lesson/module/unit guards to add `IntakeGuard`.
- Delete `app/onboarding/`, `app/en/onboarding/`, `components/onboarding-form.tsx`.

---

## Phase 0 — Data layer & types

### Task 1: D1 migration for intake_profiles

**Files:**
- Create: `workers/migrations/0003_intake_profiles.sql`

- [ ] **Step 1: Write the migration**

```sql
-- workers/migrations/0003_intake_profiles.sql
CREATE TABLE IF NOT EXISTS intake_profiles (
  user_id        TEXT PRIMARY KEY REFERENCES users(id),
  status         TEXT NOT NULL DEFAULT 'in_progress',
  answers        TEXT NOT NULL DEFAULT '{}',
  current_step   INTEGER NOT NULL DEFAULT 0,

  int_score INTEGER, wis_score INTEGER, con_score INTEGER,
  dex_score INTEGER, cha_score INTEGER, str_score INTEGER,
  char_class    TEXT,
  char_level    INTEGER,
  world_skin    TEXT,
  cog_tier      INTEGER,
  register      TEXT,
  sheet_language TEXT,
  niche         TEXT,
  os            TEXT,

  legendary_title TEXT, backstory TEXT, first_quest TEXT, final_boss TEXT,
  prose_source  TEXT,

  created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, completed_at INTEGER
);
```

- [ ] **Step 2: Apply locally**

Run: `cd workers && npx wrangler d1 execute tochka-sborki-db --local --file=migrations/0003_intake_profiles.sql`
Expected: `Executed 1 command(s)` with no error.

- [ ] **Step 3: Commit**

```bash
git add workers/migrations/0003_intake_profiles.sql
git commit -m "feat(workers): add intake_profiles D1 migration"
```

### Task 2: Shared intake types

**Files:**
- Create: `web/lib/intake/types.ts`

- [ ] **Step 1: Write the types**

```typescript
// web/lib/intake/types.ts
export type Locale = 'ru' | 'en'
export type QuestionFormat = 'number' | 'single' | 'multi' | 'likert' | 'text'
export type AttributeCode = 'INT' | 'WIS' | 'CON' | 'DEX' | 'CHA' | 'STR'
export type ModuleId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export type CharacterClass =
  | 'artificer' | 'mage' | 'operator' | 'healer' | 'sovereign' | 'wanderer'

export type WorldSkin =
  | 'slavic-myth' | 'dark-fantasy' | 'cyber-noir' | 'space-opera'
  | 'anime-quest' | 'soviet-heroic' | 'mystic-arcane' | 'wanderer'

export interface QuestionOption {
  value: string                 // stable key stored in answers
  label: { ru: string; en: string }
}

export interface Question {
  id: string                    // e.g. "C3"
  module: ModuleId
  format: QuestionFormat
  required: boolean
  prompt: { ru: string; en: string }
  options?: QuestionOption[]     // for single/multi
  showIf?: { questionId: string; equals: string }  // F2 branching
}

export interface ModuleIntro {
  id: ModuleId
  title: { ru: string; en: string }
  intro: { ru: string; en: string }
}

// answers: questionId -> value(s). number stored as number, multi as string[]
export type AnswerValue = string | number | string[]
export type Answers = Record<string, AnswerValue>

export interface ScoreResult {
  int: number; wis: number; con: number; dex: number; cha: number; str: number
  charClass: CharacterClass
  charLevel: number             // 0–4
  worldSkin: WorldSkin
  worldSkinSource: 'g9' | 'g3' | 'wanderer-fallback'
  cogTier: number               // 1–4
  register: string              // ty|vy|playful|terse|adaptive
  sheetLanguage: string         // ru|en|ru-tech|mix
  niche: string | null
  os: string | null             // mac|windows
  strLowConfidence: boolean
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add web/lib/intake/types.ts
git commit -m "feat(intake): add shared intake types"
```

### Task 3: Attribute friendly-name metadata

**Files:**
- Create: `web/lib/intake/attributes.ts`
- Test: `web/lib/intake/attributes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/intake/attributes.test.ts
import { describe, it, expect } from 'vitest'
import { ATTRIBUTES } from './attributes'

describe('ATTRIBUTES', () => {
  it('has all 6 attributes with ru+en names, meanings, max', () => {
    const codes = ATTRIBUTES.map(a => a.code)
    expect(codes).toEqual(['INT', 'WIS', 'CON', 'DEX', 'CHA', 'STR'])
    for (const a of ATTRIBUTES) {
      expect(a.name.ru).toBeTruthy()
      expect(a.name.en).toBeTruthy()
      expect(a.meaning.ru).toBeTruthy()
      expect(a.max).toBeGreaterThan(0)
    }
  })
  it('uses the agreed russified names', () => {
    const int = ATTRIBUTES.find(a => a.code === 'INT')!
    expect(int.name.ru).toBe('Тех-разум')
    expect(int.max).toBe(30)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/intake/attributes.test.ts`
Expected: FAIL — cannot find module `./attributes`.

- [ ] **Step 3: Write the implementation**

```typescript
// web/lib/intake/attributes.ts
import type { AttributeCode } from './types'

export interface AttributeMeta {
  code: AttributeCode
  emoji: string
  name: { ru: string; en: string }
  meaning: { ru: string; en: string }
  max: number
}

export const ATTRIBUTES: AttributeMeta[] = [
  { code: 'INT', emoji: '🧠', max: 30,
    name: { ru: 'Тех-разум', en: 'Tech-Mind' },
    meaning: { ru: 'глубина в технике и абстракциях', en: 'depth in tech & abstraction' } },
  { code: 'WIS', emoji: '📚', max: 25,
    name: { ru: 'Самообучение', en: 'Self-Learning' },
    meaning: { ru: 'учиться самому, без подсказок', en: 'learning on your own' } },
  { code: 'CON', emoji: '🛡', max: 25,
    name: { ru: 'Стойкость', en: 'Stamina' },
    meaning: { ru: 'не бросаешь, анти-выгорание', en: 'persistence, anti-burnout' } },
  { code: 'DEX', emoji: '⚡', max: 20,
    name: { ru: 'Темп', en: 'Tempo' },
    meaning: { ru: 'как быстро хочешь результат', en: 'how fast you want results' } },
  { code: 'CHA', emoji: '🌟', max: 20,
    name: { ru: 'Харизма', en: 'Charisma' },
    meaning: { ru: 'клиенты и сообщество', en: 'client & community orientation' } },
  { code: 'STR', emoji: '🔨', max: 20,
    name: { ru: 'Размах', en: 'Ambition' },
    meaning: { ru: 'масштаб того, что строишь', en: 'scope of what you build' } },
]
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/intake/attributes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/attributes.ts web/lib/intake/attributes.test.ts
git commit -m "feat(intake): add attribute friendly-name metadata"
```

---

## Phase 1 — Scoring engine (pure, TDD)

### Task 4: Scoring weight table

**Files:**
- Create: `web/lib/intake/scoring-weights.ts`

**Calibration rule (no placeholders):** Where the source doc gives explicit point values, use them
verbatim. Where it does not, apply this default: for an N-option `single` question that feeds an
attribute, assign evenly-spaced points from 0 to the question's documented max in option order
(first option = least). Likert (1–5) maps 1→0,2→1,3→2,4→3,5→4 unless the doc states inverse scoring
(B1 is inverse: 1→5,2→4,3→3,4→2,5→1). Every weight is editable here for cohort calibration.

- [ ] **Step 1: Write the weights (documented values + default rule)**

```typescript
// web/lib/intake/scoring-weights.ts
// points[questionId][optionValue] = points contributed to its attribute.
// Doc-explicit values are used verbatim; others follow the even-spacing rule (see plan).
export const SCORING: Record<string, Record<string, number>> = {
  // INT sources
  C1: { tier0: 0, tier1: 2, tier2: 4, tier3: 8, tier4: 12 }, // also sets char_level 0..4
  C3: { never_heard: 0, heard: 1, know: 3, used: 5 },
  C4: { never: 0, basic: 2, scripts: 4, comfortable: 6 },
  C8: { very: 5, somewhat: 3, concrete: 1, confused: 0 },
  D3: { absorb: 6, tired: 4, lose: 2, rewatch: 1, giveup: 0 },
  D7: { one: 0, two_three: 2, four_five: 4, many: 6 },
  // WIS sources
  D1: { video_copy: 1, read_try: 3, jump_in: 4, walk_through: 0 },
  D5: { do_now: 4, notes: 2, teach: 3, review: 2, depends: 2 },
  D9: { e0: 0, e1: 2, e2: 3, e3: 5 },           // metacognition Likert-ish (even-spaced)
  E3: { quick: 1, slow: 3, community: 2 },        // shared with CHA context
  E4: { high: 5, mid: 3, low: 1 },
  // CON sources
  E1: { e0: 0, e1: 1, e2: 3, e3: 5 },
  E2: { e0: 0, e1: 1, e2: 3, e3: 5 },
  E7: { e0: 0, e1: 2, e2: 4, e3: 6 },
  B7: { lt_week: 1, w1_4: 2, m1_3: 3, m6_plus: 5 },
  B8: { e0: 0, e1: 2, e2: 4 },                    // dropout-trigger severity (open-text gated; MC proxy)
  // DEX sources
  A9: { 1: 0, 2: 1, 3: 2, 4: 4, 5: 5 },           // urgency Likert
  F5: { yes: 5, no: 1 },
  E5: { lt2h: 1, h2_5: 3, h5_plus: 5 },
  B6: { yes: 4, no: 1 },
  // CHA sources
  A5: { confident: 2, supported: 4, ahead: 3, calm: 3, other: 2 },
  A6: { professional: 4, modern: 3, efficient: 2, creative: 3, other: 2 },
  F2: { coach: 4, massage: 4, astrology: 4, content: 5, ecommerce: 3, service: 3, tech: 1, other: 2 },
  // STR sources (low-confidence: numeric proxies only)
  F4: { solo: 2, helpers: 3, small: 4, large: 6 },
}

// B1 is inverse-scored Push (not a direct attribute, used by future SPs) — kept for completeness.
export const INVERSE_LIKERT = new Set(['B1'])
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/lib/intake/scoring-weights.ts
git commit -m "feat(intake): add calibratable scoring weight table"
```

### Task 5: Attribute computation

**Files:**
- Create: `web/lib/intake/scoring.ts`
- Test: `web/lib/intake/scoring.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/intake/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { computeAttributes } from './scoring'

describe('computeAttributes', () => {
  it('sums MC/Likert points and normalizes to range', () => {
    // INT raw max = 12+5+6+5+6+6 = 40; normalize to 30.
    const answers = { C1: 'tier4', C3: 'used', C4: 'comfortable', C8: 'very', D3: 'absorb', D7: 'many' }
    const a = computeAttributes(answers)
    expect(a.int).toBe(30) // 40/40*30
  })
  it('returns 0 for an attribute with no answers', () => {
    const a = computeAttributes({})
    expect(a.int).toBe(0)
    expect(a.cha).toBe(0)
  })
  it('ignores open-text answers', () => {
    const a = computeAttributes({ A1: 'I am a massage therapist', C1: 'tier0' })
    expect(a.int).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: FAIL — `computeAttributes` not exported.

- [ ] **Step 3: Implement attribute computation**

```typescript
// web/lib/intake/scoring.ts
import { SCORING } from './scoring-weights'
import type { Answers, AttributeCode } from './types'

const SOURCES: Record<AttributeCode, { ids: string[]; rawMax: number; range: number }> = {
  INT: { ids: ['C1', 'C3', 'C4', 'C8', 'D3', 'D7'], rawMax: 40, range: 30 },
  WIS: { ids: ['D1', 'D5', 'D9', 'E3', 'E4'], rawMax: 21, range: 25 },
  CON: { ids: ['E1', 'E2', 'E7', 'B7', 'B8'], rawMax: 25, range: 25 },
  DEX: { ids: ['A9', 'F5', 'E5', 'B6'], rawMax: 19, range: 20 },
  CHA: { ids: ['A5', 'A6', 'F2', 'E3'], rawMax: 16, range: 20 },
  STR: { ids: ['F4', 'A9'], rawMax: 11, range: 20 },
}

function pointsFor(id: string, answers: Answers): number {
  const raw = answers[id]
  if (raw == null) return 0
  const table = SCORING[id]
  if (!table) return 0
  const key = typeof raw === 'number' ? String(raw) : Array.isArray(raw) ? '' : raw
  return table[key] ?? 0
}

export interface Attributes {
  int: number; wis: number; con: number; dex: number; cha: number; str: number
}

export function computeAttributes(answers: Answers): Attributes {
  const out = {} as Record<Lowercase<AttributeCode>, number>
  for (const code of Object.keys(SOURCES) as AttributeCode[]) {
    const { ids, rawMax, range } = SOURCES[code]
    const raw = ids.reduce((sum, id) => sum + pointsFor(id, answers), 0)
    out[code.toLowerCase() as Lowercase<AttributeCode>] = Math.round((raw / rawMax) * range)
  }
  return out as Attributes
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/scoring.ts web/lib/intake/scoring.test.ts
git commit -m "feat(intake): compute normalized RPG attributes"
```

### Task 6: Class assignment

**Files:**
- Modify: `web/lib/intake/scoring.ts`
- Test: `web/lib/intake/scoring.test.ts`

- [ ] **Step 1: Add failing tests**

```typescript
// append to web/lib/intake/scoring.test.ts
import { assignClass } from './scoring'

describe('assignClass', () => {
  it('Artificer when INT/STR/CON high', () => {
    expect(assignClass({ int: 22, wis: 10, con: 19, dex: 10, cha: 10, str: 16 })).toBe('artificer')
  })
  it('Healer when CHA/CON high and INT low', () => {
    expect(assignClass({ int: 8, wis: 16, con: 20, dex: 17, cha: 19, str: 12 })).toBe('healer')
  })
  it('Wanderer when no thresholds met', () => {
    expect(assignClass({ int: 5, wis: 5, con: 5, dex: 5, cha: 5, str: 5 })).toBe('wanderer')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: FAIL — `assignClass` not exported.

- [ ] **Step 3: Implement**

```typescript
// append to web/lib/intake/scoring.ts
import type { CharacterClass } from './types'

export function assignClass(a: Attributes): CharacterClass {
  if (a.int >= 20 && a.str >= 15 && a.con >= 18) return 'artificer'
  if (a.wis >= 18 && a.int >= 15 && a.cha >= 15) return 'mage'
  if (a.wis >= 20 && a.cha >= 18 && a.con >= 20) return 'sovereign'
  if (a.dex >= 15 && a.str >= 12 && a.int >= 10 && a.wis < 15) return 'operator'
  if (a.cha >= 15 && a.con >= 15 && a.int < 15) return 'healer'
  return 'wanderer'
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/scoring.ts web/lib/intake/scoring.test.ts
git commit -m "feat(intake): class assignment by attribute thresholds"
```

### Task 7: World Skin, cog tier, register/language/niche/level, full profile

**Files:**
- Modify: `web/lib/intake/scoring.ts`
- Test: `web/lib/intake/scoring.test.ts`

- [ ] **Step 1: Add failing tests**

```typescript
// append to web/lib/intake/scoring.test.ts
import { assignWorldSkin, computeCogTier, scoreProfile } from './scoring'

describe('assignWorldSkin', () => {
  it('G9 explicit choice wins over G3', () => {
    expect(assignWorldSkin({ G9: 'cyber-noir', G3: 'Ведьмак' })).toEqual({ skin: 'cyber-noir', source: 'g9' })
  })
  it('falls back to wanderer when neither present', () => {
    expect(assignWorldSkin({})).toEqual({ skin: 'wanderer', source: 'wanderer-fallback' })
  })
  it('leaves G3 to async classification (returns g3 marker)', () => {
    expect(assignWorldSkin({ G3: 'Ведьмак' })).toEqual({ skin: 'wanderer', source: 'g3' })
  })
})

describe('computeCogTier', () => {
  it('downshifts when G6 says under 3 min despite long D2', () => {
    expect(computeCogTier({ D2: '30_45', G6: 'under3' })).toBe(1)
  })
  it('uses D2 when consistent', () => {
    expect(computeCogTier({ D2: '30_45', G6: '10_30' })).toBe(3)
  })
})

describe('scoreProfile', () => {
  it('produces a full ScoreResult', () => {
    const r = scoreProfile({
      C1: 'tier0', A5: 'supported', A6: 'professional', F2: 'massage',
      E3: 'community', E4: 'high', D2: '15_20', G6: '10_30',
      G8: 'ty', G12: 'ru-tech', G9: 'slavic-myth',
    })
    expect(r.charLevel).toBe(0)
    expect(r.register).toBe('ty')
    expect(r.sheetLanguage).toBe('ru-tech')
    expect(r.niche).toBe('massage')
    expect(r.worldSkin).toBe('slavic-myth')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: FAIL — new exports missing.

- [ ] **Step 3: Implement**

```typescript
// append to web/lib/intake/scoring.ts
import type { Answers, WorldSkin, ScoreResult } from './types'

const CHAR_LEVEL: Record<string, number> = { tier0: 0, tier1: 1, tier2: 2, tier3: 3, tier4: 4 }
const COG_BY_D2: Record<string, number> = { '5_10': 1, '15_20': 2, '30_45': 3, '60_plus': 4 }

export function assignWorldSkin(answers: Answers): { skin: WorldSkin; source: 'g9' | 'g3' | 'wanderer-fallback' } {
  const g9 = answers['G9'] as string | undefined
  if (g9) return { skin: g9 as WorldSkin, source: 'g9' }
  if (answers['G3']) return { skin: 'wanderer', source: 'g3' } // resolved async by Gemini
  return { skin: 'wanderer', source: 'wanderer-fallback' }
}

export function computeCogTier(answers: Answers): number {
  const base = COG_BY_D2[answers['D2'] as string] ?? 2
  if (answers['G6'] === 'under3') return 1 // Shorts-native cross-validation override
  return base
}

const STR_NUMERIC_IDS = ['F4', 'A9']

export function scoreProfile(answers: Answers): ScoreResult {
  const attrs = computeAttributes(answers)
  const { skin, source } = assignWorldSkin(answers)
  const strInputs = STR_NUMERIC_IDS.filter(id => answers[id] != null).length
  return {
    int: attrs.int, wis: attrs.wis, con: attrs.con, dex: attrs.dex, cha: attrs.cha, str: attrs.str,
    charClass: assignClass(attrs),
    charLevel: CHAR_LEVEL[answers['C1'] as string] ?? 0,
    worldSkin: skin,
    worldSkinSource: source,
    cogTier: computeCogTier(answers),
    register: (answers['G8'] as string) ?? 'adaptive',
    sheetLanguage: (answers['G12'] as string) ?? 'ru-tech',
    niche: (answers['F2'] as string) ?? null,
    os: (answers['OS'] as string) ?? null,
    strLowConfidence: strInputs < 2,
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd web && npx vitest run lib/intake/scoring.test.ts`
Expected: PASS (all describe blocks).

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/scoring.ts web/lib/intake/scoring.test.ts
git commit -m "feat(intake): world skin, cog tier, and full profile scoring"
```

---

## Phase 2 — Questionnaire content

### Task 8: Question config (62 questions, RU+EN)

**Files:**
- Create: `web/lib/intake/questions.ts`
- Test: `web/lib/intake/questions.test.ts`

**Source of truth:** Transcribe questions verbatim from the two spec source docs (Modules A–F from the
main doc §5; Module G from the addendum §4). Option `value` keys MUST match `scoring-weights.ts`
(Task 4) for every scored question. Add one extra `single` question `OS` ("Mac / Windows / Linux")
in Module C (folds in the retired onboarding step), values `mac|windows|linux`.

- [ ] **Step 1: Write the failing test (structural contract)**

```typescript
// web/lib/intake/questions.test.ts
import { describe, it, expect } from 'vitest'
import { QUESTIONS, MODULE_INTROS } from './questions'
import { SCORING } from './scoring-weights'

describe('QUESTIONS', () => {
  it('has 63 questions (62 instrument + OS) across modules A–G', () => {
    expect(QUESTIONS.length).toBe(63)
    expect(new Set(QUESTIONS.map(q => q.module))).toEqual(new Set(['A','B','C','D','E','F','G']))
  })
  it('every question has RU and EN prompt', () => {
    for (const q of QUESTIONS) { expect(q.prompt.ru).toBeTruthy(); expect(q.prompt.en).toBeTruthy() }
  })
  it('single/multi questions have options with ru+en labels', () => {
    for (const q of QUESTIONS.filter(q => q.format === 'single' || q.format === 'multi')) {
      expect(q.options && q.options.length).toBeGreaterThan(0)
      for (const o of q.options!) { expect(o.label.ru).toBeTruthy(); expect(o.label.en).toBeTruthy() }
    }
  })
  it('every option value used in SCORING exists in its question', () => {
    for (const [qid, table] of Object.entries(SCORING)) {
      const q = QUESTIONS.find(q => q.id === qid)
      if (!q || !q.options) continue // Likert numeric / proxy questions may have no options
      const values = new Set(q.options.map(o => o.value))
      for (const key of Object.keys(table)) {
        if (/^\d+$/.test(key)) continue // Likert numeric keys
        expect(values.has(key), `${qid} missing option ${key}`).toBe(true)
      }
    }
  })
  it('has an intro for every module', () => {
    expect(MODULE_INTROS.map(m => m.id)).toEqual(['A','B','C','D','E','F','G'])
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd web && npx vitest run lib/intake/questions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the config**

Transcribe all questions. Pattern (one fully-worked example per format — replicate for all 63,
keeping IDs and option `value`s aligned with `scoring-weights.ts`):

```typescript
// web/lib/intake/questions.ts
import type { Question, ModuleIntro } from './types'

export const MODULE_INTROS: ModuleIntro[] = [
  { id: 'A', title: { ru: 'Ваш Квест', en: 'Your Quest' },
    intro: { ru: 'Начнём с того, чего ты на самом деле хочешь…', en: "Let's start with what you actually want…" } },
  // … B–G intros transcribed from the docs
]

export const QUESTIONS: Question[] = [
  // open text
  { id: 'A1', module: 'A', format: 'text', required: true,
    prompt: { ru: 'Опиши свою работу или основное занятие одним предложением.',
              en: 'Describe your work or main activity in one sentence.' } },
  // likert
  { id: 'A9', module: 'A', format: 'likert', required: true,
    prompt: { ru: 'Насколько срочно тебе нужно рабочее AI-решение в ближайшие 2–4 недели?',
              en: 'How urgent is a working AI solution in the next 2–4 weeks?' } },
  // single (scored) — values MUST match SCORING['C3']
  { id: 'C3', module: 'C', format: 'single', required: true,
    prompt: { ru: 'Когда ты слышишь слово «API», что ближе?', en: 'When you hear "API", which is closest?' },
    options: [
      { value: 'never_heard', label: { ru: 'Никогда не слышал(а)', en: 'Never heard it' } },
      { value: 'heard',       label: { ru: 'Слышал(а), но не знаю что это', en: 'Heard it, unsure' } },
      { value: 'know',        label: { ru: 'Знаю, но не использовал(а)', en: 'Know it, never used' } },
      { value: 'used',        label: { ru: 'Подключал(а) / использовал(а)', en: 'Have used one' } },
    ] },
  // multi
  { id: 'C2', module: 'C', format: 'multi', required: false,
    prompt: { ru: 'Какие AI-инструменты ты использовал(а)?', en: 'Which AI tools have you used?' },
    options: [
      { value: 'chatgpt', label: { ru: 'ChatGPT', en: 'ChatGPT' } },
      { value: 'claude',  label: { ru: 'Claude', en: 'Claude' } },
      // … rest
    ] },
  // number
  { id: 'G1', module: 'G', format: 'number', required: true,
    prompt: { ru: 'В каком году ты родился(ась)?', en: 'What year were you born?' } },
  // OS folded-in question
  { id: 'OS', module: 'C', format: 'single', required: true,
    prompt: { ru: 'На какой системе ты работаешь?', en: 'What system do you work on?' },
    options: [
      { value: 'mac',     label: { ru: 'macOS', en: 'macOS' } },
      { value: 'windows', label: { ru: 'Windows', en: 'Windows' } },
      { value: 'linux',   label: { ru: 'Linux', en: 'Linux' } },
    ] },
  // F2 with downstream branching consumer; G9 single-choice of 7 skins; etc.
]
```

> Implementation note: transcribe ALL 63 questions following the patterns above. Cross-check each
> scored question's `value`s against `scoring-weights.ts`. The test in Step 1 enforces alignment.

- [ ] **Step 4: Run to verify pass**

Run: `cd web && npx vitest run lib/intake/questions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/intake/questions.ts web/lib/intake/questions.test.ts
git commit -m "feat(intake): full 63-question bilingual config"
```

---

## Phase 3 — Worker API & Gemini

### Task 9: Gemini client with fallback

**Files:**
- Create: `workers/src/lib/gemini.ts`
- Test: `workers/src/lib/gemini.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// workers/src/lib/gemini.test.ts
import { describe, it, expect, vi } from 'vitest'
import { generateSheetProse, fallbackProse } from './gemini'

describe('fallbackProse', () => {
  it('produces non-empty prose without network', () => {
    const p = fallbackProse({ charClass: 'healer', worldSkin: 'slavic-myth', language: 'ru' } as any)
    expect(p.legendaryTitle).toBeTruthy()
    expect(p.backstory).toBeTruthy()
    expect(p.firstQuest).toBeTruthy()
    expect(p.finalBoss).toBeTruthy()
  })
})

describe('generateSheetProse', () => {
  it('falls back when fetch throws', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))
    const r = await generateSheetProse({ charClass: 'healer', worldSkin: 'slavic-myth', language: 'ru' } as any,
      'fake-key', fetchImpl as any)
    expect(r.source).toBe('template')
    expect(r.legendaryTitle).toBeTruthy()
  })
  it('parses Gemini JSON on success', async () => {
    const body = { candidates: [{ content: { parts: [{ text: JSON.stringify({
      legendaryTitle: 'T', backstory: 'B', firstQuest: 'Q', finalBoss: 'F' }) }] } }] }
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => body })
    const r = await generateSheetProse({ charClass: 'healer', worldSkin: 'slavic-myth', language: 'ru' } as any,
      'fake-key', fetchImpl as any)
    expect(r.source).toBe('gemini')
    expect(r.legendaryTitle).toBe('T')
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd workers && npx vitest run src/lib/gemini.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```typescript
// workers/src/lib/gemini.ts
export interface ProseInput {
  charClass: string; worldSkin: string; language: string
  register?: string; niche?: string | null
  attributes?: Record<string, number>
  aspirational?: string; firstWin?: string; successDef?: string  // G11, A2/F3, A10
}
export interface Prose {
  legendaryTitle: string; backstory: string; firstQuest: string; finalBoss: string
  source: 'gemini' | 'template'
}

export function fallbackProse(i: ProseInput): Omit<Prose, 'source'> {
  const ru = i.language !== 'en'
  return {
    legendaryTitle: ru ? `Герой пути «${i.worldSkin}»` : `Hero of the ${i.worldSkin} path`,
    backstory: ru ? 'Раньше ты делал(а) всё вручную. Но всегда знал(а), что есть другая версия тебя.'
                  : 'You used to do everything by hand — but you always knew there was another version of you.',
    firstQuest: ru ? 'Создай свой первый рабочий AI-инструмент.' : 'Build your first working AI tool.',
    finalBoss: ru ? 'Система, которая работает без твоего ежедневного участия.'
                  : 'A system that runs without your daily input.',
  }
}

export async function generateSheetProse(
  input: ProseInput, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<Prose> {
  const model = 'gemini-2.5-pro'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const prompt = buildProsePrompt(input)
  try {
    const res = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 },
      }),
    })
    if (!res.ok) throw new Error(`gemini ${res.status}`)
    const data = await res.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text)
    return {
      legendaryTitle: parsed.legendaryTitle, backstory: parsed.backstory,
      firstQuest: parsed.firstQuest, finalBoss: parsed.finalBoss, source: 'gemini',
    }
  } catch {
    return { ...fallbackProse(input), source: 'template' }
  }
}

function buildProsePrompt(i: ProseInput): string {
  return [
    `You write RPG character-sheet prose for a learning platform.`,
    `Language: ${i.language}. Register: ${i.register ?? 'neutral'}. World skin: ${i.worldSkin}. Class: ${i.charClass}. Niche: ${i.niche ?? 'n/a'}.`,
    `Learner aspirational figure (G11): ${i.aspirational ?? 'n/a'}.`,
    `Desired first win: ${i.firstWin ?? 'n/a'}. Success definition: ${i.successDef ?? 'n/a'}.`,
    `Return STRICT JSON: {"legendaryTitle","backstory","firstQuest","finalBoss"}.`,
    `Tone must match the world skin. Backstory uses the aspirational figure. finalBoss frames the ultimate challenge.`,
  ].join('\n')
}

// G3 film -> skin classification
export async function classifyFilmSkin(
  film: string, apiKey: string, fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const skins = 'slavic-myth|dark-fantasy|cyber-noir|space-opera|anime-quest|soviet-heroic|mystic-arcane|wanderer'
  try {
    const res = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text:
        `Map this film/series to ONE world skin from [${skins}]. Reply with only the skin key. Film: "${film}"` }] }] }),
    })
    if (!res.ok) throw new Error(String(res.status))
    const data = await res.json() as any
    const out = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim().toLowerCase()
    return skins.includes(out) ? out : 'wanderer'
  } catch {
    return 'wanderer'
  }
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd workers && npx vitest run src/lib/gemini.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/gemini.ts workers/src/lib/gemini.test.ts
git commit -m "feat(workers): gemini client for sheet prose + film classification"
```

### Task 10: Intake API handlers

**Files:**
- Create: `workers/src/handlers/intake.ts`
- Test: `workers/src/handlers/intake.test.ts`
- Modify: `workers/src/index.ts` (route wiring), `workers/wrangler.toml` (no change unless secret docs)

- [ ] **Step 1: Write the failing test**

```typescript
// workers/src/handlers/intake.test.ts
import { describe, it, expect, vi } from 'vitest'
import { handleProgress, handleMe, handleSubmit } from './intake'

function fakeDb(row: any = null) {
  const store = { row }
  return {
    prepare: () => ({
      bind: (..._a: any[]) => ({
        first: async () => store.row,
        run: async () => { store.row = { ...(store.row ?? {}) }; return { success: true } },
      }),
    }),
    _store: store,
  } as any
}

describe('handleMe', () => {
  it('returns 404-style null when no profile', async () => {
    const res = await handleMe(fakeDb(null), 'user1')
    expect(res.status).toBe(404)
  })
  it('returns profile when present', async () => {
    const res = await handleMe(fakeDb({ user_id: 'user1', status: 'completed' }), 'user1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('completed')
  })
})

describe('handleSubmit', () => {
  it('rejects missing required answers', async () => {
    const res = await handleSubmit(fakeDb(), 'user1', { answers: {} }, 'key', vi.fn() as any)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd workers && npx vitest run src/handlers/intake.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement handlers**

```typescript
// workers/src/handlers/intake.ts
import { scoreProfile } from '../../../web/lib/intake/scoring'
import { QUESTIONS } from '../../../web/lib/intake/questions'
import { generateSheetProse, classifyFilmSkin } from '../lib/gemini'
import type { Answers } from '../../../web/lib/intake/types'

const REQUIRED = QUESTIONS.filter(q => q.required).map(q => q.id)

export async function handleMe(db: any, userId: string): Promise<Response> {
  const row = await db.prepare('SELECT * FROM intake_profiles WHERE user_id = ?').bind(userId).first()
  if (!row) return new Response(null, { status: 404 })
  return Response.json(row)
}

export async function handleProgress(db: any, userId: string, body: { answers: Answers; currentStep: number }): Promise<Response> {
  const now = Date.now()
  await db.prepare(
    `INSERT INTO intake_profiles (user_id, answers, current_step, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET answers=excluded.answers, current_step=excluded.current_step, updated_at=excluded.updated_at`,
  ).bind(userId, JSON.stringify(body.answers), body.currentStep, now, now).run()
  return Response.json({ ok: true })
}

export async function handleSubmit(db: any, userId: string, body: { answers: Answers }, geminiKey: string, fetchImpl = fetch): Promise<Response> {
  const answers = body.answers ?? {}
  const missing = REQUIRED.filter(id => answers[id] == null || answers[id] === '')
  if (missing.length) return Response.json({ error: 'missing_required', missing }, { status: 400 })

  const score = scoreProfile(answers)

  // resolve G3 skin if needed
  if (score.worldSkinSource === 'g3' && typeof answers['G3'] === 'string') {
    score.worldSkin = (await classifyFilmSkin(answers['G3'] as string, geminiKey, fetchImpl)) as any
  }

  const prose = await generateSheetProse({
    charClass: score.charClass, worldSkin: score.worldSkin, language: score.sheetLanguage,
    register: score.register, niche: score.niche,
    attributes: { int: score.int, wis: score.wis, con: score.con, dex: score.dex, cha: score.cha, str: score.str },
    aspirational: answers['G11'] as string, firstWin: answers['A2'] as string, successDef: answers['A10'] as string,
  }, geminiKey, fetchImpl)

  const now = Date.now()
  await db.prepare(
    `INSERT INTO intake_profiles
       (user_id, status, answers, current_step, int_score, wis_score, con_score, dex_score, cha_score, str_score,
        char_class, char_level, world_skin, cog_tier, register, sheet_language, niche, os,
        legendary_title, backstory, first_quest, final_boss, prose_source, created_at, updated_at, completed_at)
     VALUES (?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET status='completed', answers=excluded.answers,
        int_score=excluded.int_score, wis_score=excluded.wis_score, con_score=excluded.con_score,
        dex_score=excluded.dex_score, cha_score=excluded.cha_score, str_score=excluded.str_score,
        char_class=excluded.char_class, char_level=excluded.char_level, world_skin=excluded.world_skin,
        cog_tier=excluded.cog_tier, register=excluded.register, sheet_language=excluded.sheet_language,
        niche=excluded.niche, os=excluded.os, legendary_title=excluded.legendary_title,
        backstory=excluded.backstory, first_quest=excluded.first_quest, final_boss=excluded.final_boss,
        prose_source=excluded.prose_source, updated_at=excluded.updated_at, completed_at=excluded.completed_at`,
  ).bind(
    userId, JSON.stringify(answers), 0, score.int, score.wis, score.con, score.dex, score.cha, score.str,
    score.charClass, score.charLevel, score.worldSkin, score.cogTier, score.register, score.sheetLanguage,
    score.niche, score.os, prose.legendaryTitle, prose.backstory, prose.firstQuest, prose.finalBoss,
    prose.source, now, now, now,
  ).run()

  return Response.json({ ok: true, redirect: '/character' })
}
```

- [ ] **Step 4: Wire routes in index.ts**

```typescript
// workers/src/index.ts — inside the request router, after auth routes
import { handleMe, handleProgress, handleSubmit } from './handlers/intake'
// const userId = await requireAuth(request, env)  // existing auth helper
if (path === '/api/intake/me' && request.method === 'GET') return handleMe(env.DB, userId)
if (path === '/api/intake/progress' && request.method === 'PATCH') return handleProgress(env.DB, userId, await request.json())
if (path === '/api/intake/submit' && request.method === 'POST') return handleSubmit(env.DB, userId, await request.json(), env.GEMINI_API_KEY)
```

- [ ] **Step 5: Run tests + typecheck**

Run: `cd workers && npx vitest run src/handlers/intake.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Set the Gemini secret (one-time, manual)**

Run: `cd workers && npx wrangler secret put GEMINI_API_KEY`
Expected: prompts for the key; stores it. (Document in README; do not echo the key.)

- [ ] **Step 7: Commit**

```bash
git add workers/src/handlers/intake.ts workers/src/handlers/intake.test.ts workers/src/index.ts
git commit -m "feat(workers): intake submit/me/progress API with scoring + gemini"
```

---

## Phase 4 — Frontend wizard, guard, sheet, flow

### Task 11: Question renderer component

**Files:**
- Create: `web/components/intake/question-renderer.tsx`

- [ ] **Step 1: Implement (renders one question by format)**

```tsx
// web/components/intake/question-renderer.tsx
'use client'
import type { Question, AnswerValue, Locale } from '@/lib/intake/types'

interface Props { question: Question; locale: Locale; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }

export function QuestionRenderer({ question: q, locale, value, onChange }: Props) {
  const t = (x: { ru: string; en: string }) => x[locale]
  if (q.format === 'text')
    return <textarea value={(value as string) ?? ''} onChange={e => onChange(e.target.value)}
      placeholder="…" style={{ width: '100%', minHeight: 90 }} />
  if (q.format === 'number')
    return <input type="number" value={(value as number) ?? ''} onChange={e => onChange(Number(e.target.value))} />
  if (q.format === 'likert')
    return <div style={{ display: 'flex', gap: 8 }}>{[1,2,3,4,5].map(n =>
      <button key={n} onClick={() => onChange(n)} aria-pressed={value === n}
        style={{ fontWeight: value === n ? 700 : 400 }}>{n}</button>)}</div>
  // single / multi
  const selected = q.format === 'multi' ? ((value as string[]) ?? []) : value
  return <div>{q.options!.map(o => {
    const on = q.format === 'multi' ? (selected as string[]).includes(o.value) : selected === o.value
    return <button key={o.value} aria-pressed={on}
      onClick={() => q.format === 'multi'
        ? onChange(on ? (selected as string[]).filter(v => v !== o.value) : [...(selected as string[]), o.value])
        : onChange(o.value)}
      style={{ display: 'block', width: '100%', textAlign: 'left', fontWeight: on ? 700 : 400 }}>
      {t(o.label)}</button>
  })}</div>
}
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/intake/question-renderer.tsx
git commit -m "feat(intake): question renderer by format"
```

### Task 12: Intake wizard (visible-question filtering, progress, resume, submit)

**Files:**
- Create: `web/components/intake/intake-wizard.tsx`
- Test: `web/lib/intake/visible.test.ts`
- Create: `web/lib/intake/visible.ts`

- [ ] **Step 1: Write failing test for showIf filtering**

```typescript
// web/lib/intake/visible.test.ts
import { describe, it, expect } from 'vitest'
import { visibleQuestions } from './visible'
import type { Question } from './types'

const qs: Question[] = [
  { id: 'F2', module: 'F', format: 'single', required: true, prompt: { ru: '', en: '' },
    options: [{ value: 'massage', label: { ru: '', en: '' } }] },
  { id: 'F2a', module: 'F', format: 'text', required: false, prompt: { ru: '', en: '' },
    showIf: { questionId: 'F2', equals: 'massage' } },
]

describe('visibleQuestions', () => {
  it('hides showIf question until condition met', () => {
    expect(visibleQuestions(qs, {}).map(q => q.id)).toEqual(['F2'])
    expect(visibleQuestions(qs, { F2: 'massage' }).map(q => q.id)).toEqual(['F2', 'F2a'])
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd web && npx vitest run lib/intake/visible.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement visible filter**

```typescript
// web/lib/intake/visible.ts
import type { Question, Answers } from './types'
export function visibleQuestions(all: Question[], answers: Answers): Question[] {
  return all.filter(q => !q.showIf || answers[q.showIf.questionId] === q.showIf.equals)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `cd web && npx vitest run lib/intake/visible.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the wizard**

```tsx
// web/components/intake/intake-wizard.tsx
'use client'
import { useEffect, useState } from 'react'
import { QUESTIONS, MODULE_INTROS } from '@/lib/intake/questions'
import { visibleQuestions } from '@/lib/intake/visible'
import { QuestionRenderer } from './question-renderer'
import type { Answers, AnswerValue, Locale } from '@/lib/intake/types'

export function IntakeWizard({ locale }: { locale: Locale }) {
  const [answers, setAnswers] = useState<Answers>({})
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.answers) { setAnswers(JSON.parse(d.answers)); setStep(d.current_step ?? 0) } })
      .catch(() => {})
  }, [])

  const visible = visibleQuestions(QUESTIONS, answers)
  const q = visible[step]
  const total = visible.length

  function setAnswer(v: AnswerValue) {
    const next = { ...answers, [q.id]: v }
    setAnswers(next)
    fetch('/api/intake/progress', { method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: next, currentStep: step }) }).catch(() => {})
  }

  async function finish() {
    setSubmitting(true)
    const res = await fetch('/api/intake/submit', { method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) })
    if (res.ok) { const { redirect } = await res.json(); window.location.replace(locale === 'en' ? '/en' + redirect : redirect) }
    else setSubmitting(false)
  }

  if (!q) return null
  const isLast = step === total - 1
  const answered = answers[q.id] != null && answers[q.id] !== '' && !(Array.isArray(answers[q.id]) && (answers[q.id] as string[]).length === 0)
  const moduleTitle = MODULE_INTROS.find(m => m.id === q.module)?.title[locale] ?? ''

  return (
    <main style={{ maxWidth: 560, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--text-secondary)' }}>
        {moduleTitle} · {step + 1}/{total}
      </div>
      <div style={{ height: 4, background: 'var(--border-color)', borderRadius: 2, margin: '.5rem 0 1.5rem' }}>
        <div style={{ height: '100%', width: `${((step + 1) / total) * 100}%`, background: 'var(--text-accent)', borderRadius: 2 }} />
      </div>
      <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.2rem' }}>{q.prompt[locale]}</h1>
      <QuestionRenderer question={q} locale={locale} value={answers[q.id]} onChange={setAnswer} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
        <button disabled={step === 0} onClick={() => setStep(s => Math.max(0, s - 1))}>← {locale === 'en' ? 'Back' : 'Назад'}</button>
        {isLast
          ? <button disabled={(q.required && !answered) || submitting} onClick={finish}>{locale === 'en' ? 'Finish →' : 'Завершить →'}</button>
          : <button disabled={q.required && !answered} onClick={() => setStep(s => s + 1)}>{locale === 'en' ? 'Next →' : 'Далее →'}</button>}
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Typecheck**

Run: `cd web && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add web/lib/intake/visible.ts web/lib/intake/visible.test.ts web/components/intake/intake-wizard.tsx
git commit -m "feat(intake): resumable wizard with showIf filtering"
```

### Task 13: quest-intake routes (RU + EN)

**Files:**
- Create: `web/app/quest-intake/page.tsx`
- Create: `web/app/en/quest-intake/page.tsx`

- [ ] **Step 1: Implement both routes**

```tsx
// web/app/quest-intake/page.tsx
import { Nav } from '@/components/nav'
import { IntakeWizard } from '@/components/intake/intake-wizard'
export default function Page() { return (<><Nav locale="ru" /><IntakeWizard locale="ru" /></>) }
```

```tsx
// web/app/en/quest-intake/page.tsx
import { Nav } from '@/components/nav'
import { IntakeWizard } from '@/components/intake/intake-wizard'
export default function Page() { return (<><Nav locale="en" /><IntakeWizard locale="en" /></>) }
```

- [ ] **Step 2: Build to verify export**

Run: `cd web && npm run build`
Expected: build succeeds; `/quest-intake` and `/en/quest-intake` appear in route list.

- [ ] **Step 3: Commit**

```bash
git add web/app/quest-intake/page.tsx web/app/en/quest-intake/page.tsx
git commit -m "feat(intake): quest-intake routes (ru+en)"
```

### Task 14: Character Sheet component + routes

**Files:**
- Create: `web/components/character-sheet.tsx`
- Create: `web/app/character/page.tsx`, `web/app/en/character/page.tsx`

- [ ] **Step 1: Implement the component**

```tsx
// web/components/character-sheet.tsx
'use client'
import { useEffect, useState } from 'react'
import { ATTRIBUTES } from '@/lib/intake/attributes'
import type { Locale } from '@/lib/intake/types'

export function CharacterSheet({ locale }: { locale: Locale }) {
  const [p, setP] = useState<any>(null)
  useEffect(() => { fetch('/api/intake/me', { credentials: 'include' })
    .then(r => r.ok ? r.json() : null).then(setP).catch(() => {}) }, [])
  if (!p) return null
  const scores: Record<string, number> = { INT: p.int_score, WIS: p.wis_score, CON: p.con_score, DEX: p.dex_score, CHA: p.cha_score, STR: p.str_score }
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-accent)', textTransform: 'uppercase' }}>
        {p.world_skin} · {p.char_class} · {locale === 'en' ? 'Level' : 'Уровень'} {p.char_level}
      </div>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 900, margin: '.4rem 0 1.4rem' }}>{p.legendary_title}</h1>
      {ATTRIBUTES.map(a => (
        <div key={a.code} style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '.74rem' }}>
            <span>{a.emoji} {a.name[locale]} <em style={{ color: 'var(--text-secondary)', fontSize: '.62rem' }}>{a.code}</em></span>
            <b style={{ color: 'var(--text-accent)' }}>{scores[a.code]} / {a.max}</b>
          </div>
          <div style={{ fontSize: '.74rem', color: 'var(--text-secondary)', margin: '.2rem 0' }}>{a.meaning[locale]}</div>
          <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3 }}>
            <div style={{ height: '100%', width: `${(scores[a.code] / a.max) * 100}%`, background: 'var(--text-accent)', borderRadius: 3 }} />
          </div>
        </div>
      ))}
      {[['backstory', p.backstory], ['first_quest', p.first_quest], ['final_boss', p.final_boss]].map(([k, v]) => (
        <div key={k as string} style={{ borderLeft: '3px solid var(--text-accent)', paddingLeft: '.9rem', margin: '1rem 0' }}>{v}</div>
      ))}
    </main>
  )
}
```

- [ ] **Step 2: Implement routes**

```tsx
// web/app/character/page.tsx
import { Nav } from '@/components/nav'
import { CharacterSheet } from '@/components/character-sheet'
export default function Page() { return (<><Nav locale="ru" /><CharacterSheet locale="ru" /></>) }
```

```tsx
// web/app/en/character/page.tsx
import { Nav } from '@/components/nav'
import { CharacterSheet } from '@/components/character-sheet'
export default function Page() { return (<><Nav locale="en" /><CharacterSheet locale="en" /></>) }
```

- [ ] **Step 3: Build**

Run: `cd web && npm run build`
Expected: success; `/character`, `/en/character` in route list.

- [ ] **Step 4: Commit**

```bash
git add web/components/character-sheet.tsx web/app/character/page.tsx web/app/en/character/page.tsx
git commit -m "feat(intake): character sheet component + routes"
```

### Task 15: IntakeGuard + flow integration + retire onboarding

**Files:**
- Create: `web/components/intake-guard.tsx`
- Modify: `web/components/pages/unit-page.tsx`, `web/components/pages/module-page.tsx`, `web/components/lesson-layout.tsx` (wrap with IntakeGuard)
- Modify: `web/app/auth/verify/verify-client.tsx`
- Delete: `web/app/onboarding/page.tsx`, `web/app/en/onboarding/page.tsx`, `web/components/onboarding-form.tsx`

- [ ] **Step 1: Implement IntakeGuard**

```tsx
// web/components/intake-guard.tsx
'use client'
import { useEffect, useState } from 'react'
import type { Locale } from '@/lib/intake/types'

export function IntakeGuard({ children, locale = 'ru' }: { children: React.ReactNode; locale?: Locale }) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const base = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.status === 'completed') setReady(true); else window.location.replace(base) })
      .catch(() => window.location.replace(base))
  }, [locale])
  if (!ready) return null
  return <>{children}</>
}
```

- [ ] **Step 2: Wrap gated pages**

In `web/components/pages/unit-page.tsx`, `module-page.tsx`, and `web/components/lesson-layout.tsx`,
wrap the existing `<AuthGuard locale={locale}>` children with `<IntakeGuard locale={locale}>`:

```tsx
// pattern, applied in all three files
<AuthGuard locale={locale}>
  <IntakeGuard locale={locale}>
    {/* existing content */}
  </IntakeGuard>
</AuthGuard>
```
Add `import { IntakeGuard } from '@/components/intake-guard'` to each.

- [ ] **Step 3: Update verify-client redirect**

In `web/app/auth/verify/verify-client.tsx`, replace the OS/onboarding destination logic with:

```typescript
const savedRedirect = sessionStorage.getItem('login_redirect')
const savedLocale = sessionStorage.getItem('login_locale')
sessionStorage.removeItem('login_redirect'); sessionStorage.removeItem('login_locale')
const base = savedLocale === 'en' ? '/en' : ''
// intake guard will bounce to /quest-intake if profile incomplete; safe default:
const destination = savedRedirect || `${base}/quest-intake/`
setTimeout(() => router.replace(destination), 800)
```

- [ ] **Step 4: Delete onboarding (retired — OS folded into questionnaire)**

```bash
git rm web/app/onboarding/page.tsx web/app/en/onboarding/page.tsx web/components/onboarding-form.tsx
```
Then grep for stragglers and fix any imports:
Run: `cd web && npx grep -rl "onboarding-form\|/onboarding" app components 2>/dev/null || true`
Expected: no remaining references (HeroSecondaryCta and others must not point to /onboarding).

- [ ] **Step 5: Build + full test run**

Run: `cd web && npm run build && npx vitest run`
Expected: build success; all tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(intake): IntakeGuard gating, verify redirect, retire onboarding"
```

---

## Phase 5 — Verification

### Task 16: End-to-end manual verification + deploy

- [ ] **Step 1: Local Worker + web smoke test**

Run (Worker): `cd workers && npx wrangler dev`
Run (web): `cd web && npm run dev`
Manually: log in → land on `/quest-intake` → answer through all modules (resume by reload mid-way) →
submit → `/character` renders with attributes + prose → `/lessons/...` now accessible.

- [ ] **Step 2: Verify gate**

In a fresh session (new email), confirm `/lessons/00-kickstart/` redirects to `/quest-intake/`.

- [ ] **Step 3: Apply migration to remote D1**

Run: `cd workers && npx wrangler d1 execute tochka-sborki-db --remote --file=migrations/0003_intake_profiles.sql`
Expected: success.

- [ ] **Step 4: Push (CI deploys)**

```bash
git push
```
Expected: CI runs web + workers jobs green.

- [ ] **Step 5: Update program tracker**

Set SP1 status to ✅ in `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md` and update Current
Position. Commit.

---

## Self-Review notes

- **Spec coverage:** §2 architecture → Tasks 9–15; §3 data model → Task 1; §4 questionnaire → Tasks 8, 11–13;
  §5 scoring → Tasks 4–7; §6 sheet → Tasks 9, 14; §7 gating/errors/testing → Tasks 10, 15, all `*.test.ts`.
- **Open items from spec §9:** SCORING table (Task 4 + calibration rule), Gemini models/prompts (Task 9),
  template fallback (Task 9), F2 niche sub-questions (Task 8). All covered.
- **Type consistency:** `scoreProfile`/`ScoreResult` fields used identically in scoring (Task 7),
  handler (Task 10), and sheet (Task 14). Question `value` keys gated against `SCORING` by Task 8 test.
- **Known transcription dependency:** Task 8 requires verbatim transcription of all 63 questions from the
  source docs; the structural test enforces completeness and value-alignment with the scoring table.
