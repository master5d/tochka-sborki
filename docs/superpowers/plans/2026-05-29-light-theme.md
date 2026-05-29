# Light Theme + System Auto-Detect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global light theme alongside the existing dark theme, defaulting to the OS `prefers-color-scheme` with a user override (Light / Dark / System), switching instantly without reload.

**Architecture:** CSS custom-property palettes under `[data-theme="light"]` / `[data-theme="dark"]`; a pure pref-store (`theme-pref.ts`) mirroring `os-pref.ts`; a blocking inline `<head>` script that applies the resolved theme before paint (static export → no server resolution); a `ThemeProvider` that keeps "system" mode live via `matchMedia`; a 3-segment toggle in the nav.

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), TypeScript, CSS custom properties + Tailwind 4, Vitest (env `node`).

**Working directory:** all commands run from `web/` unless stated. Branch is already `feature/light-theme`.

**Reference spec:** `docs/superpowers/specs/2026-05-29-light-theme-design.md`

**Note on verification:** Logic (`theme-pref.ts`) is unit-tested with Vitest (TDD). The CSS/UI tasks cannot be meaningfully unit-tested in this `node`-env Vitest setup; their verification is `npm run build` passing plus the described manual/visual check. This matches the project convention (Vitest covers `lib/` logic only).

---

### Task 1: Theme preference store

**Files:**
- Create: `web/lib/theme-pref.ts`
- Test: `web/lib/theme-pref.test.ts`

- [ ] **Step 1: Write the failing test**

Create `web/lib/theme-pref.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { detectSystem, readStoredPref, storePref, resolveTheme, effectiveTheme, THEME_KEY } from './theme-pref'

function makeStorage(): Storage {
  const m = new Map<string, string>()
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size },
  } as Storage
}

function setMatchMedia(dark: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: dark, media: q }))
  vi.stubGlobal('window', { matchMedia: (globalThis as { matchMedia: unknown }).matchMedia })
}

describe('theme-pref', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorage())
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detectSystem returns dark when prefers-color-scheme: dark matches', () => {
    setMatchMedia(true)
    expect(detectSystem()).toBe('dark')
  })

  it('detectSystem returns light when it does not match', () => {
    setMatchMedia(false)
    expect(detectSystem()).toBe('light')
  })

  it('detectSystem falls back to dark with no matchMedia', () => {
    vi.stubGlobal('window', {})
    expect(detectSystem()).toBe('dark')
  })

  it('readStoredPref returns null for missing or garbage values', () => {
    expect(readStoredPref()).toBeNull()
    localStorage.setItem(THEME_KEY, 'sepia')
    expect(readStoredPref()).toBeNull()
  })

  it('readStoredPref round-trips a valid value', () => {
    storePref('light')
    expect(readStoredPref()).toBe('light')
  })

  it('resolveTheme returns the system arg when pref is system', () => {
    expect(resolveTheme('system', 'light')).toBe('light')
    expect(resolveTheme('system', 'dark')).toBe('dark')
  })

  it('resolveTheme returns the explicit pref otherwise', () => {
    expect(resolveTheme('light', 'dark')).toBe('light')
    expect(resolveTheme('dark', 'light')).toBe('dark')
  })

  it('effectiveTheme follows system when nothing is stored', () => {
    setMatchMedia(false) // system = light
    expect(effectiveTheme()).toBe('light')
  })

  it('effectiveTheme honors an explicit stored pref over system', () => {
    setMatchMedia(false) // system = light
    storePref('dark')
    expect(effectiveTheme()).toBe('dark')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/theme-pref.test.ts --no-file-parallelism`
Expected: FAIL — cannot resolve `./theme-pref`.

- [ ] **Step 3: Write the implementation**

Create `web/lib/theme-pref.ts`:

