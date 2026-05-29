# Light Theme + System Auto-Detect — Design

**Date:** 2026-05-29
**Status:** Approved (design)
**Scope:** `web/` (LMS, `ai.mamaev.coach`)

## Goal

Add a global **light theme** alongside the existing dark theme, with **system auto-detect** (`prefers-color-scheme`) as the default and a user override (Light / Dark / System). Theme switches instantly with no page reload.

## Approach

Hand-rolled `[data-theme="light|dark"]` token swap + inline FOUC-guard script + a small `ThemeProvider`, mirroring the project's established client-pref pattern (`os-pref.ts`, `lang-preference`). No new dependencies. Chosen over `next-themes` (extra dep, foreign pattern) and CSS-only `@media` (no manual override — fails the requirement).

## Constraints

- **Static export** (`output: 'export'`): the server cannot resolve per-user theme, so the resolved theme must be applied by a blocking inline `<head>` script before first paint, or the page flashes the wrong theme (FOUC).
- All themable colors already flow through CSS custom properties scoped to `[data-theme="model-kit"]`. The exceptions are a small, well-bounded set of hardcoded hex values (audited below).

---

## 1. Token Layer — `web/themes/model-kit.css`

Restructure the single `[data-theme="model-kit"]` block into a theme-agnostic base plus two palettes.

```css
:root {
  /* Theme-agnostic: layout, type scale, radius, fonts — identical in both themes */
  --font-mono: 'Geist Mono', monospace;
  --radius: 4px;
  --display-size: clamp(2.8rem, 7vw, 6.5rem);
  --section-label-size: 0.7rem;
  --number-size: clamp(5rem, 14vw, 11rem);
  --section-gap: 5rem;
  --accent-line: 3px solid var(--text-accent);
  --content-max: 1100px;
}

[data-theme="dark"] {
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --bg-surface: #16161f;
  --text-primary: #e8e8f0;
  --text-secondary: #9090a8;
  --text-accent: #00ff88;
  --border-color: #2a2a3a;
  --border-accent: #00ff8840;
  --text-on-accent: #000000;
  --crit: #ff6b5b;
  --phase-1: #00ff88;
  --phase-2: #00aaff;
  --phase-3: #ff9900;
  --phase-4: #ff44aa;
}

[data-theme="light"] {
  /* Warm "model kit" paper — constructivist blueprint feel */
  --bg-primary: #f4f1ea;
  --bg-secondary: #eae6dc;
  --bg-surface: #fbf9f4;
  --text-primary: #15151a;
  --text-secondary: #5a5a6a;
  --text-accent: #0c8f4d;       /* neon green fails contrast on paper; darkened */
  --border-color: #d8d2c6;
  --border-accent: #0c8f4d40;
  --text-on-accent: #ffffff;
  --crit: #d92d20;
  --phase-1: #0c8f4d;
  --phase-2: #0061a8;
  --phase-3: #b06600;
  --phase-4: #b51d6e;
}
```

**Notes:**
- The literal string `"model-kit"` is retired as a `data-theme` value; the file keeps its name (it is still the model-kit design system, now in two palettes).
- Light palette values are a starting point and may be tuned during implementation; the **token contract** (names) is what's fixed.
- `web/lib/themes.ts` (`themes[]`, `defaultTheme = 'model-kit'`) becomes obsolete. Remove it and its sole import in `layout.tsx`.

## 2. Pref Store — `web/lib/theme-pref.ts`

Mirror of `lib/os-pref.ts`. Pure helpers + storage shell.

```ts
export type ThemePref = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_KEY = 'theme-pref'

export function detectSystem(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function readStoredPref(): ThemePref | null {
  if (typeof localStorage === 'undefined') return null
  const v = localStorage.getItem(THEME_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : null
}

export function storePref(pref: ThemePref): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(THEME_KEY, pref)
}

export function resolveTheme(pref: ThemePref, system: ResolvedTheme): ResolvedTheme {
  return pref === 'system' ? system : pref
}

export function effectiveTheme(): ResolvedTheme {
  return resolveTheme(readStoredPref() ?? 'system', detectSystem())
}
```

**Default behavior:** no stored value → `'system'` → resolved from `prefers-color-scheme`.

## 3. FOUC-Guard — Inline Head Script (`web/app/layout.tsx`)

Render an explicit `<head>` with a blocking inline script that applies the resolved theme before paint. Set `data-theme="dark"` + `suppressHydrationWarning` on `<html>` as the static fallback (script overrides instantly; `suppressHydrationWarning` silences the attribute mismatch warning).

