# Blog Split (Phase 2) — Design

**Status:** approved design → ready for implementation plan
**Date:** 2026-06-02
**Author:** Alexander Mamaev + Claude

## Goal

Extract the blog out of `hub/` into a standalone Next.js app at `blog/` (sibling of `hub/`, `mentor/`, `LMS/` in the mc_hub monorepo), **without changing any public URL**. The blog stays at `mamaev.coach/blog/*` (RU) and `mamaev.coach/en/blog/*` (EN), served from the existing single Cloudflare Pages project `mamaev-coach-hub`.

**Why a standalone app (not just a folder):** the blog is intended as a cross-project semantic meta-wrapper — context for Точка Сборки, mentorship, **and** the rest of the projects (echo, SOVERN, etc.), able to grow on its own. Its own app justifies the separation.

**Serving model: B** — keep URLs intact via a merged build (`blog/out` merged into `hub/out`), one CF project, one domain. (Model A, a `blog.mamaev.coach` subdomain, was rejected: it would change every blog URL and break the just-shipped agent-ready/SEO + EN-blog work.)

## Non-goals (YAGNI)

- No npm workspaces / shared package (chrome is duplicated instead — see below).
- No cross-project taxonomy/categories now. The posts registry must merely not *preclude* growth (it already carries `tags`, `related`).
- No subdomain, no new CF Pages project, no new domain.
- No redesign of blog content or chrome. Pure extraction + plumbing.

## Architecture

### Two apps, one merged output

```
mc_hub/
├── hub/          → builds hub/out  (landing /, /en/ + whole-site SEO files)
├── blog/         → builds blog/out (/blog/*, /en/blog/* + blog RSS/OG)
└── (deploy)      merge blog/out into hub/out, deploy hub/out → mamaev-coach-hub
```

Build order at deploy time (in the `deploy-hub` CI job):
1. `npm ci && npm run build` in `blog/` → `blog/out` (also emits `posts-manifest.json`, see Data Bridge).
2. `npm ci && npm run build` in `hub/` → `hub/out` (reads `posts-manifest.json` to populate sitemap/llms).
3. Merge step copies blog output into hub output (see Merge Mechanics).
4. `wrangler pages deploy hub/out --project-name=mamaev-coach-hub`.

Blog **must** build before hub, because hub's whole-site SEO files consume the blog's manifest.

### What moves to `blog/`

Blog-owned source (move from hub, history-preserving `git mv` where same-repo):
- `hub/app/blog/**` → `blog/app/blog/**` (index, 4 posts, prologue `opengraph-image`, `rss.xml`)
- `hub/app/en/blog/**` → `blog/app/en/blog/**` (EN mirror incl. EN rss, EN OG)
- `hub/components/blog/**` → `blog/components/blog/**`
- `hub/components/prologue/**` → `blog/components/prologue/**` (prologue post content)
- `hub/lib/posts.ts` + `posts.test.ts` → `blog/lib/` (registry + helpers + `SITE` const)
- `hub/lib/ai-prompt.ts` + `ai-prompt.test.ts` → `blog/lib/` (the "read with AI" feature is blog-only)

### What is COPIED into `blog/` (shared chrome — duplicated, by decision)

The blog needs its own self-contained chrome (it inherits nothing from hub at runtime):
- `app/layout.tsx` — root layout (ThemeProvider, SiteHeader, LangSuggestBanner, theme FOUC script, fonts, `globals.css`)
- `components/site-header.tsx`, `header-lang-switch.tsx`, `theme-provider.tsx`, `theme-toggle.tsx`, `lang-suggest-banner.tsx` (NOT `lang-switcher.tsx` — that fixed pill is landing-body chrome; the blog uses the header switch)
- `lib/theme-pref.ts`, `lib/dictionaries.ts` (the blog needs the `blog` section + shared UI strings; landing-only strings may be trimmed)
- `app/globals.css`, fonts config, `next.config.ts`, `tsconfig.json`, `package.json`, `postcss.config.mjs`, `vitest.config.ts`

**Drift marker:** each copied chrome file gets a header comment:
`// SHARED CHROME — mirror of hub/components/<name>. Keep in sync (see docs/.../blog-split-design.md).`
A future workspace-package extraction is the escape hatch if mirroring becomes painful.

### What STAYS in `hub/` (landing + whole-site concerns)

- `app/page.tsx`, `app/en/page.tsx`, `components/home-page.tsx` (landing)
- `app/not-found.tsx`, `components/not-found-page.tsx`
- `app/layout.tsx` + chrome (the originals — hub keeps its own)
- **Whole-site agent-ready files** — single files for the whole domain:
  - `app/sitemap.ts`, `app/llms.txt/route.ts`, `app/en/llms.txt/route.ts`, `app/robots.ts`
  - `public/.well-known/agent-description.md`
- A small new `hub/lib/site.ts` holding the `SITE` constants (url/name/author) that previously lived in `posts.ts`, since hub no longer imports `posts.ts`.

## Data Bridge: `posts-manifest.json`

`sitemap.ts`, `llms.txt` (×2), `robots.ts` currently `import { posts, SITE } from '@/lib/posts'`. After the move, hub must NOT import blog source (the workers↔web coupling lesson). Instead:

- The **blog build emits** `blog/posts-manifest.json` — a plain data file (committed or generated, see below) listing every published post with the fields hub's SEO files need:
  ```json
  [{ "slug": "prologue", "date": "2026-05-30", "updated": null,
     "title": "…", "description": "…",
     "en": { "title": "…", "description": "…" } }]
  ```
  Emitted by a tiny script in the blog app's `build` script (e.g. `node scripts/emit-manifest.mjs` run after `next build`, deriving from `lib/posts.ts`).
