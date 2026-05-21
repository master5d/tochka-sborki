# SP2d Themed Unit Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap each neutral lesson unit with World-Skin-voiced intro/outro and one contextual mentor hint, driven by static skin packs, leaving the 4-phase lesson core untouched.

**Architecture:** Extend `SkinPack` with an optional `units` map (`"<module>/<unit>"` → `{intro,mentorHint,outro}`) and `SkinMeta` with an optional `mentor` persona. `UnitWizard` (already a client component) fetches the learner's `world_skin`, dynamically imports the pack, and renders framing around the existing MDX children. A pure `getUnitFraming` helper is unit-tested; framing degrades gracefully to nothing when absent. Bulk framing text is generated dev-time by an extended `gen-skins.mjs` (per-module Gemini batches) and run by the owner.

**Tech Stack:** Next.js 16 (static export, client components), TypeScript, Vitest, Google Gemini (dev-time script).

**Spec:** `docs/superpowers/specs/2026-05-21-themed-unit-framing-design.md`

**Test commands:** `cd web && npx vitest run` and `cd web && npx tsc --noEmit`; build check `cd web && npx next build`.

**Key facts:**
- 38 units across 9 modules; each `web/content/<locale>/<module>/<unit>.mdx` has frontmatter `title:`.
- `UnitWizard` props already include `moduleSlug`, `unitSlug`, `locale`; phases are `currentStep` 0..3 (Activation, Reflection, Concept, Practice) with a `done` state.
- Skin-resolution pattern (from `dashboard-client.tsx`): fetch `/api/intake/me` → `world_skin` → `await import('@/lib/rpg/skins/${world_skin}.json')`.
- `units` and `mentor` are **optional** in the types so the codebase stays green before generation and wanderer stays neutral.

---

### Task 1: Extend the skin types

**Files:**
- Modify: `web/lib/rpg/types.ts`

- [ ] **Step 1: Add `UnitFraming`, `units?` on `SkinPack`, `mentor?` on `SkinMeta`**

In `web/lib/rpg/types.ts`, add the `UnitFraming` interface (after the `Bi` type) and extend the two interfaces. The final relevant section must read:

```ts
export type Bi = { ru: string; en: string }

export interface UnitFraming {
  intro: Bi        // shown at Activation (currentStep 0)
  mentorHint: Bi   // shown at Practice (currentStep 3)
  outro: Bi        // shown in the done state
}

export interface SkinPack {
  skin: WorldSkin
  zoneNames: Record<string, Bi>   // slug -> zone name
  questTitles: Record<string, Bi> // slug -> quest title
  units?: Record<string, UnitFraming> // "<moduleSlug>/<unitSlug>" -> framing
}

export interface SkinMeta {
  skin: WorldSkin
  accent: string                  // hex
  glyph: string                   // emoji
  displayName: Bi
  mentor?: { name: Bi; glyph: string } // named persona for hint box
}
```

Leave `QuestStatus`, `ZoneVM`, `QuestLogVM`, and the re-exports unchanged.

