# Agent-Ready Blog (hub/) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the orphaned `/prologue` longread a proper home as the first post of a minimal but agent-ready blog on `hub/` (mamaev.coach).

**Architecture:** A post registry (`hub/lib/posts.ts`) is the single source of truth. A `/blog` index and a reusable `PostLayout` chrome render from it. The prologue moves to `/blog/prologue` wrapped in that chrome (its bespoke body untouched). Agent-ready layers (JSON-LD, sitemap, robots, llms.txt, RSS, agent-description.md) all derive from the registry. The content graph is deferred (Spec 2); graph-ready fields (`tags`, `related`) are seeded now.

**Tech Stack:** Next.js App Router (`output: 'export'`, `trailingSlash: true`), TypeScript, Vitest (added to hub in Task 1). hub CSS tokens: `--bg-primary/-secondary`, `--text-primary/-secondary/-accent`, `--border-color`, `--font-display/-mono`, `--content-max`, `--section-label-size`, `--radius`.

**Working directory:** commands run from `hub/` unless stated. Branch is already `feature/agent-ready-blog`.

**Reference spec:** `docs/superpowers/specs/2026-05-30-agent-ready-blog-design.md`

**Verification note:** Only `lib/posts.ts` has unit tests (the registry logic — including the draft filter that guarantees editorial control). Components, metadata routes, and route handlers are verified by `npm run build` + inspecting the static `out/` output (the project convention; JSX/route emission isn't meaningfully unit-testable in a node env).

**`@/` alias:** hub already resolves `@/` to the hub root (used in `app/prologue/page.tsx`). Use `@/lib/...`, `@/components/...`.

---

### Task 1: Post registry + Vitest (TDD)

**Files:**
- Modify: `hub/package.json` (add vitest devDep + `test` script)
- Create: `hub/lib/posts.ts`
- Test: `hub/lib/posts.test.ts`

- [ ] **Step 1: Add Vitest to hub**

Run (from `hub/`): `npm install -D vitest`
Then add a `test` script to `hub/package.json` `"scripts"`:
```json
    "test": "vitest run"
```
(Keep existing `dev`/`build`/`start` scripts.)

- [ ] **Step 2: Write the failing test**

Create `hub/lib/posts.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { getAllPosts, getPost, formatDate, postUrl, posts } from './posts'

describe('posts registry', () => {
  it('getAllPosts excludes drafts', () => {
    const hasDraft = posts.some(p => p.draft)
    const out = getAllPosts()
    expect(out.every(p => !p.draft)).toBe(true)
    if (hasDraft) expect(out.length).toBeLessThan(posts.length)
  })

  it('getAllPosts sorts newest-first by date', () => {
    const out = getAllPosts()
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].date >= out[i].date).toBe(true)
    }
  })

  it('getPost returns a post by slug, or undefined', () => {
    expect(getPost('prologue')?.slug).toBe('prologue')
    expect(getPost('nope')).toBeUndefined()
  })

  it('getPost returns drafts too (preview), unlike getAllPosts', () => {
    // getPost is unfiltered by design; getAllPosts is the published view.
    expect(typeof getPost('prologue')).toBe('object')
  })

  it('formatDate renders an ISO date in Russian', () => {
    expect(formatDate('2026-05-30')).toBe('30 мая 2026')
    expect(formatDate('2026-01-01')).toBe('1 января 2026')
  })

  it('postUrl builds the canonical trailing-slash URL', () => {
    expect(postUrl('prologue')).toBe('https://mamaev.coach/blog/prologue/')
  })

  it('the prologue post exists with required metadata', () => {
    const p = getPost('prologue')!
    expect(p.title).toBe('Точка Сборки. Пролог')
    expect(p.description.length).toBeGreaterThan(0)
    expect(p.author).toBe('Александр Мамаев')
    expect(Array.isArray(p.tags)).toBe(true)
    expect(Array.isArray(p.related)).toBe(true)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run lib/posts.test.ts`
Expected: FAIL — cannot resolve `./posts`.

- [ ] **Step 4: Write the implementation**

Create `hub/lib/posts.ts`:
```ts
// hub/lib/posts.ts
// Single source of truth for blog posts. Every agent-ready artifact (index,
// sitemap, llms.txt, RSS, JSON-LD) derives from here so they never drift.
export type Post = {
  slug: string
  title: string
  description: string
  date: string            // ISO 'YYYY-MM-DD' published
  updated?: string        // ISO modified → dateModified
  author: string
  readingTime: string     // human label, e.g. '~15 мин'
  tags: string[]          // graph-ready (not rendered as UI yet)
  related: string[]       // related post slugs (empty for now)
  draft?: boolean         // editorial control: drafts never appear in getAllPosts
  ogImage?: string        // absolute URL; defaults to the post's own OG route
}

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

const RU_MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

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

/** Published posts, newest-first. Drafts are excluded. */
export function getAllPosts(): Post[] {
  return posts
    .filter(p => !p.draft)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

/** Any post by slug (including drafts, for preview). */
export function getPost(slug: string): Post | undefined {
  return posts.find(p => p.slug === slug)
}

/** ISO date → Russian human form, e.g. '30 мая 2026'. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${RU_MONTHS[m - 1]} ${y}`
}