- **Hub reads** the manifest at build time. The manifest path is `../blog/posts-manifest.json` relative to hub. Reading a **generated data file** (not importing TS source) keeps the apps decoupled and avoids esbuild cross-app resolution failures.
- If the manifest is missing (e.g. blog hasn't built yet locally), hub's SEO generation falls back to landing-only entries and logs a warning — build never crashes.

**Single source of truth** stays `blog/lib/posts.ts`; the manifest is a derived projection.

## Merge Mechanics + Asset Isolation

The crux of model B: two separate Next exports merged under one origin must not collide on `/_next/*` assets (each app produces its own hashed chunks).

**Decision — namespace blog assets via `assetPrefix`:**
- Blog `next.config.ts`: `output: 'export'`, `trailingSlash: true`, `assetPrefix: '/blog'`. Routes stay `app/blog/**` and `app/en/blog/**` (no `basePath`).
- Result: blog HTML references assets at `/blog/_next/...`; output lands in `blog/out/_next`.
- **Merge step** (script, run after both builds):
  - copy `blog/out/blog/**` → `hub/out/blog/**`
  - copy `blog/out/en/blog/**` → `hub/out/en/blog/**`
  - copy `blog/out/_next/**` → `hub/out/blog/_next/**` (matches `assetPrefix: '/blog'`)
- Hub's own `/_next/*` is untouched; blog's assets live entirely under `/blog/_next/*`. Zero collision possible.
- The blog app's own root artifacts (`blog/out/index.html`, `blog/out/404.html`) are **not** copied — hub owns `/`.

Merge implemented as a small Node script `scripts/merge-blog.mjs` at repo root (recursive copy, explicit source/dest, no shell-glob surprises on Windows/CI).

## Deploy / CI changes (`.github/workflows/deploy.yml`)

- Add `'blog/**'` to the workflow `paths:` trigger.
- Rewrite the `deploy-hub` job to: build blog → build hub → run merge script → `wrangler pages deploy hub/out`. (Single job keeps blog+hub atomic: they deploy together to one CF project.)
- `cache-dependency-path` add `blog/package-lock.json` (or a second setup-node cache entry).
- No change to `deploy-web`, `deploy-mentor`, `deploy-workers`. CF project names unchanged.

## Cross-import guard (workers↔web lesson)

- After the move, **grep** the whole repo for any `import … from '…blog/…'` or `…/hub/lib/posts` cross-app source paths. There must be NONE except the documented manifest data-read in hub.
- Pre-push validation: build `blog/`, build `hub/`, run merge, and serve/inspect `hub/out` — confirm no `/_next` 404s on blog pages.

## Testing & Verification

1. **Unit tests:** `posts.test.ts`, `ai-prompt.test.ts` move with their modules; `npm test` in `blog/` stays green. Hub keeps any landing tests.
2. **Build both apps locally** (`npm run build --prefix blog`, `--prefix hub`) + run merge script.
3. **URL parity** — every pre-existing URL still resolves in merged `hub/out`:
   - `/blog/`, `/blog/prologue/`, `/blog/horizons/`, `/blog/charter/`, `/blog/desops-hub/`
   - `/en/blog/` + the 4 EN posts
   - `/blog/rss.xml`, `/en/blog/rss.xml`
   - prologue OG images (RU + EN)
4. **Agent-ready parity** — `hub/out/sitemap.xml`, `/llms.txt`, `/en/llms.txt`, `/robots.txt` still list landing **and** all blog URLs with correct hreflang; `.well-known/agent-description.md` intact.
5. **Asset check** — open a merged blog page's HTML, confirm asset refs point to `/blog/_next/*` and those files exist in `hub/out/blog/_next`.
6. **Deploy** via CI; verify all 4 jobs green; spot-check live `mamaev.coach/blog/` + `/en/blog/`.

## Risks

- **Chrome drift** (accepted): header/theme copied; mitigated by drift-marker comments. Escape hatch: workspace package.
- **assetPrefix edge cases**: validated by the local merge + asset check before any push (step 5).
- **Manifest staleness locally**: hub falls back to landing-only + warning; CI always builds blog first so prod is always complete.
- **Build-order coupling**: documented; the single `deploy-hub` job enforces blog→hub→merge order.

## File-level summary

| Action | Path |
|--------|------|
| Create app | `blog/` (Next app: config, package.json, layout, globals, fonts) |
| Move | `hub/app/blog/**`, `hub/app/en/blog/**` → `blog/app/...` |
| Move | `hub/components/{blog,prologue}/**` → `blog/components/...` |
| Move | `hub/lib/{posts,posts.test,ai-prompt,ai-prompt.test}.ts` → `blog/lib/` |
| Copy (chrome) | layout, site-header, header-lang-switch, theme-*, lang-*, dictionaries, theme-pref, globals.css |
| New | `blog/scripts/emit-manifest.mjs`, `scripts/merge-blog.mjs`, `hub/lib/site.ts` |
| Edit | `hub/app/{sitemap.ts,robots.ts,llms.txt,en/llms.txt}` → read manifest + `site.ts` |
| Edit | `.github/workflows/deploy.yml` (deploy-hub job + paths) |
| Delete (from hub, after move) | `hub/app/blog`, `hub/app/en/blog`, `hub/components/{blog,prologue}`, `hub/lib/posts*`, `hub/lib/ai-prompt*` |
