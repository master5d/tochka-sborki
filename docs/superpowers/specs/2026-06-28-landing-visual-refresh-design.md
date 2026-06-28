# Landing visual refresh — Design

**Ticket:** `fb_fb9fc1f8da31` (Landing visual refresh / brand-style pass: dark hero, badge stat
blocks, clean sectioning, gradient accents — Mindvalley reference).

**Date:** 2026-06-28

## Goal

A principle-based brand-polish pass on the hub landing (`mamaev.coach`), adding the two elements
the page is actually missing — **gradient accents** and an honest **badge row** — plus a subtle
**hero glow** for depth, without a redesign and without any of the inauthentic devices the ticket
bans.

## Decision (owner, at design gate)

The ticket is reference-driven (Mindvalley screenshots in a OneDrive folder not visible to the
implementer) and consolidating ("more screenshots may follow"). The owner chose a **principle-based
blind pass**: a tightly-scoped, token-based polish on the existing landing, validated by an
ASCII mockup at the design gate and an approval gate — no reference files needed.

## Scope (carved by honest triage)

The landing (`hub/components/home-page.tsx`) is **already** dark, cleanly sectioned, and brand-styled
(Unbounded display + Geist Mono + neon accent, constructivist), and already avoids the entire
ban-list. The real delta versus what exists:

- **In scope:** gradient accent tokens + their application (hero eyebrow gradient text; project-card
  accent bar as a gradient fade); a subtle hero glow; an honest non-vanity badge row under the hero
  bio; a dictionary entry for the badges + a guard test.
