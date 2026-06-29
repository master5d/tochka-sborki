# Blog-post-per-showcase — design (fb_83d05aa7ee6f)

**Ticket:** `fb_83d05aa7ee6f` — «Блогпост на каждый showcase-кейс (развёрнутый use-case под демо-витриной)». Each real proof case in the LMS showcase gets an accompanying deep-dive blog post; the case card links to it.

## Goal

Author 4 deep-dive use-case blog posts (one per **real** showcase case) in the standalone blog app, and wire each LMS real case to its post with a locale-correct link, guarded by a cross-app drift test so links never rot.

## Context (audit — grep-before-build)

- **Showcase lives in LMS:** `LMS/tochka-sborki/web/lib/course/showcase.ts`. 4 `REAL_CASES` (proof, with `result`/`author` payoff): `echo`, `lms`, `canvas`, `brain`. 10 `DREAM_CASES` (aspirational, no deep-dive).
- **Connective field already exists:** `RealCase.href?: string // → blog deep-dive; omitted until the post exists`. All 4 currently omitted (dark).
- **Gallery UI already wired:** `components/showcase-filter.tsx` renders `c.href ? <a href={c.href}>…<div>→ разбор/→ deep-dive</div></a> : <div>` for real cases. **No component change needed** — populating `href` lights the link. The `deepDive` affordance label is already localized; only the `href` value is not locale-aware today.
- **Blog is standalone** (`mamaev.coach/blog`), no cross-app import with LMS. Post pattern = 4 artifacts each: registry entry in `blog/lib/posts.ts` (`posts: Post[]`), body `blog/components/blog/posts/<slug>.tsx` (RU + EN branches), RU route `blog/app/blog/<slug>/page.tsx`, EN route `blog/app/en/blog/<slug>/page.tsx`. Index, RSS, llms.txt, OG, and the SEO manifest all derive from the registry — **not touched**.
- **Voice template:** `horizons` post — calm, first-person, concrete, with the signature boundary device («AI берёт: … / Остаётся твоим: …»).

## Authoring scope (from design gate)

Write all 4 posts now. **Authenticity guardrails** (sacred constraints): posts are technically grounded in the real backing projects (sourced facts), use the established first-person voice, reuse each case's existing owner-authored `result` line as the honest payoff, and invent **no** metrics, testimonials, or subjective results beyond what the owner already wrote. De-guru, de-hustle, no glossy/scarcity.

| case id | post slug | backing project (grounded facts) | honest payoff (verbatim from showcase.ts `result`) |
|---|---|---|---|
| `echo` | `echo` | Echo dictation: Tauri + Rust + React, GPU Whisper via Vulkan, offline, RU/EN code-switch, fork of Handy, Meeting Copilot | «Письма, заметки и код теперь надиктовываю — печать ушла на второй план.» |
| `canvas` | `diagram-canvas` | sovern-mindmap: one canvas, background generators, "move meaning not draw rectangles", Outline/Document/Reading views | «Схемы, на которые уходил час в редакторе, рождаются за минуты.» |
| `lms` | `the-site-itself` | this very site: RPG course platform, AI mentor, world map, quests, built solo via vibe-coding | «Целый обучающий продукт собран в одиночку, без классической команды разработки.» |
| `brain` | `second-brain` | embedding-agent KG: notes/sources/experience → knowledge graph, GraphRAG, query your own archive | «Перестал терять идеи — спрашиваю собственный архив как живого собеседника.» |

## Post structure (consistent skeleton, scannable, ~shorter than horizons)

Each post body (RU + EN, mirrored) follows:
1. `styles.lead` — a hook tied to the reader's pain.
2. `<h2>` «Что болело» / "What hurt" — the problem before the tool.
3. `<h2>` «Что я собрал» / "What I built" — what the thing is, grounded in real facts.
4. `<h2>` «Как — без команды» / "How — without a team" — the vibe-coding how (agent did X, I did Y).
5. `styles.boundary` device — «AI берёт: … / Остаётся твоим: …» (reused signature).
6. honest result paragraph — built around the owner's existing `result` line, no embellishment.
7. closing `<p>` — CTA back to the course/intake + an internal link to a related post (`/blog/prologue/` or `/blog/horizons/`, locale-correct prefix).