```ts
// web/lib/theme-pref.ts
// Global theme preference (light / dark / system). Mirrors the os-pref.ts pattern.
// "system" follows the OS prefers-color-scheme; an explicit pick overrides it.
export type ThemePref = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_KEY = 'theme-pref'

/** The OS-reported scheme. Defaults to 'dark' off-browser or when unknown. */
export function detectSystem(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** The explicit choice the user saved, or null if they never picked. */
export function readStoredPref(): ThemePref | null {
  try {
    const raw = localStorage.getItem(THEME_KEY)
    return raw === 'light' || raw === 'dark' || raw === 'system' ? raw : null
  } catch {
    return null
  }
}

export function storePref(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_KEY, pref)
  } catch {
    /* ignore */
  }
}

/** Collapse a preference + the current system scheme into a concrete theme. */
export function resolveTheme(pref: ThemePref, system: ResolvedTheme): ResolvedTheme {
  return pref === 'system' ? system : pref
}

/** What the page should actually show right now. */
export function effectiveTheme(): ResolvedTheme {
  return resolveTheme(readStoredPref() ?? 'system', detectSystem())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/theme-pref.test.ts --no-file-parallelism`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add web/lib/theme-pref.ts web/lib/theme-pref.test.ts
git commit -m "feat: theme preference store (light/dark/system)"
```

---

### Task 2: Token layer — light + dark palettes

**Files:**
- Modify (full rewrite): `web/themes/model-kit.css`
- Delete: `web/lib/themes.ts`
- Modify: `web/app/layout.tsx:5` (remove import) and `:28` (`data-theme`)

- [ ] **Step 1: Rewrite the token file**

Replace the entire contents of `web/themes/model-kit.css` with:

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
  --text-accent: #0c8f4d;
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

- [ ] **Step 2: Delete the obsolete theme registry**

`web/lib/themes.ts` is no longer referenced once layout is updated. Send it to the Recycle Bin (project rule — do not `rm` tracked source) and stage its removal:

```bash
git rm web/lib/themes.ts
```

(`git rm` removes the tracked file via git; no `rm` of an untracked important file is involved.)

- [ ] **Step 3: Update layout to a static dark fallback**

In `web/app/layout.tsx`, remove the import on line 5:

```tsx
import { defaultTheme } from '@/lib/themes'
```

and change the opening `<html>` tag (line ~26-30) from `data-theme={defaultTheme}` to a literal:

```tsx
    <html
      lang="ru"
      data-theme="dark"
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable}`}
    >
```

(The blocking script + `suppressHydrationWarning` arrive in Task 3; dark stays the visible default meanwhile, identical to today.)

- [ ] **Step 4: Verify the build is green**

Run: `npm run build`
Expected: build completes; no "Cannot find module '@/lib/themes'" error. The site renders in dark exactly as before.

- [ ] **Step 5: Commit**

```bash
git add web/themes/model-kit.css web/app/layout.tsx web/lib/themes.ts
git commit -m "feat: split model-kit tokens into light + dark palettes"
```

---

### Task 3: FOUC-guard script + ThemeProvider

**Files:**
- Create: `web/components/theme-provider.tsx`
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Create the provider**

Create `web/components/theme-provider.tsx`:

```tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  type ThemePref,
  type ResolvedTheme,
  readStoredPref,
  storePref,
  detectSystem,
  resolveTheme,
} from '@/lib/theme-pref'

interface ThemeContextValue {
  pref: ThemePref
  resolved: ResolvedTheme
  setPref: (p: ThemePref) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Init matches the head script's fallback; corrected on mount from storage.
  const [pref, setPrefState] = useState<ThemePref>('system')
  const [resolved, setResolved] = useState<ResolvedTheme>('dark')

  // Hydrate from storage (the head script already painted the right theme).
  useEffect(() => {
    const p = readStoredPref() ?? 'system'
    setPrefState(p)
    setResolved(resolveTheme(p, detectSystem()))
  }, [])

  // Follow the OS live while pref is "system".
  useEffect(() => {
    if (pref !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const next: ResolvedTheme = mq.matches ? 'dark' : 'light'
      setResolved(next)
      document.documentElement.setAttribute('data-theme', next)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [pref])

  const setPref = useCallback((p: ThemePref) => {
    storePref(p)
    setPrefState(p)
    const next = resolveTheme(p, detectSystem())
    setResolved(next)
    document.documentElement.setAttribute('data-theme', next)
  }, [])

  return (
    <ThemeContext.Provider value={{ pref, resolved, setPref }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Wire the script + provider into the layout**

Edit `web/app/layout.tsx`. Add the import near the other component imports:

```tsx
import { ThemeProvider } from '@/components/theme-provider'
```

Add the inline-script constant above the `RootLayout` function (after `metadata`):

```tsx
// Keep the 'theme-pref' key + 'system' default in sync with lib/theme-pref.ts.
// This runs before paint so the resolved theme is applied with no flash (FOUC).
const themeScript = `(function(){try{` +
  `var p=localStorage.getItem('theme-pref')||'system';` +
  `var sys=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';` +
  `document.documentElement.setAttribute('data-theme',p==='system'?sys:p);` +
  `}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`
