# A11y Contrast Drift-Guard + Accent Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WCAG-AA contrast a binding, regression-proof guard over the LMS theme tokens, and fix the one current failure (light `--text-accent`).

**Architecture:** A pure `contrastRatio` util + a Vitest guard that parses `themes/model-kit.css` and asserts AA (≥4.5) for 12 text/bg token pairs across both themes; plus a one-hex fix to the failing light accent. Formalize-as-drift-guard pattern.

**Tech Stack:** TypeScript, Vitest, CSS custom properties. No new dependencies.

## Global Constraints

- App directory: all paths under `LMS/tochka-sborki/web/`. Run all commands from there.
- Test runner: `npm run test` (= `vitest run`). Scoped: `npm run test -- lib/a11y/contrast.test.ts`.
- WCAG AA normal-text threshold: **contrast ratio ≥ 4.5**.
- The fix: light `--text-accent` `#0077cc` → `#0070c0` (4.13 → 4.56). Dark accent `#00d1ff` unchanged.
- Scope is **LMS only** — do NOT touch `hub/`, `blog/`, or `mentor/` model-kit copies (known divergence, deferred).
- Additive: one hex change + two new test files. No component edits, no new deps.
- Commit directly to `main` (trunk-based). Do NOT create a feature branch.

---

### Task 1: Pure `contrastRatio` util + sanity test

**Files:**
- Create: `lib/a11y/contrast.ts`
- Test: `lib/a11y/contrast.test.ts`

**Interfaces:**
- Produces: `function contrastRatio(hex1: string, hex2: string): number` — WCAG 2.x ratio between two `#rrggbb` colors (order-independent, range 1–21).

- [ ] **Step 1: Write the failing test**

Create `lib/a11y/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { contrastRatio } from './contrast'

describe('contrastRatio', () => {
  it('is ~21 for black on white', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeGreaterThan(20.9)
  })
  it('is 1 for identical colors', () => {
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })
  it('is order-independent', () => {
    expect(contrastRatio('#0070c0', '#f4f1ea')).toBeCloseTo(
      contrastRatio('#f4f1ea', '#0070c0'), 5,
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- lib/a11y/contrast.test.ts`
Expected: FAIL — cannot resolve `./contrast`.

- [ ] **Step 3: Implement the util**

Create `lib/a11y/contrast.ts`:

```ts
// lib/a11y/contrast.ts
// WCAG 2.x relative-luminance contrast ratio between two #rrggbb colors.
// Returns a value in [1, 21], order-independent.

function channel(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1)
  const l2 = luminance(hex2)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/a11y/contrast.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/a11y/contrast.ts lib/a11y/contrast.test.ts
git commit -m "feat(a11y): pure WCAG contrastRatio util (fb_8cac8d78f49c)"
```

---

### Task 2: model-kit AA guard + light-accent fix

**Files:**
- Modify: `lib/a11y/contrast.test.ts` (add the model-kit AA guard block)
- Modify: `themes/model-kit.css` (light `--text-accent` fix)

**Interfaces:**
- Consumes: `contrastRatio` from `./contrast` (Task 1).
- Produces: a guard that fails if any of the 12 token pairs drops below AA.

- [ ] **Step 1: Add the guard test (currently red on the unfixed accent)**

Append this block to `lib/a11y/contrast.test.ts` (after the existing `describe`):

