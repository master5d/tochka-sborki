# `<AnnotatedExample>` MDX Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable, props-driven `<AnnotatedExample>` MDX component that renders an example string as color-coded numbered tokens with explaining callouts ("exploded anatomy").

**Architecture:** A pure resolver in `lib/content/annotated-example.ts` (unit-tested) maps `Segment[]` to numbered, color-resolved `AnatomyToken[]`. A presentational server component `components/annotated-example.tsx` (no `'use client'`) renders the token line + a responsive callout grid and is registered in `mdx-components.tsx` so any `.mdx` can use it.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, static), React server component, TypeScript, Vitest (`env: node`).

## Global Constraints

- Working directory for ALL commands: `LMS/tochka-sborki/web/` (run `cd LMS/tochka-sborki/web` first). NEVER run `npx vitest` from `workers/` — wrong cwd.
- Test command: `npm test -- annotated-example` (Vitest). Build command: `npm run build`.
- Style with CSS vars only: `--text-accent`, `--text-secondary`, `--text-primary`, `--bg-surface`, `--border-color`, `--radius`, `--font-mono`. No hardcoded theme colors except the accent rgba triples in the `ACCENT` map.
- `<AnnotatedExample>` is presentational → a **server component**: do NOT add `'use client'`.
- Props-driven and copy-agnostic: the component holds NO ru/en copy; all strings arrive via `segments`/`caption` from the lesson `.mdx`.
- The pure helper is unit-tested (Vitest); the component is verified by a green `npm run build` only (repo convention — UI not unit-tested).
- No server, data store, migration, or new npm dependency.

---

### Task 1: Pure resolver `buildAnatomy` + accent map

**Files:**
- Create: `LMS/tochka-sborki/web/lib/content/annotated-example.ts`
- Test: `LMS/tochka-sborki/web/lib/content/annotated-example.test.ts`

**Interfaces:**
- Consumes: nothing (new module).
- Produces (used by Task 2):
  - `export type Accent = 'lime' | 'cyan' | 'amber' | 'magenta' | 'violet' | 'rose'`
  - `export interface AccentColor { border: string; bg: string; text: string }`
  - `export interface Segment { text: string; label: string; note: string; accent: Accent }`
  - `export interface AnatomyToken { n: number; text: string; label: string; note: string; color: AccentColor }`
  - `export const ACCENT: Record<Accent, AccentColor>`
  - `export const FALLBACK: AccentColor`
  - `export function buildAnatomy(segments: Segment[]): AnatomyToken[]`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/content/annotated-example.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { buildAnatomy, ACCENT, FALLBACK, type Segment } from './annotated-example'

const seg = (text: string, accent: Segment['accent']): Segment => ({ text, label: `${text}-label`, note: `${text}-note`, accent })