```

Change the returned JSX so `<html>` gets `suppressHydrationWarning`, gains a `<head>` with the script, and the body is wrapped in `ThemeProvider`:

```tsx
  return (
    <html
      lang="ru"
      data-theme="dark"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable} ${unbounded.variable}`}
    >
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
  )
```

- [ ] **Step 3: Verify the build and the FOUC guard**

Run: `npm run build`
Expected: build completes with no errors.

Then `npm run dev`, open `http://localhost:3000`, and in DevTools console run:

```js
localStorage.setItem('theme-pref','light'); location.reload()
```

Expected: page loads already in the light (paper) palette with **no dark flash**. Set it back: `localStorage.setItem('theme-pref','system'); location.reload()` → follows the OS scheme. Toggle the OS appearance while on a page with the provider mounted and `theme-pref=system` → colors switch live.

- [ ] **Step 4: Commit**

```bash
git add web/components/theme-provider.tsx web/app/layout.tsx
git commit -m "feat: FOUC-guard head script + ThemeProvider (live system follow)"
```

---

### Task 4: Theme labels in the dictionary

**Files:**
- Modify: `web/lib/dictionaries.ts` (type block ~line 4-15; `ru` nav ~line 146; `en` nav ~line 333)

- [ ] **Step 1: Extend the `nav` type**

In the `Dictionary` type's `nav` object (after `osCurrent: (os: string) => string`), add:

```ts
    theme: { title: string; light: string; dark: string; system: string }
```

- [ ] **Step 2: Add the RU strings**

In `dictionaries.ru.nav` (after the `osCurrent` line, ~line 156), add:

```ts
      theme: { title: 'Тема', light: 'Светлая', dark: 'Тёмная', system: 'Системная' },
```

- [ ] **Step 3: Add the EN strings**

In `dictionaries.en.nav` (after the `osCurrent` line, ~line 343), add:

```ts
      theme: { title: 'Theme', light: 'Light', dark: 'Dark', system: 'System' },
```

- [ ] **Step 4: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors (the new type members are satisfied by both locales).

- [ ] **Step 5: Commit**

```bash
git add web/lib/dictionaries.ts
git commit -m "feat: theme toggle labels (RU+EN)"
```

---

### Task 5: Theme toggle in the nav

**Files:**
- Create: `web/components/theme-toggle.tsx`
- Modify: `web/components/nav.tsx`

- [ ] **Step 1: Create the toggle**

