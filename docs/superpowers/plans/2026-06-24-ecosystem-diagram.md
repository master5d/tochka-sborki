# Ecosystem Diagram (Learn·Connect·Prove) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A bespoke React ecosystem diagram for the course, organized by the Learn/Connect/Prove 3-pillar lens, data-driven and embedded on the landing page, honest about which pillars are live vs planned.

**Architecture:** A generic props-driven component (`components/ecosystem-diagram.tsx`) renders three pillar columns of node cards; course-specific nodes live in `lib/course/ecosystem.ts` (engine + course-data split, sibling of `showcase.ts`/`niche-map.ts`). Follows the `program-venn.tsx` idiom: a11y `sr-only` semantic fallback + responsive mobile collapse. No Mermaid, no network, no state.

**Tech Stack:** TypeScript, Next.js 16 static export (`output: 'export'`), React, vitest. All files under `LMS/tochka-sborki/web/`.

## Global Constraints

- All files under `LMS/tochka-sborki/web/`. Run tests from there: `cd LMS/tochka-sborki/web && npx vitest run`.
- Bilingual ru + en in all course data and the "soon" badge label.
- Engine + course-data split: the component takes `data` as a prop (generic); the Точка-Сборки nodes live in `lib/course/ecosystem.ts`.
- Import `Locale` from `@/lib/intake/types` (the convention used by sibling `lib/course/showcase.ts` — verify with `grep -n "import type { Locale }" LMS/tochka-sborki/web/lib/course/showcase.ts`).
- Authenticity (binding): `planned` nodes are clearly marked not-yet-live ("скоро"/"soon") and visually dimmed — never shown as available. No hype, no fabricated dates, no scarcity.
- No Mermaid — bespoke React/CSS following `program-venn.tsx` (the visual grid is `aria-hidden`; the `sr-only` block carries the semantics).
- Additive only: do not alter existing home-page sections, ProgramVenn, or other components.
- Static export: presentational pages/components validated by `next build`.
- Test idiom: `import { describe, it, expect } from 'vitest'`.

---

### Task 1: Ecosystem data layer (`lib/course/ecosystem.ts`)

**Files:**
- Create: `LMS/tochka-sborki/web/lib/course/ecosystem.ts`
- Test: `LMS/tochka-sborki/web/lib/course/ecosystem.test.ts`

**Interfaces:**
- Consumes: `Locale` (`'ru' | 'en'`) from `@/lib/intake/types`.
- Produces:
  - `type NodeStatus = 'live' | 'planned'`
  - `interface EcoNode { label: string; desc?: string; status: NodeStatus }`
  - `interface EcoPillar { key: 'learn' | 'connect' | 'prove'; title: string; nodes: EcoNode[] }`
  - `interface EcosystemData { eyebrow: string; heading: string; pillars: EcoPillar[] }`
  - `getEcosystem(locale: Locale): EcosystemData`

- [ ] **Step 1: Write the failing test**

Create `LMS/tochka-sborki/web/lib/course/ecosystem.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getEcosystem } from './ecosystem'

describe('getEcosystem', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`returns 3 ordered pillars with non-empty nodes (${loc})`, () => {
      const e = getEcosystem(loc)
      expect(e.eyebrow.length).toBeGreaterThan(0)
      expect(e.heading.length).toBeGreaterThan(0)
      expect(e.pillars.map((p) => p.key)).toEqual(['learn', 'connect', 'prove'])
      for (const p of e.pillars) {
        expect(p.title.length).toBeGreaterThan(0)
        expect(p.nodes.length).toBeGreaterThan(0)
        for (const n of p.nodes) {
          expect(n.label.length).toBeGreaterThan(0)
          expect(['live', 'planned']).toContain(n.status)
        }
      }
    })
  }

  it('has at least one planned node (honest not-yet-live)', () => {
    const all = getEcosystem('ru').pillars.flatMap((p) => p.nodes)
    expect(all.some((n) => n.status === 'planned')).toBe(true)
  })

  it('is bilingual (ru and en headings differ)', () => {
    expect(getEcosystem('ru').heading).not.toBe(getEcosystem('en').heading)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/ecosystem.test.ts`
Expected: FAIL — `Failed to resolve import './ecosystem'`.

- [ ] **Step 3: Write the implementation**

Create `LMS/tochka-sborki/web/lib/course/ecosystem.ts`. Author the data with a `Bi { ru; en }` raw structure and resolve by locale in `getEcosystem` (the sibling `showcase.ts` pattern):

