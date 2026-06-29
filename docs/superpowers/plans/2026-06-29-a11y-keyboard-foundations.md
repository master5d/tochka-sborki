# A11y Keyboard-Nav Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the missing keyboard + low-vision accessibility foundations site-wide for the Точка Сборки LMS — a visible focus indicator, `prefers-reduced-motion` respect, and a skip-to-content link.

**Architecture:** Three additive `app/globals.css` rules + one shared `SkipLink` component rendered first inside the shared `Nav` + `id="main-content" tabIndex={-1}` on the six core learner-journey `<main>` landmarks. Guarded by a source-presence test (no DOM render infra exists).

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`), TypeScript, Tailwind v4 (reset only; a11y CSS lives in globals.css), Vitest. No new dependencies.

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Scoped: `npm run test -- lib/a11y/keyboard.test.ts`.
- `Locale` (`'ru' | 'en'`) is imported from `@/lib/dictionaries`.
- Keyboard-a11y CSS lives in `app/globals.css` (components use inline styles, not Tailwind utilities) — exact rules given verbatim below.
- Skip-link uses `:focus-visible` semantics: focus ring is keyboard-only (mouse clicks must NOT show the ring).
- Focus ring + skip-link colors use existing tokens: `--text-accent`, `--bg-primary` (no new colors).
- Skip-link target `id="main-content" tabIndex={-1}` is added to exactly these 6 shells this slice: `mdx-page`, `module-page`, `unit-page`, `home-page`, `certificate-page`, `lesson-layout`. One-off pages are a deferred follow-on — do NOT touch them.
- Additive only: no existing behavior changes.
- Commit directly to `main` (trunk-based). Do NOT create a feature branch.
- No new dependencies.

---

### Task 1: Global a11y CSS rules + SkipLink component + Nav wiring

**Files:**
- Modify: `app/globals.css` (append 3 rules)
- Create: `components/skip-link.tsx`
- Modify: `components/nav.tsx` (import SkipLink; wrap return in a fragment with SkipLink first)
- Test: `lib/a11y/keyboard.test.ts`

**Interfaces:**
- Consumes: `Locale` from `@/lib/dictionaries`.
- Produces: `function SkipLink({ locale }: { locale: Locale }): JSX.Element` (renders `<a class="skip-link" href="#main-content">`); the `.skip-link`, `:focus-visible`, and reduced-motion CSS contracts.

- [ ] **Step 1: Write the failing test**

Create `lib/a11y/keyboard.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, '..', '..') // web/
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')

