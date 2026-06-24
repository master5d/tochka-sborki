# Ecosystem diagram (Learn·Connect·Prove) — Design

**Tickets:** `fb_7b2c9c5d8795` (single 'ecosystem' diagram — show all support pillars at a
glance) merged with `fb_e3399aa4efa2` ('Learn / Connect / Prove' 3-pillar platform
framework). Honest triage merged these: the 3-pillar framework is a structural lens, not an
independently buildable feature, and it lands AS the structure of the ecosystem diagram.

**Date:** 2026-06-24

## Goal

Give a newcomer a single at-a-glance picture of the course's whole support system, organized
by the DIY-university Learn / Connect / Prove lens. A bespoke React diagram (no Mermaid),
data-driven, embedded on the landing page for conversion clarity, honest about which pillars
are live versus planned.

## Scope (carved by honest triage of the B1 diagram batch)

- **In scope:** the ecosystem diagram component + its course data, structured by the three
  pillars, embedded on the landing home page.
- **Out of scope (deferred):**
  - `fb_e9649b38d80e` (Manus-style use-case gallery) — a different mechanic that enhances the
    existing `components/showcase-gallery.tsx`; its own slice.
  - The real CONNECT/PROVE features (S.A.S.H.A community `fb_1319cb1286a9`, golden
    'Academy admission' credential `fb_6ded7b0b7980`) — shown here only as `planned` nodes,
    not built.
  - A dedicated `/ecosystem` page (YAGNI — landing embed only).
  - Per-node drill-down / replay.

## Architecture

A bespoke, props-driven React component (the reusable engine) plus course-specific data in
`lib/course/`, following the established engine + course-data split (siblings:
`lib/course/showcase.ts`, `lib/course/niche-map.ts`). The component renders three pillar
columns, each holding node cards; it carries a screen-reader semantic fallback and collapses
the columns to a vertical stack on mobile — the same idiom as the existing
`components/program-venn.tsx`. Inline styles + CSS custom properties; bilingual via a
`locale` prop reading the data layer. No network, no state, no storage.

## Components

### `lib/course/ecosystem.ts` (new)

Types and bilingual data:

```ts
import type { Locale } from '@/lib/dictionaries'

export type NodeStatus = 'live' | 'planned'

export interface EcoNode {
  label: string
  desc?: string
  status: NodeStatus
}

export interface EcoPillar {
  key: 'learn' | 'connect' | 'prove'
  title: string
  nodes: EcoNode[]
}

export interface EcosystemData {
  eyebrow: string
  heading: string
  pillars: EcoPillar[]   // exactly three, in order: learn, connect, prove
}

export function getEcosystem(locale: Locale): EcosystemData
```

Course nodes for Точка Сборки (honest live/planned split):

- **learn** (all `live`): Курс (9 модулей) · AI-напарник (companion) · Learn-with-AI handoff ·
  Материалы / Программа (syllabus).
- **connect** (all `planned`): Комьюнити S.A.S.H.A · Кросс-курс companion.
- **prove** (mixed): Сертификат (`live` — `/certificate` exists) · Golden «Academy admission»
  ticket (`planned`) · Showcase-портфолио (`planned`).

Each `planned` node's copy stays honest — no dates, no hype; the UI marks it "скоро"/"soon".

### `components/ecosystem-diagram.tsx` (new)

Generic engine: `export function EcosystemDiagram({ data, locale }: { data: EcosystemData; locale?: Locale }): JSX.Element`.

- Renders an outer `<section>` (ProgramVenn idiom: section label/eyebrow + heading).
- Three pillar columns from `data.pillars`, each a header (`title`) + a list of node cards.
- A node card shows `label` (+ optional `desc`). `planned` nodes are visually dimmed and
  carry a "скоро" (ru) / "soon" (en) badge; `live` nodes are full-strength.
- Screen-reader semantic version (`sr-only`): `<h3>{heading}</h3>` then, per pillar, the
  title and a `<ul>` of nodes annotated with their status. Mirrors ProgramVenn's `sr-only`
  block.
- Responsive: a `<style>` block collapses the three-column grid to a single column on
  `max-width: 720px` (ProgramVenn idiom).
- The "скоро"/"soon" badge label is locale-derived inside the component (the only locale
  branch in the component; everything else comes from `data`).

### `components/pages/home-page.tsx` (modified)

Render `<EcosystemDiagram data={getEcosystem(locale)} locale={locale} />` as a new landing
section, placed near the existing `ProgramVenn`. The `locale` prop is already in scope
(`HomePage({ locale })`). Additive — do not alter existing sections.

## Data flow

Static. `getEcosystem(locale)` returns pure data; the component renders it. No endpoint, no
fetch, no storage, no client state.

## Error handling

Pure functions over a closed locale union and a fixed three-pillar shape; no runtime failure
modes. Unknown statuses cannot occur (the union is `'live' | 'planned'`).

## Authenticity (binding)

- `planned` nodes are clearly marked not-yet-live ("скоро"/"soon") and visually distinct —
  never presented as available.
- No hype, no fabricated dates, no scarcity. The diagram states what exists and what is
  planned, plainly.

## Testing

- **`lib/course/ecosystem.test.ts` (new):** for `'ru'` and `'en'`, `getEcosystem` returns
  exactly three pillars with keys `['learn', 'connect', 'prove']` in order; every pillar has a
  non-empty `nodes` array; every node's `status` is `'live'` or `'planned'`; at least one
  `planned` node exists (the connect/prove placeholders); `eyebrow`, `heading`, and every
  node `label` are non-empty; the ru and en datasets differ (bilingual, not a copy).
- The component is presentational (like ProgramVenn — untested at the unit level); it is
  validated by `next build` (full typecheck + static export) when embedded on the home page.

Run: `cd LMS/tochka-sborki/web && npx vitest run lib/course/ecosystem.test.ts` and the full
`npx vitest run`; plus `npm run build` for the embed.

## Global constraints

- All files under `LMS/tochka-sborki/web/`. Static export (`output: 'export'`).
- Bilingual ru + en in all course data and the badge label.
- Engine + course-data split: the component is generic (takes `data` as a prop); the
  Точка-Сборки nodes live in `lib/course/ecosystem.ts` (sibling convention with
  `showcase.ts` / `niche-map.ts`).
- No Mermaid — bespoke React/CSS, following the `program-venn.tsx` idiom (a11y sr-only +
  responsive collapse).
- Additive: do not alter existing home-page sections, ProgramVenn, or other components.

## Files

| File | Responsibility |
|---|---|
| `lib/course/ecosystem.ts` | types + `getEcosystem(locale)` bilingual course data |
| `lib/course/ecosystem.test.ts` | data-layer tests |
| `components/ecosystem-diagram.tsx` | generic 3-pillar diagram engine (+ a11y + responsive) |
| `components/pages/home-page.tsx` | embed the diagram on the landing |

## Out of scope

- Use-case gallery (`fb_e9649b38d80e`).
- Real CONNECT/PROVE features (community, golden ticket) — placeholder nodes only.
- Dedicated `/ecosystem` page.
- Per-node drill-down / step-by-step replay.