```ts
// web/lib/course/ecosystem.ts
// Course-data for the Learn/Connect/Prove ecosystem diagram. Engine component is generic
// (components/ecosystem-diagram.tsx); these nodes are specific to Точка Сборки.
import type { Locale } from '@/lib/intake/types'

export type NodeStatus = 'live' | 'planned'
export interface EcoNode { label: string; desc?: string; status: NodeStatus }
export interface EcoPillar { key: 'learn' | 'connect' | 'prove'; title: string; nodes: EcoNode[] }
export interface EcosystemData { eyebrow: string; heading: string; pillars: EcoPillar[] }

interface Bi { ru: string; en: string }
interface RawNode { label: Bi; desc?: Bi; status: NodeStatus }
interface RawPillar { key: 'learn' | 'connect' | 'prove'; title: Bi; nodes: RawNode[] }
interface RawEco { eyebrow: Bi; heading: Bi; pillars: RawPillar[] }

const RAW: RawEco = {
  eyebrow: { ru: 'Экосистема', en: 'Ecosystem' },
  heading: {
    ru: 'Вся поддержка курса — с одного взгляда',
    en: 'The whole support system at a glance',
  },
  pillars: [
    {
      key: 'learn',
      title: { ru: 'Учись', en: 'Learn' },
      nodes: [
        { label: { ru: 'Курс (9 модулей)', en: 'Course (9 modules)' }, status: 'live' },
        { label: { ru: 'AI-напарник', en: 'AI companion' }, status: 'live' },
        { label: { ru: 'Учиться с ИИ', en: 'Learn with AI' }, status: 'live' },
        { label: { ru: 'Материалы и программа', en: 'Materials & syllabus' }, status: 'live' },
      ],
    },
    {
      key: 'connect',
      title: { ru: 'Связывайся', en: 'Connect' },
      nodes: [
        { label: { ru: 'Сообщество S.A.S.H.A', en: 'S.A.S.H.A community' }, status: 'planned' },
        { label: { ru: 'Кросс-курс companion', en: 'Cross-course companion' }, status: 'planned' },
      ],
    },
    {
      key: 'prove',
      title: { ru: 'Доказывай', en: 'Prove' },
      nodes: [
        { label: { ru: 'Сертификат', en: 'Certificate' }, status: 'live' },
        { label: { ru: 'Золотой билет в академию', en: 'Academy admission ticket' }, status: 'planned' },
        { label: { ru: 'Портфолио-витрина', en: 'Showcase portfolio' }, status: 'planned' },
      ],
    },
  ],
}

export function getEcosystem(locale: Locale): EcosystemData {
  const k: 'ru' | 'en' = locale === 'en' ? 'en' : 'ru'
  return {
    eyebrow: RAW.eyebrow[k],
    heading: RAW.heading[k],
    pillars: RAW.pillars.map((p) => ({
      key: p.key,
      title: p.title[k],
      nodes: p.nodes.map((n) => ({
        label: n.label[k],
        desc: n.desc ? n.desc[k] : undefined,
        status: n.status,
      })),
    })),
  }
}
```

> Before writing, confirm the `Locale` import path matches the sibling: `grep -n "import type { Locale }" LMS/tochka-sborki/web/lib/course/showcase.ts`. If it differs, use whatever the siblings use.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/ecosystem.test.ts`
Expected: PASS — all four cases green.

- [ ] **Step 5: Commit**

```bash
git add LMS/tochka-sborki/web/lib/course/ecosystem.ts LMS/tochka-sborki/web/lib/course/ecosystem.test.ts
git commit -m "feat(lms): ecosystem diagram data layer (Learn/Connect/Prove)"
```

---

### Task 2: Ecosystem diagram component (`components/ecosystem-diagram.tsx`)

**Files:**
- Create: `LMS/tochka-sborki/web/components/ecosystem-diagram.tsx`

**Interfaces:**
- Consumes: `EcosystemData` from `@/lib/course/ecosystem` (Task 1); `Locale` from `@/lib/intake/types`.
- Produces: `export function EcosystemDiagram({ data, locale }: { data: EcosystemData; locale?: Locale }): JSX.Element`.

Presentational, like `program-venn.tsx`: a `<section>` with eyebrow + heading, an `aria-hidden` 3-column grid of node cards, an `sr-only` semantic version, and a responsive `<style>` collapsing to one column on mobile. `planned` nodes are dimmed and carry a "скоро"/"soon" badge. No unit test (presentational; validated by typecheck here and `next build` in Task 3).

- [ ] **Step 1: Create the component**

Create `LMS/tochka-sborki/web/components/ecosystem-diagram.tsx`:

```tsx
import type { Locale } from '@/lib/intake/types'
import type { EcosystemData } from '@/lib/course/ecosystem'

