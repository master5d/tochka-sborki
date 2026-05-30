# Agent-Ready Blog (hub/) — Design Spec

**Date:** 2026-05-30
**Status:** Approved (design)
**Scope:** `hub/` (mamaev.coach, CF Pages project `mamaev-coach-hub`)
**Sub-project:** 1 of 2 (Spec 2 = Content Graph, deferred until a corpus of ~5–8 posts exists)

## 1. Goal

Give the orphaned `/prologue` longread a proper home by building a **minimal but agent-ready blog frame** on `hub/`. The prologue becomes the first post. No editorial changes to the prologue text in this scope.

The frame is "minimal" in blog features (one post, no tags UI/pagination yet) but "complete" in **agent-readiness**: predictable URLs, accessible text, machine-readable layers (llms.txt, agent-description.md, sitemap, robots, RSS, JSON-LD), and an editorial-control data model. Guided by the Pimenov "agent-ready site" 7-layer methodology; the one layer deferred to Spec 2 is the content graph (TF-IDF/SVG analysis), which is inert at n=1.

**Key principle (from the methodology):** everything that makes the site legible to agents also makes it clearer to humans — agent-readiness *is* mature content architecture, not a separate machine-only optimization.

## 2. Decisions (from brainstorming)

- Scope tier: **(B)** minimal frame + foundation, **not** an ongoing-blog buildout.
- Editorial: **frame only** — prologue text untouched; revision is a separate later effort.
- URL: move `/prologue` → **`/blog/prologue`**, **no redirect** (never shared publicly yet; fix internal references instead).
- Section name: **`/blog`**.
- Language: **RU-only** for now; `/en/blog` deferred until EN content exists.
- Agent-ready depth: **full package**, with the content graph split into **Spec 2**; graph-ready data (`tags`, `related`) is seeded now.

## 3. Constraints (hub environment)

- Next.js App Router, `output: 'export'`, `trailingSlash: true`, `images: { unoptimized: true }`. Static export — no server runtime.
- No `public/` directory exists yet — create it.
- hub currently uses a single theme (`data-theme="model-kit"`); hub light/dark theming is **out of scope**. The blog uses hub's existing CSS tokens (`--bg-primary`, `--bg-secondary`, `--text-primary`, `--text-secondary`, `--text-accent`, `--border-color`, `--font-display`, `--font-mono`, `--content-max`, `--section-label-size`, `--radius`).
- The prologue (`hub/components/prologue/Prologue.tsx`) renders an `<article>` of sections with **no visible H1** — so the post-chrome masthead supplies the title without duplication.
- Export-safe generation mechanisms:
  - `app/sitemap.ts`, `app/robots.ts` — Next metadata routes, supported in `output: 'export'`.
  - Route handlers (`app/**/route.ts`) are export-safe **only** as static `GET` with `export const dynamic = 'force-static'`. Used for `llms.txt` and `blog/rss.xml`.
  - Static policy files go in `public/` (copied verbatim into `out/`).

## 4. Data model — `hub/lib/posts.ts` (single source of truth)

```ts
export type Post = {
  slug: string            // URL slug under /blog/<slug>
  title: string
  description: string     // 1-sentence; used in index, meta, JSON-LD, RSS
  date: string            // ISO 'YYYY-MM-DD' published
  updated?: string        // ISO modified → dateModified
  author: string          // 'Александр Мамаев'
  readingTime: string     // human label, e.g. '~15 мин'
  tags: string[]          // graph-ready (Layer 3); not rendered as UI yet
  related: string[]       // related post slugs (Layer 3); empty now
  draft?: boolean         // editorial control (Layer 7)
  ogImage?: string        // absolute or root-relative; defaults to the post's OG route
}

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

export const posts: Post[] = [
  {
    slug: 'prologue',
    title: 'Точка Сборки. Пролог',
    description:
      'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
    date: '2026-05-30',
    author: 'Александр Мамаев',
    readingTime: '~15 мин',
    tags: ['AI', 'спиритуальность', 'Точка Сборки', 'агентский инжиниринг'],
    related: [],
  },
]

export function getAllPosts(): Post[]   // drop draft, sort by date desc
export function getPost(slug: string): Post | undefined
```

