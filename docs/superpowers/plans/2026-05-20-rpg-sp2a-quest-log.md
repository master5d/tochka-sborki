# SP2a — Quest Log + World Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic `/dashboard` with a personalized Quest Log: the 9 course modules reordered by RPG class, named in the learner's World Skin voice, shown as a winding SVG zone map above a quest feed, with progress and a highlighted current quest (soft order — every module stays openable).

**Architecture:** Pure composition of three sources — profile (`GET /api/intake/me`), progress (existing `progress-provider`), and static repo content (`web/lib/rpg/*`). A pure `buildQuestLog` view-model builder feeds three presentational components. Skin quest/zone names come from committed JSON packs generated at dev-time by Gemini (`scripts/gen-skins.mjs`); runtime never calls Gemini and falls back to real module titles when a pack entry is missing.

**Tech Stack:** Next.js 16 (App Router, static export), TypeScript, Vitest, Node ESM script + Google Gemini API (dev-time only).

**Spec:** `docs/superpowers/specs/2026-05-20-rpg-sp2a-quest-log-design.md`
**Builds on:** SP1 (shipped). Profile row fields (snake_case from D1): `char_class`, `world_skin`, `niche`, `char_level`, `legendary_title`, `status`.

---

## Canonical facts (used throughout)

The 9 module slugs in ascending `module` order (from `getAllModules`):
```
00-kickstart, 01-introduction, 02-setup-guide, 03-stack-selection,
04-prompt-engineering, 05-context-memory, 06-audio-pipeline, 07-tools, 08-agent-engineering
```
`progress-provider` exposes `getState(slug)` → `'completed' | 'viewed' | 'none'` (existing; see `web/app/dashboard/dashboard-client.tsx` for usage). Classes/skins are the SP1 union types in `web/lib/intake/types.ts`.

## File Structure

```
web/lib/rpg/
  modules.ts        MODULE_SLUGS canonical ordered slug list
  types.ts          SkinPack, SkinMeta, ZoneVM, QuestLogVM
  skins-meta.ts     accent/glyph/displayName per skin (authored)
  quest-lines.ts    CharacterClass → ordered slug[] (authored permutations)
  niche-map.ts      niche → relevant module slug
  quest-log.ts      buildQuestLog() pure builder
  skins/
    wanderer.json   hand-authored neutral fallback pack
    <skin>.json     Gemini-generated packs (committed after review)
web/components/rpg/
  character-strip.tsx
  world-map.tsx     winding SVG path + node math
  quest-feed.tsx
web/app/dashboard/dashboard-client.tsx   (rewritten to compose the above)
scripts/gen-skins.mjs                    (dev-time Gemini generation)
```

---

## Phase 0 — Static content & types

### Task 1: RPG module list, types, skin meta

**Files:** Create `web/lib/rpg/modules.ts`, `web/lib/rpg/types.ts`, `web/lib/rpg/skins-meta.ts`

- [ ] **Step 1: Create `web/lib/rpg/modules.ts`**

```typescript
// Canonical module slugs in ascending order (mirrors content/<locale>/NN-* dirs).
export const MODULE_SLUGS = [
  '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
  '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools', '08-agent-engineering',
] as const
export type ModuleSlug = (typeof MODULE_SLUGS)[number]
```

- [ ] **Step 2: Create `web/lib/rpg/types.ts`**

```typescript
import type { WorldSkin, CharacterClass, Locale } from '@/lib/intake/types'

export type Bi = { ru: string; en: string }

export interface SkinPack {
  skin: WorldSkin
  zoneNames: Record<string, Bi>   // slug -> zone name
  questTitles: Record<string, Bi> // slug -> quest title
}

export interface SkinMeta {
  skin: WorldSkin
  accent: string                  // hex
  glyph: string                   // emoji
  displayName: Bi
}

export type QuestStatus = 'completed' | 'current' | 'todo'

export interface ZoneVM {
  slug: string
  order: number                   // position in class order (0-based)
  zoneName: string                // localized
  questTitle: string              // localized
  moduleTitle: string             // real module title (subtitle)
  durationLabel: string
  status: QuestStatus
  isNiche: boolean
  href: string
}

export interface QuestLogVM {
  zones: ZoneVM[]
  summary: {
    completedCount: number
    total: number
    legendaryTitle: string
    charClass: CharacterClass
    skin: WorldSkin
    level: number
  }
}

export type { WorldSkin, CharacterClass, Locale }
```

- [ ] **Step 3: Create `web/lib/rpg/skins-meta.ts`**

