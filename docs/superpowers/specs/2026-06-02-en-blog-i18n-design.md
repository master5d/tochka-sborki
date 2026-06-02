# EN Blog i18n — Design

**Date:** 2026-06-02
**Site:** `hub/` (mamaev.coach)
**Goal:** Ship full English mirror of the hub blog — all 4 posts, locale-aware UI, and full agent-ready parity (hreflang, EN sitemap entries, `/en/llms.txt`, EN RSS) — without disturbing the RU canon.

## Context

The hub blog today is RU-only:

- `lib/posts.ts` — single source of truth. `Post` has **flat** `title`/`description`/`readingTime` (all RU). `SITE.lang = 'ru'`. `formatDate` uses `RU_MONTHS`. `postUrl(slug)` → `/blog/<slug>/`.
- Posts render as React components. Three live in `components/blog/posts/<slug>.tsx`; **prologue** is special: `components/prologue/Prologue.tsx`, with a custom PT-Serif font and its own `app/blog/prologue/opengraph-image.tsx` (hardcoded RU text). All post components already accept a `locale` prop but `throw new Error('EN translation pending')` on `'en'`.
- Per-post `app/blog/<slug>/page.tsx` hardcodes RU `metadata`.
- UI strings are hardcoded RU in `BlogIndex` ("Блог", "Читать", "Пока нет публикаций"), `PostLayout` ("← Блог", "По теме"), `BlogFooter` (Telegram/course sentence).
- Agent layers all derive from `posts` and are RU: `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/blog/rss.xml/route.ts`, `components/blog/json-ld.tsx` (`inLanguage: SITE.lang`), `app/robots.ts`.
- i18n precedent (landing): `app/en/page.tsx` → `<HomePage locale="en" />`; `lib/dictionaries.ts` carries full RU+EN dictionaries keyed by `Locale = 'ru' | 'en'`.

The 4 posts: **prologue** (~12 min, spiritual/poetic register), **horizons** (~7 min), **charter** (~6 min, Nina narrative), **desops-hub** (~8 min, technical DesOps; has `DesOpsMasterDiagram`).

## Locale model — Approach A (additive `en?`)

Keep the flat fields as the **RU canon** (existing RU code keeps reading `post.title` unchanged) and add an optional EN block. Presence of `en` means the post is translated and should appear in the EN index; absence means it is hidden from EN surfaces.

```ts
type Localized = { title: string; description: string; readingTime: string }

type Post = {
  slug: string
  date: string
  updated?: string
  author: string
  tags: string[]
  related: string[]
  draft?: boolean
  ogImage?: string
  // RU canon (flat, unchanged):
  title: string
  description: string
  readingTime: string
  // EN mirror (additive):
  en?: Localized
}
```

All locale resolution is isolated in one well-bounded helper so consumers never branch on locale inline:

```ts
type ResolvedPost = {
  title: string
  description: string
  readingTime: string
  url: string        // /blog/<slug>/  or  /en/blog/<slug>/
  langTag: string    // 'ru-RU' | 'en-US'
  date: string
  formattedDate: string
}
function localizedPost(post: Post, locale: Locale): ResolvedPost
```

Supporting accessors in `lib/posts.ts`:

- `getAllPosts(locale: Locale = 'ru', source = posts)` — for `'en'`, additionally filter to `p.en != null`. RU behaviour unchanged (default arg).
- `postUrl(slug, locale: Locale = 'ru')` — RU `/blog/<slug>/`; EN `/en/blog/<slug>/`. Default preserves existing call sites.
- `formatDate(iso, locale: Locale = 'ru')` — RU months as today; EN via `EN_MONTHS` (or `Intl.DateTimeFormat('en-US')`), e.g. `1 June 2026`.
- `SITE.lang` stays `'ru'` (it is the site default); per-locale language tags come from `localizedPost`.

**Rationale:** minimal churn, RU canon untouched, append-safe, and all locale logic lives in one unit that can be tested independently.

## Components → locale-aware

UI strings move into `lib/dictionaries.ts` under a `blog` section (RU+EN): `indexHeading` ("Блог"/"Blog"), `indexBackToSite`, `empty`, `readCta` ("Читать"/"Read"), `backToBlog` ("← Блог"/"← Blog"), `relatedLabel` ("По теме"/"Related"), `footerThinkAloud` + `footerPractice` (the Telegram/course sentence, fully translated).

