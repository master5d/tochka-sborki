# Landing Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A principle-based brand-polish pass on the hub landing (`mamaev.coach`) — gradient accent tokens, a subtle hero glow, an honest non-vanity badge row, and a per-card gradient accent — with zero inauthentic devices.

**Architecture:** CSS-token + content + one-component change. Two reusable gradient tokens in `hub/themes/model-kit.css` (both `[data-theme]` blocks); badge content in `hub/lib/dictionaries.ts` (bilingual); render changes in `hub/components/home-page.tsx` (inline-style component). A vitest guard pins the badges present + non-vanity.

**Tech Stack:** Next.js (standalone `hub/` app, static export), TypeScript, CSS custom properties, Vitest.

## Global Constraints

- All files under `hub/` (the apex landing → `mamaev.coach`). Static. Run tests: `cd hub && npx vitest run`. Build: `cd hub && npm run build`.
- Bilingual ru + en (badges in both locales).
- Token-based: new gradient tokens defined in BOTH `[data-theme]` blocks (dark + light parity).
- UI text in `dictionaries.ts` (project convention), not hardcoded in the component.
- Additive: existing sections, copy, and theme tokens stay byte-identical apart from the listed insertions/edits.
- **Ban-list (binding):** NO countdown, NO vanity stats, NO press-logo wall, NO photo testimonials, NO hard pricing push. Badges are qualitative-only (the guard enforces it). Gradient stays subtle (avoid the "loud AI-generated" look).
- The student/learner counter is OUT of this slice (it is owner-gated /admin + a worker endpoint — a separate slice). Do not add any counter here.

---

### Task 1: gradient tokens + hero-badges dictionary entry + guard test

**Files:**
- Modify: `hub/themes/model-kit.css`
- Modify: `hub/lib/dictionaries.ts`
- Test: `hub/lib/dictionaries.hero-badges.test.ts` (new)

**Interfaces:**
- Consumes: the existing `Dictionary` interface + `dictionaries` map in `hub/lib/dictionaries.ts`; the `--phase-1`/`--phase-2` vars in `model-kit.css`.
- Produces: CSS tokens `--accent-gradient` + `--hero-glow` (both themes); `Dictionary.heroBadges: string[]` consumed by Task 2's component.

- [ ] **Step 1: Add the failing test**

Create `hub/lib/dictionaries.hero-badges.test.ts` (mirrors `dictionaries.founder.test.ts`):

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

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd hub && npx vitest run lib/dictionaries.hero-badges.test.ts`
Expected: FAIL — `dictionaries.ru.heroBadges` is `undefined` (field not added yet); the `.length`/iteration throws or fails.

- [ ] **Step 3: Add the `heroBadges` field to the interface + both locales**

In `hub/lib/dictionaries.ts`:

(a) In the `Dictionary` interface, add the field immediately after `bio: string`:

```ts
  bio: string
  heroBadges: string[]
```

(b) In the `ru` dictionary object, add immediately after the `bio: '...'` line:

```ts
    heroBadges: ['9 модулей', 'RU · EN', 'бесплатно', 'agent-agnostic'],
```

(c) In the `en` dictionary object, add immediately after the `bio: '...'` line:

```ts
    heroBadges: ['9 modules', 'RU · EN', 'free', 'agent-agnostic'],
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd hub && npx vitest run lib/dictionaries.hero-badges.test.ts`
Expected: PASS — both locales have ≥3 non-empty badges, none matching the vanity pattern (the single digit in «9 модулей» / «9 modules» is allowed).

- [ ] **Step 5: Add the gradient tokens (both themes)**

In `hub/themes/model-kit.css`, in the `[data-theme="dark"]` block, after the `--phase-4: #ff44aa;` line, add:

```css
  --accent-gradient: linear-gradient(120deg, var(--phase-1), var(--phase-2));
  --hero-glow: radial-gradient(55% 45% at 18% 0%, rgba(0, 209, 255, 0.13), transparent 70%);
```

In the `[data-theme="light"]` block, after the `--phase-4: #b51d6e;` line, add:

```css
  --accent-gradient: linear-gradient(120deg, var(--phase-1), var(--phase-2));
  --hero-glow: radial-gradient(55% 45% at 18% 0%, rgba(0, 119, 204, 0.08), transparent 70%);
```

- [ ] **Step 6: Run the full hub suite (no regression)**

Run: `cd hub && npx vitest run`
Expected: PASS — full suite green (hero-badges + existing dictionaries/events/site tests).

- [ ] **Step 7: Commit**