```typescript
import type { SkinMeta, WorldSkin } from './types'

export const SKINS_META: Record<WorldSkin, SkinMeta> = {
  'slavic-myth':   { skin: 'slavic-myth',   accent: '#7bd88f', glyph: '🌿', displayName: { ru: 'Славянский Миф', en: 'Slavic Myth' } },
  'dark-fantasy':  { skin: 'dark-fantasy',  accent: '#ff5577', glyph: '🏰', displayName: { ru: 'Тёмное Фэнтези', en: 'Dark Fantasy' } },
  'cyber-noir':    { skin: 'cyber-noir',    accent: '#00e5ff', glyph: '🕶️', displayName: { ru: 'Кибер-Нуар', en: 'Cyber Noir' } },
  'space-opera':   { skin: 'space-opera',   accent: '#4d8cff', glyph: '🚀', displayName: { ru: 'Космическая Опера', en: 'Space Opera' } },
  'anime-quest':   { skin: 'anime-quest',   accent: '#ff7ace', glyph: '🎌', displayName: { ru: 'Аниме-Квест', en: 'Anime Quest' } },
  'soviet-heroic': { skin: 'soviet-heroic', accent: '#e0b020', glyph: '🏛', displayName: { ru: 'Советский Героизм', en: 'Soviet Heroic' } },
  'mystic-arcane': { skin: 'mystic-arcane', accent: '#b388ff', glyph: '🔮', displayName: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' } },
  'wanderer':      { skin: 'wanderer',      accent: '#00ff88', glyph: '🌀', displayName: { ru: 'Странник', en: 'Wanderer' } },
}
```

- [ ] **Step 4: Typecheck + commit**

Run (from `web`): `npx tsc --noEmit` — expected PASS.
```bash
git add web/lib/rpg/modules.ts web/lib/rpg/types.ts web/lib/rpg/skins-meta.ts
git commit -m "feat(rpg): module slugs, view-model types, skin meta"
```

### Task 2: Class quest-lines

**Files:** Create `web/lib/rpg/quest-lines.ts`, `web/lib/rpg/quest-lines.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/rpg/quest-lines.test.ts
import { describe, it, expect } from 'vitest'
import { QUEST_LINES } from './quest-lines'
import { MODULE_SLUGS } from './modules'

describe('QUEST_LINES', () => {
  const classes = ['artificer','mage','operator','healer','sovereign','wanderer'] as const
  it('defines an order for every class', () => {
    for (const c of classes) expect(QUEST_LINES[c]).toBeDefined()
  })
  it('each order is a full permutation of the 9 module slugs', () => {
    for (const c of classes) {
      expect([...QUEST_LINES[c]].sort()).toEqual([...MODULE_SLUGS].sort())
    }
  })
  it('wanderer is the default ascending order', () => {
    expect(QUEST_LINES.wanderer).toEqual([...MODULE_SLUGS])
  })
})
```

- [ ] **Step 2: Run to verify fail**

Run: `cd web && npx vitest run lib/rpg/quest-lines.test.ts` — FAIL (module not found).

- [ ] **Step 3: Implement (orders are initial design hypotheses, calibratable — each a full permutation)**

```typescript
// web/lib/rpg/quest-lines.ts
import type { CharacterClass } from '@/lib/intake/types'
import { MODULE_SLUGS } from './modules'

const [K, INTRO, SETUP, STACK, PROMPT, CONTEXT, AUDIO, TOOLS, AGENT] = MODULE_SLUGS

// Each array is a permutation of all 9 slugs (soft reorder — nothing dropped).
export const QUEST_LINES: Record<CharacterClass, string[]> = {
  wanderer:  [...MODULE_SLUGS],
  healer:    [K, INTRO, SETUP, STACK, PROMPT, AUDIO, CONTEXT, TOOLS, AGENT],
  operator:  [K, SETUP, PROMPT, STACK, TOOLS, AUDIO, INTRO, CONTEXT, AGENT],
  mage:      [K, INTRO, PROMPT, STACK, CONTEXT, AGENT, TOOLS, AUDIO, SETUP],
  artificer: [K, SETUP, STACK, PROMPT, TOOLS, AUDIO, CONTEXT, AGENT, INTRO],
  sovereign: [K, INTRO, STACK, CONTEXT, AGENT, TOOLS, PROMPT, AUDIO, SETUP],
}
```

- [ ] **Step 4: Run to verify pass** — `cd web && npx vitest run lib/rpg/quest-lines.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/rpg/quest-lines.ts web/lib/rpg/quest-lines.test.ts
git commit -m "feat(rpg): per-class module quest-line orderings"
```

### Task 3: Niche map

**Files:** Create `web/lib/rpg/niche-map.ts`, `web/lib/rpg/niche-map.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/rpg/niche-map.test.ts
import { describe, it, expect } from 'vitest'
import { NICHE_MODULE } from './niche-map'
import { MODULE_SLUGS } from './modules'

describe('NICHE_MODULE', () => {
  it('maps every niche to a real module slug', () => {
    for (const slug of Object.values(NICHE_MODULE)) {
      expect(MODULE_SLUGS).toContain(slug)
    }
  })
  it('covers the F2 niche values', () => {
    for (const n of ['coach','massage','astrology','content','ecommerce','service','tech','other']) {
      expect(NICHE_MODULE[n]).toBeTruthy()
    }
  })
})
```

