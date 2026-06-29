# A11y keyboard-nav foundations — design (fb_a2c667a36a64, slice 1 of N)

**Ticket:** `fb_a2c667a36a64` — LMS accessibility baseline ("Access for all"): captions/transcripts, full keyboard navigation, screen-reader/ARIA pass, color contrast, low-bandwidth mode.

## Decomposition

The ticket bundles 5 independent areas. This spec covers **only the first slice — keyboard-navigation foundations**. The rest become follow-on tickets:
- **This slice:** visible focus indicator + `prefers-reduced-motion` + skip-to-content link.
- Follow-on: captions/transcripts (owner-media-gated), low-bandwidth/low-spec mode (infra), color-contrast audit (shared-theme), broader ARIA pass.

## Goal

Ship the missing keyboard + low-vision foundations site-wide as an engine-level baseline: a consistent visible focus ring, OS reduced-motion respect, and a skip-to-content link for keyboard/screen-reader users.

## Audit (why these three)

- **0** skip-to-content links today.
- **0** global `:focus-visible` styles (browser defaults only, inconsistent across the many inline-styled buttons/links).
- **2** files reference `prefers-reduced-motion` (partial).
- ARIA is already well-seeded (43 files use `aria-*`); `lang` is handled dynamically. So ARIA/lang are **not** in this slice.
- Tailwind v4 is present (`@import "tailwindcss"`), but components use inline styles, not utility classes — so keyboard-a11y styling lives in `app/globals.css` (one place), not Tailwind utilities.

## Scope

- Single app: `LMS/tochka-sborki/web/`. `lms_target: engine` (reusable baseline benefiting every course).
- Skip-link target (`id="main-content"`) added to the **6 core learner-journey shells** now; one-off pages (store/support/admin/auth/feedback) get the id in a follow-on — flagged here, not silently dropped.

Out of scope: captions, low-bandwidth mode, contrast audit, broad ARIA pass, render-test infra.

## Architecture — global CSS + one shared component + landmark ids

### 1. `app/globals.css` — three additive rules

```css
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

### 2. `components/skip-link.tsx` — new shared component

Bilingual, uses the `.skip-link` class, targets `#main-content`:

```tsx
import type { Locale } from '@/lib/dictionaries'

export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a className="skip-link" href="#main-content">
      {locale === 'en' ? 'Skip to content' : 'Перейти к содержимому'}
    </a>
  )
}
```

### 3. `components/nav.tsx` — render the skip-link first

`Nav` currently returns `<nav>…</nav>`. Wrap in a fragment so the skip-link is the first focusable element on every Nav-bearing page (27 pages):

```tsx
return (
  <>
    <SkipLink locale={locale} />
    <nav style={{ … }}>
      …
    </nav>
  </>
)
```

(`locale` is already computed in `Nav`; add the `SkipLink` import.)

### 4. Skip-link targets — `id="main-content" tabIndex={-1}` on 6 shells

Add to the `<main>` opening tag in:
- `components/pages/mdx-page.tsx`
- `components/pages/module-page.tsx`
- `components/pages/unit-page.tsx`
- `components/pages/home-page.tsx`
- `components/pages/certificate-page.tsx`
- `components/lesson-layout.tsx`

`tabIndex={-1}` makes `<main>` a programmatic focus target so activating the skip-link moves focus into the content (not just scrolls). These six cover lessons, modules, units, home, certificate, and the lesson reader — the core learner journey.

## Testing

`lib/a11y/keyboard.test.ts` — source-presence guard (same idiom as the content-track tests; no render infra exists):
- `globals.css` contains a `:focus-visible { … outline … }` rule.
- `globals.css` contains `prefers-reduced-motion: reduce`.
- `globals.css` defines `.skip-link` and `.skip-link:focus`.
- `nav.tsx` references `SkipLink`.
- `skip-link.tsx` contains `#main-content` and both bilingual labels.
- each of the 6 shells contains `id="main-content"`.

Plus `npm run build` + full suite (no regression). DOM/visual behavior is build-validated (consistent with prior visual slices).

## Authenticity / values

"Access for all" equity baseline — inclusive by default, no vanity. No new dependencies. Focus ring uses the existing accent token; reduced-motion is opt-in via the user's OS.

## Backward compatibility

Additive only: three new CSS rules, one new component, a fragment wrap in Nav, and six `id`/`tabIndex` attribute additions. No existing behavior changes; `:focus-visible` only adds an outline on keyboard focus.

## Task decomposition (for the plan)

1. **Global rules + skip-link + Nav wiring** — `globals.css` (3 rules), `skip-link.tsx`, `nav.tsx` fragment, and the test assertions for globals + SkipLink + Nav.
2. **Skip-link landmark targets** — add `id="main-content" tabIndex={-1}` to the 6 shells + the shell-target test assertion.