`getAllPosts` excludes `draft: true` and sorts newest-first. Every downstream artifact (index, sitemap, llms.txt, RSS) reads from `getAllPosts()` so they stay in sync.

## 5. Blog frame

### 5.1 Index — `app/blog/page.tsx` + `components/blog/blog-index.tsx`
- Heading **«Блог»** (hub display font), optional one-line subtitle.
- A list of post cards: `дата · title · description · «Читать →»`, each linking to `/blog/<slug>/`. Styled with hub tokens, echoing the home projects-grid card idiom but tuned for prose (single column or responsive grid).
- `metadata`: `title: 'Блог · Александр Мамаев'`, description.
- Renders **JSON-LD `Blog`** (with `blogPost` ItemList of the posts) via the json-ld helper.

### 5.2 Post chrome — `components/blog/post-layout.tsx`
A reusable wrapper: `PostLayout({ post, children })`.
- Top: `← Блог` back-link (to `/blog/`).
- **Masthead:** H1 `post.title`; meta line `formatDate(post.date) · post.author · post.readingTime`. (Date formatted RU, e.g. «30 мая 2026».)
- Body: `{children}` (the post content; for the prologue, the bespoke `<Prologue>`).
- **«По теме»** block: renders links for `post.related` slugs resolved via `getPost`; if `related` is empty, renders nothing (graph-ready).
- Bottom: `← Блог` back-link.
- Renders **JSON-LD `BlogPosting`** for `post`.

The masthead uses hub tokens and a narrow reading column consistent with the prologue's own `max-width`.

### 5.3 JSON-LD helper — `components/blog/json-ld.tsx`
- `BlogPostingLd({ post })` → `<script type="application/ld+json">` with: `@type: BlogPosting`, `headline`, `description`, `datePublished`, `dateModified` (= updated ?? date), `author` (`@type: Person`, name), `publisher`, `inLanguage: 'ru'`, `keywords` (tags joined), `url` (`SITE.url + /blog/<slug>/`), `image` (resolved OG).
- `BlogLd({ posts })` → `@type: Blog` with `blogPost` array of lightweight BlogPosting refs.
- Output via `dangerouslySetInnerHTML` of `JSON.stringify(obj)`.