- [ ] **Step 2: Run to verify fail** — FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// web/lib/rpg/niche-map.ts
// niche (Module F2 value) -> module slug most tied to that niche's first win.
export const NICHE_MODULE: Record<string, string> = {
  coach:     '04-prompt-engineering',
  massage:   '04-prompt-engineering',
  astrology: '04-prompt-engineering',
  service:   '04-prompt-engineering',
  other:     '04-prompt-engineering',
  content:   '06-audio-pipeline',
  ecommerce: '07-tools',
  tech:      '08-agent-engineering',
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/rpg/niche-map.ts web/lib/rpg/niche-map.test.ts
git commit -m "feat(rpg): niche → module mapping"
```

### Task 4: Wanderer fallback pack + skin-pack structural test

**Files:** Create `web/lib/rpg/skins/wanderer.json`, `web/lib/rpg/skin-packs.test.ts`

- [ ] **Step 1: Author `web/lib/rpg/skins/wanderer.json`** (neutral — zone = "Зона N", quest = module-ish)

```json
{
  "skin": "wanderer",
  "zoneNames": {
    "00-kickstart": { "ru": "Развилка 0", "en": "Crossroad 0" },
    "01-introduction": { "ru": "Развилка 1", "en": "Crossroad 1" },
    "02-setup-guide": { "ru": "Развилка 2", "en": "Crossroad 2" },
    "03-stack-selection": { "ru": "Развилка 3", "en": "Crossroad 3" },
    "04-prompt-engineering": { "ru": "Развилка 4", "en": "Crossroad 4" },
    "05-context-memory": { "ru": "Развилка 5", "en": "Crossroad 5" },
    "06-audio-pipeline": { "ru": "Развилка 6", "en": "Crossroad 6" },
    "07-tools": { "ru": "Развилка 7", "en": "Crossroad 7" },
    "08-agent-engineering": { "ru": "Развилка 8", "en": "Crossroad 8" }
  },
  "questTitles": {
    "00-kickstart": { "ru": "Найти свою тропу", "en": "Find your path" },
    "01-introduction": { "ru": "Понять новый мир", "en": "Understand the new world" },
    "02-setup-guide": { "ru": "Собрать снаряжение", "en": "Gather your gear" },
    "03-stack-selection": { "ru": "Выбрать инструменты силы", "en": "Choose your tools" },
    "04-prompt-engineering": { "ru": "Освоить язык команд", "en": "Master the language of commands" },
    "05-context-memory": { "ru": "Удержать память", "en": "Hold the memory" },
    "06-audio-pipeline": { "ru": "Поток данных", "en": "The data stream" },
    "07-tools": { "ru": "Расширить арсенал", "en": "Expand your arsenal" },
    "08-agent-engineering": { "ru": "Собрать своих агентов", "en": "Assemble your agents" }
  }
}
```

- [ ] **Step 2: Write the structural test (validates ANY committed pack)**

```typescript
// web/lib/rpg/skin-packs.test.ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MODULE_SLUGS } from './modules'

const dir = join(__dirname, 'skins')

describe('skin packs', () => {
  const files = readdirSync(dir).filter(f => f.endsWith('.json'))
  it('has at least the wanderer fallback pack', () => {
    expect(files).toContain('wanderer.json')
  })
  for (const f of files) {
    it(`${f} covers all 9 modules with non-empty ru+en`, () => {
      const pack = JSON.parse(readFileSync(join(dir, f), 'utf8'))
      for (const slug of MODULE_SLUGS) {
        for (const field of ['zoneNames', 'questTitles'] as const) {
          expect(pack[field]?.[slug]?.ru, `${f} ${field}.${slug}.ru`).toBeTruthy()
          expect(pack[field]?.[slug]?.en, `${f} ${field}.${slug}.en`).toBeTruthy()
        }
      }
    })
  }
})
```

- [ ] **Step 3: Run to verify pass** — `cd web && npx vitest run lib/rpg/skin-packs.test.ts` → PASS (wanderer pack valid).

- [ ] **Step 4: Commit**

```bash
git add web/lib/rpg/skins/wanderer.json web/lib/rpg/skin-packs.test.ts
git commit -m "feat(rpg): wanderer fallback skin pack + structural test"
```

### Task 5: Gemini skin-pack generation script

**Files:** Create `scripts/gen-skins.mjs`

- [ ] **Step 1: Implement the script**

```javascript
// scripts/gen-skins.mjs
// Dev-time only. Generates web/lib/rpg/skins/<skin>.json via Gemini.
// Usage: GEMINI_API_KEY=... node scripts/gen-skins.mjs [skin1 skin2 ...]
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const KEY = process.env.GEMINI_API_KEY
if (!KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1) }