Create `web/components/theme-toggle.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { getDictionary, type Locale } from '@/lib/dictionaries'
import type { ThemePref } from '@/lib/theme-pref'

const SEGMENTS: { key: ThemePref; glyph: string }[] = [
  { key: 'light', glyph: '☀️' },
  { key: 'dark', glyph: '🌙' },
  { key: 'system', glyph: '🖥️' },
]

export function ThemeToggle({ locale }: { locale: Locale }) {
  const { pref, setPref } = useTheme()
  const t = getDictionary(locale)
  const [mounted, setMounted] = useState(false)

  // Render only after mount: pref is corrected from storage in an effect, so the
  // active segment would otherwise mismatch the server-rendered default.
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      role="radiogroup"
      aria-label={t.nav.theme.title}
      style={{
        display: 'flex',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
    >
      {SEGMENTS.map(seg => {
        const active = pref === seg.key
        return (
          <button
            key={seg.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t.nav.theme[seg.key]}
            title={t.nav.theme[seg.key]}
            onClick={() => setPref(seg.key)}
            style={{
              padding: '3px 8px',
              cursor: 'pointer',
              border: 'none',
              background: active ? 'var(--text-accent)' : 'transparent',
              color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 400,
            }}
          >
            <span aria-hidden="true">{seg.glyph}</span>
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Mount it in the nav**

In `web/components/nav.tsx`, add the import near the top (after the os-pref import on line 7):

```tsx
import { ThemeToggle } from '@/components/theme-toggle'
```

Then render `<ThemeToggle locale={locale} />` immediately before the OS-toggle button block (before the `{os && (` expression around line 112):

```tsx
        <ThemeToggle locale={locale} />

        {os && (
```

- [ ] **Step 3: Verify build + interaction**

Run: `npm run build`
Expected: build completes.

`npm run dev`, open the site: a `[☀️][🌙][🖥️]` pill sits in the nav by the language/OS toggles. Clicking ☀️ switches to paper instantly (no reload); 🌙 back to dark; 🖥️ follows the OS. The active segment is highlighted with the accent color and reads `--text-on-accent` text in both themes.

- [ ] **Step 4: Commit**

```bash
git add web/components/theme-toggle.tsx web/components/nav.tsx
git commit -m "feat: 3-segment theme toggle in nav"
```

---

### Task 6: Audit — on-accent text token

**Files (replace `'#000'` → `'var(--text-on-accent)'` only where the text sits on a `--text-accent` background):**
- `web/components/nav.tsx:132,138`
- `web/components/os-toggle.tsx:72`
- `web/components/agent-toggle.tsx:79`
- `web/components/cs/vault.tsx:73`
- `web/components/rpg/quest-feed.tsx:20,26,29`
- `web/components/unit-wizard.tsx:294,312`
- `web/components/dungeon/dungeon-card.tsx:44`
- `web/components/dungeon/dungeon-view.tsx:75`
- `web/components/pages/home-page.tsx:111`
- `web/components/pages/certificate-page.tsx:196`
- `web/components/login-form.tsx:126`
- `web/components/feedback-form.tsx:190`
- `web/components/intake/intake-wizard.tsx:135`
- `web/components/lang-suggest-banner.tsx:98`
- `web/components/wellbeing/wellbeing-panel.tsx:84`
- `web/components/character-sheet.tsx:42`
- `web/components/mobile-gate.tsx:178`

- [ ] **Step 1: Confirm each candidate sits on an accent background**

For each file/line above, open it and verify the `#000` is the foreground for an element whose `background` is `var(--text-accent)` (or the JS `accent` variable that resolves to it). The grep to relocate them:

Run: `grep -rn "'#000'\|: '#000'\|color: #000\|color:#000" web/components`

Most are `background: accent/var(--text-accent), color: '#000'`. **If any `#000` sits on a white/neutral surface instead, leave it as `#000`** and note it in the commit body.

- [ ] **Step 2: Replace the confirmed sites**

In each confirmed location, change the literal `#000` to `var(--text-on-accent)`. Examples:

`web/components/nav.tsx` lines 132 and 138:
```tsx
              color: os === 'mac' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
```
```tsx
              color: os === 'windows' ? 'var(--text-on-accent)' : 'var(--text-secondary)',
```

`web/components/os-toggle.tsx` line 72:
```tsx
              color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
```

`web/components/rpg/quest-feed.tsx` line 20:
```tsx
              color: done ? accent : cur ? 'var(--text-on-accent)' : 'var(--text-secondary)',
```

Apply the same literal-for-token swap at every confirmed line (the surrounding code is unchanged — only the `#000` string becomes `var(--text-on-accent)`). For the CSS-in-JS block in `intake-wizard.tsx:135` (`color: #000;` inside a template-literal `<style>`), use `color: var(--text-on-accent);`.

- [ ] **Step 3: Verify nothing else broke**

Run: `npm run build`
Expected: build completes.

Run: `grep -rn "'#000'" web/components`
Expected: only intentional leftovers (if any from Step 1), which you noted. No `#000` remains on an accent background.

`npm run dev`: switch to light theme — accent buttons/pills/badges now show white-on-green text (legible), and dark theme is unchanged (black-on-green).

- [ ] **Step 4: Commit**

```bash
git add web/components
git commit -m "refactor: route on-accent text through --text-on-accent token"
```

---

### Task 7: Audit — crit color + phase palette

**Files:**
- `web/components/feedback-form.tsx:179`
- `web/components/login-form.tsx:118`
- `web/components/mobile-gate.tsx:197`
- `web/components/unit-wizard.tsx:22`
- `web/components/phase-chrome.ts:6-9`

- [ ] **Step 1: Route error reds through `--crit`**

`web/components/feedback-form.tsx` line 179 — change `color: '#ff4444'` to:
```tsx
        <p style={{ color: 'var(--crit)', marginBottom: '1rem', fontSize: '0.875rem' }}>
```

`web/components/login-form.tsx` line 118 — change `color: '#ff4444'` to:
```tsx
              <p style={{ color: 'var(--crit)', fontSize: '0.875rem' }}>{errorMsg}</p>
```

`web/components/mobile-gate.tsx` line 197 — drop the now-defined fallback:
```tsx
            color: 'var(--crit)',
```

- [ ] **Step 2: Route phase colors through `--phase-*`**

`web/components/unit-wizard.tsx` line 22 — replace the hardcoded array:
```tsx
const PHASE_COLORS = ['var(--phase-1)', 'var(--phase-2)', 'var(--phase-3)', 'var(--phase-4)']
```
(Lines 171, 179, 311 already index `PHASE_COLORS[...]` and need no change.)

`web/components/phase-chrome.ts` lines 6-9 — replace each `color` literal, keeping the activation→1, reflection→2, concept→3, practice→4 mapping (same order as the dark hex values):
```ts
  activation: { label: { ru: 'Активация', en: 'Activation' }, icon: '⚡', color: 'var(--phase-1)' },
  reflection: { label: { ru: 'Рефлексия', en: 'Reflection' }, icon: '👁', color: 'var(--phase-2)' },
  concept:    { label: { ru: 'Концепция', en: 'Concept' },    icon: '💡', color: 'var(--phase-3)' },
  practice:   { label: { ru: 'Практика', en: 'Practice' },    icon: '🛠', color: 'var(--phase-4)' },
```

- [ ] **Step 3: Verify**

Run: `npm test`
Expected: existing `phase-chrome.test.ts` and all suites pass (the test asserts labels/markers, not raw hex — confirm by reading it if a color assertion exists; if it asserts a hex `color`, update that expectation to the matching `var(--phase-N)` string).

Run: `npm run build`
Expected: build completes.

`npm run dev`: in light theme, phase chips and the wizard progress bar use the darker phase variants (legible on paper); error messages use the darker red. Dark theme unchanged.

- [ ] **Step 4: Commit**

```bash
git add web/components/feedback-form.tsx web/components/login-form.tsx web/components/mobile-gate.tsx web/components/unit-wizard.tsx web/components/phase-chrome.ts
git commit -m "refactor: route crit + phase colors through theme tokens"
```

---

### Task 8: Documentation sync

**Files:**
- Modify: `CLAUDE.md`
- Modify: `web/README.md`

- [ ] **Step 1: Update CLAUDE.md**

In the `### Web / LMS` stack bullet, change:
```
- CSS Custom Properties + Tailwind 4 — темы через `data-theme` атрибут
```
to:
```
- CSS Custom Properties + Tailwind 4 — light/dark темы через `data-theme` (`light`/`dark`), дефолт = система (prefers-color-scheme), выбор в nav (`theme-pref`)
```

In the RPG **localStorage-ключи** line, add `theme-pref` to the list:
```
- **localStorage-ключи** (изолированы): `cs_wallet`, `unit_progress`, `daily_quests`, `niche_dungeon`, `help_seen`, `pacing`, `os`, `theme-pref`, `stack`, `lang-preference`.
```

- [ ] **Step 2: Update web/README.md**

In the Стек table, change the Стилизация row:
```
| Стилизация | CSS Custom Properties + Tailwind 4 (`data-theme="light|dark"`, дефолт = система) |
```

In the structure block under `components/`, add:
```
│   ├── theme-provider.tsx        — ThemeProvider + useTheme (live system follow)
│   ├── theme-toggle.tsx          — 3-сегментный переключатель темы (light/dark/system)
```
and under `lib/`, add:
```
│   ├── theme-pref.ts             — детект/хранение темы (light/dark/system)
```

In the **localStorage-ключи** line near the RPG table, add `theme-pref`:
```
`daily_quests`, `niche_dungeon`, `help_seen`, `pacing`, `os`, `theme-pref`, `stack`, `lang-preference`.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md web/README.md
git commit -m "docs: light/dark theme + theme-pref key"
```

---

## Final verification

- [ ] Run full suite: `npm test` (from `web/`) → all green, including the new `theme-pref.test.ts`.
- [ ] Run `npm run build` → completes, ~same page count as before.
- [ ] Manual: in dark theme the site is pixel-identical to pre-change; in light theme all text is legible (no neon-on-white, no black-on-green), the toggle persists across reloads, and `system` follows the OS live.
- [ ] After all tasks: dispatch a final holistic code review, then use **superpowers:finishing-a-development-branch**.
