# "You are here" Locator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the learner's current position on the World Map with an explicit ✦ "you are here" star marker on the current module node plus a bilingual text caption below the map.

**Architecture:** A pure `lib/rpg/locator.ts buildLocator(zones, locale)` derives the current-position view-model + caption from the existing `ZoneVM[]` (one already carries `status:'current'`). `components/rpg/world-map.tsx` gains a `locale` prop, renders the ✦ on the current node and the caption under the SVG. `profile-client.tsx` passes `locale`.

**Tech Stack:** Next.js 16 (static export), React client component, TypeScript, vitest `env=node` (pure helper only).

## Global Constraints

- **Working dir:** all commands from the web app `/c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web`; git from repo root `/c/telo/Efforts/Ongoing/mc_hub`. cwd drifts — use absolute paths in git.
- **Client-side only** — no server, no data, no migration, no new dependency. Progress comes from the existing `ZoneVM[]`.
- **Bilingual:** all locator strings from `buildLocator(zones, locale)`; `locale: 'ru' | 'en'`.
- **Captions (exact):** current → `📍 Вы тут: <zoneName> · модуль N из M` (ru) / `📍 You are here: <zoneName> · module N of M` (en). Finished → `🏁 Курс пройден` (ru) / `🏁 Course complete` (en).
- **Marker placement:** ✦ at `(p.x, p.y - 9)` on the current node, above the niche 👑 (`p.y - 7`); inside the existing `.wm-cur` pulsing group; `aria-hidden="true"`.
- **Don't break** existing World Map rendering (nodes, snakePath, pulse, crown, click-to-scroll) or any other test.
- **Run a single test file:** `npx vitest run lib/rpg/locator.test.ts` from the web app dir.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `lib/rpg/locator.ts` | `buildLocator` (current-position → `LocatorVM` + bilingual caption) | 1 |
| `lib/rpg/locator.test.ts` | helper tests | 1 |
| `components/rpg/world-map.tsx` | `+ locale` prop, ✦ marker, caption, aria | 2 |
| `app/character/profile-client.tsx` | pass `locale` to `<WorldMap>` | 2 |

`ZoneVM` (existing, `lib/rpg/types.ts`): `{ slug; order: number /*0-based*/; zoneName: string /*localized*/; questTitle; moduleTitle; durationLabel; status: 'completed'|'current'|'todo'; isNiche; href }`.

---

### Task 1: `buildLocator` pure helper

**Files:**
- Create: `LMS/tochka-sborki/web/lib/rpg/locator.ts`
- Test: `LMS/tochka-sborki/web/lib/rpg/locator.test.ts`

**Interfaces:**
- Consumes: `ZoneVM` from `./types`.
- Produces: `LocatorVM { finished: boolean; hereIndex: number | null; total: number; zoneName: string | null; caption: string }`, `buildLocator(zones: ZoneVM[], locale: 'ru' | 'en'): LocatorVM`.

- [ ] **Step 1: Write the failing test**

```ts
// LMS/tochka-sborki/web/lib/rpg/locator.test.ts
import { describe, it, expect } from 'vitest'
import { buildLocator } from './locator'
import type { ZoneVM } from './types'

// minimal ZoneVM factory — only fields buildLocator reads matter
function zone(order: number, status: ZoneVM['status'], zoneName: string): ZoneVM {
  return { slug: `m${order}`, order, zoneName, questTitle: zoneName, moduleTitle: zoneName, durationLabel: '', status, isNiche: false, href: '#' }
}

// 9 zones: 0-4 completed, 5 current, 6-8 todo
function nineZones(): ZoneVM[] {
  return Array.from({ length: 9 }, (_, i) =>
    zone(i, i < 5 ? 'completed' : i === 5 ? 'current' : 'todo', i === 5 ? 'Аудио-пайплайн' : `Z${i}`))
}

describe('buildLocator', () => {
  it('locates the current module (ru): 1-based index, total, zone name in caption', () => {
    const loc = buildLocator(nineZones(), 'ru')
    expect(loc.finished).toBe(false)
    expect(loc.hereIndex).toBe(6)
    expect(loc.total).toBe(9)
    expect(loc.zoneName).toBe('Аудио-пайплайн')
    expect(loc.caption).toContain('Вы тут')
    expect(loc.caption).toContain('Аудио-пайплайн')
    expect(loc.caption).toContain('модуль 6 из 9')
  })

  it('renders the english caption', () => {
    const loc = buildLocator(nineZones(), 'en')
    expect(loc.caption).toContain('You are here')
    expect(loc.caption).toContain('module 6 of 9')
  })

  it('handles the first module (order 0)', () => {
    const zones = [zone(0, 'current', 'Старт'), zone(1, 'todo', 'Z1')]
    const loc = buildLocator(zones, 'ru')
    expect(loc.hereIndex).toBe(1)
    expect(loc.caption).toContain('модуль 1 из 2')
  })

  it('reports finished when no zone is current (all completed)', () => {
    const zones = [zone(0, 'completed', 'A'), zone(1, 'completed', 'B')]
    const ru = buildLocator(zones, 'ru')
    expect(ru.finished).toBe(true)
    expect(ru.hereIndex).toBeNull()
    expect(ru.zoneName).toBeNull()
    expect(ru.caption).toContain('Курс пройден')
    expect(buildLocator(zones, 'en').caption).toContain('Course complete')
  })

  it('does not throw on empty zones (treats as finished)', () => {
    const loc = buildLocator([], 'ru')
    expect(loc.finished).toBe(true)
    expect(loc.total).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web && npx vitest run lib/rpg/locator.test.ts`
