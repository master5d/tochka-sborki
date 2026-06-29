# A11y low-bandwidth / lite-mode — design (fb_731d3ee7f748)

**Ticket:** `fb_731d3ee7f748` — A11y follow-on (from `fb_a2c667a36a64` slice 3): a lite mode that drops heavy assets/animations for slow connections and old devices. Equity note: not everyone has the same tech access. (Spawned alongside the keyboard/contrast a11y baseline.)

## Goal

Add a **lite mode** that, when active, defers the page's heaviest assets — primarily the ~4 MB self-contained Walkthrough iframes — and drops decorative gradients/animations, with a persisted user preference that **auto-enables on Save-Data / slow connections**. Mirrors the existing `theme-pref` infrastructure.

## Context (audit — grep-before-build)

- **Pref pattern is established:** `lib/theme-pref.ts` (pure: key + read/store/resolve/effective) + `components/theme-provider.tsx` (context, applies `data-theme` on `<html>`, FOUC-free) + a head inline script in `app/layout.tsx` painting `data-theme` pre-paint + `components/theme-toggle.tsx` in nav (beside `rpg-mode-toggle.tsx`). Lite-mode mirrors this exactly. There is also `lib/os-pref.ts` as a second instance of the same pattern.
- **`ShowcaseVideo` (`components/showcase-video.tsx`) already defers** — it is a click-to-load facade (poster + play button; the real player iframe loads only on click). **Bandwidth-friendly already → not touched.** (component-overlap: don't rebuild.)
- **`Walkthrough` (`components/walkthrough.tsx`) does NOT defer** — a server component that always renders `<iframe src="/walkthroughs/<slug>.html" loading="lazy">`. Each file is ~4 MB (cumulative inline-SVG frames). `loading="lazy"` only delays to scroll; this is the heavy asset lite-mode must gate. It is the poster-child, freshly shipped in `fb_54dd5739f9ce`.
- `app/globals.css` already has a `@media (prefers-reduced-motion: reduce)` block (from the a11y baseline). Lite-mode's CSS is **separate** — bandwidth/paint cost, not vestibular motion — keyed on `[data-lite="on"]`.

## Decision (from design gate)

**Auto-detect default.** The preference is `'on' | 'off' | 'auto'`, default `'auto'`: lite auto-enables when `navigator.connection.saveData === true` or `effectiveType` ∈ {`'slow-2g'`, `'2g'`}. The user can override to explicit `on`/`off` via a nav toggle. Honors the equity note (slow networks / old devices get lite with zero action). `Save-Data` is the standard signal.

## Architecture — mirror theme-pref

### 1. `lib/lite-pref.ts` — pure preference logic

```ts
export type LitePref = 'on' | 'off' | 'auto'
export const LITE_KEY = 'lite-pref'
export function detectSaveData(): boolean            // navigator.connection saveData || effectiveType in 2g set; false when unknown/SSR
export function readStoredPref(): LitePref | null    // localStorage, validated
export function storePref(pref: LitePref): void
export function resolveLite(pref: LitePref, saveData: boolean): boolean  // 'auto' → saveData; else pref==='on'
export function effectiveLite(): boolean             // resolveLite(readStoredPref() ?? 'auto', detectSaveData())
```

Pure, unit-tested. Default pref when unset = `'auto'`.

### 2. Head pre-paint script (`app/layout.tsx`)

Mirror the existing `themeScript`: an inline script reads `lite-pref` (and, for `auto`/unset, `navigator.connection`) and sets `document.documentElement.setAttribute('data-lite', on ? 'on' : 'off')` before paint, so CSS applies without flash. `<html>` gets a default `data-lite="off"` attribute (script corrects it). Keep the key/`auto`-default in sync with `lib/lite-pref.ts` (a comment says so, as the theme script does).

### 3. `components/lite-provider.tsx` — context + live application

Mirror `ThemeProvider`: `LiteProvider` exposes `{ lite: boolean; pref: LitePref; setPref(p) }` via `useLite()`. On mount, hydrate from storage; `setPref` stores + updates `data-lite` on `<html>` + state. (Connection-change listening is optional and out of scope — `auto` is resolved at load + on explicit toggle; YAGNI on live `navigator.connection` change events.) Wrap the app tree beside/within the existing ThemeProvider.

### 4. `components/lite-toggle.tsx` — nav control

A small pill toggle in `nav.tsx` beside `ThemeToggle` / `RpgModeToggle`. Cycles or toggles the pref; label bilingual ("Lite"/«Лёгкий» + an on/off state). Accessible (`aria-pressed`, focus-visible inherited from the a11y baseline). Shows the current effective state.

### 5. `app/globals.css` — `[data-lite="on"]` heavy-drop

Conservative, decorative-only:
- Neutralize large background gradients/images (fall back to a flat token color, e.g. `--bg-primary`).
- Disable non-essential animations/transitions (`[data-lite="on"] * { animation: none !important; transition: none !important; }`), scoped so it doesn't break focus outlines.
Does not touch layout, text, or interactive affordances. Distinct from the `prefers-reduced-motion` block (both may apply).

### 6. `components/walkthrough.tsx` — lite-aware click-to-load facade

Convert to a client component that reads `useLite()`. When `lite` is true, render a lightweight placeholder (same `<figure>` frame + border, no iframe): a short line ("Интерактивная схема — тяжёлая, нажми чтобы загрузить" / "Interactive diagram — heavy; tap to load") + a button that, on click, swaps in the real `<iframe>`. When `lite` is false, render the iframe as today (`loading="lazy"`). **Mirrors the `ShowcaseVideo` facade pattern** for consistency. The `slug`/`title`/`minHeight` props are unchanged → MDX usage unchanged.

## Testing

- `lib/lite-pref.test.ts` — pure: `resolveLite` truth table (`auto`→saveData, `on`→true, `off`→false); `readStoredPref` validation (valid values, junk→null); `effectiveLite` default-to-`auto` path. `detectSaveData` guarded for SSR/unknown (returns false).
- Components (`lite-provider`, `lite-toggle`, `walkthrough`) — build-validated (`npm run build`), consistent with the slice-style elsewhere. No jsdom DOM-state test for the toggle.
- Full suite + build green, no regression (theme/os toggles still work; existing walkthrough MDX still compiles).

## Authenticity / values

Directly serves the equity note: lite mode is for people on slow networks and old devices — "not everyone has the same tech access." Auto-detect means they don't have to know it exists. No dark patterns, no nagging.

## Scope

- Single app: `LMS/tochka-sborki/web/`. `lms_target: engine`.
- **Out of scope:** touching `ShowcaseVideo` (already a facade), live `navigator.connection` change listening, a server-side Save-Data header path (client-only is sufficient for a static export), image `srcset`/responsive-image work, RPG world-map/skin asset gating (separate concern), and any change to MDX authoring of `<Walkthrough>`.

## Backward compatibility

Additive: one new pure lib + provider + toggle + a CSS block + making `Walkthrough` client-and-lite-aware (same props, same default-mode rendering). Default `data-lite="off"` for users not on Save-Data → zero visible change for them. No new dependencies.

## Task decomposition (for the plan)

1. `lib/lite-pref.ts` pure logic + `lite-pref.test.ts` (TDD).
2. `LiteProvider` + `useLite()` + head pre-paint script + mount in layout (mirrors ThemeProvider) — build-validated.
3. `lite-toggle.tsx` in nav + `[data-lite="on"]` CSS heavy-drop — build-validated.
4. `walkthrough.tsx` lite-aware click-to-load facade — build-validated + full suite/build green.