Each registry `Post` entry carries: `slug`, RU `title`/`description`/`readingTime`, `date` (2026-06-29), `author: 'Александр Мамаев'`, `tags`, `related` (existing slugs), and a full `en` block. No `draft` (published), no `kind` (essay).

## LMS wiring — locale-aware deep-dive link

In `LMS/tochka-sborki/web/lib/course/showcase.ts`:
- Add `deepDive?: string` (blog slug) to the `RealCase` interface.
- Add helper:
  ```ts
  export function deepDiveUrl(slug: string, locale: Locale): string {
    const prefix = locale === 'en' ? '/en/blog/' : '/blog/'
    return `https://mamaev.coach${prefix}${slug}/`
  }
  ```
- In `getShowcase`, resolve each real case's `href`: `href: c.deepDive ? deepDiveUrl(c.deepDive, locale) : c.href`. (`locale` here is the function's `Locale`; `L` stays the `'ru'|'en'` narrowing for `Bi` lookups.)
- Set `deepDive` on the 4 real cases: `echo`→`'echo'`, `lms`→`'the-site-itself'`, `canvas`→`'diagram-canvas'`, `brain`→`'second-brain'`.
- `DREAM_CASES` and `ShowcaseCase.href` untouched (dream cases never deep-link).

Canonical link form: `https://mamaev.coach/blog/<slug>/` (ru) and `https://mamaev.coach/en/blog/<slug>/` (en) — absolute, because LMS and blog are separate apps/origins.

## Drift-guard (cross-app, formalize-as-drift-guard)

The 4 slugs are the contract, asserted from both ends (the list is intentionally duplicated as `CONTRACT_SLUGS` in each test file — no cross-app import exists):

- **Blog** `blog/lib/posts.test.ts` — parametrized: for each `CONTRACT_SLUGS` slug, `getPost(slug)` exists, is non-draft, appears in `getAllPosts('ru')` and `getAllPosts('en')` (i.e. has an `en` block), and `author === 'Александр Мамаев'`.
- **LMS** `LMS/tochka-sborki/web/lib/course/showcase.test.ts` — `deepDiveUrl('x','ru')==='https://mamaev.coach/blog/x/'` and `deepDiveUrl('x','en')==='https://mamaev.coach/en/blog/x/'`; every `REAL_CASES` entry has a `deepDive` ∈ `CONTRACT_SLUGS`; `getShowcase('ru').real.cases` every `href` matches `https://mamaev.coach/blog/<slug>/` and `getShowcase('en')` matches the `/en/blog/` form.

## Scope

- Apps: `blog/` (4 posts) + `LMS/tochka-sborki/web/` (showcase wiring + test). Two app test suites run independently.
- **Out of scope:** dream-case deep-dives, OG-image art, blog index/RSS/manifest edits (auto-derived), restructuring per-post routes into a dynamic route, any showcase-gallery component change (already wired).

## Backward compatibility

Additive: 4 new posts (new slugs, no collision with prologue/horizons/charter/desops-hub/imagination/nervous-strength/graph), one new optional field + one helper in showcase.ts, locale-aware `href` resolution (previously straight-through; no real case set `href` before, so no behavior change for existing data). No dependencies. Existing posts and showcase dream cases unaffected.

## Testing

- Blog: `cd blog && npm run test` (vitest) green incl. the parametrized contract guard; `npm run build` (static export) succeeds with the 8 new routes.
- LMS: `cd LMS/tochka-sborki/web && npm run test` green incl. the showcase contract guard; `npm run build` succeeds.

## Task decomposition (for the plan)

Order = dark-ship discipline: posts exist before LMS lights the links.
1. Blog post `echo` (registry + body RU/EN + 2 routes) + per-post existence test.
2. Blog post `diagram-canvas` (same shape) + existence test.
3. Blog post `the-site-itself` (same shape) + existence test.
4. Blog post `second-brain` (same shape) + existence test + the parametrized blog-side `CONTRACT_SLUGS` guard (all 4 now exist).
5. LMS showcase wiring: `deepDive` field + `deepDiveUrl` helper + locale-aware `getShowcase` resolution + set 4 slugs + LMS-side contract guard.