describe('keyboard-nav a11y foundations', () => {
  it('globals.css defines a visible :focus-visible outline', () => {
    expect(read('app/globals.css')).toMatch(/:focus-visible\s*\{[^}]*outline/)
  })
  it('globals.css respects prefers-reduced-motion', () => {
    expect(read('app/globals.css')).toContain('prefers-reduced-motion: reduce')
  })
  it('globals.css defines a .skip-link revealed on focus', () => {
    const css = read('app/globals.css')
    expect(css).toContain('.skip-link')
    expect(css).toMatch(/\.skip-link:focus/)
  })
  it('Nav renders the SkipLink', () => {
    expect(read('components/nav.tsx')).toContain('SkipLink')
  })
  it('SkipLink targets #main-content with bilingual labels', () => {
    const c = read('components/skip-link.tsx')
    expect(c).toContain('#main-content')
    expect(c).toContain('Перейти к содержимому')
    expect(c).toContain('Skip to content')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/a11y/keyboard.test.ts`
Expected: FAIL — `skip-link.tsx` missing; globals.css lacks the rules; Nav lacks SkipLink.

- [ ] **Step 3: Append the three rules to `app/globals.css`**

Append to the end of `app/globals.css`:

```css
/* ── Accessibility: keyboard-nav foundations ────────────────────────── */

/* Skip-to-content link — off-screen until focused (keyboard reveal) */
.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 100;
  padding: 0.6rem 1rem;
  background: var(--text-accent);
  color: var(--bg-primary);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 0 0 6px 0;
}
.skip-link:focus { left: 0; }

/* Visible keyboard focus indicator (keyboard only, not mouse clicks) */
:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 2px;
}

/* Respect the OS reduced-motion preference */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 4: Create `components/skip-link.tsx`**

```tsx
import type { Locale } from '@/lib/dictionaries'

// Skip-to-content link — first focusable element on every Nav-bearing page.
// Hidden off-screen (.skip-link in globals.css) until focused via keyboard.
export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a className="skip-link" href="#main-content">
      {locale === 'en' ? 'Skip to content' : 'Перейти к содержимому'}
    </a>
  )
}
```

- [ ] **Step 5: Wire SkipLink into `components/nav.tsx`**

Add the import near the other imports at the top of `components/nav.tsx`:

```tsx
import { SkipLink } from '@/components/skip-link'
```

Then change the component's `return (` from:

```tsx
  return (
    <nav style={{
```

to (wrap in a fragment, SkipLink first):

```tsx
  return (
    <>
      <SkipLink locale={locale} />
      <nav style={{
```

And close the fragment: find the matching closing `</nav>` that ends the returned JSX and change it from:

```tsx
    </nav>
  )
}
```

to:

```tsx
    </nav>
    </>
  )
}
```

> `locale` is already computed inside `Nav` (used throughout the component). Only the closing `</nav>` that terminates the `return` gets the `</>` after it — do not alter any nested elements.

- [ ] **Step 6: Run test to verify it passes**

Run: `npm run test -- lib/a11y/keyboard.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Build (no regression)**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css components/skip-link.tsx components/nav.tsx lib/a11y/keyboard.test.ts
git commit -m "feat(a11y): focus-visible + reduced-motion + skip-link foundations (fb_a2c667a36a64)"
```

---

### Task 2: Skip-link landmark targets on the 6 core shells

**Files:**
- Modify: `components/pages/mdx-page.tsx`
- Modify: `components/pages/module-page.tsx`
- Modify: `components/pages/unit-page.tsx`
- Modify: `components/pages/home-page.tsx`
- Modify: `components/pages/certificate-page.tsx`
- Modify: `components/lesson-layout.tsx`
- Test: `lib/a11y/keyboard.test.ts` (add one assertion)

**Interfaces:**
- Consumes: the `#main-content` target produced by `SkipLink` in Task 1.
- Produces: `id="main-content" tabIndex={-1}` on each shell's `<main>` landmark.

- [ ] **Step 1: Add the failing assertion**

Append this test inside the `describe('keyboard-nav a11y foundations', …)` block in `lib/a11y/keyboard.test.ts`:

```ts
  it('the six core learner shells expose the #main-content target', () => {
    const shells = [
      'components/pages/mdx-page.tsx',
      'components/pages/module-page.tsx',
      'components/pages/unit-page.tsx',
      'components/pages/home-page.tsx',
      'components/pages/certificate-page.tsx',
      'components/lesson-layout.tsx',
    ]
    for (const f of shells) {
      expect(read(f), `${f} should have id="main-content"`).toContain('id="main-content"')
    }
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/a11y/keyboard.test.ts`
Expected: FAIL on the new assertion (no shell has `id="main-content"` yet).

- [ ] **Step 3: Add the id+tabIndex to each `<main>`**

Make exactly these six edits (insert `id="main-content" tabIndex={-1} ` into each `<main` opening tag):

`components/pages/mdx-page.tsx` — change:
```tsx
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 3rem' }}>
```
to:
```tsx
      <main id="main-content" tabIndex={-1} style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 3rem' }}>
```

`components/pages/module-page.tsx` — change:
```tsx
          <main style={{ flex: 1, padding: '2rem 3rem' }}>
```
to:
```tsx
          <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: '2rem 3rem' }}>
```

`components/pages/unit-page.tsx` — change:
```tsx
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
```
to:
```tsx
        <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
```

`components/pages/home-page.tsx` — change:
```tsx
      <main>
```
to:
```tsx
      <main id="main-content" tabIndex={-1}>
```

`components/pages/certificate-page.tsx` — change:
```tsx
        <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '4rem 2rem' }}>
```
to:
```tsx
        <main id="main-content" tabIndex={-1} style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '4rem 2rem' }}>
```

`components/lesson-layout.tsx` — change:
```tsx
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
```
to:
```tsx
        <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
```

> `unit-page.tsx` and `lesson-layout.tsx` have an identical `<main …>` string — they are in different files, so each file's single occurrence is unambiguous within its own file.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/a11y/keyboard.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Build + full suite (no regression)**

Run: `npm run build`
Expected: build succeeds; the 6 shells render `<main id="main-content" tabIndex={-1}>`.

Run: `npm run test`
Expected: PASS — full suite green, no regressions.

- [ ] **Step 6: Commit**

```bash
git add components/pages/mdx-page.tsx components/pages/module-page.tsx components/pages/unit-page.tsx components/pages/home-page.tsx components/pages/certificate-page.tsx components/lesson-layout.tsx lib/a11y/keyboard.test.ts
git commit -m "feat(a11y): add #main-content skip-link target to core learner shells (fb_a2c667a36a64)"
```

---

## Self-Review

**1. Spec coverage:**
- `:focus-visible` indicator → Task 1 Step 3 + test. ✅
- `prefers-reduced-motion` guard → Task 1 Step 3 + test. ✅
- `.skip-link` CSS + `SkipLink` component + Nav wiring → Task 1 Steps 3-5 + tests. ✅
- `id="main-content" tabIndex={-1}` on the 6 shells → Task 2 + test. ✅
- Source-presence test guard → Tasks 1-2. ✅
- Additive / no new deps / token-based colors → Global Constraints. ✅
- One-off pages deferred (not touched) → Global Constraints. ✅

**2. Placeholder scan:** No TBD/TODO. All CSS, the component, the Nav edit, and all six `<main>` edits are complete verbatim.

**3. Type/consistency:** `SkipLink({ locale })` signature matches its Nav usage; `#main-content` is identical in `skip-link.tsx`, the 6 shells, and the tests; `.skip-link` / `:focus-visible` / `prefers-reduced-motion` strings match between the CSS (Task 1 Step 3) and the test assertions (Task 1 Step 1). The Task 2 assertion's shell list matches the six files edited in Task 2 Step 3.
