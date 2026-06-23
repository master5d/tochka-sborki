# `<WillWont>` Expectation-Contract Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable two-column "will / won't" expectation-contract block for lesson/module/event intros, seeded with the course-intro contract in module 01.

**Architecture:** Bilingual keyed data in a pure `lib/content/will-wont.ts` (unit-tested) feeds a generic presentational engine `components/will-wont-block.tsx` through a thin string-prop wrapper `components/will-wont.tsx` (`<WillWont id="…" locale="…" />`), registered for MDX. Inline array/object MDX props are NOT delivered by `next-mdx-remote@6`, so the wrapper + lib data sidestep that.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, static), `next-mdx-remote@6`, React server components, TypeScript, Vitest (`env: node`).

## Global Constraints

- Working directory for ALL commands: `LMS/tochka-sborki/web/` (run `cd LMS/tochka-sborki/web` first). NEVER run `npx vitest` from `workers/`.
- Test command: `npm test -- will-wont`. Build command: `npm run build`.
- **Do NOT pass arrays/objects as inline MDX props** — they arrive `undefined` under `next-mdx-remote@6` and fail the build. MDX uses only the string props `<WillWont id="course-intro" locale="ru" />`.
- Bilingual: RU is source, EN a faithful mirror; same number of `will`/`wont` items in both locales. Use the seed copy in Task 1 verbatim.
- Authenticity: NO income/earnings claims anywhere (the "100k" line appears only as an explicit example of what the course will NOT promise). No hype.
- `<WillWontBlock>`, `<WillWont>` are server components — NO `'use client'`.
- CSS vars only (`--text-accent`, `--text-secondary`, `--text-primary`, `--bg-surface`, `--border-color`, `--radius`, `--font-mono`).
- The pure data module is unit-tested; the engine + wrapper + MDX are verified by a green `npm run build`.
- No server, data store, migration, or new npm dependency.

---

### Task 1: Bilingual data + `getWillWont`

**Files:**
- Create: `LMS/tochka-sborki/web/lib/content/will-wont.ts`
- Test: `LMS/tochka-sborki/web/lib/content/will-wont.test.ts`

**Interfaces:**
- Consumes: `type Locale` from `@/lib/intake/types` (`'ru' | 'en'`).
- Produces (used by Tasks 2-3):
  - `export interface WillWontVM { heading: string; willLabel: string; wontLabel: string; will: string[]; wont: string[]; punchline?: string }`
  - `export const WILL_WONT: Record<string, Record<Locale, { heading: string; will: string[]; wont: string[]; punchline?: string }>>`
  - `export const LABELS: Record<Locale, { will: string; wont: string }>`
  - `export function getWillWont(id: string, locale: Locale): WillWontVM | null`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/content/will-wont.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getWillWont } from './will-wont'