/** Canonical post URL with trailing slash (matches trailingSlash: true). */
export function postUrl(slug: string): string {
  return `${SITE.url}/blog/${slug}/`
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run lib/posts.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add hub/package.json hub/package-lock.json hub/lib/posts.ts hub/lib/posts.test.ts
git commit -m "feat(blog): post registry + vitest (hub)"
```

---

### Task 2: JSON-LD helper

**Files:**
- Create: `hub/components/blog/json-ld.tsx`

- [ ] **Step 1: Write the component**

Create `hub/components/blog/json-ld.tsx`:
```tsx
import { SITE, postUrl, type Post } from '@/lib/posts'

function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BlogPostingLd({ post }: { post: Post }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Person', name: SITE.author },
    inLanguage: SITE.lang,
    keywords: post.tags.join(', '),
    url: postUrl(post.slug),
    ...(post.ogImage ? { image: post.ogImage } : {}),
  }
  return <Ld data={data} />
}

export function BlogLd({ posts }: { posts: Post[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} — Блог`,
    url: `${SITE.url}/blog/`,
    inLanguage: SITE.lang,
    blogPost: posts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: postUrl(p.slug),
      datePublished: p.date,
    })),
  }
  return <Ld data={data} />
}
```

- [ ] **Step 2: Verify it type-checks via build later (no standalone test)**

This is verified in Task 4's build (it's imported by the index and post chrome). No action now.

- [ ] **Step 3: Commit**

```bash
git add hub/components/blog/json-ld.tsx
git commit -m "feat(blog): JSON-LD helper (BlogPosting/Blog)"
```

---

### Task 3: Post chrome (PostLayout)

**Files:**
- Create: `hub/components/blog/post-layout.tsx`

- [ ] **Step 1: Write the component**

Create `hub/components/blog/post-layout.tsx`:
```tsx
import Link from 'next/link'
import { type Post, getPost, formatDate } from '@/lib/posts'
import { BlogPostingLd } from './json-ld'

const backLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-accent)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
}

export function PostLayout({ post, children }: { post: Post; children: React.ReactNode }) {
  const related = post.related.map(getPost).filter((p): p is Post => Boolean(p))

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <BlogPostingLd post={post} />

      <Link href="/blog/" style={backLinkStyle}>← Блог</Link>

      <header style={{ margin: '2rem 0 2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 900,
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          margin: '0 0 1rem',
        }}>
          {post.title}
        </h1>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
        }}>
          {formatDate(post.date)} · {post.author} · {post.readingTime}
        </div>
      </header>

      {children}

      {related.length > 0 && (
        <section style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            По теме
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {related.map(r => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}/`} style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <Link href="/blog/" style={backLinkStyle}>← Блог</Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add hub/components/blog/post-layout.tsx
git commit -m "feat(blog): PostLayout chrome (masthead + related + JSON-LD)"
```

---

### Task 4: Blog index page

**Files:**
- Create: `hub/components/blog/blog-index.tsx`
- Create: `hub/app/blog/page.tsx`

- [ ] **Step 1: Write the index component**

Create `hub/components/blog/blog-index.tsx`:
```tsx
import Link from 'next/link'
import { getAllPosts, formatDate } from '@/lib/posts'
import { BlogLd } from './json-ld'