const MODULE_SLUGS = [
  '00-kickstart','01-introduction','02-setup-guide','03-stack-selection',
  '04-prompt-engineering','05-context-memory','06-audio-pipeline','07-tools','08-agent-engineering',
]

// Read real module titles (RU) for grounding.
function moduleTitles() {
  const out = {}
  for (const slug of MODULE_SLUGS) {
    const meta = JSON.parse(readFileSync(join(ROOT, 'web/content/ru', slug, '_meta.json'), 'utf8'))
    out[slug] = { title: meta.title, description: meta.description }
  }
  return out
}

const SKIN_TONES = {
  'slavic-myth': 'warm Slavic folklore, house-spirit (домовой) metaphors, oral-storytelling, unhurried',
  'dark-fantasy': 'serious, atmospheric, morally complex, earned gravitas',
  'cyber-noir': 'dry, precise, ironic, urban, zero fluff',
  'space-opera': 'epic, expansive, optimistic, mission/crew framing',
  'anime-quest': 'high-energy, training-arc, celebratory, urgent',
  'soviet-heroic': 'dry collective humor, смекалка, pragmatic, anti-glamour',
  'mystic-arcane': 'symbolic, intuitive, arcane/spell metaphors',
}

async function gen(skin) {
  const titles = moduleTitles()
  const prompt = [
    `You localize an AI course into an RPG "world skin". Skin: ${skin}. Tone: ${SKIN_TONES[skin]}.`,
    `For EACH of these 9 modules, invent a short zone name and a quest title in that tone, in BOTH Russian and English.`,
    `Modules (slug → real title): ${JSON.stringify(titles)}`,
    `Russian is primary; keep technical terms (API, prompt, agent, MCP) untranslated. Keep names short (zone ≤ 3 words, quest ≤ 7 words).`,
    `Return STRICT JSON: {"zoneNames":{"<slug>":{"ru","en"}},"questTitles":{"<slug>":{"ru","en"}}} covering all 9 slugs.`,
  ].join('\n')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${KEY}`
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.85 } }) })
  if (!res.ok) throw new Error(`${skin}: gemini ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text)
  const pack = { skin, zoneNames: parsed.zoneNames, questTitles: parsed.questTitles }
  // validate coverage
  for (const slug of MODULE_SLUGS) {
    if (!pack.zoneNames?.[slug]?.ru || !pack.questTitles?.[slug]?.ru) throw new Error(`${skin}: missing ${slug}`)
  }
  writeFileSync(join(ROOT, 'web/lib/rpg/skins', `${skin}.json`), JSON.stringify(pack, null, 2) + '\n')
  console.log(`✓ ${skin}`)
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SKIN_TONES)
for (const s of targets) { try { await gen(s) } catch (e) { console.error('✗', e.message) } }
```

- [ ] **Step 2: Sanity check the script parses (no run needed without key)**

Run: `node --check scripts/gen-skins.mjs` — expected: no output (valid syntax).

- [ ] **Step 3: Commit**

```bash
git add scripts/gen-skins.mjs
git commit -m "chore(rpg): dev-time Gemini skin-pack generator"
```

> Skin packs for the 6 themed skins are generated separately (Task 11 / content step) with a real
> GEMINI_API_KEY and reviewed before commit. The UI degrades to real module titles for any missing pack,
> so the build does not depend on them.

---

## Phase 1 — Quest-log assembly (pure)

### Task 6: buildQuestLog

**Files:** Create `web/lib/rpg/quest-log.ts`, `web/lib/rpg/quest-log.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// web/lib/rpg/quest-log.test.ts
import { describe, it, expect } from 'vitest'
import { buildQuestLog } from './quest-log'
import type { SkinPack } from './types'

const modules = {
  '00-kickstart': { title: 'Kickstart', duration: '25 мин' },
  '01-introduction': { title: 'Введение', duration: '40 мин' },
} as any

const pack: SkinPack = {
  skin: 'slavic-myth',
  zoneNames: { '00-kickstart': { ru: 'Деревня', en: 'Village' } },
  questTitles: { '00-kickstart': { ru: 'Зов тропы', en: 'Call of the path' } },
}

const profile = { char_class: 'healer', world_skin: 'slavic-myth', niche: 'massage', char_level: 1, legendary_title: 'Знахарка' } as any

