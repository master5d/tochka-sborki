# Blog Split (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the blog into a standalone Next.js app `blog/` while keeping every public URL at `mamaev.coach/blog/*` and `/en/blog/*` via a merged build.

**Architecture:** Two static-export Next apps (`hub/` = landing + whole-site SEO; `blog/` = blog pages + RSS/OG + a generated `posts-manifest.json`). At deploy the blog builds first, the hub builds second (reading the manifest to populate sitemap/llms), then a Node merge script folds `blog/out` into `hub/out` (blog assets namespaced under `/blog/_next` via `assetPrefix`). One Cloudflare Pages project `mamaev-coach-hub`.

**Tech Stack:** Next.js 16 (App Router, `output: 'export'`, `trailingSlash: true`), React 19, TypeScript, Vitest, Cloudflare Pages via Wrangler, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-06-02-blog-split-design.md`

**Reference (repo conventions):**
- All apps build on **Node 24**, deploy via `.github/workflows/deploy.yml`.
- Each app is independent (own `package.json`/`node_modules`); **no** root workspace.
- Lesson: never import another app's TS **source** across app boundaries (the workers↔web build break). The manifest is a generated **data** file, read with `fs`, not imported.
- Run all git from repo root: `git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" …`. Build without changing the shell cwd: `npm run build --prefix <app>`.
- **Intentional red window:** after Task 3, `hub` will not build until Task 5 rewrites its SEO files. That is expected; Task 3's gate is "blog builds", Task 5's gate is "hub builds".

---

## File Structure

**New app `blog/`:**
- `blog/package.json`, `blog/next.config.ts`, `blog/tsconfig.json`, `blog/postcss.config.mjs`, `blog/vitest.config.ts`, `blog/next-env.d.ts` — scaffold (mirror hub).
- `blog/app/layout.tsx`, `blog/app/globals.css`, `blog/app/not-found.tsx` — copied chrome + minimal 404.
- `blog/app/blog/**`, `blog/app/en/blog/**` — moved blog routes (incl. `rss.xml`, `opengraph-image`).
- `blog/app/posts-manifest.json/route.ts` — **new** static route emitting the manifest.
- `blog/components/blog/**`, `blog/components/prologue/**` — moved.
- `blog/components/{site-header,header-lang-switch,theme-provider,theme-toggle,lang-suggest-banner}.tsx` — copied chrome (drift-marked).
- `blog/lib/{posts,posts.test,ai-prompt,ai-prompt.test}.ts` — moved.
- `blog/lib/{dictionaries,theme-pref}.ts` — copied chrome (drift-marked).

**Hub changes:**
- `hub/lib/site.ts` — **new**: `SITE` consts + manifest reader (`manifestPosts`, `postUrl`).
- `hub/app/{sitemap.ts,robots.ts,llms.txt/route.ts,en/llms.txt/route.ts}` — rewritten to use `site.ts`.
- Deletions (the moved dirs/files) — performed by `git mv` in Task 3.

**Repo root:**
- `scripts/merge-blog.mjs` — **new** merge script.
- `.github/workflows/deploy.yml` — `deploy-hub` job rewritten; `blog/**` added to `paths`.

---

## Task 1: Scaffold the empty `blog/` Next app