export function BlogIndex() {
  const posts = getAllPosts()
  return (
    <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '4rem 1.5rem 5rem' }}>
      <BlogLd posts={posts} />

      <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)', textDecoration: 'none' }}>
        ← mamaev.coach
      </Link>

      <h1 style={{
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        margin: '1.5rem 0 3rem',
      }}>
        Блог
      </h1>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {posts.map(post => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}/`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                marginBottom: '0.5rem',
              }}>
                {formatDate(post.date)} · {post.readingTime}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: '0 0 0.75rem',
              }}>
                {post.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                {post.description}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 700 }}>
                Читать →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 2: Write the route page**

Create `hub/app/blog/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog/blog-index'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Блог · Александр Мамаев',
  description: 'Эссе и лонгриды об AI, практике и агентском инжиниринге.',
  openGraph: {
    title: 'Блог · Александр Мамаев',
    description: 'Эссе и лонгриды об AI, практике и агентском инжиниринге.',
    url: 'https://mamaev.coach/blog',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function BlogPage() {
  return <BlogIndex />
}
```

- [ ] **Step 3: Verify build**

Run (from `hub/`): `npm run build`
Expected: completes; `out/blog/index.html` exists and (open it) contains «Блог», the prologue card, and an `application/ld+json` `Blog` script.

- [ ] **Step 4: Commit**

```bash
git add hub/components/blog/blog-index.tsx hub/app/blog/page.tsx
git commit -m "feat(blog): index page + Blog JSON-LD"
```

---

### Task 5: Migrate the prologue to /blog/prologue

**Files:**
- Move: `hub/app/prologue/page.tsx` → `hub/app/blog/prologue/page.tsx`
- Move: `hub/app/prologue/opengraph-image.tsx` → `hub/app/blog/prologue/opengraph-image.tsx`
- Move: `hub/app/prologue/pt-serif-400.woff`, `pt-serif-700.woff` → `hub/app/blog/prologue/`
- Remove: `hub/app/prologue/` (after move)
- Modify: any internal reference to `/prologue`

- [ ] **Step 1: Move the route directory with git**

```bash
git mv hub/app/prologue hub/app/blog/prologue
```
This moves `page.tsx`, `opengraph-image.tsx`, and the two `.woff` fonts together.

- [ ] **Step 2: Wrap the page in PostLayout + fix OG url**

Replace `hub/app/blog/prologue/page.tsx` contents with:
```tsx
import type { Metadata } from 'next'
import { Prologue } from '@/components/prologue/Prologue'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Точка Сборки. Пролог',
  description:
    'Это не курс программирования. Это курс собирания себя в эпоху расщепления — через инструмент, который раньше казался врагом.',
  openGraph: {
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
    url: 'https://mamaev.coach/blog/prologue',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Точка Сборки. Пролог',
    description:
      'Великий переход, децентрализованный AI, liberation — и почему всё это об одном.',
  },
}

export default function ProloguePage() {
  return (
    <PostLayout post={getPost('prologue')!}>
      <Prologue locale="ru" />
    </PostLayout>
  )
}
```
(Only the `url` changed in metadata; the wrapper is the new part. `opengraph-image.tsx` needs no change — it's colocated and now serves `/blog/prologue/opengraph-image`.)

- [ ] **Step 2b: Verify the prologue body has no duplicate H1**

Read `hub/components/prologue/sections/Opening.tsx` — confirm it starts with a `<p>` lead, not an `<h1>`. (Already verified in design: no H1, so the PostLayout masthead is the only title. If you find an H1 that duplicates the masthead title, leave the body untouched and report it as DONE_WITH_CONCERNS — do NOT edit the prologue text.)

- [ ] **Step 3: Fix internal references to the old path**

Run: `grep -rn "/prologue" hub --include=*.tsx --include=*.ts --include=*.md | grep -v "/blog/prologue"`
For each hit that is a link/URL to the old `/prologue` page (not the OG `/blog/prologue` you just set), update it to `/blog/prologue`. Known candidates:
- `hub/_research/prologue/telegram-announce.md` — update any `mamaev.coach/prologue` to `mamaev.coach/blog/prologue`.
- `hub/components/prologue/sections/DoubleDoor.tsx` — inspect: its CTA links point OUTWARD (course `ai.mamaev.coach`, telegram), not to `/prologue`. If so, no change. Only change a link if it actually targets the prologue page itself.

- [ ] **Step 4: Verify build + old path gone**

Run (from `hub/`): `npm run build`
Expected: completes. `out/blog/prologue/index.html` exists and contains the masthead H1 «Точка Сборки. Пролог» followed by the longread; it also contains a `BlogPosting` `application/ld+json` script. `out/prologue/` does NOT exist (old path removed).

- [ ] **Step 5: Commit**

```bash
git add hub/app/blog/prologue hub/_research/prologue/telegram-announce.md
# (add any other file you edited in Step 3)
git commit -m "feat(blog): migrate prologue to /blog/prologue under PostLayout"
```

---

### Task 6: Link the blog from the home page

**Files:**
- Modify: `hub/components/home-page.tsx`

- [ ] **Step 1: Add the blog link in the hero**

In `hub/components/home-page.tsx`, the hero `<section className="hub-hero">` ends with the bio `<p>{t.bio}</p>`. Immediately after that `<p>`, add an internal blog link:
```tsx
        <p style={{ marginTop: '2rem' }}>
          <a href="/blog/" style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            color: 'var(--text-accent)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            → Блог
          </a>
        </p>
```
(Use a plain internal `<a href="/blog/">` — NOT `target="_blank"` like the external project links. It's the same `t` dictionary scope, but the label is fixed RU here; the hub home is RU-primary and EN mirror handles its own copy. Keep it simple: literal «→ Блог».)

- [ ] **Step 2: Verify build**

Run (from `hub/`): `npm run build`
Expected: completes; `out/index.html` contains a `href="/blog/"` link with «Блог».

- [ ] **Step 3: Commit**

```bash
git add hub/components/home-page.tsx
git commit -m "feat(blog): link blog from hub home hero"
```

---

### Task 7: SVG diagram accessibility (Layer 2)

**Files:**
- Modify: `hub/components/prologue/diagrams/AssemblyPoint.tsx`
- Modify: `hub/components/prologue/diagrams/TornAxes.tsx`
- Modify: `hub/components/prologue/diagrams/TwoCurves.tsx`

- [ ] **Step 1: Add role + title to each SVG**

Read each diagram file. On the root `<svg>` element of each, add `role="img"` and `aria-labelledby` pointing to a `<title>` you add as the first child of the `<svg>`. Use these titles (descriptive, so agents/screen-readers get text for the visual anchor):
- `AssemblyPoint.tsx`: `<title>Точка сборки: расщеплённые части сходятся в одну собранную точку</title>` (id `assembly-point-title`)
- `TornAxes.tsx`: `<title>Порванная карта смысла: оси старых институтов расходятся</title>` (id `torn-axes-title`)
- `TwoCurves.tsx`: `<title>Две S-кривые: централизованный AI выходит на плато, сеть личных узлов растёт</title>` (id `two-curves-title`)

Pattern for each:
```tsx
<svg role="img" aria-labelledby="assembly-point-title" /* ...existing props... */>
  <title id="assembly-point-title">Точка сборки: расщеплённые части сходятся в одну собранную точку</title>
  {/* ...existing children... */}
</svg>
```
Adjust the id per file. Do not change any visual geometry — only add `role`, `aria-labelledby`, and the `<title>` child.

- [ ] **Step 2: Verify build**

Run (from `hub/`): `npm run build`
Expected: completes; `out/blog/prologue/index.html` contains the three `<title>` strings.

- [ ] **Step 3: Commit**

```bash
git add hub/components/prologue/diagrams/AssemblyPoint.tsx hub/components/prologue/diagrams/TornAxes.tsx hub/components/prologue/diagrams/TwoCurves.tsx
git commit -m "feat(blog): a11y titles for prologue SVG diagrams"
```

---

### Task 8: sitemap.xml + robots.txt

**Files:**
- Create: `hub/app/sitemap.ts`
- Create: `hub/app/robots.ts`

- [ ] **Step 1: Write the sitemap**

Create `hub/app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
import { SITE, getAllPosts } from '@/lib/posts'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map(p => ({
    url: `${SITE.url}/blog/${p.slug}/`,
    lastModified: p.updated ?? p.date,
  }))
  return [
    { url: `${SITE.url}/`, lastModified: new Date().toISOString().slice(0, 10) },
    { url: `${SITE.url}/blog/`, lastModified: posts[0]?.lastModified ?? new Date().toISOString().slice(0, 10) },
    ...posts,
  ]
}
```

- [ ] **Step 2: Write robots**

Create `hub/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/posts'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      {
        userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'CCBot'],
        allow: '/',
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
```

- [ ] **Step 3: Verify build**

Run (from `hub/`): `npm run build`
Expected: completes; `out/sitemap.xml` exists and lists `/`, `/blog/`, and `/blog/prologue/`; `out/robots.txt` exists, allows the AI user-agents, and references the sitemap URL.

- [ ] **Step 4: Commit**

```bash
git add hub/app/sitemap.ts hub/app/robots.ts
git commit -m "feat(blog): sitemap.xml + robots.txt (AI crawlers, from registry)"
```

---

### Task 9: llms.txt + RSS (static route handlers)

**Files:**
- Create: `hub/app/llms.txt/route.ts`
- Create: `hub/app/blog/rss.xml/route.ts`

- [ ] **Step 1: Write the llms.txt handler**

Create `hub/app/llms.txt/route.ts`:
```ts
import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts()
  const body = `# ${SITE.name}

Личный сайт: AI builder, vibe coder, coach. Лендинг, блог и ссылки на курс «Точка Сборки» (ai.mamaev.coach).

## Разделы
- Главная: ${SITE.url}/
- Блог: ${SITE.url}/blog/
- Курс «Точка Сборки» (внешний): https://ai.mamaev.coach/

## Посты
${posts.map(p => `- [${p.title}](${postUrl(p.slug)}) — ${p.description}`).join('\n')}

## Машиночитаемые слои
- ${SITE.url}/sitemap.xml
- ${SITE.url}/blog/rss.xml
- ${SITE.url}/.well-known/agent-description.md
`
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
```

- [ ] **Step 2: Write the RSS handler**

Create `hub/app/blog/rss.xml/route.ts`:
```ts
import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function GET() {
  const items = getAllPosts()
    .map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${postUrl(p.slug)}</link>
      <guid isPermaLink="true">${postUrl(p.slug)}</guid>
      <description>${esc(p.description)}</description>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)} — Блог</title>
    <link>${SITE.url}/blog/</link>
    <description>Эссе и лонгриды об AI, практике и агентском инжиниринге.</description>
    <language>ru</language>