describe('buildQuestLog', () => {
  it('orders by class, marks first non-completed as current', () => {
    const vm = buildQuestLog(profile, modules, ['00-kickstart'], () => 'completed', pack, 'ru')
    // healer order starts 00,01,...; 00 completed → current is 01
    expect(vm.zones[0].status).toBe('completed')
    const current = vm.zones.find(z => z.status === 'current')
    expect(current?.slug).toBe('01-introduction')
  })
  it('uses skin pack name when present, falls back to module title', () => {
    const vm = buildQuestLog(profile, modules, [], () => 'none', pack, 'ru')
    expect(vm.zones.find(z => z.slug === '00-kickstart')!.questTitle).toBe('Зов тропы')
    expect(vm.zones.find(z => z.slug === '01-introduction')!.questTitle).toBe('Введение') // fallback
  })
  it('flags the niche module', () => {
    const vm = buildQuestLog(profile, modules, [], () => 'none', pack, 'ru')
    expect(vm.zones.find(z => z.slug === '04-prompt-engineering')?.isNiche).toBe(true)
  })
  it('summary counts completed', () => {
    const vm = buildQuestLog(profile, modules, ['00-kickstart'], (s) => s === '00-kickstart' ? 'completed' : 'none', pack, 'ru')
    expect(vm.summary.completedCount).toBe(1)
    expect(vm.summary.total).toBe(9)
  })
})
```

- [ ] **Step 2: Run to verify fail** — FAIL (module not found).

- [ ] **Step 3: Implement**

```typescript
// web/lib/rpg/quest-log.ts
import type { CharacterClass, WorldSkin } from '@/lib/intake/types'
import { MODULE_SLUGS } from './modules'
import { QUEST_LINES } from './quest-lines'
import { NICHE_MODULE } from './niche-map'
import type { SkinPack, QuestLogVM, ZoneVM, QuestStatus } from './types'

type GetState = (slug: string) => 'completed' | 'viewed' | 'none'
type ModuleInfo = Record<string, { title: string; duration: string }>
type Profile = {
  char_class: CharacterClass; world_skin: WorldSkin; niche: string | null
  char_level: number; legendary_title: string
}

export function buildQuestLog(
  profile: Profile, modules: ModuleInfo, completedSlugs: string[],
  getState: GetState, pack: SkinPack | null, locale: 'ru' | 'en',
): QuestLogVM {
  const order = QUEST_LINES[profile.char_class] ?? [...MODULE_SLUGS]
  const nicheSlug = profile.niche ? NICHE_MODULE[profile.niche] : undefined

  const statuses: QuestStatus[] = order.map(slug => getState(slug) === 'completed' ? 'completed' : 'todo')
  const currentIdx = statuses.findIndex(s => s !== 'completed')
  if (currentIdx >= 0) statuses[currentIdx] = 'current'

  const base = locale === 'en' ? '/en' : ''
  const zones: ZoneVM[] = order.map((slug, i) => ({
    slug,
    order: i,
    zoneName: pack?.zoneNames?.[slug]?.[locale] || `Zone ${i}`,
    questTitle: pack?.questTitles?.[slug]?.[locale] || modules[slug]?.title || slug,
    moduleTitle: modules[slug]?.title || slug,
    durationLabel: modules[slug]?.duration || '',
    status: statuses[i],
    isNiche: slug === nicheSlug,
    href: `${base}/lessons/${slug}/`,
  }))

  return {
    zones,
    summary: {
      completedCount: order.filter(s => getState(s) === 'completed').length,
      total: MODULE_SLUGS.length,
      legendaryTitle: profile.legendary_title,
      charClass: profile.char_class,
      skin: profile.world_skin,
      level: profile.char_level,
    },
  }
}
```

- [ ] **Step 4: Run to verify pass** — `cd web && npx vitest run lib/rpg/quest-log.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/rpg/quest-log.ts web/lib/rpg/quest-log.test.ts
git commit -m "feat(rpg): pure quest-log view-model builder"
```

---

## Phase 2 — UI

### Task 7: World map node-position helper + component

**Files:** Create `web/lib/rpg/map-layout.ts`, `web/lib/rpg/map-layout.test.ts`, `web/components/rpg/world-map.tsx`

- [ ] **Step 1: Write failing test for layout math**

```typescript
// web/lib/rpg/map-layout.test.ts
import { describe, it, expect } from 'vitest'
import { nodePositions } from './map-layout'

describe('nodePositions', () => {
  it('returns one point per node within the viewBox', () => {
    const pts = nodePositions(9, 100, 100, 3)
    expect(pts).toHaveLength(9)
    for (const p of pts) { expect(p.x).toBeGreaterThanOrEqual(0); expect(p.x).toBeLessThanOrEqual(100) }
  })
  it('snakes: row 0 left→right, row 1 right→left', () => {
    const pts = nodePositions(6, 90, 90, 3) // 2 rows of 3
    expect(pts[0].x).toBeLessThan(pts[2].x)   // row 0 ascending
    expect(pts[3].x).toBeGreaterThan(pts[5].x) // row 1 descending
  })
})
```

- [ ] **Step 2: Run to verify fail** — FAIL.

- [ ] **Step 3: Implement layout helper**

```typescript
// web/lib/rpg/map-layout.ts
export interface Pt { x: number; y: number }