- [ ] **Step 2: Verify it typechecks**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0 (optional fields don't break existing packs/usages).

- [ ] **Step 3: Commit**

```bash
git add web/lib/rpg/types.ts
git commit -m "feat(web): SkinPack.units + SkinMeta.mentor types for unit framing"
```

---

### Task 2: Mentor personas in SKINS_META

**Files:**
- Modify: `web/lib/rpg/skins-meta.ts`
- Test: `web/lib/rpg/skins-meta.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/lib/rpg/skins-meta.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { SKINS_META } from './skins-meta'

describe('SKINS_META mentor personas', () => {
  it('every non-wanderer skin has a named mentor with a glyph', () => {
    for (const [skin, meta] of Object.entries(SKINS_META)) {
      if (skin === 'wanderer') continue
      expect(meta.mentor?.name.ru.length ?? 0).toBeGreaterThan(0)
      expect(meta.mentor?.name.en.length ?? 0).toBeGreaterThan(0)
      expect(meta.mentor?.glyph.length ?? 0).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run lib/rpg/skins-meta.test.ts`
Expected: FAIL (mentor is undefined on every entry).

- [ ] **Step 3: Add `mentor` to every entry**

Replace the body of `SKINS_META` in `web/lib/rpg/skins-meta.ts` with (keep the existing `import` line and the `export const SKINS_META: Record<WorldSkin, SkinMeta> = {` opener):

```ts
  'slavic-myth':   { skin: 'slavic-myth',   accent: '#7bd88f', glyph: '🌿', displayName: { ru: 'Славянский Миф', en: 'Slavic Myth' }, mentor: { name: { ru: 'Домовой', en: 'House-Spirit' }, glyph: '🪆' } },
  'dark-fantasy':  { skin: 'dark-fantasy',  accent: '#ff5577', glyph: '🏰', displayName: { ru: 'Тёмное Фэнтези', en: 'Dark Fantasy' }, mentor: { name: { ru: 'Хранитель', en: 'The Keeper' }, glyph: '🗝️' } },
  'cyber-noir':    { skin: 'cyber-noir',    accent: '#00e5ff', glyph: '🕶️', displayName: { ru: 'Кибер-Нуар', en: 'Cyber Noir' }, mentor: { name: { ru: 'Фиксер', en: 'The Fixer' }, glyph: '🕶️' } },
  'space-opera':   { skin: 'space-opera',   accent: '#4d8cff', glyph: '🚀', displayName: { ru: 'Космическая Опера', en: 'Space Opera' }, mentor: { name: { ru: 'Бортовой ИИ', en: 'Ship AI' }, glyph: '🛰️' } },
  'anime-quest':   { skin: 'anime-quest',   accent: '#ff7ace', glyph: '🎌', displayName: { ru: 'Аниме-Квест', en: 'Anime Quest' }, mentor: { name: { ru: 'Сэнсэй', en: 'Sensei' }, glyph: '🥋' } },
  'soviet-heroic': { skin: 'soviet-heroic', accent: '#e0b020', glyph: '🏛', displayName: { ru: 'Советский Героизм', en: 'Soviet Heroic' }, mentor: { name: { ru: 'Бригадир', en: 'The Foreman' }, glyph: '🔧' } },
  'mystic-arcane': { skin: 'mystic-arcane', accent: '#b388ff', glyph: '🔮', displayName: { ru: 'Мистическая Аркана', en: 'Mystic Arcane' }, mentor: { name: { ru: 'Оракул', en: 'The Oracle' }, glyph: '🔮' } },
  'wanderer':      { skin: 'wanderer',      accent: '#00ff88', glyph: '🌀', displayName: { ru: 'Странник', en: 'Wanderer' }, mentor: { name: { ru: 'Проводник', en: 'Guide' }, glyph: '🧭' } },
```

Preserve all Cyrillic and emoji exactly. Use the Edit tool.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/rpg/skins-meta.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/rpg/skins-meta.ts web/lib/rpg/skins-meta.test.ts
git commit -m "feat(web): named mentor persona per skin in SKINS_META"
```

---

### Task 3: `getUnitFraming` helper

**Files:**
- Create: `web/lib/rpg/unit-framing.ts`
- Test: `web/lib/rpg/unit-framing.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/lib/rpg/unit-framing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getUnitFraming } from './unit-framing'
import type { SkinPack } from './types'

const pack = {
  skin: 'slavic-myth', zoneNames: {}, questTitles: {},
  units: {
    '04-prompt-engineering/u2-spec-formula': {
      intro: { ru: 'и', en: 'i' }, mentorHint: { ru: 'м', en: 'm' }, outro: { ru: 'о', en: 'o' },
    },
  },
} as unknown as SkinPack