export function EcosystemDiagram({ data, locale = 'ru' }: { data: EcosystemData; locale?: Locale }) {
  const soon = locale === 'en' ? 'soon' : 'скоро'

  return (
    <section style={{
      padding: 'var(--section-gap) 2rem',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
    }}>
      <style>{`
        .eco-sr-only {
          position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
        }
        @media (max-width: 720px) {
          .eco-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Screen-reader semantic version of the diagram */}
      <div className="eco-sr-only">
        <h3>{data.heading}</h3>
        {data.pillars.map((p) => (
          <div key={p.key}>
            <h4>{p.title}</h4>
            <ul>
              {p.nodes.map((n, i) => (
                <li key={i}>{n.label}{n.status === 'planned' ? ` (${soon})` : ''}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1rem',
        }}>
          {data.eyebrow}
        </div>
        <h2 style={{ marginTop: 0, marginBottom: '2.5rem', color: 'var(--text-primary)' }}>
          {data.heading}
        </h2>

        <div className="eco-grid" aria-hidden="true" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1.25rem',
        }}>
          {data.pillars.map((p) => (
            <div key={p.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-accent)',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem',
              }}>
                {p.title}
              </div>
              {p.nodes.map((n, i) => {
                const planned = n.status === 'planned'
                return (
                  <div key={i} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg-surface)',
                    padding: '0.85rem',
                    opacity: planned ? 0.55 : 1,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{n.label}</span>
                      {planned && (
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius)',
                          padding: '0.1rem 0.4rem',
                          whiteSpace: 'nowrap',
                        }}>
                          {soon}
                        </span>
                      )}
                    </div>
                    {n.desc && (
                      <p style={{ margin: '0.4rem 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                        {n.desc}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Typecheck the component**

Run: `cd LMS/tochka-sborki/web && npx tsc --noEmit`
Expected: PASS (no type errors) — this typechecks the new component against the Task-1 `EcosystemData` type. Also run `npx vitest run` and expect the suite to stay green.

- [ ] **Step 3: Commit**

```bash
git add LMS/tochka-sborki/web/components/ecosystem-diagram.tsx
git commit -m "feat(lms): ecosystem diagram component (3-pillar columns, a11y, responsive)"
```

---

### Task 3: Embed the diagram on the landing page

**Files:**
- Modify: `LMS/tochka-sborki/web/components/pages/home-page.tsx`

**Interfaces:**
- Consumes: `EcosystemDiagram` from `@/components/ecosystem-diagram` (Task 2); `getEcosystem` from `@/lib/course/ecosystem` (Task 1).
- Produces: the diagram rendered as a landing section.

`home-page.tsx` is `export function HomePage({ locale }: Props)` and already imports `ProgramVenn` from `@/components/program-venn`. Add the ecosystem diagram as a new section near ProgramVenn. Additive — do not change existing sections.

- [ ] **Step 1: Add the imports**

At the top of `LMS/tochka-sborki/web/components/pages/home-page.tsx`, after the existing `import { ProgramVenn } from '@/components/program-venn'` line, add:

```tsx
import { EcosystemDiagram } from '@/components/ecosystem-diagram'
import { getEcosystem } from '@/lib/course/ecosystem'
```

- [ ] **Step 2: Render the diagram near ProgramVenn**

Find where `<ProgramVenn ... />` is rendered in the JSX. Immediately after that element, add:

```tsx
      <EcosystemDiagram data={getEcosystem(locale)} locale={locale} />
```

(`locale` is already in scope from `HomePage({ locale })`. If `ProgramVenn` is rendered with a `locale` prop, mirror that; if it is rendered with no props, still pass `data`/`locale` to `EcosystemDiagram` as shown — it requires `data`.)

- [ ] **Step 3: Verify the suite + static build**

Run: `cd LMS/tochka-sborki/web && npx vitest run && npm run build`
Expected: vitest PASS (incl. the Task-1 ecosystem test); `next build` succeeds (full typecheck of the component + data + embed) and the static export completes.

Confirm the home page emitted: `ls LMS/tochka-sborki/web/out/index.html LMS/tochka-sborki/web/out/en/index.html`
Expected: both exist.

- [ ] **Step 4: Commit**

```bash
git add LMS/tochka-sborki/web/components/pages/home-page.tsx
git commit -m "feat(lms): embed ecosystem diagram on the landing page"
```

---

## Out of scope

- Use-case gallery (`fb_e9649b38d80e`).
- Real CONNECT/PROVE features (community, golden ticket) — placeholder nodes only.
- Dedicated `/ecosystem` page.
- Per-node drill-down / step-by-step replay.
- Any change to existing home-page sections, ProgramVenn, or other components.