describe('buildAnatomy', () => {
  it('numbers tokens 1..n sequentially', () => {
    const out = buildAnatomy([seg('a', 'lime'), seg('b', 'cyan'), seg('c', 'amber')])
    expect(out.map(t => t.n)).toEqual([1, 2, 3])
  })
  it('resolves a known accent to its exact ACCENT triple', () => {
    const [t] = buildAnatomy([seg('x', 'cyan')])
    expect(t.color).toEqual(ACCENT.cyan)
  })
  it('resolves an unknown accent to FALLBACK (never undefined)', () => {
    const [t] = buildAnatomy([{ text: 'x', label: 'l', note: 'n', accent: 'zzz' as Segment['accent'] }])
    expect(t.color).toEqual(FALLBACK)
    expect(t.color).toBeDefined()
  })
  it('returns [] for empty input', () => {
    expect(buildAnatomy([])).toEqual([])
  })
  it('preserves text, label and note verbatim', () => {
    const [t] = buildAnatomy([{ text: 'роль', label: 'кто', note: 'почему', accent: 'violet' }])
    expect(t.text).toBe('роль')
    expect(t.label).toBe('кто')
    expect(t.note).toBe('почему')
  })
  it('exposes 6 accents in the ACCENT map', () => {
    expect(Object.keys(ACCENT).sort()).toEqual(['amber', 'cyan', 'lime', 'magenta', 'rose', 'violet'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npm test -- annotated-example`
Expected: FAIL — cannot resolve `./annotated-example` / `buildAnatomy is not a function`.

- [ ] **Step 3: Implement the resolver**

Create `LMS/tochka-sborki/web/lib/content/annotated-example.ts`:
```ts
export type Accent = 'lime' | 'cyan' | 'amber' | 'magenta' | 'violet' | 'rose'

export interface AccentColor { border: string; bg: string; text: string }

export interface Segment {
  text: string    // the literal token as it appears in the example
  label: string   // short name of the part (e.g. "роль")
  note: string    // the callout explanation
  accent: Accent
}

export interface AnatomyToken {
  n: number
  text: string
  label: string
  note: string
  color: AccentColor
}

// rgba triples in the same style as StackMatrix.ACCENT_COLORS.
export const ACCENT: Record<Accent, AccentColor> = {
  lime:    { border: 'rgba(0, 255, 136, 0.5)',  bg: 'rgba(0, 255, 136, 0.08)',  text: 'rgb(0, 255, 136)' },
  cyan:    { border: 'rgba(80, 200, 255, 0.5)', bg: 'rgba(80, 200, 255, 0.08)', text: 'rgb(80, 200, 255)' },
  amber:   { border: 'rgba(255, 180, 84, 0.5)', bg: 'rgba(255, 180, 84, 0.08)', text: 'rgb(255, 180, 84)' },
  magenta: { border: 'rgba(255, 100, 200, 0.5)',bg: 'rgba(255, 100, 200, 0.08)',text: 'rgb(255, 100, 200)' },
  violet:  { border: 'rgba(168, 130, 255, 0.5)',bg: 'rgba(168, 130, 255, 0.08)',text: 'rgb(168, 130, 255)' },
  rose:    { border: 'rgba(255, 120, 120, 0.5)',bg: 'rgba(255, 120, 120, 0.08)',text: 'rgb(255, 120, 120)' },
}

// Neutral fallback for an unknown/missing accent — never undefined.
export const FALLBACK: AccentColor = {
  border: 'var(--border-color)', bg: 'var(--bg-surface)', text: 'var(--text-accent)',
}

export function buildAnatomy(segments: Segment[]): AnatomyToken[] {
  return segments.map((s, i) => ({
    n: i + 1,
    text: s.text,
    label: s.label,
    note: s.note,
    color: ACCENT[s.accent] ?? FALLBACK,
  }))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npm test -- annotated-example`
Expected: PASS (all 6 tests green).

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/content/annotated-example.ts LMS/tochka-sborki/web/lib/content/annotated-example.test.ts
git commit -m "feat(content): buildAnatomy resolver + accent map for AnnotatedExample (fb_e92087192011)"
```

---

### Task 2: `<AnnotatedExample>` component + MDX registration

**Files:**
- Create: `LMS/tochka-sborki/web/components/annotated-example.tsx`
- Modify: `LMS/tochka-sborki/web/components/mdx-components.tsx`

**Interfaces:**
- Consumes: `buildAnatomy`, `type Segment` from `@/lib/content/annotated-example` (Task 1).
- Produces: `export function AnnotatedExample(props: { segments: Segment[]; caption?: string; mono?: boolean }): React.JSX.Element` — registered into `mdxComponents`.

Verified by a green `npm run build` (no unit test — repo convention for UI). Reference pattern: `components/stack-matrix.tsx` (accent triples, inline `<style>` media query, CSS vars) and `components/video-checkpoint.tsx` (`<figure>` wrapper).

- [ ] **Step 1: Create the component**

Create `LMS/tochka-sborki/web/components/annotated-example.tsx`:
```tsx
import { buildAnatomy, type Segment } from '@/lib/content/annotated-example'

export function AnnotatedExample({ segments, caption, mono = true }: {
  segments: Segment[]
  caption?: string
  mono?: boolean
}) {
  const tokens = buildAnatomy(segments)

  const badge = (n: number, color: { bg: string; text: string }): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    minWidth: '1.25rem', height: '1.25rem', borderRadius: '999px',
    background: color.bg, color: color.text,
    fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 700,
  })

  return (
    <figure style={{ margin: '1.5rem 0' }}>
      <style>{`
        @media (max-width: 720px) {
          .anatomy-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {caption && (
        <figcaption style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          textTransform: 'uppercase', letterSpacing: '0.12em',
          color: 'var(--text-secondary)', marginBottom: '0.75rem',
        }}>{caption}</figcaption>
      )}

      {/* Example line — numbered accent-tinted tokens */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)', padding: '1rem',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontSize: mono ? '0.875rem' : '1rem', lineHeight: 1.9,
        marginBottom: '1.25rem', wordBreak: 'break-word',
      }}>
        {tokens.map((t, i) => (
          <span key={t.n}>
            {i > 0 && ' '}
            <span style={{
              background: t.color.bg,
              borderBottom: `2px solid ${t.color.border}`,
              borderRadius: '4px', padding: '0.1em 0.3em',
              color: 'var(--text-primary)',
            }}>
              {t.text}
              <sup aria-hidden="true" style={{
                marginLeft: '0.25em', color: t.color.text,
                fontFamily: 'var(--font-mono)', fontSize: '0.7em', fontWeight: 700,
              }}>{t.n}</sup>
            </span>
          </span>
        ))}
      </div>

      {/* Callout grid — one card per token, same number + accent */}
      <div className="anatomy-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem',
      }}>
        {tokens.map(t => (
          <div key={t.n} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
            borderLeft: `3px solid ${t.color.border}`, borderRadius: 'var(--radius)',
            padding: '0.75rem 0.9rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span aria-hidden="true" style={badge(t.n, t.color)}>{t.n}</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
                color: t.color.text, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{t.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--text-secondary)' }}>{t.note}</p>
          </div>
        ))}
      </div>
    </figure>
  )
}
```

- [ ] **Step 2: Register the component in MDX**

In `LMS/tochka-sborki/web/components/mdx-components.tsx`:

Add the import after the other component imports (after the `Walkthrough` import line):
```tsx
import { AnnotatedExample } from './annotated-example'
```

Add `AnnotatedExample,` to the `mdxComponents` object, after the `Walkthrough,` entry:
```tsx
  Walkthrough,
  AnnotatedExample,
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd LMS/tochka-sborki/web && npm run build`
Expected: PASS — build completes; the component type-checks and is registered for MDX.

- [ ] **Step 4: Commit**

```bash
git add LMS/tochka-sborki/web/components/annotated-example.tsx LMS/tochka-sborki/web/components/mdx-components.tsx
git commit -m "feat(content): AnnotatedExample MDX component + registration (fb_e92087192011)"
```

---

## Self-Review

**1. Spec coverage:**
- `Accent` (6), `Segment`, `AnatomyToken`, `ACCENT` map, `FALLBACK`, `buildAnatomy` → Task 1. ✓
- 1-based numbering, known→triple, unknown→FALLBACK, empty→[], preserves text/label/note → Task 1 tests. ✓
- Server component (no `'use client'`), props-driven, copy-agnostic → Task 2 component. ✓
- Numbered-badge connector (no SVG), accent-tinted token line, superscript number → Task 2. ✓
- Responsive callout grid (auto-fit + inline `<style>` @720px→1col) → Task 2. ✓
- `mono` flag default true; optional `caption` eyebrow → Task 2 signature + render. ✓
- Registration in `mdx-components.tsx` → Task 2 step 2. ✓
- Accessibility: decorative glyphs `aria-hidden`, numbers are real text → Task 2 (`sup`/badge `aria-hidden`, label/number text). ✓
- Static export, no server/data/migration/dependency → Global Constraints; pure TS + one server component. ✓
- Out of scope (course authoring fb_2e3ffcf70af2, SVG connectors, interactivity, demo page) → not built. ✓

**2. Placeholder scan:** No TBD/TODO; every code step shows complete code; the test file is fully written. ✓

**3. Type consistency:** `Segment`/`AnatomyToken`/`AccentColor`/`Accent`/`ACCENT`/`FALLBACK`/`buildAnatomy` defined in Task 1 and consumed identically in Task 2 (`buildAnatomy(segments)`, `t.n`, `t.text`, `t.label`, `t.note`, `t.color.{bg,border,text}`). Component prop type `{ segments: Segment[]; caption?: string; mono?: boolean }` matches the spec. `mono` defaulted in the destructure. ✓