### 5.4 Prologue migration
- Move directory `hub/app/prologue/` → `hub/app/blog/prologue/` (both `page.tsx` and `opengraph-image.tsx`).
- `app/blog/prologue/page.tsx` renders `<PostLayout post={getPost('prologue')!}><Prologue locale="ru" /></PostLayout>`.
- Update OG metadata `url` from `https://mamaev.coach/prologue` → `https://mamaev.coach/blog/prologue`.
- Remove the now-empty `hub/app/prologue/`.
- Fix any internal references to `/prologue` (grep: `DoubleDoor.tsx` is the prologue's own CTA, points outward to course/telegram, not to `/prologue` itself — verify; the `_research/telegram-announce.md` draft link → update to `/blog/prologue`).
- The prologue body text is **not** edited.

### 5.5 Home linkage — `components/home-page.tsx`
Add an internal **`→ Блог`** link (to `/blog/`) in the hero area, styled like the existing socials links (not `target="_blank"`). This removes the orphan condition.

## 6. Agent-ready layers

| Layer | Artifact | Implementation | Source |
|------|----------|----------------|--------|
| 1 Predictable URLs | `/blog/<slug>/` | slug-based routing (already) | — |
| 2 Accessible text | static HTML, semantic tags | already (static export); add SVG a11y below | — |
| 2/4 Structured data | JSON-LD `BlogPosting` / `Blog` | §5.3 | registry |
| 4 Sitemap | `/sitemap.xml` | `app/sitemap.ts` — home, `/blog`, each post (lastModified = updated ?? date) | registry |
| 4 Robots | `/robots.txt` | `app/robots.ts` — allow all + explicit AI user-agents (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot) allowed; `sitemap` URL | — |
| 4 llms.txt | `/llms.txt` | `app/llms.txt/route.ts` (`force-static`) — `# Александр Мамаев`, описание, разделы (Главная, Блог, Курс ai.mamaev.coach), список постов с URL+описанием, ссылки на sitemap/rss/agent-description | registry |
| 4/6 agent-description | `/.well-known/agent-description.md` | static `public/.well-known/agent-description.md` — what the site is, content types, available data (llms.txt, sitemap, rss), permitted vs restricted actions, source-of-truth designation | static |
| 4 RSS | `/blog/rss.xml` | `app/blog/rss.xml/route.ts` (`force-static`) — RSS 2.0 channel + `<item>` per post (title, link, description, pubDate, guid) | registry |
| 3 Relations (graph-ready) | `tags`, `related`, «По теме» block | data seeded now; block renders when populated | registry |
| 7 Editorial control | `draft` flag | `getAllPosts` filters drafts | registry |

### 6.1 SVG diagram accessibility (Layer 2)
The prologue diagrams (`components/prologue/diagrams/{AssemblyPoint,TornAxes,TwoCurves}.tsx`) get `role="img"` + a `<title>` element describing each diagram, so agents and screen readers get text for the visual anchors.

### 6.2 agent-description.md content (draft)
```markdown
# Agent Description — mamaev.coach

## What this site is
Личный сайт Александра Мамаева: AI builder, vibe coder, coach.
Содержит лендинг, блог (эссе/лонгриды об AI, практике и агентском инжиниринге)
и ссылки на курс «Точка Сборки» (ai.mamaev.coach).

## Content types
- Pages: главная (`/`), блог-индекс (`/blog/`)
- Posts: лонгриды под `/blog/<slug>/`

## Machine-readable data
- `/llms.txt` — обзор и список материалов
- `/sitemap.xml` — все URL с датами
- `/blog/rss.xml` — лента блога
- JSON-LD (BlogPosting/Blog) на страницах

## Source of truth
Метаданные постов — `hub/lib/posts.ts`. Канонические URL — `/blog/<slug>/`.

## Permitted / restricted
- Read: вся публичная часть и машинные слои — разрешено.
- Suggest / draft: через PR в репозитории (человек ревьюит и мерджит).
- Publish / delete / overwrite: только человек. Агент не публикует и не удаляет контент.
```

## 7. Out of scope

- **Content graph** (TF-IDF, SVG map, gap/orphan/bridge/route/stale detection) → Spec 2.
- Editorial revision of the prologue text.
- EN blog (`/en/blog`, EN prologue).
- `search-index.json` full-text index.
- hub light/dark theming.
- Tags as a browsable UI / tag pages; pagination.
- Redirect from old `/prologue`.

## 8. Verification

- `npm run build` (in `hub/`) completes; `out/` contains: `blog/index.html`, `blog/prologue/index.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `blog/rss.xml`, `.well-known/agent-description.md`, and the prologue OG image. No `prologue/` (old path) remains.
- View-source of `out/blog/prologue/index.html` contains the `BlogPosting` JSON-LD and the masthead H1.
- `/llms.txt` and `/blog/rss.xml` list the prologue with the `/blog/prologue/` URL.
- Home page shows the `→ Блог` link; `/blog` lists the prologue; `/blog/prologue` renders the longread under the masthead.
- Internal references to the old `/prologue` are updated.

## 9. Documentation updates (post-merge)

- `CLAUDE.md`: note hub now hosts a blog (`/blog`, registry `hub/lib/posts.ts`) + agent-ready layers (llms.txt, agent-description.md, sitemap, robots, RSS, JSON-LD).
- A short `hub/README.md` section (or create one) describing the blog + how to add a post (append to `posts.ts`, drop a body component/MDX) + the agent-ready layers and the "agent drafts, human publishes" rule.