// Boustrophedon (snake) layout: nodes fill rows L→R, R→L, L→R… within w×h, `cols` per row.
export function nodePositions(n: number, w: number, h: number, cols: number): Pt[] {
  const rows = Math.ceil(n / cols)
  const padX = w * 0.12, padY = h * 0.12
  const usableW = w - padX * 2, usableH = h - padY * 2
  const stepX = cols > 1 ? usableW / (cols - 1) : 0
  const stepY = rows > 1 ? usableH / (rows - 1) : 0
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / cols)
    let col = i % cols
    if (row % 2 === 1) col = cols - 1 - col // reverse on odd rows
    pts.push({ x: padX + col * stepX, y: padY + row * stepY })
  }
  return pts
}

// Build an SVG path string snaking through points with smooth quadratic curves.
export function snakePath(pts: Pt[]): string {
  if (pts.length === 0) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1], cur = pts[i]
    const mx = (prev.x + cur.x) / 2, my = (prev.y + cur.y) / 2
    d += ` Q ${prev.x} ${prev.y} ${mx} ${my} T ${cur.x} ${cur.y}`
  }
  return d
}
```

- [ ] **Step 4: Run to verify pass** — PASS.

- [ ] **Step 5: Implement `web/components/rpg/world-map.tsx`**

```tsx
'use client'
import { nodePositions, snakePath } from '@/lib/rpg/map-layout'
import type { ZoneVM } from '@/lib/rpg/types'

const VB = 100
const COLS = 3