```ts
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const HERE = dirname(fileURLToPath(import.meta.url))
const MODEL_KIT = join(HERE, '..', '..', 'themes', 'model-kit.css') // web/themes/model-kit.css

// Extract a `--name: #rrggbb` map from a single [data-theme="<name>"] { … } block.
function themeTokens(css: string, theme: 'dark' | 'light'): Record<string, string> {
  const block = new RegExp(`\\[data-theme="${theme}"\\]\\s*\\{([^}]*)\\}`).exec(css)
  if (!block) throw new Error(`theme block not found: ${theme}`)
  const out: Record<string, string> = {}
  const re = /--([\w-]+):\s*(#[0-9a-fA-F]{6})/g
  let m: RegExpExecArray | null
  while ((m = re.exec(block[1])) !== null) out[m[1]] = m[2]
  return out
}

// Pairs that must meet AA normal-text (>= 4.5): [fg token, bg token].
const PAIRS: [string, string][] = [
  ['text-primary', 'bg-primary'],
  ['text-secondary', 'bg-primary'],
  ['text-secondary', 'bg-surface'],
  ['text-accent', 'bg-primary'],
  ['text-on-accent', 'text-accent'],
  ['crit', 'bg-primary'],
]

describe('model-kit WCAG AA contrast guard', () => {
  const css = readFileSync(MODEL_KIT, 'utf8')
  for (const theme of ['dark', 'light'] as const) {
    const t = themeTokens(css, theme)
    for (const [fg, bg] of PAIRS) {
      it(`${theme}: --${fg} on --${bg} meets AA (>=4.5)`, () => {
        const r = contrastRatio(t[fg], t[bg])
        expect(r, `${theme} --${fg} (${t[fg]}) on --${bg} (${t[bg]}) = ${r.toFixed(2)}`).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})
```

- [ ] **Step 2: Run test to verify it fails on the unfixed accent**

Run: `npm run test -- lib/a11y/contrast.test.ts`
Expected: FAIL — exactly one case red: `light: --text-accent on --bg-primary meets AA (>=4.5)` (ratio 4.13). This proves the guard bites.

- [ ] **Step 3: Fix the light accent token**

In `themes/model-kit.css`, inside the `[data-theme="light"]` block, change:

```css
  --text-accent: #0077cc;       /* Deep blue for light mode contrast */
```
to:
```css
  --text-accent: #0070c0;       /* Deep blue, AA-tuned (4.56:1 on paper bg) */
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- lib/a11y/contrast.test.ts`
Expected: PASS (3 sanity + 12 guard cases = 15).

- [ ] **Step 5: Verify-bites the guard (do NOT commit the revert)**

Temporarily change `--text-accent` back to `#0077cc`, run `npm run test -- lib/a11y/contrast.test.ts`, confirm the `light: --text-accent on --bg-primary` case goes RED, then restore `#0070c0` and confirm green. This proves the guard catches a real regression. Leave the file at `#0070c0`.

- [ ] **Step 6: Build + full suite (no regression)**

Run: `npm run build`
Expected: build succeeds.

Run: `npm run test`
Expected: PASS — full suite green including the 15 contrast assertions.

- [ ] **Step 7: Commit**

```bash
git add lib/a11y/contrast.test.ts themes/model-kit.css
git commit -m "feat(a11y): WCAG-AA contrast guard over model-kit tokens + light-accent fix (fb_8cac8d78f49c)"
```

---

## Self-Review

**1. Spec coverage:**
- Pure `contrastRatio` util → Task 1. ✅
- Parse model-kit dark+light blocks, assert ≥4.5 for the 6 pairs/theme (12 total) → Task 2 Step 1. ✅
- Sanity assertions (white/black ≈21, identical =1) → Task 1. ✅
- Light-accent `#0077cc` → `#0070c0` fix → Task 2 Step 3. ✅
- Verify-bites discipline (guard catches the regression, revert not committed) → Task 2 Step 5. ✅
- LMS-only scope (no hub/blog/mentor) → Global Constraints. ✅
- No new deps, additive → Global Constraints. ✅

**2. Placeholder scan:** No TBD/TODO. All code (util, test, regex, fix) is complete and verbatim.

**3. Type/consistency:** `contrastRatio(hex1, hex2): number` signature matches between Task 1 (produces) and Task 2 (consumes). The `PAIRS` token names (`text-primary`, `bg-primary`, `bg-surface`, `text-accent`, `text-on-accent`, `crit`) all exist in both `[data-theme]` blocks of `model-kit.css`. All 12 pairs verified ≥4.5 post-fix (dark min 5.58, light min 4.56). The MODEL_KIT path climb (`lib/a11y/` → `themes/`) matches the existing `keyboard.test.ts` path idiom.