Expected: FAIL — cannot find module `./locator`.

- [ ] **Step 3: Write minimal implementation**

```ts
// LMS/tochka-sborki/web/lib/rpg/locator.ts
import type { ZoneVM } from './types'

export interface LocatorVM {
  finished: boolean
  hereIndex: number | null   // 1-based position of the current module; null when finished
  total: number
  zoneName: string | null    // localized name of the current zone; null when finished
  caption: string            // ready-to-render line shown under the map
}

export function buildLocator(zones: ZoneVM[], locale: 'ru' | 'en'): LocatorVM {
  const total = zones.length
  const current = zones.find(z => z.status === 'current')

  if (!current) {
    return {
      finished: true,
      hereIndex: null,
      total,
      zoneName: null,
      caption: locale === 'en' ? '🏁 Course complete' : '🏁 Курс пройден',
    }
  }

  const hereIndex = current.order + 1
  const zoneName = current.zoneName
  const caption = locale === 'en'
    ? `📍 You are here: ${zoneName} · module ${hereIndex} of ${total}`
    : `📍 Вы тут: ${zoneName} · модуль ${hereIndex} из ${total}`

  return { finished: false, hereIndex, total, zoneName, caption }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web && npx vitest run lib/rpg/locator.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add LMS/tochka-sborki/web/lib/rpg/locator.ts LMS/tochka-sborki/web/lib/rpg/locator.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(rpg): buildLocator — current-position view-model + bilingual caption"
```

---

### Task 2: World Map marker + caption

**Files:**
- Modify: `LMS/tochka-sborki/web/components/rpg/world-map.tsx`

**Interfaces:**
- Consumes: `buildLocator` (Task 1), `ZoneVM`.
- Produces: `<WorldMap>` now requires a `locale: 'ru' | 'en'` prop.

The current full file is below; replace it entirely with the version that follows.