```tsx
const themeScript = `(function(){try{
  var p=localStorage.getItem('theme-pref')||'system';
  var sys=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  document.documentElement.setAttribute('data-theme', p==='system'?sys:p);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

// in render:
<html lang="ru" data-theme="dark" suppressHydrationWarning className={...}>
  <head>
    <script dangerouslySetInnerHTML={{ __html: themeScript }} />
  </head>
  <body>
    <ThemeProvider>
      <ProgressProvider>
        <LangSuggestBanner />
        {children}
      </ProgressProvider>
    </ThemeProvider>
  </body>
</html>
```

The script in `<head>` runs before `<body>` renders → no flash. The `'theme-pref'` / `'system'` literals are duplicated here (cannot import a module into an inline blocking script); a code comment links it to `theme-pref.ts` as the source of truth.

## 4. ThemeProvider — `web/components/theme-provider.tsx`

Client component, always mounted (wraps the app in layout). Owns live state and the `prefers-color-scheme` listener so system-following updates without reload.

- State: `pref: ThemePref` (init from `readStoredPref() ?? 'system'`), derived `resolved: ResolvedTheme`.
- On mount + whenever `pref === 'system'`: subscribe to `matchMedia('(prefers-color-scheme: dark)')` `change` events; on change, recompute resolved and `setAttribute('data-theme', resolved)`.
- `setPref(next)`: `storePref(next)` → update state → `setAttribute('data-theme', resolveTheme(next, detectSystem()))`. **No reload.**
- Exposes context `{ pref, resolved, setPref }` via a `useTheme()` hook (`web/lib/use-theme.ts` or co-located).

It must not re-flip the theme on mount differently from what the head script already set (read the same inputs).

## 5. Toggle — `web/components/theme-toggle.tsx` (in `nav.tsx`)

3-segment pill `[☀️][🌙][Auto]`, styled like the existing OS-toggle pill (rounded, segmented, active segment uses `--text-accent` bg + `--text-on-accent` text). Consumes `useTheme()`.

- Clicking a segment calls `setPref('light' | 'dark' | 'system')`.
- Active segment = current `pref` (so "Auto" is highlightable distinctly from the resolved light/dark).
- Placed in `nav.tsx` next to the language + OS toggles.
- Labels/titles/aria via `dictionaries.ts`: `nav.theme.title`, `nav.theme.light`, `nav.theme.dark`, `nav.theme.system` (RU + EN).
- Render-gate identical to OS toggle (`os && ...`): render only after mount to avoid SSR/CSR mismatch on the active segment.

## 6. Hardcoded-Color Audit (full, this spec)

Three patterns → three tokens. Replace inline literals with `var(--token)`.

| Pattern | Token | Files / lines |
|---|---|---|
| On-accent text `'#000'` (text sitting on `--text-accent` bg) | `--text-on-accent` | nav.tsx:132,138 · os-toggle.tsx:72 · agent-toggle.tsx:79 · cs/vault.tsx:73 · rpg/quest-feed.tsx:20,26,29 · unit-wizard.tsx:294,312 · dungeon/dungeon-card.tsx:44 · dungeon/dungeon-view.tsx:75 · pages/home-page.tsx:111 · pages/certificate-page.tsx:196 · login-form.tsx:126 · feedback-form.tsx:190 · intake/intake-wizard.tsx:135 · lang-suggest-banner.tsx:98 · wellbeing/wellbeing-panel.tsx:84 · character-sheet.tsx:42 · mobile-gate.tsx:178 |
| Error red `#ff4444` / `#ff6b5b` | `--crit` | feedback-form.tsx:179 · login-form.tsx:118 · mobile-gate.tsx:197 (already `var(--crit, …)` → drop fallback) |
| Phase accents `#00ff88/#00aaff/#ff9900/#ff44aa` | `--phase-1..4` | unit-wizard.tsx:22 (`PHASE_COLORS` → `['var(--phase-1)', …]`) · phase-chrome.ts (4 color literals → matching vars) |

**During implementation, verify each `#000` site actually sits on an accent background before swapping** (a couple may sit on white/neutral — those keep `#000`). The audit list above is the candidate set, not a blind replace.

**Left fixed on purpose (NOT touched):**
- `certificate-svg.tsx` (ACCENT/BG/PRIMARY/MUTED/BORDER) — downloadable SVG certificate is a deliberate fixed dark artifact, theme-independent.
- `mobile-gate.tsx:71` QR module/background colors (`{ dark, light }`) — QR contrast pair, not UI chrome.

## 7. Tests — `web/lib/theme-pref.test.ts`

Vitest (env `node` — stub `localStorage` and `window.matchMedia` via `vi.stubGlobal`, mirroring `os-pref.test.ts`):

- `resolveTheme`: `system` → returns `system` arg; `light`/`dark` → returns itself.
- `detectSystem`: matchMedia dark `true` → `'dark'`; `false` → `'light'`; no matchMedia → `'dark'`.
- `readStoredPref`: valid value round-trips; garbage / empty → `null`.
- `effectiveTheme`: no stored → follows system; stored `light` → `'light'` regardless of system.
- `storePref` → `readStoredPref` round-trip.

## Out of Scope

- Theming `hub/` and `mentor/` sites (separate projects; can follow the same pattern later).
- Per-theme imagery/illustration swaps.
- Animated theme-transition (instant swap only).

## Documentation Updates (post-merge)

- `CLAUDE.md`: note light/dark themes + `theme-pref` localStorage key; "темы через `data-theme`" → "light/dark + system".
- `web/README.md`: stack row `data-theme="model-kit"` → `data-theme="light|dark"`; add `theme-pref` to localStorage key inventory; add `theme-toggle` / `theme-provider` to structure.