describe('getUnitFraming', () => {
  it('returns the entry for a present key', () => {
    expect(getUnitFraming(pack, '04-prompt-engineering', 'u2-spec-formula')?.intro.ru).toBe('и')
  })
  it('returns null for a missing key', () => {
    expect(getUnitFraming(pack, '04-prompt-engineering', 'u9-nope')).toBeNull()
  })
  it('returns null when pack is null', () => {
    expect(getUnitFraming(null, 'm', 'u')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd web && npx vitest run lib/rpg/unit-framing.test.ts`
Expected: FAIL — cannot find module `./unit-framing`.

- [ ] **Step 3: Write the implementation**

Create `web/lib/rpg/unit-framing.ts`:

```ts
import type { SkinPack, UnitFraming } from './types'

export function getUnitFraming(
  pack: SkinPack | null,
  moduleSlug: string,
  unitSlug: string,
): UnitFraming | null {
  return pack?.units?.[`${moduleSlug}/${unitSlug}`] ?? null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd web && npx vitest run lib/rpg/unit-framing.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add web/lib/rpg/unit-framing.ts web/lib/rpg/unit-framing.test.ts
git commit -m "feat(web): getUnitFraming pure helper"
```

---

### Task 4: Pack coverage / shape test

**Files:**
- Test: `web/lib/rpg/skins-coverage.test.ts`

This test validates generated packs without requiring generation to have happened yet: packs with no `units` are skipped; packs with `units` must cover every real unit key with non-empty RU text. It reads the actual content tree so it stays correct if units change.

- [ ] **Step 1: Write the test**

Create `web/lib/rpg/skins-coverage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))      // web/lib/rpg
const contentDir = join(here, '..', '..', 'content', 'ru') // web/content/ru
const skinsDir = join(here, 'skins')                        // web/lib/rpg/skins

const MODULE_SLUGS = [
  '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
  '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools', '08-agent-engineering',
]

function expectedKeys(): string[] {
  const keys: string[] = []
  for (const m of MODULE_SLUGS) {
    const files = readdirSync(join(contentDir, m)).filter(f => /^u\d.*\.mdx$/.test(f))
    for (const f of files) keys.push(`${m}/${f.replace(/\.mdx$/, '')}`)
  }
  return keys
}

describe('skin pack unit-framing coverage', () => {
  const keys = expectedKeys()
  const files = readdirSync(skinsDir).filter(f => f.endsWith('.json'))

  it('discovers 38 unit keys', () => {
    expect(keys.length).toBe(38)
  })

  for (const file of files) {
    const pack = JSON.parse(readFileSync(join(skinsDir, file), 'utf8'))
    const units = pack.units ?? {}
    if (Object.keys(units).length === 0) {
      it(`${file}: no units yet (coverage skipped until generated)`, () => {
        expect(Object.keys(units).length).toBe(0)
      })
      continue
    }
    it(`${file}: covers all ${keys.length} unit keys with well-formed framing`, () => {
      for (const k of keys) {
        expect(units[k]?.intro?.ru?.length ?? 0).toBeGreaterThan(0)
        expect(units[k]?.mentorHint?.ru?.length ?? 0).toBeGreaterThan(0)
        expect(units[k]?.outro?.ru?.length ?? 0).toBeGreaterThan(0)
      }
      expect(Object.keys(units).length).toBe(keys.length)
    })
  }
})
```

- [ ] **Step 2: Run the test**

Run: `cd web && npx vitest run lib/rpg/skins-coverage.test.ts`
Expected: PASS — "discovers 38 unit keys" passes, and every existing pack hits the "no units yet" branch (none have `units` before generation).

> If "discovers 38 unit keys" reports a different number, the content tree changed; STOP and report — the spec's 38-unit assumption needs revisiting before generation.

- [ ] **Step 3: Commit**

```bash
git add web/lib/rpg/skins-coverage.test.ts
git commit -m "test(web): skin pack unit-framing coverage guard"
```

---

### Task 5: Render framing in UnitWizard

**Files:**
- Modify: `web/components/unit-wizard.tsx`

The wizard gains skin resolution and three render points. The 4-step flow, progress bar, and completion logic are unchanged.

- [ ] **Step 1: Update imports**

In `web/components/unit-wizard.tsx`, change the React import and add three module imports. The top imports become:

```ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UnitWizardContext } from './unit-wizard-context'
import { useUnitProgress } from '@/lib/unit-progress'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import { SKINS_META } from '@/lib/rpg/skins-meta'
import { getUnitFraming } from '@/lib/rpg/unit-framing'
import type { SkinPack, WorldSkin } from '@/lib/rpg/types'
```

- [ ] **Step 2: Add skin resolution state**

Immediately after the line `const topRef = useRef<HTMLDivElement>(null)`, insert:

```ts
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

  const framing = getUnitFraming(pack, moduleSlug, unitSlug)
  const mentor = skin ? SKINS_META[skin]?.mentor : undefined
```

- [ ] **Step 3: Render the intro (Activation only)**

Find the breadcrumb block that ends with:

```tsx
        {moduleTitle} · {t.unit(unitIndex + 1, totalUnits)}
      </div>
```

Immediately after that closing `</div>`, insert:

```tsx
      {currentStep === 0 && framing?.intro && (
        <div style={{
          borderLeft: '3px solid var(--text-accent)',
          background: 'var(--bg-surface)',
          borderRadius: 8,
          padding: '0.9rem 1.1rem',
          margin: '0 0 1.5rem',
          fontStyle: 'italic',
          color: 'var(--text-primary)',
        }}>
          {framing.intro[locale]}
        </div>
      )}
```

- [ ] **Step 4: Render the mentor hint (Practice only)**

Find the phase content block:

```tsx
      {/* Phase content (controlled by UnitWizardContext) */}
      <div style={{ minHeight: '40vh' }}>
        {children}
      </div>
```

Replace it with:

```tsx
      {/* Phase content (controlled by UnitWizardContext) */}
      <div style={{ minHeight: '40vh' }}>
        {children}
        {currentStep === 3 && framing?.mentorHint && mentor && (
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
      </div>
```

- [ ] **Step 5: Render the outro (done state)**

Find the actions block opener:

```tsx
      {/* Actions */}
      <div style={{
        marginTop: '2.5rem',
```

Immediately BEFORE the `{/* Actions */}` comment, insert:

```tsx
      {done && framing?.outro && (
        <div style={{
          borderLeft: '3px solid var(--text-accent)',
          background: 'var(--bg-surface)',
          borderRadius: 8,
          padding: '0.9rem 1.1rem',
          marginTop: '2rem',
          fontStyle: 'italic',
          color: 'var(--text-primary)',
        }}>
          {framing.outro[locale]}
        </div>
      )}
```

- [ ] **Step 6: Verify typecheck and build**

Run: `cd web && npx tsc --noEmit`
Expected: exit 0.

Run: `cd web && npx next build`
Expected: build succeeds; lesson/unit routes still generate. (Framing renders nothing at runtime until packs have `units` — that's expected; this verifies no build/type regressions.)

- [ ] **Step 7: Commit**

```bash
git add web/components/unit-wizard.tsx
git commit -m "feat(web): render themed intro/mentor-hint/outro in UnitWizard"
```

---

### Task 6: Extend gen-skins.mjs with a `--units` pass

**Files:**
- Modify: `scripts/gen-skins.mjs`

Adds a per-module generation pass that fills `pack.units` without touching `zoneNames`/`questTitles`. Run by the owner with their Gemini key; not executed in CI.

- [ ] **Step 1: Add the units generator**

In `scripts/gen-skins.mjs`, add `readdirSync` to the `node:fs` import so the line reads:

```js
import { writeFileSync, readFileSync, readdirSync } from 'node:fs'
```

Then, immediately above the final dispatch block (`const targets = process.argv.slice(2)...`), insert:

```js
function unitList(module) {
  const dir = join(ROOT, 'web/content/ru', module)
  return readdirSync(dir)
    .filter(f => /^u\d.*\.mdx$/.test(f))
    .sort()
    .map(f => {
      const slug = f.replace(/\.mdx$/, '')
      const raw = readFileSync(join(dir, f), 'utf8')
      const m = raw.match(/title:\s*"([^"]+)"/)
      return { slug, title: m ? m[1] : slug }
    })
}

function expectedUnitCount() {
  return MODULE_SLUGS.reduce((n, m) => n + unitList(m).length, 0)
}

async function genUnitsForModule(skin, module) {
  const units = unitList(module)
  const prompt = [
    `You theme an AI course into the "${skin}" world skin. Tone: ${SKIN_TONES[skin]}.`,
    `Module: ${module}. For EACH unit below write themed framing in BOTH Russian and English:`,
    `- intro: 1-2 sentences setting the scene before the lesson, in the skin's voice.`,
    `- mentorHint: ONE short encouraging line from the skin's mentor character, referencing the unit's topic.`,
    `- outro: 1-2 sentences celebrating completion and bridging onward.`,
    `Units (slug -> real title): ${JSON.stringify(units)}`,
    `Russian is primary; keep technical terms (API, prompt, agent, MCP) untranslated. Keep each field concise.`,
    `Return STRICT JSON: {"<slug>":{"intro":{"ru","en"},"mentorHint":{"ru","en"},"outro":{"ru","en"}}} covering every unit slug.`,
  ].join('\n')
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${KEY}`
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.85 } }),
  })
  if (!res.ok) throw new Error(`${skin}/${module}: gemini ${res.status}`)
  const data = await res.json()
  const parsed = JSON.parse(data.candidates[0].content.parts[0].text)
  const out = {}
  for (const u of units) {
    const f = parsed[u.slug]
    if (!f?.intro?.ru || !f?.mentorHint?.ru || !f?.outro?.ru) throw new Error(`${skin}/${module}: missing ${u.slug}`)
    out[`${module}/${u.slug}`] = { intro: f.intro, mentorHint: f.mentorHint, outro: f.outro }
  }
  return out
}

async function genUnits(skin) {
  const packPath = join(ROOT, 'web/lib/rpg/skins', `${skin}.json`)
  const pack = JSON.parse(readFileSync(packPath, 'utf8'))
  pack.units = pack.units ?? {}
  for (const module of MODULE_SLUGS) {
    Object.assign(pack.units, await genUnitsForModule(skin, module))
    console.log(`  ✓ ${skin}/${module}`)
  }
  const expected = expectedUnitCount()
  if (Object.keys(pack.units).length !== expected) {
    throw new Error(`${skin}: expected ${expected} unit keys, got ${Object.keys(pack.units).length}`)
  }
  writeFileSync(packPath, JSON.stringify(pack, null, 2) + '\n')
  console.log(`✓ ${skin} units`)
}
```

- [ ] **Step 2: Replace the dispatch block to support `--units`**

Replace the final two lines:

```js
const targets = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SKIN_TONES)
for (const s of targets) { try { await gen(s) } catch (e) { console.error('✗', e.message) } }
```

with:

```js
const args = process.argv.slice(2)
const unitsMode = args.includes('--units')
const named = args.filter(a => a !== '--units')
const targets = named.length ? named : Object.keys(SKIN_TONES)
for (const s of targets) {
  try { await (unitsMode ? genUnits(s) : gen(s)) }
  catch (e) { console.error('✗', e.message) }
}
```

- [ ] **Step 3: Syntax-check the script**

Run: `node --check scripts/gen-skins.mjs`
Expected: no output, exit 0 (valid syntax). Do NOT run the generator here (it needs the owner's `GEMINI_API_KEY` and spends tokens).

- [ ] **Step 4: Commit**

```bash
git add scripts/gen-skins.mjs
git commit -m "feat(scripts): gen-skins --units pass for themed unit framing"
```

---

### Task 7: Ship — merge, generate, deploy

**Files:**
- Modify: `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md` (tracker entry)

- [ ] **Step 1: Run the full web suite + build once more**

Run: `cd web && npx vitest run && npx tsc --noEmit && npx next build`
Expected: all tests pass (including coverage guard in "no units yet" mode), tsc exit 0, build succeeds.

- [ ] **Step 2: Update the program tracker**

In `docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`, append this entry to the end of the **Current position** blockquote:

```markdown
>
> **2026-05-21 — SP2d Themed Unit Framing SHIPPED (code).** Extends the World Skin engine: `SkinPack`
> gains optional `units` (`<module>/<unit>` → intro/mentorHint/outro), `SkinMeta` gains a named `mentor`
> persona. `UnitWizard` resolves the learner's skin and renders themed intro (Activation), mentor hint
> (Practice), and outro (done) around the neutral 4-phase core; graceful no-op when framing is absent.
> Pure `getUnitFraming` + coverage guard tested. `gen-skins.mjs --units` generates per-module framing.
> **PENDING (owner): run `GEMINI_API_KEY=... node scripts/gen-skins.mjs --units`** to populate the 7
> themed packs, then controller spot-reviews + commits. Until then framing is neutral. Branch retained.
```

- [ ] **Step 3: Commit and merge to main**

```bash
git add docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md
git commit -m "docs: mark SP2d Themed Unit Framing shipped (code; packs pending generation)"
git checkout main
git merge --no-ff rpg-sp2d-unit-framing -m "Merge: SP2d Themed Unit Framing — themed intro/outro + mentor hint per unit"
GIT_TERMINAL_PROMPT=0 git push origin main
```

- [ ] **Step 4: Verify CI**

Run: `gh run list --branch main --limit 1`
Expected: latest run completes `success`.

- [ ] **Step 5: Owner generation step (manual, post-merge)**

The 7 themed packs need their `units` populated. The owner runs, from the repo root with their key in env:

```
GEMINI_API_KEY=... node scripts/gen-skins.mjs --units
```

This writes `units` into all 7 themed `web/lib/rpg/skins/<skin>.json` (wanderer left neutral). The controller then spot-reviews tone + Cyrillic + technical-term integrity, runs `cd web && npx vitest run lib/rpg/skins-coverage.test.ts` (now the coverage branch runs and must pass 38/38 for each generated pack), commits the packs, and pushes — CI redeploys. Until then, framing is a graceful no-op (units absent → neutral lesson).

---

## Notes for the executor

- `units` and `mentor` are intentionally optional — the codebase and build stay green before generation, and wanderer stays neutral.
- Do NOT run `gen-skins.mjs` during implementation; generation is the owner's post-merge step (Task 7 Step 5).
- The coverage test (Task 4) is designed to pass both before generation (skip branch) and after (38/38 branch). Don't weaken it.
- Framing is additive markup in `UnitWizard`; never alter the 4-phase navigation or completion logic.
