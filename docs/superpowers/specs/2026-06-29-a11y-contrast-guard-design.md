# A11y contrast drift-guard + accent fix — design (fb_8cac8d78f49c)

**Ticket:** `fb_8cac8d78f49c` — A11y follow-on: color-contrast audit (WCAG AA on every text/bg token pair in `model-kit.css`, fix failures) + broader screen-reader/ARIA pass. (Spawned from `fb_a2c667a36a64` slice 4.)

## Goal

Make WCAG-AA contrast a **binding, regression-proof guard** over the LMS theme tokens, and fix the single current failure. The audit becomes a test that fails CI if any future palette edit drops a text/bg pair below AA (formalize-as-drift-guard, same pattern as the Kolb coverage guard).

## Audit result (already computed)

The palette is already AA-tuned (comments in `model-kit.css` say so) — **11 of 12** key pairs pass ≥4.5 in both themes. **One failure:** light `--text-accent: #0077cc` on `--bg-primary #f4f1ea` = **4.13** (AA normal text needs 4.5; passes large-only). Links/eyebrows use accent at small sizes → a real failure.

## Decisions (from design gate)

- **Fix:** light `--text-accent` `#0077cc` → **`#0070c0`** (4.56 — minimal change clearing AA, visually near-identical "deep blue").
- **Scope:** **LMS only**. The identical `#0077cc` in `hub/blog/mentor` `model-kit.css` copies (each app has its own) is a known divergence → follow-on, not touched here.
- **"Broad ARIA pass"** from the ticket is deferred — ARIA is already well-seeded (43 files); this slice is the concrete, testable contrast half.

## Scope

- Single app: `LMS/tochka-sborki/web/`. `lms_target: engine`.
- Out of scope: hub/blog/mentor model-kit copies, broad ARIA pass, contrast on non-token ad-hoc inline colors.

## Architecture — pure util + parse-and-assert guard + one-token fix

### 1. `lib/a11y/contrast.ts` — pure WCAG contrast util

```ts
// WCAG 2.x relative-luminance contrast ratio between two #rrggbb colors.
export function contrastRatio(hex1: string, hex2: string): number
```

sRGB channel linearization (`c<=0.03928 ? c/12.92 : ((c+0.055)/1.055)**2.4`), luminance `0.2126 R + 0.7152 G + 0.0722 B`, ratio `(max+0.05)/(min+0.05)`. Pure, reusable, unit-testable.

### 2. `lib/a11y/contrast.test.ts` — sanity + model-kit AA guard

- **Sanity:** `contrastRatio('#ffffff','#000000')` ≈ 21 (assert > 20.9); `contrastRatio('#ffffff','#ffffff')` === 1.
- **Parse** `themes/model-kit.css`: extract the `[data-theme="dark"] { … }` and `[data-theme="light"] { … }` blocks, build a `name → #hex` map per theme (regex `--([\w-]+):\s*(#[0-9a-fA-F]{6})`).
- **Assert ≥ 4.5** for these 12 pairs (6 per theme), all verified passing post-fix:
  - `text-primary` / `bg-primary`
  - `text-secondary` / `bg-primary`
  - `text-secondary` / `bg-surface`
  - `text-accent` / `bg-primary`
  - `text-on-accent` / `text-accent`
  - `crit` / `bg-primary`

  Implemented as a per-theme loop over a pair list, with a descriptive message naming the failing pair + its ratio.

### 3. `themes/model-kit.css` — the one fix

Change the `[data-theme="light"]` block:
```css
  --text-accent: #0077cc;       /* Deep blue for light mode contrast */
```
to:
```css
  --text-accent: #0070c0;       /* Deep blue, AA-tuned (4.56:1 on paper bg) */
```

(Dark theme accent `#00d1ff` already passes at 10.88 — unchanged.)

## Testing

The contrast test is the deliverable's guard. Verification: `npm run test -- lib/a11y/contrast.test.ts` green (sanity + 12 AA assertions), `npm run build`, full suite (no regression). No new dependencies.

**Verify-bites discipline:** the guard must demonstrably catch a regression — confirm by temporarily reverting the accent to `#0077cc` (test goes red on the `light text-accent/bg-primary` pair), then restore `#0070c0` (green). Do NOT commit the temporary revert.

## Authenticity / values

Continues the "Access for all" baseline; the guard makes inclusivity non-regressable. Minimal brand disruption (`#0070c0` ≈ `#0077cc`).

## Backward compatibility

One hex value darkened (strictly-better legibility) + two new test files. No behavior change, no component edits, no new deps.

## Task decomposition (for the plan)

1. **`contrast.ts` util + sanity test** — pure `contrastRatio` + the white/black/white sanity assertions (TDD).
2. **model-kit AA guard + accent fix** — extend the test to parse `model-kit.css` and assert the 12 pairs (red on current `#0077cc`), then fix the token to `#0070c0` (green); verify-bites the guard.