- **Out of scope (carved):**
  - A full redesign, new sections, or new copy beyond the badges.
  - Mindvalley-specific layouts (the reference screenshots aren't visible).
  - Light-theme work beyond token parity (every new token is defined in both themes).
  - **The ban-list (binding):** countdown timers, vanity stats, press-logo walls, glossy photo
    testimonials, hard pricing push — none added.

## Architecture

CSS-token + content + one-component change. Two reusable gradient tokens go in
`hub/themes/model-kit.css` (both `[data-theme]` blocks). Badge content goes in
`hub/lib/dictionaries.ts` (the hub's content home, per project convention; bilingual). The render
changes live in `hub/components/home-page.tsx` (inline-style component). A vitest guard pins the
badges as present + non-vanity.

## Component

### `hub/themes/model-kit.css` (modified — add 2 tokens per theme)

In the `[data-theme="dark"]` block, after the phase vars, add:

```css
  --accent-gradient: linear-gradient(120deg, var(--phase-1), var(--phase-2));
  --hero-glow: radial-gradient(55% 45% at 18% 0%, rgba(0, 209, 255, 0.13), transparent 70%);
```

In the `[data-theme="light"]` block, after the phase vars, add:

```css
  --accent-gradient: linear-gradient(120deg, var(--phase-1), var(--phase-2));
  --hero-glow: radial-gradient(55% 45% at 18% 0%, rgba(0, 119, 204, 0.08), transparent 70%);
```

(`--accent-gradient` resolves the per-theme `--phase-1`/`--phase-2`; the glow alpha is tuned per
theme — stronger on dark, faint on light paper.)

### `hub/lib/dictionaries.ts` (modified)

Add to the `Dictionary` interface (after `bio: string`):

```ts
  heroBadges: string[]
```

Add the values (honest, qualitative, non-vanity — derived from existing facts):

- ru: `heroBadges: ['9 модулей', 'RU · EN', 'бесплатно', 'agent-agnostic'],`
- en: `heroBadges: ['9 modules', 'RU · EN', 'free', 'agent-agnostic'],`

Place the field right after `bio` in each locale object.

### `hub/components/home-page.tsx` (modified)

Four targeted edits inside the HERO section; everything else byte-identical.

1. **Hero glow.** Make the hero section positioned and clip the glow: add `position: 'relative'`
   and `overflow: 'hidden'` to the existing `.hub-hero` `<section>` style object. As the section's
   first child, add a decorative layer:

   ```tsx
   <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'var(--hero-glow)', pointerEvents: 'none', zIndex: 0 }} />
   ```

   Wrap the existing hero inner content (the eyebrow `<div>`, `<h1>`, bio `<p>`, badge row, links
   `<p>`) in a single positioning wrapper so it paints above the glow:

   ```tsx
   <div style={{ position: 'relative', zIndex: 1 }}>
     {/* eyebrow, h1, bio, badges, links */}
   </div>
   ```

2. **Hero eyebrow gradient text.** Change the hero eyebrow `<div>` (the `{t.tagline}` one) style:
   replace `color: 'var(--text-accent)'` with gradient-clipped text:

   ```tsx
     background: 'var(--accent-gradient)',
     WebkitBackgroundClip: 'text',
     backgroundClip: 'text',
     color: 'transparent',
     WebkitTextFillColor: 'transparent',
   ```

   (Only the hero eyebrow; the pitch/founder/projects eyebrows stay flat to avoid a "loud" look.)

3. **Badge row.** Immediately after the bio `<p>` and before the links `<p>`, render:

   ```tsx
   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1.75rem' }}>
     {t.heroBadges.map(b => (
       <span key={b} style={{
         fontFamily: 'var(--font-mono)',
         fontSize: '0.75rem',
         color: 'var(--text-secondary)',
         background: 'var(--bg-secondary)',
         border: '1px solid var(--border-color)',
         borderRadius: 'var(--radius)',
         padding: '0.4rem 0.8rem',
         letterSpacing: '0.04em',
       }}>{b}</span>
     ))}
   </div>
   ```

4. **Project-card accent bar → gradient fade.** In the PROJECTS section, the per-card left accent
   bar currently uses `background: p.color`. Change it to a vertical gradient fade of the card's own
   color (keeps per-card identity, adds the gradient accent):

   ```tsx
     background: `linear-gradient(180deg, ${p.color}, transparent)`,
   ```

### `hub/lib/dictionaries.hero-badges.test.ts` (new)

Mirrors the existing `dictionaries.founder.test.ts` style:

```ts
import { describe, it, expect } from 'vitest'
import { dictionaries } from './dictionaries'

describe('hero badges', () => {
  const vanity = /\d{3,}|★|студент|клиент|подписчик|students|clients|followers|users|\d+\s*\+/i
  for (const loc of ['ru', 'en'] as const) {
    it(`${loc}: present, non-empty, >= 3`, () => {
      const b = dictionaries[loc].heroBadges
      expect(Array.isArray(b)).toBe(true)
      expect(b.length).toBeGreaterThanOrEqual(3)
      for (const x of b) expect(x.trim().length).toBeGreaterThan(0)
    })
    it(`${loc}: no vanity-metric framing`, () => {
      for (const x of dictionaries[loc].heroBadges) {
        expect(vanity.test(x), `vanity framing: ${x}`).toBe(false)
      }
    })
  }
})
```

(The single digit in «9 модулей» / «9 modules» passes — the guard bans 3+-digit counts, `★`,
`N+`, and audience-count words, not all numerals.)

## Data flow

Static. The component reads `getDictionary(locale)` (now including `heroBadges`); CSS tokens resolve
per active `data-theme`. No endpoint, no client state.

## Authenticity (binding)

- Honors the ticket's explicit ban-list: NO countdown, NO vanity stats (the badge guard enforces
  qualitative-only), NO press-logo wall, NO photo testimonials, NO hard pricing push.
- Badges are honest, qualitative facts (modules / bilingual / free / agent-agnostic) — signal, not
  metrics.
- Gradient stays subtle (single hero-eyebrow gradient + soft glow + per-card fade) — deliberately
  avoiding the "loud AI-generated" look.

## Testing

- `hub/lib/dictionaries.hero-badges.test.ts`: badges present both locales (≥3, non-empty) +
  anti-vanity guard.
- Validated by `cd hub && npm run build` (the visual changes compile; hero + projects render).

Run: `cd hub && npx vitest run` then `npm run build`.

## Global constraints

- Files under `hub/` (the apex landing → `mamaev.coach`). Static.
- Bilingual ru + en (badges in both locales).
- Token-based: new gradient tokens defined in BOTH `[data-theme]` blocks (dark + light parity).
- UI text in `dictionaries.ts` (per project convention), not hardcoded in the component.
- Additive: existing sections, copy, and theme tokens stay byte-identical apart from the listed
  insertions/edits.

## Files

| File | Responsibility |
|---|---|
| `hub/themes/model-kit.css` | `--accent-gradient` + `--hero-glow` tokens (both themes) |
| `hub/lib/dictionaries.ts` | `heroBadges` field + ru/en honest non-vanity values |
| `hub/components/home-page.tsx` | hero glow + eyebrow gradient text + badge row + card-bar gradient |
| `hub/lib/dictionaries.hero-badges.test.ts` | badges present both locales + anti-vanity guard |

## Out of scope

- Full redesign / new sections / new copy beyond badges; Mindvalley-specific layouts; light-theme
  beyond token parity; countdown / vanity stats / press wall / photo testimonials / pricing push.