```bash
git add hub/themes/model-kit.css hub/lib/dictionaries.ts hub/lib/dictionaries.hero-badges.test.ts
git commit -m "feat(hub): gradient tokens + honest hero badges (fb_fb9fc1f8da31)"
```

---

### Task 2: apply the refresh in the home page

**Files:**
- Modify: `hub/components/home-page.tsx`

**Interfaces:**
- Consumes: `--accent-gradient` + `--hero-glow` tokens and `t.heroBadges` from Task 1.
- Produces: the visual changes (build-validated; no unit test for the component).

The four edits below are all inside `hub/components/home-page.tsx`. Everything else stays byte-identical.

- [ ] **Step 1: Hero glow + content wrapper**

The HERO `<section className="hub-hero" ...>` currently opens with a style object then the eyebrow `<div>`. Two changes:

(1) Add `position: 'relative'` and `overflow: 'hidden'` to that section's style object (it currently has `padding`, `maxWidth`, `margin`):

```tsx
      <section className="hub-hero" style={{
        padding: '6rem 2rem 3rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}>
```

(2) As the section's first child (before the eyebrow `<div>`), add the decorative glow, then wrap ALL the existing hero inner content (the eyebrow `<div>`, the `<h1>`, the bio `<p>`, and the links `<p>`) in a single relative wrapper so it paints above the glow:

```tsx
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'var(--hero-glow)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* existing eyebrow <div>, <h1>, bio <p>, (badge row from Step 3), links <p> go here */}
        </div>
```

Ensure the wrapper's closing `</div>` sits just before the section's closing `</section>`.

- [ ] **Step 2: Hero eyebrow → gradient text**

In the hero eyebrow `<div>` (the one rendering `{t.tagline}`), replace the `color: 'var(--text-accent)',` line with the gradient-clip block:

```tsx
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          background: 'var(--accent-gradient)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          {t.tagline}
        </div>
```

(Only the hero eyebrow — the pitch/founder/projects eyebrows stay flat.)

- [ ] **Step 3: Badge row**

Immediately after the hero bio `<p>` (the one rendering `{t.bio}`) and before the links `<p>` (the one with `→ Блог` / Events), insert:

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

(This sits inside the relative wrapper from Step 1.)

- [ ] **Step 4: Project-card accent bar → gradient fade**

In the PROJECTS section, the per-card decorative left bar currently has `background: p.color,`. Change that one line to a vertical gradient fade of the card's own color:

```tsx
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '3px',
                  height: '100%',
                  background: `linear-gradient(180deg, ${p.color}, transparent)`,
                }} />
```

- [ ] **Step 5: Typecheck + build**

Run: `cd hub && npm run build`
Expected: PASS — TypeScript accepts `t.heroBadges` (now on `Dictionary`) and the style objects; the static export of `/` and `/en/` compiles with the glow, gradient eyebrow, badge row, and gradient card bars.

- [ ] **Step 6: Full suite (no regression)**

Run: `cd hub && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 7: Commit**

```bash
git add hub/components/home-page.tsx
git commit -m "feat(hub): hero glow + gradient accents + badge row (fb_fb9fc1f8da31)"
```

---

## Self-Review

**Spec coverage:**
- Gradient tokens `--accent-gradient` + `--hero-glow` in both themes → Task 1 (Step 5). ✓
- `heroBadges` field + ru/en honest non-vanity values → Task 1 (Step 3). ✓
- Anti-vanity + presence guard test → Task 1 (Step 1). ✓
- Hero glow (decorative, aria-hidden, above-content wrapper) → Task 2 (Step 1). ✓
- Hero eyebrow gradient text → Task 2 (Step 2). ✓
- Badge row under bio → Task 2 (Step 3). ✓
- Project-card accent bar gradient fade → Task 2 (Step 4). ✓
- Build-validated visual changes → Task 2 (Step 5). ✓
- Additive (existing sections/copy/tokens unchanged) → respected. ✓
- Ban-list honored (no counter, no vanity, no countdown/press/testimonials/pricing) → nothing added; counter explicitly carved to a separate slice. ✓

**Placeholder scan:** none — every code step carries full content with exact values from the spec.

**Type consistency:** `heroBadges: string[]` is added to the `Dictionary` interface (Task 1) and consumed as `t.heroBadges` in the component (Task 2, Step 3) — names match. The CSS tokens `--accent-gradient`/`--hero-glow` defined in Task 1 (Step 5) match the `var(--accent-gradient)`/`var(--hero-glow)` references in Task 2 (Steps 1, 2). The card-bar edit keeps the per-project `p.color` (existing `Project.color` field). ✓