export function WorldMap({ zones, accent, glyph }: { zones: ZoneVM[]; accent: string; glyph: string }) {
  const pts = nodePositions(zones.length, VB, VB, COLS)
  const path = snakePath(pts)
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        @keyframes wm-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .wm-cur { animation: wm-pulse 1.8s infinite; }
        @media (prefers-reduced-motion: reduce){ .wm-cur{ animation:none } }
      `}</style>
      <svg viewBox={`0 0 ${VB} ${VB}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label="World map">
        <path d={path} fill="none" stroke="var(--border-color)" strokeWidth={1.2} strokeDasharray="2 2" />
        {zones.map((z, i) => {
          const p = pts[i]
          const done = z.status === 'completed', cur = z.status === 'current'
          const fill = done ? accent : cur ? accent : 'var(--bg-surface)'
          const opacity = z.status === 'todo' ? 0.5 : 1
          return (
            <g key={z.slug} className={cur ? 'wm-cur' : undefined} opacity={opacity}
               style={{ cursor: 'pointer' }} onClick={() => {
                 document.getElementById(`quest-${z.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
               }}>
              <circle cx={p.x} cy={p.y} r={6} fill={fill}
                      stroke={accent} strokeWidth={cur ? 1.5 : done ? 1 : 0.6} />
              <text x={p.x} y={p.y + 2.2} textAnchor="middle" fontSize={5}>{glyph}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

- [ ] **Step 6: Typecheck + commit**

Run: `cd web && npx tsc --noEmit` → PASS.
```bash
git add web/lib/rpg/map-layout.ts web/lib/rpg/map-layout.test.ts web/components/rpg/world-map.tsx
git commit -m "feat(rpg): winding SVG world map + layout math"
```

### Task 8: CharacterStrip + QuestFeed components

**Files:** Create `web/components/rpg/character-strip.tsx`, `web/components/rpg/quest-feed.tsx`

- [ ] **Step 1: Implement `web/components/rpg/character-strip.tsx`**

```tsx
'use client'
import Link from 'next/link'
import type { QuestLogVM } from '@/lib/rpg/types'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import type { Locale } from '@/lib/intake/types'

export function CharacterStrip({ summary, accent, locale }: { summary: QuestLogVM['summary']; accent: string; locale: Locale }) {
  const meta = SKINS_META[summary.skin]
  const lvl = locale === 'en' ? 'Level' : 'Уровень'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem',
      padding: '1.1rem 1.3rem', border: '1px solid var(--border-color)', borderRadius: 12,
      background: `linear-gradient(135deg, ${accent}14, transparent)` }}>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.64rem', letterSpacing: '.12em', textTransform: 'uppercase', color: accent, marginBottom: '.35rem' }}>
          {meta.glyph} {meta.displayName[locale]} · {summary.charClass} · {lvl} {summary.level}
        </div>
        <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.1 }}>{summary.legendaryTitle}</div>
        <Link href={locale === 'en' ? '/en/character/' : '/character/'} style={{ fontFamily: 'var(--font-mono)', fontSize: '.62rem', color: accent }}>⬡ {locale === 'en' ? 'Character sheet →' : 'Лист персонажа →'}</Link>
      </div>
      <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
        <b style={{ color: accent, fontSize: '1.3rem', display: 'block' }}>{summary.completedCount}/{summary.total}</b>
        {locale === 'en' ? 'quests done' : 'квестов'}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Implement `web/components/rpg/quest-feed.tsx`**

```tsx
'use client'
import Link from 'next/link'
import type { ZoneVM } from '@/lib/rpg/types'
import type { Locale } from '@/lib/intake/types'

export function QuestFeed({ zones, accent, locale }: { zones: ZoneVM[]; accent: string; locale: Locale }) {
  const cont = locale === 'en' ? 'Continue →' : 'Продолжить →'
  const nicheLabel = locale === 'en' ? 'niche' : 'ниша'
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden', marginTop: '1.25rem' }}>
      {zones.map(z => {
        const done = z.status === 'completed', cur = z.status === 'current'
        return (
          <div key={z.slug} id={`quest-${z.slug}`} style={{
            padding: cur ? '1rem 1.3rem' : '.85rem 1.3rem', borderBottom: '1px solid var(--border-color)',
            background: cur ? `${accent}10` : 'transparent', display: 'flex', gap: '.85rem', alignItems: 'center' }}>
            <span aria-hidden style={{ width: 24, height: 24, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: '.7rem',
              background: done ? `${accent}30` : cur ? accent : 'transparent',
              color: done ? accent : cur ? '#000' : 'var(--text-secondary)',
              border: z.status === 'todo' ? '1px solid var(--border-color)' : 'none' }}>
              {done ? '✓' : cur ? '▸' : z.order + 1}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Link href={z.href} style={{ color: z.status === 'todo' ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 600, fontSize: '.95rem', textDecoration: 'none' }}>
                {z.questTitle}{z.isNiche && <span style={{ marginLeft: '.5rem', fontFamily: 'var(--font-mono)', fontSize: '.55rem', textTransform: 'uppercase', letterSpacing: '.1em', color: '#000', background: accent, borderRadius: 3, padding: '1px 6px' }}>{nicheLabel}</span>}
              </Link>
              <div style={{ fontSize: '.72rem', color: 'var(--text-secondary)', marginTop: '.15rem' }}>{z.moduleTitle}{z.durationLabel ? ` · ${z.durationLabel}` : ''}</div>
              {cur && <Link href={z.href} style={{ display: 'inline-block', marginTop: '.6rem', background: accent, color: '#000', fontWeight: 900, fontFamily: 'var(--font-mono)', fontSize: '.72rem', textTransform: 'uppercase', letterSpacing: '.06em', padding: '.45rem 1rem', borderRadius: 6, textDecoration: 'none' }}>{cont}</Link>}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `cd web && npx tsc --noEmit` → PASS.
```bash
git add web/components/rpg/character-strip.tsx web/components/rpg/quest-feed.tsx
git commit -m "feat(rpg): character strip + quest feed components"
```

### Task 9: Rewrite dashboard-client into the Quest Log

**Files:** Modify `web/app/dashboard/dashboard-client.tsx` (full rewrite); read `web/app/dashboard/page.tsx` first to keep its props contract.

- [ ] **Step 1: Inspect the page wrapper**

Run: `cat web/app/dashboard/page.tsx` and the top of `web/app/dashboard/dashboard-client.tsx` to confirm what props are passed (it currently passes `lessons`). The rewrite needs module info `{slug:{title,duration}}` — derive it in `page.tsx` from `getAllModules('ru')`/`('en')` or from the existing `lessons` prop. Keep `page.tsx` server-only; pass a `modules` map and `locale`.

- [ ] **Step 2: Update `web/app/dashboard/page.tsx` to pass modules + locale**

```tsx
// web/app/dashboard/page.tsx
import { getAllModules } from '@/lib/content'
import { DashboardClient } from './dashboard-client'

export default function Page() {
  const modules = Object.fromEntries(getAllModules('ru').map(m => [m.slug, { title: m.title, duration: m.duration }]))
  return <DashboardClient modules={modules} locale="ru" />
}
```

(If an `/en/dashboard` route exists, mirror with `'en'`; if not, this RU route is the dashboard. Confirm during Step 1 and adjust.)

- [ ] **Step 3: Rewrite `web/app/dashboard/dashboard-client.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import { buildQuestLog } from '@/lib/rpg/quest-log'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { CharacterStrip } from '@/components/rpg/character-strip'
import { WorldMap } from '@/components/rpg/world-map'
import { QuestFeed } from '@/components/rpg/quest-feed'
import wandererPack from '@/lib/rpg/skins/wanderer.json'
import type { SkinPack } from '@/lib/rpg/types'
import type { Locale } from '@/lib/intake/types'

interface Props { modules: Record<string, { title: string; duration: string }>; locale: Locale }

export function DashboardClient({ modules, locale }: Props) {
  const router = useRouter()
  const { getState } = useProgress()
  const [profile, setProfile] = useState<any>(null)
  const [pack, setPack] = useState<SkinPack | null>(null)

  useEffect(() => {
    fetch('/api/intake/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(async p => {
        if (!p || p.status !== 'completed') { router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'); return }
        setProfile(p)
        try {
          const mod = await import(`@/lib/rpg/skins/${p.world_skin}.json`)
          setPack(mod.default as SkinPack)
        } catch { setPack(wandererPack as SkinPack) }
      })
      .catch(() => router.replace(locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'))
  }, [router, locale])

  if (!profile) return (<><Nav locale={locale} /><main style={{ maxWidth: 660, margin: '0 auto', padding: '4rem 1.5rem' }}><p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>…</p></main></>)

  const accent = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.accent ?? 'var(--text-accent)'
  const glyph = SKINS_META[profile.world_skin as keyof typeof SKINS_META]?.glyph ?? '⬡'
  const completed = Object.keys(modules).filter(s => getState(s) === 'completed')
  const vm = buildQuestLog(profile, modules, completed, getState as any, pack, locale)

  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: 660, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        <CharacterStrip summary={vm.summary} accent={accent} locale={locale} />
        <div style={{ margin: '1.5rem 0' }}><WorldMap zones={vm.zones} accent={accent} glyph={glyph} /></div>
        <QuestFeed zones={vm.zones} accent={accent} locale={locale} />
      </main>
    </>
  )
}
```

- [ ] **Step 4: Build**

Run: `cd web && npm run build` — expected success; `/dashboard` present. Resolve any JSON-import or type errors (the JSON dynamic import uses the committed packs; the static import of `wanderer.json` must resolve — ensure `resolveJsonModule` is on in tsconfig, which Next enables by default).

- [ ] **Step 5: Commit**

```bash
git add web/app/dashboard/page.tsx web/app/dashboard/dashboard-client.tsx
git commit -m "feat(rpg): quest log replaces dashboard (character strip + map + feed)"
```

---

## Phase 3 — Content generation & verification

### Task 10: Generate themed skin packs (content step)

**Files:** Create `web/lib/rpg/skins/{slavic-myth,dark-fantasy,cyber-noir,space-opera,anime-quest,soviet-heroic,mystic-arcane}.json`

- [ ] **Step 1: Run the generator with a real key** (controller/human step — requires `GEMINI_API_KEY` in local env)

Run (from repo root): `GEMINI_API_KEY=<key> node scripts/gen-skins.mjs`
Expected: `✓ slavic-myth` … one line per skin; JSON files written under `web/lib/rpg/skins/`.

- [ ] **Step 2: Review each pack**

Open each generated `*.json`: verify Cyrillic is intact, tone matches the skin, names are short, all 9 slugs present RU+EN. Fix wording by hand where weak. (The structural test from Task 4 will fail the build if any slug is missing.)

- [ ] **Step 3: Run the structural test over all packs**

Run: `cd web && npx vitest run lib/rpg/skin-packs.test.ts` — expected PASS for every committed pack.

- [ ] **Step 4: Commit**

```bash
git add web/lib/rpg/skins/*.json
git commit -m "content(rpg): themed world-skin packs (Gemini-generated, reviewed)"
```

> If a key is unavailable now, skip this task — the UI falls back to real module titles per skin and
> the feature still ships. Packs can be added later without code changes.

### Task 11: Full verify + e2e smoke

- [ ] **Step 1: Full test + build**

Run: `cd web && CI=true npx vitest run && npm run build` — expected: all tests pass; build succeeds.

- [ ] **Step 2: Local smoke**

Run `npm run dev` (web). With a completed intake profile (or temporarily stub `/api/intake/me`), open `/dashboard`: confirm character strip, winding map (current node pulses, click scrolls to quest), and feed render; current quest shows Continue CTA; all rows link to `/lessons/<slug>/`. Confirm a no-profile session redirects to `/quest-intake/`.

- [ ] **Step 3: Update program tracker**

In `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`: set SP2a status to ✅ shipped (or "code complete, packs pending") and update Current Position. Commit.

---

## Self-Review notes

- **Spec coverage:** §2 architecture → Tasks 6,9; §3 content pipeline → Tasks 5,10; §4 quest-lines → Task 2; §5 buildQuestLog → Task 6; §6 UI (CharacterStrip/WorldMap/QuestFeed/dashboard) → Tasks 7,8,9; §7 logic/edge/testing → Tasks 6 (status/current/niche/fallback), 9 (no-profile redirect, missing-pack fallback), 4 (pack structural test), 2 (permutation). All covered.
- **Open items from spec §9:** quest-lines arrays (Task 2), niche-map (Task 3), skins-meta (Task 1), gen-skins prompt (Task 5), WorldMap SVG math (Task 7). All covered.
- **Type consistency:** `buildQuestLog(profile, modules, completedSlugs, getState, pack, locale)` signature matches its test (Task 6) and its caller (Task 9). `ZoneVM`/`QuestLogVM`/`SkinPack`/`SkinMeta` defined in Task 1, used identically in 6/7/8/9. `getState` returns `'completed'|'viewed'|'none'` (matches existing provider).
- **Deploy note:** implement on a feature branch (CI deploys `main`); merge only after verify. The `/dashboard` rewrite changes the authed landing for all users — verify before merge.