**Current file:**
```tsx
'use client'
import { nodePositions, snakePath } from '@/lib/rpg/map-layout'
import type { ZoneVM } from '@/lib/rpg/types'

const VB = 100
const COLS = 3

export function WorldMap({ zones, accent, glyph, nicheDungeonCleared = false }: { zones: ZoneVM[]; accent: string; glyph: string; nicheDungeonCleared?: boolean }) {
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
          const fill = (done || cur) ? accent : 'var(--bg-surface)'
          const opacity = z.status === 'todo' ? 0.5 : 1
          return (
            <g key={z.slug} className={cur ? 'wm-cur' : undefined} opacity={opacity}
               style={{ cursor: 'pointer' }} onClick={() => {
                 document.getElementById(`quest-${z.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
               }}>
              <circle cx={p.x} cy={p.y} r={6} fill={fill}
                      stroke={accent} strokeWidth={cur ? 1.5 : done ? 1 : 0.6} />
              <text x={p.x} y={p.y + 2.2} textAnchor="middle" fontSize={5}>{glyph}</text>
              {z.isNiche && nicheDungeonCleared && (
                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={5} aria-hidden="true">👑</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
```

- [ ] **Step 1: Replace the file** with this version (adds `locale` prop, ✦ marker on the current node, the caption `<p>`, and an enriched `aria-label`)

```tsx
'use client'
import { nodePositions, snakePath } from '@/lib/rpg/map-layout'
import { buildLocator } from '@/lib/rpg/locator'
import type { ZoneVM } from '@/lib/rpg/types'

const VB = 100
const COLS = 3

export function WorldMap({ zones, accent, glyph, locale, nicheDungeonCleared = false }: { zones: ZoneVM[]; accent: string; glyph: string; locale: 'ru' | 'en'; nicheDungeonCleared?: boolean }) {
  const pts = nodePositions(zones.length, VB, VB, COLS)
  const path = snakePath(pts)
  const loc = buildLocator(zones, locale)
  const mapLabel = locale === 'en'
    ? (loc.finished ? 'Learning map — course complete' : `Learning map — you are here: ${loc.zoneName}`)
    : (loc.finished ? 'Карта обучения — курс пройден' : `Карта обучения — Вы тут: ${loc.zoneName}`)
  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <style>{`
        @keyframes wm-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
        .wm-cur { animation: wm-pulse 1.8s infinite; }
        @media (prefers-reduced-motion: reduce){ .wm-cur{ animation:none } }
      `}</style>
      <svg viewBox={`0 0 ${VB} ${VB}`} style={{ width: '100%', height: 'auto' }} role="img" aria-label={mapLabel}>
        <path d={path} fill="none" stroke="var(--border-color)" strokeWidth={1.2} strokeDasharray="2 2" />
        {zones.map((z, i) => {
          const p = pts[i]
          const done = z.status === 'completed', cur = z.status === 'current'
          const fill = (done || cur) ? accent : 'var(--bg-surface)'
          const opacity = z.status === 'todo' ? 0.5 : 1
          return (
            <g key={z.slug} className={cur ? 'wm-cur' : undefined} opacity={opacity}
               style={{ cursor: 'pointer' }} onClick={() => {
                 document.getElementById(`quest-${z.slug}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
               }}>
              <circle cx={p.x} cy={p.y} r={6} fill={fill}
                      stroke={accent} strokeWidth={cur ? 1.5 : done ? 1 : 0.6} />
              <text x={p.x} y={p.y + 2.2} textAnchor="middle" fontSize={5}>{glyph}</text>
              {z.isNiche && nicheDungeonCleared && (
                <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize={5} aria-hidden="true">👑</text>
              )}
              {cur && (
                <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={5.5} fill={accent} aria-hidden="true">✦</text>
              )}
            </g>
          )
        })}
      </svg>
      <p style={{ marginTop: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
        {loc.caption}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Wire `locale` from the only caller, `app/character/profile-client.tsx`** (same task — the new prop is required, so its single caller must pass it for the build to stay green)

The current line (around `app/character/profile-client.tsx:55`) reads:
```tsx
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} nicheDungeonCleared={nicheDungeonCleared} />
```
Change it to:
```tsx
          <WorldMap zones={vm.zones} accent={accent} glyph={glyph} locale={locale} nicheDungeonCleared={nicheDungeonCleared} />
```
`locale` is the `ProfileClient` prop (`export function ProfileClient({ modules, locale }: Props)`), already in scope. `profile-client.tsx` is the ONLY `<WorldMap>` caller in the repo.

- [ ] **Step 3: Typecheck + helper/geometry suites stay green**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web && npx tsc --noEmit && npx vitest run lib/rpg/locator.test.ts lib/rpg/map-layout.test.ts`
Expected: tsc clean (the new required prop is satisfied by the caller edit); locator (5) + map-layout (existing) PASS. The component itself has no unit test (consistent with the repo — only geometry/helpers are unit-tested); its rendering is verified by the green build next.

- [ ] **Step 4: Green static build (the integration gate)**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web && npm run build`
Expected: build succeeds (Next.js 16 `output:'export'`); `/character/` and `/en/character/` routes emit without error.

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add LMS/tochka-sborki/web/components/rpg/world-map.tsx LMS/tochka-sborki/web/app/character/profile-client.tsx
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(rpg): World Map ✦ you-are-here marker + bilingual caption, wired on /character"
```

---

## Post-implementation (controller)

1. Run the web suite from its own root: `cd /c/telo/Efforts/Ongoing/mc_hub/LMS/tochka-sborki/web && npx vitest run` (NOT from `workers/` — the cwd gotcha sweeps the wrong tests).
2. `git push origin main` → CI deploys web (`deploy-web` by path filter).
3. Verify on `ai.mamaev.coach/character/` (a learner mid-course): the ✦ sits on the current module node with the "Вы тут: … · модуль N из M" caption under the map; EN at `/en/character/`.

## Self-Review

- **Spec coverage:** `buildLocator` + LocatorVM + bilingual captions + finished + empty-defensive (T1) ✓; ✦ marker at `cy-9` above crown + caption `<p>` + `locale` prop + enriched aria, no break to existing render, profile-client passes `locale`, green build (T2) ✓; SVG not unit-tested, helper is (matches repo) ✓; out-of-scope (roadmap MDX, geometry) untouched ✓.
- **Type consistency:** `LocatorVM`/`buildLocator(zones, locale)` (T1) consumed by world-map (T2); `WorldMap` `locale: 'ru'|'en'` prop matches the `profile-client` `locale: Locale` passed in the same task (T2) — `Locale` is the `'ru'|'en'` union used across the web app. The `cy-9` marker vs `cy-7` crown placement matches the spec. Captions match the spec's exact strings (`модуль N из M` / `module N of M`, `Курс пройден` / `Course complete`).
- **Placeholder scan:** none — full code in every step; the Task-2 tsc failure is intentional and documented, resolved by Task 3.