describe('getWillWont', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`returns a full VM for course-intro (${loc})`, () => {
      const vm = getWillWont('course-intro', loc)
      expect(vm).not.toBeNull()
      expect(vm!.heading.length).toBeGreaterThan(0)
      expect(vm!.willLabel.length).toBeGreaterThan(0)
      expect(vm!.wontLabel.length).toBeGreaterThan(0)
      expect(vm!.punchline && vm!.punchline.length).toBeGreaterThan(0)
      expect(vm!.will.length).toBeGreaterThanOrEqual(1)
      expect(vm!.wont.length).toBeGreaterThanOrEqual(1)
      for (const s of [...vm!.will, ...vm!.wont]) expect(s.length).toBeGreaterThan(0)
    })
  }
  it('returns null for an unknown id', () => {
    expect(getWillWont('does-not-exist', 'ru')).toBeNull()
  })
  it('ru and en differ', () => {
    expect(getWillWont('course-intro', 'ru')!.heading).not.toBe(getWillWont('course-intro', 'en')!.heading)
    expect(getWillWont('course-intro', 'ru')!.will[0]).not.toBe(getWillWont('course-intro', 'en')!.will[0])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npm test -- will-wont`
Expected: FAIL — cannot resolve `./will-wont` / `getWillWont is not a function`.

- [ ] **Step 3: Implement the data module**

Create `LMS/tochka-sborki/web/lib/content/will-wont.ts`:
```ts
import type { Locale } from '@/lib/intake/types'

export interface WillWontVM {
  heading: string
  willLabel: string
  wontLabel: string
  will: string[]
  wont: string[]
  punchline?: string
}

interface Entry { heading: string; will: string[]; wont: string[]; punchline?: string }

export const LABELS: Record<Locale, { will: string; wont: string }> = {
  ru: { will: 'Будет', wont: 'Не будет' },
  en: { will: 'Will', wont: "Won't" },
}

export const WILL_WONT: Record<string, Record<Locale, Entry>> = {
  'course-intro': {
    ru: {
      heading: 'Честный контракт',
      will: [
        'соберёшь рабочую штуку своими руками (бот, лендинг, автоматизация)',
        'научишься писать задачу для AI и держать цикл',
        'выберешь стек под себя — платный или суверенный',
        'пройдёшь путь от первого промпта до агента',
      ],
      wont: [
        'обещаний «100к за неделю» и income-flex',
        'воды и пересказа документации',
        'волшебной кнопки «сделай за меня»',
        'привязки к одному вендору',
      ],
      punchline: 'Без воды и без хайпа — честный обмен: ты вкладываешь внимание, курс даёт навык.',
    },
    en: {
      heading: 'An honest deal',
      will: [
        'you build a working thing with your own hands (a bot, a landing page, an automation)',
        'you learn to write the task for the AI and hold the loop',
        'you choose a stack that fits you — paid or sovereign',
        'you walk the path from your first prompt to an agent',
      ],
      wont: [
        "promises of '100k in a week' or income flexing",
        'filler or rehashing the docs',
        "a magic 'do-it-for-me' button",
        'lock-in to a single vendor',
      ],
      punchline: 'No fluff, no hype — an honest exchange: you invest attention, the course gives you skill.',
    },
  },
}

export function getWillWont(id: string, locale: Locale): WillWontVM | null {
  const L: Locale = locale === 'en' ? 'en' : 'ru'
  const entry = WILL_WONT[id]?.[L]
  if (!entry) return null
  return {
    heading: entry.heading,
    willLabel: LABELS[L].will,
    wontLabel: LABELS[L].wont,
    will: entry.will,
    wont: entry.wont,
    punchline: entry.punchline,
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npm test -- will-wont`
Expected: PASS (all tests green).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/content/will-wont.ts LMS/tochka-sborki/web/lib/content/will-wont.test.ts
git commit -m "feat(content): bilingual will/wont data + getWillWont (fb_797eef868c61)"
```

---

### Task 2: `WillWontBlock` presentational engine

**Files:**
- Create: `LMS/tochka-sborki/web/components/will-wont-block.tsx`

**Interfaces:**
- Consumes: nothing (generic; receives plain props).
- Produces: `export function WillWontBlock(props: { heading?: string; willLabel: string; wontLabel: string; will: string[]; wont: string[]; punchline?: string }): React.JSX.Element` — used by Task 3's wrapper.

A new, not-yet-imported file → the build stays green; verified by `npm run build`. Reference pattern: `components/stack-matrix.tsx` (inline `<style>` media query, CSS vars), `components/before-after.tsx` (two-column grid with mono labels).

- [ ] **Step 1: Create the engine component**

Create `LMS/tochka-sborki/web/components/will-wont-block.tsx`:
```tsx
export function WillWontBlock({ heading, willLabel, wontLabel, will, wont, punchline }: {
  heading?: string
  willLabel: string
  wontLabel: string
  will: string[]
  wont: string[]
  punchline?: string
}) {
  const colLabel: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', textTransform: 'uppercase',
    letterSpacing: '0.12em', marginBottom: '0.75rem',
  }
  const list: React.CSSProperties = { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }
  const item: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1.1rem 1fr', gap: '0.5rem', alignItems: 'baseline', fontSize: '0.92rem', lineHeight: 1.5 }

  return (
    <figure style={{
      margin: '1.5rem 0', padding: '1.25rem',
      background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius)',
    }}>
      <style>{`
        @media (max-width: 720px) { .willwont-grid { grid-template-columns: 1fr !important; gap: 1.5rem !important; } }
      `}</style>

      {heading && (
        <figcaption style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.1rem' }}>{heading}</figcaption>
      )}

      <div className="willwont-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* WILL */}
        <div>
          <div style={{ ...colLabel, color: 'var(--text-accent)' }}>{willLabel}</div>
          <ul style={list}>
            {will.map((s, i) => (
              <li key={i} style={item}>
                <span aria-hidden="true" style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>✓</span>
                <span style={{ color: 'var(--text-primary)' }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* WON'T */}
        <div>
          <div style={{ ...colLabel, color: 'var(--text-secondary)' }}>{wontLabel}</div>
          <ul style={list}>
            {wont.map((s, i) => (
              <li key={i} style={item}>
                <span aria-hidden="true" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>✗</span>
                <span style={{ color: 'var(--text-secondary)' }}>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {punchline && (
        <p style={{ marginTop: '1.25rem', marginBottom: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-accent)', lineHeight: 1.45 }}>{punchline}</p>
      )}
    </figure>
  )
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — build completes; the new file type-checks (not yet imported, no behavior change).

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/components/will-wont-block.tsx
git commit -m "feat(content): WillWontBlock two-column expectation engine (fb_797eef868c61)"
```

---

### Task 3: `<WillWont>` wrapper + MDX wiring

**Files:**
- Create: `LMS/tochka-sborki/web/components/will-wont.tsx`
- Modify: `LMS/tochka-sborki/web/components/mdx-components.tsx`
- Modify: `LMS/tochka-sborki/web/content/ru/01-introduction/u1-activation.mdx`
- Modify: `LMS/tochka-sborki/web/content/en/01-introduction/u1-activation.mdx`

**Interfaces:**
- Consumes: `getWillWont` from `@/lib/content/will-wont` (Task 1); `WillWontBlock` from `@/components/will-wont-block` (Task 2); `type Locale` from `@/lib/intake/types`.
- Produces: `<WillWont id="…" locale="…" />` available in MDX.

Verified by a green `npm run build` (no unit test); the build proves the `<WillWont id="course-intro" locale="…" />` usages compile.

- [ ] **Step 1: Create the wrapper component**

Create `LMS/tochka-sborki/web/components/will-wont.tsx`:
```tsx
import { getWillWont } from '@/lib/content/will-wont'
import { WillWontBlock } from '@/components/will-wont-block'
import type { Locale } from '@/lib/intake/types'

export function WillWont({ id, locale }: { id: string; locale: Locale }) {
  const vm = getWillWont(id, locale)
  return vm ? <WillWontBlock {...vm} /> : null
}
```

- [ ] **Step 2: Register the component in MDX**

In `LMS/tochka-sborki/web/components/mdx-components.tsx`:

Add the import after the `PromptAnatomy` import line:
```tsx
import { WillWont } from './will-wont'
```

Add `WillWont,` to the `mdxComponents` object, after the `PromptAnatomy,` entry:
```tsx
  PromptAnatomy,
  WillWont,
}
```

- [ ] **Step 3: Insert into the RU course-intro unit**

In `LMS/tochka-sborki/web/content/ru/01-introduction/u1-activation.mdx`, find:
```
> 💡 **Этот курс — agent-agnostic.** Концепции работают с Claude Code, Aider, Hermes (SOVERN), Cline и другими. Если ты Behind-GFW или хочешь Sovereign-стек — модуль 03 («Выбор стека») покажет 4 варианта на выбор.
```
Replace it with (append the component after the blockquote):
```
> 💡 **Этот курс — agent-agnostic.** Концепции работают с Claude Code, Aider, Hermes (SOVERN), Cline и другими. Если ты Behind-GFW или хочешь Sovereign-стек — модуль 03 («Выбор стека») покажет 4 варианта на выбор.

<WillWont id="course-intro" locale="ru" />
```

- [ ] **Step 4: Insert into the EN course-intro unit**

In `LMS/tochka-sborki/web/content/en/01-introduction/u1-activation.mdx`, find:
```
> 💡 **This course is agent-agnostic.** Concepts work with Claude Code, Aider, Hermes (SOVERN), Cline, and more. If you're behind a firewall or want a Sovereign stack — module 03 ("Stack selection") shows 4 options.
```
Replace it with:
```
> 💡 **This course is agent-agnostic.** Concepts work with Claude Code, Aider, Hermes (SOVERN), Cline, and more. If you're behind a firewall or want a Sovereign stack — module 03 ("Stack selection") shows 4 options.

<WillWont id="course-intro" locale="en" />
```

- [ ] **Step 5: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — both `<WillWont>` usages render (no `undefined`/`map` error).

- [ ] **Step 6: Commit**

```bash
git add LMS/tochka-sborki/web/components/will-wont.tsx LMS/tochka-sborki/web/components/mdx-components.tsx LMS/tochka-sborki/web/content/ru/01-introduction/u1-activation.mdx LMS/tochka-sborki/web/content/en/01-introduction/u1-activation.mdx
git commit -m "feat(content): WillWont wrapper + course-intro contract in module 01 (fb_797eef868c61)"
```

---

## Self-Review

**1. Spec coverage:**
- `WillWontVM`, `WILL_WONT` keyed data, `LABELS`, `getWillWont` (null on unknown id, locale guard) → Task 1. ✓
- Tests: full VM both locales, will/wont ≥1 non-empty, unknown id → null, ru≠en → Task 1 test. ✓
- Generic presentational two-column engine (Будет ✓ / Не будет ✗, optional heading + punchline, responsive, CSS vars, aria-hidden glyphs) → Task 2. ✓
- String-prop wrapper feeding the engine, null → renders nothing → Task 3 step 1. ✓
- Registration → Task 3 step 2. ✓
- 2 MDX insertions (ru/en module 01 u1, after the tip blockquote) → Task 3 steps 3-4. ✓
- No inline array props; string props only → Global Constraints + wrapper. ✓
- Authenticity: no income claims except as the explicit "won't" example → seed copy. ✓
- Out of scope (ProgramVenn untouched, other entries, per-item notes, income claims) → not built. ✓

**2. Placeholder scan:** No TBD/TODO; complete code in every step; full bilingual data inline; exact MDX find/replace anchors. ✓

**3. Type consistency:** `WillWontVM`/`getWillWont`/`WILL_WONT`/`LABELS` defined in Task 1 and consumed identically in Task 3 (`getWillWont(id, locale)` → spread into `<WillWontBlock {...vm} />`). The engine's prop names (`heading`, `willLabel`, `wontLabel`, `will`, `wont`, `punchline`) exactly match the `WillWontVM` fields, so `{...vm}` type-checks. `<WillWont>` is registered under the same name used in MDX. The wrapper returns `null` when `getWillWont` does, matching the spec's graceful path. ✓
