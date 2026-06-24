# Founder-story hub section — Design

**Ticket:** `fb_e0529c53c234` (Founder-story brand narrative — axis-2 hero's journey: Kundalini
teacher → sovereign agentic-AI builder, leaving the guru-dependency model behind).

**Date:** 2026-06-24

## Goal

Add a "lived transformation" narrative section to the hub landing (`mamaev.coach`): the
founder's arc from Kundalini-yoga teacher to sovereign agentic-AI builder, with the throughline
"amplify your voice, don't replace it" / agency over dependency. Honest — the guru past is
owned and transcended, not sold or mystified.

## Scope (carved by honest triage)

- **In scope:** one bilingual founder-story section on the hub home page, sourced from the
  dictionary (same engine pattern as the existing hero/pitch/projects sections).
- **Out of scope (deferred):**
  - S.A.S.H.A brand identity (`fb_7c7eda02a024`) and the academy manifesto (`fb_43a821d71a64`)
    — the story threads INTO them but does not build them.
  - A founder photo / portrait — no asset; text-only.
  - A dedicated `/about` page (YAGNI — landing section only).
  - Any change to the hero `bio`, pitch, projects, or socials.

## Architecture

Data + a presentational section, entirely within `hub/`. The bilingual copy lives in
`hub/lib/dictionaries.ts` as a new `founder` block on the `Dictionary` interface; the section
renders in `hub/components/home-page.tsx` between the PITCH and PROJECTS sections, following the
existing inline-styled "eyebrow + content" idiom. Static export — no state, no network, no
storage.

## Components

### `hub/lib/dictionaries.ts` (modified)

Add a `founder` block to the `Dictionary` interface and to both `ru` and `en` dictionaries:

```ts
founder: {
  eyebrow: string
  heading: string
  paragraphs: string[]   // the arc: past owned → turn → throughline
}
```

Approved copy (verbatim — `paragraphs` in order p1, p2, p3):

**ru:**
- `eyebrow`: `'// путь'`
- `heading`: `'Усиливать голос, не заменять'`
- `paragraphs`:
  1. `'Раньше я был учителем кундалини-йоги — с духовным именем (Рави Ангад Синх), мантрами, линией передачи, тренингами для учителей. Это был мир преданности гуру.'`
  2. `'Я намеренно ушёл из модели зависимости от учителя. Не потому что путь был плохим — а потому что сильный учитель растит не последователя, а другого учителя.'`
  3. `'Тот же принцип теперь в инструментах, которые я строю: AI усиливает твой голос, а не заменяет. Суверенность и агентность вместо зависимости — этому учит Точка Сборки, и так я живу сам.'`

**en:**
- `eyebrow`: `'// the path'`
- `heading`: `"Amplify the voice, don't replace it"`
- `paragraphs`:
  1. `'I used to be a Kundalini-yoga teacher — with a spiritual name (Ravi Angad Singh), mantras, a lineage, teacher trainings. It was a world of devotion to the guru.'`
  2. `'I deliberately left the teacher-dependency model. Not because the path was bad — but because a strong teacher raises another teacher, not a follower.'`
  3. `"The same principle now lives in the tools I build: AI amplifies your voice, it doesn't replace it. Sovereignty and agency over dependency — that's what Tochka Sborki teaches, and how I live."`

### `hub/components/home-page.tsx` (modified)

Insert a new `<section className="hub-section">` between the PITCH section (ends at the
`{/* ── PITCH … */}` block) and the PROJECTS section (`{/* ── PROJECTS … */}`). It mirrors the
PITCH section's structure: a `var(--content-max)` container, an accent-mono eyebrow
(`t.founder.eyebrow`), a display heading (`t.founder.heading`), and the paragraphs
(`t.founder.paragraphs.map(...)`) as readable prose (`max-width` ~720px, `--text-secondary`,
`line-height` ~1.7). Inline styles consistent with the surrounding sections; `borderTop: '1px
solid var(--border-color)'` like the other sections. Additive — no existing section changes.

## Data flow

Static. `getDictionary(locale)` returns the `founder` block; the section renders it. No
endpoint, no fetch, no storage.

## Error handling

Pure data over the closed `Locale` union; no runtime failure modes. `paragraphs` is a
fixed-length array rendered with a stable `key` (index is acceptable — the list is static and
never reordered).

## Authenticity (binding)

- The guru past is **owned, not sold**: named plainly (spiritual name as honest ownership, not
  a mystical credential-flex), framed as transcended.
- The turn is the **anti-dependency** principle (same as `fb_9f6458a2` — "a teacher makes a
  teacher, not a follower"), tying to the product throughline.
- No mysticism-as-marketing, no countdown/scarcity, no glossy testimonial framing. Plain,
  honest prose.

## Testing

- **`hub/lib/dictionaries.founder.test.ts` (new):** for `'ru'` and `'en'`,
  `getDictionary(locale).founder` exists with a non-empty `eyebrow`, non-empty `heading`, and a
  `paragraphs` array of length ≥3 with every entry non-empty; the ru and en `heading`
  (and `paragraphs.join`) differ (bilingual, not a copy).
- The section is presentational; it is validated by `npm run build` in `hub/` (static export
  emits `out/index.html` and `out/en/index.html`).

Run: `cd hub && npx vitest run lib/dictionaries.founder.test.ts` and the full `npx vitest run`;
plus `npm run build` for the section.

## Global constraints

- All files under `hub/`. Static export (Next.js, bilingual ru `/` + en `/en/`).
- Bilingual ru + en in every added string.
- Engine pattern: copy in `dictionaries.ts`, rendered by `home-page.tsx` — no hardcoded prose
  in the component.
- Additive only: do not change the hero `bio`, pitch, projects, socials, footer, or section
  ordering — only add the `founder` block and its section (placed between PITCH and PROJECTS).
- Frontend-only: hub CI job (`mamaev-coach-hub` Pages). No worker, no migration, no secret.

## Files

| File | Responsibility |
|---|---|
| `hub/lib/dictionaries.ts` | `founder` block (eyebrow/heading/paragraphs) bilingual |
| `hub/lib/dictionaries.founder.test.ts` | founder block data tests |
| `hub/components/home-page.tsx` | render the founder section between PITCH and PROJECTS |

## Out of scope

- S.A.S.H.A brand identity / academy manifesto.
- Founder photo / portrait.
- Dedicated `/about` page.
- Any change to hero bio, pitch, projects, or socials.
