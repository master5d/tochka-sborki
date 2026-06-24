# Founder-story Hub Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual "lived transformation" founder-story section to the hub landing — Kundalini teacher → sovereign agentic-AI builder, throughline "amplify the voice, don't replace it".

**Architecture:** Data + a presentational section within `hub/`. A `founder` block (eyebrow/heading/paragraphs) is added to `hub/lib/dictionaries.ts`; a new section renders it in `hub/components/home-page.tsx` between the PITCH and PROJECTS sections, following the existing inline-styled "eyebrow + content" idiom.

**Tech Stack:** Next.js (static export, bilingual ru `/` + en `/en/`), TypeScript, Vitest.

## Global Constraints

- All files under `hub/`. Static export — no state, no network, no storage.
- Bilingual ru + en in every added string.
- Engine pattern: copy in `dictionaries.ts`, rendered by `home-page.tsx` — no hardcoded prose in the component.
- Additive only: do not change the hero `bio`, pitch, projects, socials, footer, or section ordering — only add the `founder` block and its section (placed between PITCH and PROJECTS).
- Authenticity (binding): the guru past is owned, not sold (spiritual name as honest ownership, not a mystical flex); the turn is the anti-dependency principle; no mysticism-as-marketing, no scarcity, no glossy framing. Use the approved copy verbatim.
- Frontend-only: hub CI job (`mamaev-coach-hub` Pages). No worker, no migration, no secret.
- Run tests from `hub/`: `npx vitest run`. Build: `npm run build`.

---

### Task 1: founder dictionary block + test

**Files:**
- Modify: `hub/lib/dictionaries.ts`
- Test: `hub/lib/dictionaries.founder.test.ts` (new)

**Interfaces:**
- Consumes: existing `Dictionary` interface, `dictionaries` record, `getDictionary` in `dictionaries.ts`.
- Produces (relied on by Task 2): `Dictionary.founder: { eyebrow: string; heading: string; paragraphs: string[] }` on both `ru` and `en`.

- [ ] **Step 1: Write the failing test**

Create `hub/lib/dictionaries.founder.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getDictionary } from './dictionaries'

describe('founder dictionary block', () => {
  for (const locale of ['ru', 'en'] as const) {
    it(`${locale}: has non-empty eyebrow, heading, and >=3 non-empty paragraphs`, () => {
      const f = getDictionary(locale).founder
      expect(f.eyebrow.length).toBeGreaterThan(0)
      expect(f.heading.length).toBeGreaterThan(0)
      expect(f.paragraphs.length).toBeGreaterThanOrEqual(3)
      for (const p of f.paragraphs) expect(p.trim().length).toBeGreaterThan(0)
    })
  }
  it('ru and en founder copy differ (bilingual)', () => {
    expect(getDictionary('ru').founder.heading).not.toBe(getDictionary('en').founder.heading)
    expect(getDictionary('ru').founder.paragraphs.join('|')).not.toBe(getDictionary('en').founder.paragraphs.join('|'))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd hub && npx vitest run lib/dictionaries.founder.test.ts`
Expected: FAIL — `founder` does not exist on the dictionary (type error / undefined).

- [ ] **Step 3: Add `founder` to the `Dictionary` interface**

In `hub/lib/dictionaries.ts`, in the `Dictionary` interface, add the `founder` field immediately after the `pitch` field:

```ts
  founder: { eyebrow: string; heading: string; paragraphs: string[] }
```

- [ ] **Step 4: Add the ru `founder` block**

In the `ru` dictionary, immediately after the `pitch: { … },` block (before `projectsLabel`), add:

```ts
    founder: {
      eyebrow: '// путь',
      heading: 'Усиливать голос, не заменять',
      paragraphs: [
        'Раньше я был учителем кундалини-йоги — с духовным именем (Рави Ангад Синх), мантрами, линией передачи, тренингами для учителей. Это был мир преданности гуру.',
        'Я намеренно ушёл из модели зависимости от учителя. Не потому что путь был плохим — а потому что сильный учитель растит не последователя, а другого учителя.',
        'Тот же принцип теперь в инструментах, которые я строю: AI усиливает твой голос, а не заменяет. Суверенность и агентность вместо зависимости — этому учит Точка Сборки, и так я живу сам.',
      ],
    },
```

- [ ] **Step 5: Add the en `founder` block**

In the `en` dictionary, immediately after the `pitch: { … },` block (before `projectsLabel`), add:

