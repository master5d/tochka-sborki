# `<AnnotatedExample>` MDX Component — Design

**Ticket:** `fb_e92087192011` (reusable "exploded anatomy" MDX component for the LMS content engine).
**Paired (separate, NOT in scope):** `fb_2e3ffcf70af2` (apply it as "Anatomy of a Prompt" in module 04 + cheatsheet — course content).

**Date:** 2026-06-23

## Goal

Give the LMS content engine a reusable MDX component that renders one concrete
example string (a prompt, CLI command, install one-liner, query, config line) as
color-coded numbered tokens, each linked to a callout box explaining that part —
the "exploded anatomy" teaching device. Any lesson or the cheatsheet can drop it
in. This ticket builds ONLY the engine component; authoring real annotated
examples is the paired course ticket.

## Honest-triage note (verified)

- Nothing like it exists. `components/mdx-components.tsx` registers
  `OsBlock, OsToggle, AgentBlock, AgentToggle, StackMatrix, Phase, VideoCheckpoint,
  Walkthrough` — no anatomy/annotation component.
- Established pattern (from `StackMatrix`, `VideoCheckpoint`): components live in
  `LMS/tochka-sborki/web/components/`, registered in `mdx-components.tsx`, style via
  CSS vars (`--text-accent`, `--bg-surface`, `--border-color`, `--radius`,
  `--font-mono`), use an accent-color map of `{ border, bg, text }` rgba triples,
  and go responsive with an inline `<style>` media query (`@media (max-width:720px)`).
  `'use client'` is used ONLY when a component holds state.
- `lib/content/` already exists (`protected-content.ts`, `reflection-prompts.ts`) —
  the pure helper belongs there.

`<AnnotatedExample>` is purely presentational, so it is a **server component** (no
`'use client'`). Unlike `StackMatrix` (which hardcodes its data), this is **props-
driven** because the engine must reuse it across courses.

## Decisions locked during brainstorming

1. **Connector device = numbered badge + shared accent color, NOT drawn lines.**
   Each token carries a circled number (①②③) and an accent tint; each callout
   repeats the same number + accent. No SVG, no position measurement, no JS — robust
   under static export, accessible, and the responsive stacked-fallback comes for free.
2. **Props-driven, copy-agnostic.** `segments: Segment[]` passed from MDX; all
   user-facing copy lives in the lesson's `.mdx` (bilingual handled by the RU/EN MDX
   mirror, not the component).
3. **Palette of 6 accents** (`lime, cyan, amber, magenta, violet, rose`) so a
   5-part prompt anatomy (role/context/task/constraints/output-format) fits with
   headroom. Same rgba-triple style as `StackMatrix.ACCENT_COLORS`.
4. **`mono` flag** (default `true`): CLI/commands/config render monospace; an author
   sets `mono={false}` for prose prompts.
5. **Graceful resolution**: an unknown or missing `accent` resolves to a fallback
   color (never `undefined`); an empty `segments` array renders nothing/`[]` without
   throwing.
6. Static export, no server/data/migration, no new dependency.

## Components

### `lib/content/annotated-example.ts` (pure — the only logic)

```ts
export type Accent = 'lime' | 'cyan' | 'amber' | 'magenta' | 'violet' | 'rose'

export interface AccentColor { border: string; bg: string; text: string }

export interface Segment {
  text: string    // the literal token as it appears in the example (e.g. "Ты — senior Python-разработчик")
  label: string   // short name of the part (e.g. "роль")
  note: string    // the callout explanation
  accent: Accent
}

export interface AnatomyToken {
  n: number       // 1-based sequential number
  text: string
  label: string
  note: string
  color: AccentColor
}

export const ACCENT: Record<Accent, AccentColor>   // 6 entries, rgba triples
export function buildAnatomy(segments: Segment[]): AnatomyToken[]
```

`buildAnatomy` logic:
- maps each segment to an `AnatomyToken`: `n = index + 1`; `color = ACCENT[accent] ?? FALLBACK`
  (where `FALLBACK` is a defined neutral/first-palette triple — never `undefined`);
  `text/label/note` copied through unchanged.