**Files:**
- Create: `blog/package.json`, `blog/next.config.ts`, `blog/tsconfig.json`, `blog/.gitignore`, `blog/app/layout.tsx` (temporary stub), `blog/app/not-found.tsx`
- NOTE: hub has **no** `postcss.config.mjs` and **no** `vitest.config.ts` (it uses plain CSS — no Tailwind — and vitest defaults). The blog mirrors hub: **do not** add either config. (LMS has them because it uses Tailwind; copying LMS's PostCSS config would break the blog build, which has no `@tailwindcss/postcss` dep, once `globals.css` is imported.)

- [ ] **Step 1: Create `blog/package.json`** (mirror hub deps; distinct name)

```json
{
  "name": "mamaev-coach-blog",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "geist": "^1.7.0",
    "next": "^16.2.6",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "@types/node": "^25.6.2",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "typescript": "^6.0.3",
    "vitest": "^4.1.7"
  }
}
```

- [ ] **Step 2: Create `blog/next.config.ts`** (the asset-isolation decision)

```ts
import type { NextConfig } from 'next'

// assetPrefix '/blog' namespaces this app's /_next assets under /blog/_next so
// they never collide with hub's /_next when both exports are merged (model B).
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  assetPrefix: '/blog',
  images: { unoptimized: true },
}

export default config
```

- [ ] **Step 3: Create `blog/tsconfig.json`** (identical to hub — `@/*` → `./*`)

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: (removed)** — do NOT create `blog/postcss.config.mjs`. Hub has none; blog uses plain CSS with no Tailwind/PostCSS deps. Adding one breaks the build.

- [ ] **Step 5: (removed)** — do NOT create `blog/vitest.config.ts`. Hub has none; vitest defaults (node env) run the relative-import logic tests fine.

- [ ] **Step 6: Create `blog/.gitignore`** (copy hub's — ignores `node_modules`, `.next`, `out`)

```bash
cp hub/.gitignore blog/.gitignore
```

- [ ] **Step 7: Create a temporary `blog/app/layout.tsx` stub** (replaced in Task 2)

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 8: Create `blog/app/not-found.tsx`** (minimal — gives the export a 404; root `/` is intentionally absent)

```tsx
export default function NotFound() {
  return <main style={{ padding: '4rem', fontFamily: 'monospace' }}>404</main>
}
```

- [ ] **Step 9: Install deps and verify the empty app builds**

Run: `npm install --prefix blog && npm run build --prefix blog`
Expected: build succeeds, `blog/out/` created (contains `404.html`, `_next/`). No errors.

- [ ] **Step 10: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add blog/package.json blog/package-lock.json blog/next.config.ts blog/tsconfig.json blog/.gitignore blog/app/layout.tsx blog/app/not-found.tsx
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(blog): scaffold standalone Next app (assetPrefix /blog)"
```

---

## Task 2: Copy shared chrome into `blog/`

Copy (not move) the chrome the blog needs to stand alone. Each copied file gets a drift marker as its first line.

**Files:**
- Create (copied + drift-marked): `blog/app/layout.tsx` (overwrite stub), `blog/app/globals.css`, `blog/components/site-header.tsx`, `blog/components/header-lang-switch.tsx`, `blog/components/theme-provider.tsx`, `blog/components/theme-toggle.tsx`, `blog/components/lang-suggest-banner.tsx`, `blog/lib/dictionaries.ts`, `blog/lib/theme-pref.ts`

- [ ] **Step 1: Copy the chrome files**

```bash
cp hub/app/globals.css blog/app/globals.css
cp hub/app/layout.tsx blog/app/layout.tsx
cp hub/components/site-header.tsx blog/components/site-header.tsx
cp hub/components/header-lang-switch.tsx blog/components/header-lang-switch.tsx
cp hub/components/theme-provider.tsx blog/components/theme-provider.tsx
cp hub/components/theme-toggle.tsx blog/components/theme-toggle.tsx
cp hub/components/lang-suggest-banner.tsx blog/components/lang-suggest-banner.tsx
cp hub/lib/dictionaries.ts blog/lib/dictionaries.ts
cp hub/lib/theme-pref.ts blog/lib/theme-pref.ts
```

- [ ] **Step 2: Add a drift marker as the first line of each copied chrome file**

Prepend this exact comment line (use `//` for `.ts`/`.tsx`, `/* … */` for `.css`) to each of the 9 files above:

```
// SHARED CHROME — mirror of hub/<same relative path>. Keep in sync; see docs/superpowers/specs/2026-06-02-blog-split-design.md
```

For `blog/app/globals.css` use:

```css
/* SHARED CHROME — mirror of hub/app/globals.css. Keep in sync; see docs/superpowers/specs/2026-06-02-blog-split-design.md */
```

(If a `.tsx` file begins with `'use client'`, keep `'use client'` as line 1 and put the marker on line 2.)

- [ ] **Step 3: Do NOT yet build** (blog/lib/posts.ts and components/blog don't exist here until Task 3). Proceed.

- [ ] **Step 4: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add blog/app/globals.css blog/app/layout.tsx blog/components/site-header.tsx blog/components/header-lang-switch.tsx blog/components/theme-provider.tsx blog/components/theme-toggle.tsx blog/components/lang-suggest-banner.tsx blog/lib/dictionaries.ts blog/lib/theme-pref.ts
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(blog): copy shared chrome with drift markers"
```

---

## Task 3: Move blog content from `hub/` to `blog/`

`git mv` the blog-owned source. **This breaks the hub build until Task 5** — expected.

**Files (move):**
- `hub/app/blog` → `blog/app/blog`
- `hub/app/en/blog` → `blog/app/en/blog`
- `hub/components/blog` → `blog/components/blog`
- `hub/components/prologue` → `blog/components/prologue`
- `hub/lib/posts.ts`, `hub/lib/posts.test.ts`, `hub/lib/ai-prompt.ts`, `hub/lib/ai-prompt.test.ts` → `blog/lib/`

- [ ] **Step 1: Move the route + component dirs and lib files**

```bash
ROOT="C:/telo/Efforts/Ongoing/MDS_AI_COURSE"
git -C "$ROOT" mv hub/app/blog blog/app/blog
git -C "$ROOT" mv hub/app/en/blog blog/app/en/blog
git -C "$ROOT" mv hub/components/blog blog/components/blog
git -C "$ROOT" mv hub/components/prologue blog/components/prologue
git -C "$ROOT" mv hub/lib/posts.ts blog/lib/posts.ts
git -C "$ROOT" mv hub/lib/posts.test.ts blog/lib/posts.test.ts
git -C "$ROOT" mv hub/lib/ai-prompt.ts blog/lib/ai-prompt.ts
git -C "$ROOT" mv hub/lib/ai-prompt.test.ts blog/lib/ai-prompt.test.ts
```

- [ ] **Step 2: Remove the now-empty `hub/app/en/blog` parent if `en` only held blog**

Run: `ls hub/app/en` — if it still contains `llms.txt` and `page.tsx`, leave it. (It does: `hub/app/en/page.tsx` and `hub/app/en/llms.txt/route.ts` stay in hub.) No action needed; just verify nothing blog-related remains under `hub/app/en/blog`.

- [ ] **Step 3: Run the blog test suite (moved posts/ai-prompt tests must pass in their new home)**

Run: `npm run test --prefix blog`
Expected: PASS (posts.test.ts + ai-prompt.test.ts green; they import `./posts` / `./ai-prompt` relatively).

- [ ] **Step 4: Build the blog app — all blog routes must export**

Run: `npm run build --prefix blog`
Expected: build succeeds. Confirm these exist:
```bash
ls blog/out/blog/index.html blog/out/blog/prologue/index.html blog/out/en/blog/index.html blog/out/blog/rss.xml/index.html 2>/dev/null || ls -R blog/out/blog | head
```
All four blog posts (RU+EN), indexes, and `rss.xml` present under `blog/out/blog` and `blog/out/en/blog`.

- [ ] **Step 5: Commit** (hub is intentionally red here)

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add -A
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(blog): move blog routes, components, posts registry from hub (hub red until SEO rewrite)"
```

---

## Task 4: Emit `posts-manifest.json` from the blog build

A Next static route (same pattern as `rss.xml`) writes the manifest hub will read. No extra tooling.

**Files:**
- Create: `blog/app/posts-manifest.json/route.ts`

- [ ] **Step 1: Create the manifest route**

```ts
// blog/app/posts-manifest.json/route.ts
// Build-time data bridge: hub reads ../blog/out/posts-manifest.json to populate
// the whole-site sitemap/llms without importing blog TS source. Single source of
// truth stays lib/posts.ts; this is a derived projection. Not merged into hub/out,
// so it is never served publicly.
import { getAllPosts } from '@/lib/posts'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts('ru').map(p => ({
    slug: p.slug,
    date: p.date,
    updated: p.updated ?? null,
    title: p.title,
    description: p.description,
    en: p.en ? { title: p.en.title, description: p.en.description } : null,
  }))
  return Response.json(posts)
}
```

- [ ] **Step 2: Build the blog and verify the manifest file is emitted**

Run: `npm run build --prefix blog && cat blog/out/posts-manifest.json`
Expected: valid JSON array of 4 objects, each with `slug`, `date`, `updated`, `title`, `description`, `en` (object for all four since all are translated).

- [ ] **Step 3: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add blog/app/posts-manifest.json/route.ts
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(blog): emit posts-manifest.json static route (hub SEO data bridge)"
```

---

## Task 5: Rewrite hub whole-site SEO files to read the manifest

Hub no longer imports `@/lib/posts`. Introduce `hub/lib/site.ts` (SITE consts + manifest reader) and repoint the four SEO files. **This makes hub build again.**

**Files:**
- Create: `hub/lib/site.ts`, `hub/lib/site.test.ts`
- Modify: `hub/app/sitemap.ts`, `hub/app/robots.ts`, `hub/app/llms.txt/route.ts`, `hub/app/en/llms.txt/route.ts`

- [ ] **Step 1: Write `hub/lib/site.test.ts`** (failing first)

```ts
import { describe, it, expect } from 'vitest'
import { postUrl, manifestPostsFrom, type ManifestPost } from './site'

const fixture: ManifestPost[] = [
  { slug: 'a', date: '2026-01-01', updated: null, title: 'A', description: 'da', en: { title: 'A-en', description: 'da-en' } },
  { slug: 'b', date: '2026-02-01', updated: '2026-03-01', title: 'B', description: 'db', en: null },
]

describe('postUrl', () => {
  it('builds ru + en URLs with trailing slash', () => {
    expect(postUrl('a', 'ru')).toBe('https://mamaev.coach/blog/a/')
    expect(postUrl('a', 'en')).toBe('https://mamaev.coach/en/blog/a/')
  })
})

describe('manifestPostsFrom', () => {
  it('ru: all posts, newest-first', () => {
    expect(manifestPostsFrom(fixture, 'ru').map(p => p.slug)).toEqual(['b', 'a'])
  })
  it('en: only posts with an en block', () => {
    expect(manifestPostsFrom(fixture, 'en').map(p => p.slug)).toEqual(['a'])
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm run test --prefix hub -- site.test`
Expected: FAIL ("Cannot find module './site'").

- [ ] **Step 3: Write `hub/lib/site.ts`**

```ts
// Whole-site constants + a build-time reader for the blog's generated manifest.
// Hub no longer imports blog TS source; it reads the JSON data file the blog
// build emits at ../blog/out/posts-manifest.json (CI builds blog before hub).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SITE = {
  url: 'https://mamaev.coach',
  name: 'Александр Мамаев',
  nameEn: 'Alexander Mamaev',
  author: 'Александр Мамаев',
  lang: 'ru',
} as const

export type ManifestPost = {
  slug: string
  date: string
  updated: string | null
  title: string
  description: string
  en: { title: string; description: string } | null
}

export function postUrl(slug: string, locale: 'ru' | 'en' = 'ru'): string {
  const prefix = locale === 'en' ? '/en/blog/' : '/blog/'
  return `${SITE.url}${prefix}${slug}/`
}

/** Pure: filter by locale + sort newest-first. Tested against fixtures. */
export function manifestPostsFrom(all: ManifestPost[], locale: 'ru' | 'en' = 'ru'): ManifestPost[] {
  return all
    .filter(p => locale === 'ru' || p.en != null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

let cache: ManifestPost[] | null = null
function loadManifest(): ManifestPost[] {
  if (cache) return cache
  try {
    // process.cwd() === hub/ during the hub build (working-directory: hub).
    const raw = readFileSync(join(process.cwd(), '..', 'blog', 'out', 'posts-manifest.json'), 'utf8')
    cache = JSON.parse(raw) as ManifestPost[]
  } catch {
    console.warn('[hub] blog/out/posts-manifest.json not found — SEO files list landing only')
    cache = []
  }
  return cache
}

/** Manifest posts for a locale, newest-first. Empty (with warning) if the manifest is absent. */
export function manifestPosts(locale: 'ru' | 'en' = 'ru'): ManifestPost[] {
  return manifestPostsFrom(loadManifest(), locale)
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `npm run test --prefix hub -- site.test`
Expected: PASS (4 assertions).

- [ ] **Step 5: Rewrite `hub/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next'
import { SITE, manifestPosts, postUrl } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10)
  const ruPosts = manifestPosts('ru')
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: today, alternates: { languages: { en: `${SITE.url}/en/` } } },
    { url: `${SITE.url}/blog/`, lastModified: ruPosts[0]?.date ?? today, alternates: { languages: { en: `${SITE.url}/en/blog/` } } },
  ]
  for (const p of ruPosts) {
    entries.push({
      url: postUrl(p.slug, 'ru'),
      lastModified: p.updated ?? p.date,
      ...(p.en ? { alternates: { languages: { en: postUrl(p.slug, 'en') } } } : {}),
    })
  }
  return entries
}
```

- [ ] **Step 6: Rewrite `hub/app/robots.ts`** (only `SITE` source changes)

```ts
import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'CCBot'], allow: '/' },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
```

- [ ] **Step 7: Rewrite `hub/app/llms.txt/route.ts`**

```ts
import { SITE, manifestPosts, postUrl } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const posts = manifestPosts('ru')
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
- ${SITE.url}/en/llms.txt (English)
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
```

- [ ] **Step 8: Rewrite `hub/app/en/llms.txt/route.ts`**

```ts
import { SITE, manifestPosts, postUrl } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const posts = manifestPosts('en')
  const body = `# ${SITE.nameEn}

Personal site: AI builder, vibe coder, coach. Landing, blog, and links to the course "Tochka Sborki" (ai.mamaev.coach).

## Sections
- Home: ${SITE.url}/en/
- Blog: ${SITE.url}/en/blog/
- Course "Tochka Sborki" (external): https://ai.mamaev.coach/en/

## Posts
${posts.map(p => `- [${p.en!.title}](${postUrl(p.slug, 'en')}) — ${p.en!.description}`).join('\n')}

## Machine-readable layers
- ${SITE.url}/sitemap.xml
- ${SITE.url}/en/blog/rss.xml
- ${SITE.url}/.well-known/agent-description.md
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
```

- [ ] **Step 9: Build the blog first (so the manifest exists), then build hub**

Run: `npm run build --prefix blog && npm run build --prefix hub`
Expected: both succeed. No "Cannot find module '@/lib/posts'" in hub.

- [ ] **Step 10: Verify the hub SEO files still list landing + all blog URLs**

```bash
grep -c "/blog/" hub/out/sitemap.xml   # expect >= 5 (blog index + 4 posts)
grep -c "mamaev.coach/blog/" hub/out/llms.txt   # expect >= 4 (posts)
grep -c "/en/blog/" hub/out/en/llms.txt         # expect >= 4
grep "sitemap.xml" hub/out/robots.txt
```
Expected: all non-zero / present.

- [ ] **Step 11: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add hub/lib/site.ts hub/lib/site.test.ts hub/app/sitemap.ts hub/app/robots.ts hub/app/llms.txt/route.ts hub/app/en/llms.txt/route.ts
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(hub): read posts-manifest for whole-site sitemap/llms (decouple from blog source)"
```

---

## Task 6: Merge script (`scripts/merge-blog.mjs`)

**Files:**
- Create: `scripts/merge-blog.mjs`

- [ ] **Step 1: Create the merge script**

```js
// scripts/merge-blog.mjs
// Model B: fold the standalone blog export into the hub export so the site is
// served as one origin — blog at /blog/* and /en/blog/*. Blog assets live under
// /blog/_next (matches blog next.config assetPrefix), never colliding with hub's
// /_next. Run from the repo root AFTER both apps build, BEFORE wrangler deploy.
import { cp, access } from 'node:fs/promises'
import { join } from 'node:path'

const root = process.cwd()
const blogOut = join(root, 'blog', 'out')
const hubOut = join(root, 'hub', 'out')

async function exists(p) { try { await access(p); return true } catch { return false } }

// [from (under blog/out), to (under hub/out)]
const moves = [
  ['blog', 'blog'],
  ['en/blog', 'en/blog'],
  ['_next', 'blog/_next'],
]

for (const [from, to] of moves) {
  const src = join(blogOut, from)
  const dest = join(hubOut, to)
  if (!(await exists(src))) {
    console.error(`merge-blog: missing source ${src} — did the blog build run?`)
    process.exit(1)
  }
  await cp(src, dest, { recursive: true })
  console.log(`merge-blog: blog/out/${from} -> hub/out/${to}`)
}
console.log('merge-blog: done')
```

- [ ] **Step 2: Run the merge (both apps already built in Task 5)**

Run: `node scripts/merge-blog.mjs`
Expected: three "->" lines + "done", exit 0.

- [ ] **Step 3: Verify URL parity in the merged `hub/out`**

```bash
for p in blog/index.html blog/prologue/index.html blog/horizons/index.html blog/charter/index.html blog/desops-hub/index.html \
         en/blog/index.html en/blog/prologue/index.html en/blog/horizons/index.html en/blog/charter/index.html en/blog/desops-hub/index.html \
         blog/rss.xml/index.html en/blog/rss.xml/index.html; do
  test -f "hub/out/$p" && echo "ok  $p" || echo "MISSING  $p"
done
```
Expected: every line `ok`.

- [ ] **Step 4: Verify blog asset isolation (no `/_next` 404s)**

```bash
# Blog pages must reference /blog/_next, and those files must exist:
grep -o '/blog/_next/[^"]*' hub/out/blog/prologue/index.html | head -1
ls hub/out/blog/_next/static >/dev/null && echo "blog assets present"
```
Expected: a `/blog/_next/...` reference printed + "blog assets present".

- [ ] **Step 5: Verify OG images merged**

```bash
ls hub/out/blog/prologue/opengraph-image* hub/out/en/blog/prologue/opengraph-image* 2>/dev/null && echo "OG ok"
```
Expected: files listed + "OG ok". (If the OG route emits a differently-named file, list `hub/out/blog/prologue/` and confirm an `opengraph-image` asset is present.)

- [ ] **Step 6: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add scripts/merge-blog.mjs
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "feat(build): merge-blog.mjs folds blog/out into hub/out (model B)"
```

---

## Task 7: Wire the merged build into CI

**Files:**
- Modify: `.github/workflows/deploy.yml` (add `blog/**` to `paths`; rewrite the `deploy-hub` job)

- [ ] **Step 1: Add `blog/**` to the workflow `paths` trigger**

In `.github/workflows/deploy.yml`, under `on.push.paths`, add the blog line after the `hub` line:

```yaml
    paths:
      - 'LMS/tochka-sborki/web/**'
      - 'hub/**'
      - 'blog/**'
      - 'mentor/**'
      - 'workers/**'
      - '.github/workflows/deploy.yml'
```

- [ ] **Step 2: Replace the entire `deploy-hub` job** with the blog→hub→merge→deploy pipeline

Find the `deploy-hub:` job and replace it with:

```yaml
  # ── mamaev.coach (landing hub + blog, merged build) ───────
  deploy-hub:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: |
            blog/package-lock.json
            hub/package-lock.json
      - name: Install blog
        working-directory: blog
        run: npm ci
      - name: Build blog
        working-directory: blog
        run: npm run build
      - name: Install hub
        working-directory: hub
        run: npm ci
      - name: Build hub
        working-directory: hub
        run: npm run build
      - name: Merge blog into hub
        run: node scripts/merge-blog.mjs
      - name: Ensure project exists
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACCOUNT }}
        run: |
          npx wrangler pages project create mamaev-coach-hub \
            --production-branch=main || echo "Project already exists"
      - name: Deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ env.CF_ACCOUNT }}
        run: |
          npx wrangler pages deploy hub/out \
            --project-name=mamaev-coach-hub \
            --branch=main \
            --commit-message="${{ github.sha }}"
```

(Keep the existing `env: CF_ACCOUNT` at the top of the file and the other three jobs unchanged. If the original `deploy-hub` had a different `--project-name`, preserve that exact name instead of `mamaev-coach-hub`.)

- [ ] **Step 3: Validate the YAML locally**

Run: `node -e "require('fs').readFileSync('.github/workflows/deploy.yml','utf8')" && echo "readable"` then visually confirm the `deploy-hub` steps match Step 2.
Expected: "readable"; job has Build blog → Build hub → Merge → Deploy in order.

- [ ] **Step 4: Commit**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" add .github/workflows/deploy.yml
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" commit -m "ci(hub): build blog+hub, merge, deploy as one job"
```

---

## Task 8: Final verification, cross-import guard, deploy

**Files:** none (verification + deploy)

- [ ] **Step 1: Cross-import guard — no app imports another app's TS source**

```bash
ROOT="C:/telo/Efforts/Ongoing/MDS_AI_COURSE"
grep -rn "hub/lib/posts\|\.\./\.\./hub\|\.\./\.\./blog" "$ROOT/hub" "$ROOT/blog" --include=*.ts --include=*.tsx | grep -v node_modules
```
Expected: **no matches**. (Hub reads the manifest via `fs` in `site.ts`, not via import — `site.ts` references the path as a string, not an `import`, so it won't match.)

- [ ] **Step 2: Clean full dry-run from scratch**

```bash
ROOT="C:/telo/Efforts/Ongoing/MDS_AI_COURSE"
rm -rf "$ROOT/blog/out" "$ROOT/hub/out"
npm run build --prefix "$ROOT/blog" \
  && npm run build --prefix "$ROOT/hub" \
  && (cd "$ROOT" && node scripts/merge-blog.mjs)
```
Expected: blog builds, manifest emitted, hub builds (reads manifest), merge prints 3 moves + done.

- [ ] **Step 3: Re-run the URL-parity + asset checks from Task 6 Steps 3-5**

Expected: every `ok`, blog assets present, OG ok.

- [ ] **Step 4: Run both test suites**

```bash
npm run test --prefix "C:/telo/Efforts/Ongoing/MDS_AI_COURSE/blog"
npm run test --prefix "C:/telo/Efforts/Ongoing/MDS_AI_COURSE/hub"
```
Expected: both green (blog: posts + ai-prompt tests; hub: site.test + any existing).

- [ ] **Step 5: Push and watch the deploy**

```bash
git -C "C:/telo/Efforts/Ongoing/MDS_AI_COURSE" push origin main
gh run list --limit 1 --json databaseId -q '.[0].databaseId'
# gh run watch <id> --exit-status ; gh run view <id> --json conclusion,jobs
```
Expected: all 4 jobs `success`. `deploy-hub` shows Build blog → Build hub → Merge → Deploy.

- [ ] **Step 6: Live spot-check**

```bash
for u in https://mamaev.coach/blog/ https://mamaev.coach/blog/prologue/ https://mamaev.coach/en/blog/ https://mamaev.coach/blog/rss.xml https://mamaev.coach/sitemap.xml https://mamaev.coach/llms.txt; do
  echo "$u -> $(curl -s -o /dev/null -w '%{http_code}' "$u")"
done
```
Expected: all `200`. Open `https://mamaev.coach/blog/prologue/` in a browser; confirm styling/chrome render (assets load from `/blog/_next`).

---

## Notes for the implementer

- **Drift markers** (Task 2) are the only guard against chrome divergence between hub and blog. Don't drop them.
- The blog app has **no** `app/page.tsx` (root `/`); that is deliberate — hub owns `/`. The merge never copies `blog/out/index.html`/`404.html`.
- `posts-manifest.json` is **not** merged into `hub/out`, so it is never publicly served — it exists only for hub's build to read from `blog/out`.
- If a chrome file imported something landing-only that the blog doesn't need (e.g. a dictionaries key), trim it in the blog copy — but keep the public string keys the blog templates reference (`blog` section of `dictionaries.ts`).
- After this ships, update `CLAUDE.md` (hub no longer hosts the blog; `blog/` is the blog app) and the `project_mc_hub_monorepo` memory (Phase 2 done). Do this as a final docs commit.