```ts
    founder: {
      eyebrow: '// the path',
      heading: "Amplify the voice, don't replace it",
      paragraphs: [
        'I used to be a Kundalini-yoga teacher — with a spiritual name (Ravi Angad Singh), mantras, a lineage, teacher trainings. It was a world of devotion to the guru.',
        'I deliberately left the teacher-dependency model. Not because the path was bad — but because a strong teacher raises another teacher, not a follower.',
        "The same principle now lives in the tools I build: AI amplifies your voice, it doesn't replace it. Sovereignty and agency over dependency — that's what Tochka Sborki teaches, and how I live.",
      ],
    },
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd hub && npx vitest run lib/dictionaries.founder.test.ts`
Expected: PASS — founder block present, bilingual, non-empty.

- [ ] **Step 7: Run the full hub suite to confirm no regression**

Run: `cd hub && npx vitest run`
Expected: PASS — full suite green.

- [ ] **Step 8: Commit**

```bash
git add hub/lib/dictionaries.ts hub/lib/dictionaries.founder.test.ts
git commit -m "feat(hub): founder-story dictionary block (fb_e0529c53c234)"
```

---

### Task 2: founder-story section on the home page

**Files:**
- Modify: `hub/components/home-page.tsx`

**Interfaces:**
- Consumes (from Task 1): `t.founder.{eyebrow, heading, paragraphs}` via `getDictionary(locale)`.
- Produces: no new exports; a rendered section between PITCH and PROJECTS.

- [ ] **Step 1: Insert the founder-story section**

In `hub/components/home-page.tsx`, locate the boundary between the PITCH section's closing `</section>` and the `{/* ── PROJECTS ─ … */}` comment. Insert the new section there. The exact insertion replaces this boundary text:

Find:

```tsx
      </section>

      {/* ── PROJECTS ───────────────────────────────────────────── */}
```

Replace with:

```tsx
      </section>

      {/* ── FOUNDER STORY (lived transformation) ───────────────── */}
      <section className="hub-section" style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1.25rem',
          }}>
            {t.founder.eyebrow}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            lineHeight: 1.0,
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            margin: '0 0 1.75rem',
          }}>
            {t.founder.heading}
          </h2>
          {t.founder.paragraphs.map((p, i) => (
            <p key={i} style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              lineHeight: 1.7,
              margin: '0 0 1.25rem',
            }}>
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* ── PROJECTS ───────────────────────────────────────────── */}
```

This is the only change. Do not alter the PITCH section above it or the PROJECTS section below it.

- [ ] **Step 2: Typecheck + static export build**

Run: `cd hub && npm run build`
Expected: PASS — full typecheck succeeds and static export emits `out/index.html` and `out/en/index.html`. No type error on `t.founder.eyebrow`, `t.founder.heading`, or `t.founder.paragraphs`.

- [ ] **Step 3: Run the full hub test suite**

Run: `cd hub && npx vitest run`
Expected: PASS — full suite green (no test consumes the home-page component directly; this confirms nothing else regressed).

- [ ] **Step 4: Commit**

```bash
git add hub/components/home-page.tsx
git commit -m "feat(hub): render founder-story section between pitch and projects (fb_e0529c53c234)"
```

---

## Self-Review

**Spec coverage:**
- `founder` block (eyebrow/heading/paragraphs) bilingual → Task 1 (Steps 3-5). ✓
- Approved copy verbatim (ru + en) → Task 1 (Steps 4-5). ✓
- Data tests (bilingual, non-empty, ≥3 paragraphs, ru≠en) → Task 1 (Step 1). ✓
- Section rendered between PITCH and PROJECTS, eyebrow+heading+paragraphs idiom → Task 2 (Step 1). ✓
- Validation by hub `next build` (out/index.html + out/en/index.html) → Task 2 (Step 2). ✓
- Carve (no S.A.S.H.A/manifesto, no photo, no /about) → respected; nothing added. ✓
- Additive (no hero bio/pitch/projects/socials change) → Task 2 inserts only at the PITCH↔PROJECTS boundary. ✓

**Placeholder scan:** none — all code and copy complete and verbatim.

**Type consistency:** `founder: { eyebrow: string; heading: string; paragraphs: string[] }` defined on the `Dictionary` interface in Task 1 and consumed as `t.founder.{eyebrow, heading, paragraphs}` in Task 2 with matching names/types; `paragraphs.map((p, i) => …)` matches `string[]`. ✓