${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
```

- [ ] **Step 3: Verify the files emit correctly (trailingSlash check)**

Run (from `hub/`): `npm run build`
Expected: completes. Then confirm BOTH static files exist as files:
```bash
ls -la out/llms.txt out/blog/rss.xml
```
Expected: both are regular files. Inspect `out/llms.txt` — it lists the prologue with the `/blog/prologue/` URL; `out/blog/rss.xml` is valid RSS with the prologue `<item>`.

**Fallback (only if the build fails to emit a plain file — e.g. trailingSlash turned `llms.txt` into a directory):** delete the route handler(s), add a `hub/scripts/gen-agent-files.ts` that imports the registry and writes the same `out/llms.txt` / `out/blog/rss.xml` strings, install `tsx` as a devDep, and wire `"postbuild": "tsx scripts/gen-agent-files.ts"` in `package.json`. Report this deviation in your status.

- [ ] **Step 4: Commit**

```bash
git add hub/app/llms.txt/route.ts hub/app/blog/rss.xml/route.ts
# (if you used the fallback, also add hub/scripts/ and package.json/package-lock.json)
git commit -m "feat(blog): llms.txt + RSS feed from registry (static)"
```

---

### Task 10: agent-description.md (.well-known)

**Files:**
- Create: `hub/public/.well-known/agent-description.md`

- [ ] **Step 1: Write the public agent-description**

Create `hub/public/.well-known/agent-description.md`:
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

- [ ] **Step 2: Verify build copies it**

Run (from `hub/`): `npm run build`
Expected: completes; `out/.well-known/agent-description.md` exists with the content above.

- [ ] **Step 3: Commit**

```bash
git add hub/public/.well-known/agent-description.md
git commit -m "feat(blog): public agent-description.md (.well-known)"
```

---

### Task 11: Documentation

**Files:**
- Modify: `CLAUDE.md`
- Create: `hub/README.md`

- [ ] **Step 1: Update CLAUDE.md**

In `CLAUDE.md`, in the "Три сайта" section, the `hub/` bullet currently reads:
```
- **`hub/`** → `mamaev.coach` — личный лендинг (проект `mamaev-coach-hub`)
```
Change it to:
```
- **`hub/`** → `mamaev.coach` — личный лендинг + **блог** (`/blog`, реестр `hub/lib/posts.ts`); agent-ready слои: llms.txt, /.well-known/agent-description.md, sitemap.xml, robots.txt, /blog/rss.xml, JSON-LD (проект `mamaev-coach-hub`)
```

- [ ] **Step 2: Create hub/README.md**

Create `hub/README.md`:
```markdown
# mamaev.coach — hub

Личный лендинг + блог Александра Мамаева. Next.js App Router, `output: 'export'`,
deploy на Cloudflare Pages (`mamaev-coach-hub`) через `.github/workflows/deploy.yml`.

## Блог

- **Реестр постов:** `lib/posts.ts` — единственный источник правды (`Post[]` + `getAllPosts`/`getPost`/`formatDate`/`postUrl`).
- **Индекс:** `/blog` (`app/blog/page.tsx` + `components/blog/blog-index.tsx`).
- **Пост:** `/blog/<slug>/` обёрнут в `components/blog/post-layout.tsx` (мастхед + «По теме» + JSON-LD). Тело поста — bespoke-компонент (как `components/prologue/`) или, в будущем, MDX.

### Добавить пост
1. Добавить запись в `posts` (`lib/posts.ts`). `draft: true` скрывает его из индекса/sitemap/llms/RSS.
2. Создать тело поста и роут `app/blog/<slug>/page.tsx`, обернув в `<PostLayout post={getPost('<slug>')!}>…</PostLayout>`.
3. (Опц.) заполнить `tags`/`related` — `related` рендерит блок «По теме».

## Agent-ready слои
Всё дерёт из `lib/posts.ts`, поэтому не расходится:
- **JSON-LD** `BlogPosting`/`Blog` — `components/blog/json-ld.tsx`.
- **`/sitemap.xml`** — `app/sitemap.ts`; **`/robots.txt`** — `app/robots.ts` (разрешает AI-краулеров).
- **`/llms.txt`** — `app/llms.txt/route.ts`; **`/blog/rss.xml`** — `app/blog/rss.xml/route.ts` (оба `force-static`).
- **`/.well-known/agent-description.md`** — `public/.well-known/agent-description.md`.

**Правило:** агент пишет черновик (`draft: true` / PR), человек ревьюит и публикует. Агент не публикует и не удаляет контент сам.

## Контентный граф
TF-IDF/SVG-карта + детекция gap/orphan/bridge — отдельная подсистема (Спека 2), когда наберётся корпус.

## Разработка
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export → out/
npm test        # vitest (lib/posts.test.ts)
```
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md hub/README.md
git commit -m "docs: hub blog + agent-ready layers"
```

---

## Final verification

- [ ] `npm test` (in `hub/`) → `lib/posts.test.ts` green.
- [ ] `npm run build` (in `hub/`) → clean. `out/` contains: `blog/index.html`, `blog/prologue/index.html`, `sitemap.xml`, `robots.txt`, `llms.txt`, `blog/rss.xml`, `.well-known/agent-description.md`, and the prologue OG image route. `out/prologue/` (old path) is gone.
- [ ] `out/blog/prologue/index.html` has the masthead H1 + `BlogPosting` JSON-LD; the longread body is intact.
- [ ] `out/index.html` has the `→ Блог` link.
- [ ] No internal references to the old `/prologue` URL remain (`grep -rn "mamaev.coach/prologue\"" hub` and `grep -rn 'href="/prologue' hub`).
- [ ] After all tasks: dispatch a final holistic review, then use **superpowers:finishing-a-development-branch**.
```