- empty input → `[]`. Pure, no side effects.

### `components/annotated-example.tsx` (server component, presentational)

```tsx
export function AnnotatedExample(props: {
  segments: Segment[]
  caption?: string
  mono?: boolean   // default true
}): React.JSX.Element
```

- Calls `buildAnatomy(segments)` once.
- Optional `caption` rendered as a mono eyebrow above the example.
- **Example line** (`<p>`/`<div>`): each token a `<span>` with the accent `bg` tint,
  an accent underline/border-bottom, the token `text`, and a superscript circled
  number badge in the accent `text` color. Font is `var(--font-mono)` when `mono`,
  else inherit. Tokens render inline in order, separated by a single space.
- **Callout grid** below: `display:grid; gridTemplateColumns: repeat(auto-fit, minmax(220px,1fr)); gap`.
  Each callout = a numbered badge (accent `bg`+`text`), the `label` (accent `text`,
  mono, uppercase-ish), and the `note` (`--text-secondary`). Card styled with
  `--bg-surface` + `--border-color` + `--radius`, accent left border.
- Responsive: inline `<style>` with `@media (max-width:720px){ .anatomy-grid{ grid-template-columns:1fr } }`
  (mirrors `StackMatrix`), so callouts stack on mobile.
- Accessibility: decorative glyphs `aria-hidden`; the numbers are real text, so the
  token→callout correspondence is conveyed to screen readers.

### `components/mdx-components.tsx` (modified)

Add `import { AnnotatedExample } from './annotated-example'` and include
`AnnotatedExample` in the exported `mdxComponents` object (alongside `VideoCheckpoint`
etc.), making `<AnnotatedExample segments={…} />` available in any `.mdx`.

## Data flow

```
lesson .mdx → <AnnotatedExample segments caption mono/>
  → buildAnatomy(segments) → AnatomyToken[]
    → example line: numbered accent-tinted token spans
    → callout grid: numbered accent cards (label + note)
```

## Edge cases

- **Unknown/missing accent** → `ACCENT[accent] ?? FALLBACK`; renders in the fallback
  color, no crash.
- **Empty `segments`** → `buildAnatomy` returns `[]`; the component renders just the
  optional caption (or nothing). Not expected in real authoring, but must not throw.
- **Single segment** → one token, one callout, numbered ①.
- **Long token text / line wrap** → tokens wrap naturally as inline spans; no SVG to
  misalign (the whole reason for the badge connector).
- **Narrow viewport** → callout grid collapses to one column.

## Testing (vitest env=node — pure helper only)

`lib/content/annotated-example.test.ts`:
- `buildAnatomy` numbers tokens 1..n sequentially for a 3-segment input.
- resolves a known accent (e.g. `cyan`) to its exact `ACCENT.cyan` triple.
- unknown accent (cast through `as Accent`) → returns the `FALLBACK` triple, not `undefined`.
- empty array → `[]`.
- preserves `text`, `label`, `note` verbatim on each token.

The component itself is NOT unit-tested (repo convention — UI verified by a green
`npm run build`; once registered in `mdx-components.tsx`, the build type-checks it).

## Files

| File | Responsibility |
|---|---|
| `lib/content/annotated-example.ts` | `Accent`, `Segment`, `AnatomyToken`, `ACCENT` map, `buildAnatomy` |
| `lib/content/annotated-example.test.ts` | helper tests |
| `components/annotated-example.tsx` | presentational render (token line + callout grid, responsive) |
| `components/mdx-components.tsx` | register `AnnotatedExample` |

No server, data, migration, or new dependency. ~2 TDD tasks.

## Out of scope

- Authoring real annotated examples / placing them in module 04 or the cheatsheet —
  that is the paired course ticket `fb_2e3ffcf70af2`.
- SVG/line connectors (rejected for fragility under static export + responsive).
- Interactive behavior (hover-highlight token↔callout, click-to-expand) — YAGNI;
  the static numbered mapping teaches the structure. A future ticket can add it.
- A live demo page — registration in `mdx-components.tsx` is the engine deliverable.