- `BlogIndex({ locale })` — pulls strings from the dict; lists `getAllPosts(locale)`; links via `postUrl(slug, locale)`; renders `localizedPost(...).title/description`.
- `PostLayout({ post, locale, children })` — back link, related list, dates all locale-resolved; related links via `postUrl`. `BlogPostingLd`/`BlogLd` receive `locale`.
- `BlogFooter({ locale })` — translated sentence; same Telegram + course links (course link → `https://ai.mamaev.coach/en/` for EN).
- Post components — replace the `throw` with the EN render branch (see translations).
- `json-ld.tsx` — `BlogPostingLd`/`BlogLd` take `locale`; `inLanguage` = `localizedPost(...).langTag`; URLs via `postUrl(slug, locale)`.

## Routing

Mirror the `app/en/page.tsx` precedent. Explicit dirs (required by `output: 'export'` + per-post hardcoded metadata):

- `app/en/blog/page.tsx` → `<BlogIndex locale="en" />` + EN metadata.
- `app/en/blog/prologue/page.tsx`, `.../horizons/`, `.../charter/`, `.../desops-hub/` → `<PostLayout post={getPost(slug)!} locale="en"><Component locale="en" /></PostLayout>` + EN metadata.

**hreflang on both sides.** Every blog page (RU and EN) gets:

```ts
alternates: {
  canonical: '<self url>',
  languages: {
    'ru-RU': 'https://mamaev.coach/blog/<slug>/',
    'en-US': 'https://mamaev.coach/en/blog/<slug>/',
    'x-default': 'https://mamaev.coach/blog/<slug>/',
  },
}
```

RU post pages currently lack `alternates` → add them. The blog index pages (`/blog/` ↔ `/en/blog/`) get the same treatment.

## EN translations (Gemini draft → Claude polish)

For each of the 4 posts, Gemini produces a first-pass EN translation of the body + the page-metadata strings (title/description/OG). Claude then polishes for register:

- **prologue** — preserve the spiritual/"great transition / liberation" cadence; do **not** flatten to literal translation. This is the highest-care item.
- **charter** — keep the Nina narrative warm and concrete; "устав" → "charter"; idioms ("таскаешь воду решетом") get equivalent English images, not calques.
- **horizons** — the "four doors" framing; non-technical voice intact.
- **desops-hub** — technical; lowest register risk. `DesOpsMasterDiagram` text labels translated if they contain RU copy.

Each post's `en` block in `posts.ts` is filled (title/description/readingTime). Internal `<a href="/blog/...">` links inside post bodies switch to `/en/blog/...` in the EN branch.

## Agent-ready layers (full parity)

- **sitemap** (`app/sitemap.ts`) — add EN URLs; attach `alternates.languages` per entry (Next `MetadataRoute.Sitemap` supports `alternates`). RU and EN index + per-post.
- **llms.txt** — new `app/en/llms.txt/route.ts` (EN copy, lists `getAllPosts('en')`, EN section labels). RU `llms.txt` adds a cross-link line to `/en/llms.txt`.
- **RSS** — new `app/en/blog/rss.xml/route.ts` with `<language>en</language>`, EN titles/descriptions, `postUrl(slug,'en')`. RU RSS unchanged.
- **json-ld** — per-locale `inLanguage` (covered in components).
- **prologue OG** — new `app/en/blog/prologue/opengraph-image.tsx`: same layout/font, EN text ("Tochka Sborki" / "Prologue" / EN subtitle). Reuses the same woff files (referenced by path).
- **robots** — unchanged (points to single `sitemap.xml`, which now carries EN via `alternates`).

## Out of scope (v1)

- Adding a blog link to the `/en` landing nav (landing currently does not surface the blog; not a regression).
- A locale switcher widget *on blog pages* (hreflang covers crawlers/agents; human toggle can come later).
- **v2 intake copywriting polish** — tracked separately; in-place editorial on already-shipped questions, no architecture, no brainstorm needed.

## Verification

1. `npx tsc --noEmit` → 0 errors.
2. `next build` (hub) → clean; confirm `out/en/blog/`, `out/en/blog/<slug>/`, `out/en/llms.txt`, `out/en/blog/rss.xml` exist.
3. Spot-check generated HTML: hreflang `<link rel="alternate">` present on both RU and EN post pages; EN index lists 4 posts; EN RSS `<language>en</language>`.
4. RU regression: existing `/blog/` output byte-stable except for the added `alternates` hreflang tags.

## Build order

1. `lib/posts.ts` locale model + accessors + `lib/dictionaries.ts` blog dict. (unit-testable; extend `posts.test.ts`.)
2. Components locale-aware (`BlogIndex`, `PostLayout`, `BlogFooter`, `json-ld`).
3. EN routes (index + 4 posts) + hreflang on RU & EN pages.
4. EN post-body translations (Gemini draft → Claude polish) + fill `en` blocks.
5. Agent layers: EN sitemap entries, `/en/llms.txt`, `/en/blog/rss.xml`, EN prologue OG.
6. Verify (tsc + build + output spot-check + RU regression).
