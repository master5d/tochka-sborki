# Site Covers (floor + trend showcase + backend switch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** mamaev.coach serves the floor (the pre-quest home on model-kit) at `/` and `/en/`; the quest is a trend cover built at a hidden, noindex path and reaches `/` only through a backend switch (KV config: floor / cover / A/B share) that the owner commands.

**Architecture:** Next static export builds both homes. A Cloudflare Pages Function limited by `_routes.json` to `/` and `/en/` reads `SITE_COVER` KV, picks a variant with a pure function (broken config → floor, sticky cookie for A/B), and rewrites to the cover HTML via `env.ASSETS.fetch`, stripping its noindex. Preview deployments get their own KV and a default cover through `[env.preview]` in `hub/wrangler.toml`; production has no binding until the owner orders the namespace, so it serves the floor.

**Tech Stack:** Next.js 16 (`output: 'export'`, `trailingSlash: true`), Cloudflare Pages Functions + KV, wrangler 4.131, vitest 4.

**Spec:** `docs/superpowers/specs/2026-09-11-site-covers-floor-ab.md` (b8414ef).

## Global Constraints

- Трендовая обложка выглядит только как витрина. Переключателя у посетителя нет.
- Откат или смена обложки (трендовой или любой другой) — только на бекэнде и только по команде владельца, после того как финальный дизайн утверждён.
- Вся работа до финального дизайна идёт только на превью. На проде это допустимо как A/B-тест.
- Обложка — авторский синтез владельца, вдохновлённый трендом; ручные решения в теме квеста (`hub/themes/quest.css`, компоненты `hub/components/quest/`) — часть произведения: не трогать, не выносить, долгом не считать.
- KV недоступен или конфиг битый → пол (отказ в безопасную сторону).
- В main не пушить; прод-KV не создавать и не писать; `cover.ps1` на прод не запускать — это команды владельца.
- Коммиты по явным путям, trailer `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.

## Recon facts (checked 2026-09-11, not assumed)

- **Project `mamaev-coach-hub` has no git integration** (Pages API: no `source` field); every deployment, previews included, is `ad_hoc` = direct upload by wrangler. So the CI `10429` throttling is not a git-integration conflict; it stays explained by shared runner egress (same `cf-deploy` token deployed fine from the laptop).
- **Functions ship only from the wrangler cwd.** `wrangler pages deploy` compiles `./functions` relative to the directory it runs in; CI today runs from the repo root with `hub/out`, so no functions would ship. Plan: run wrangler from `hub/` with `hub/wrangler.toml` (`pages_build_output_dir = "./out"`).
- **KV binding for Pages = wrangler config**, `[[env.preview.kv_namespaces]]` / `[env.preview.vars]` override for preview deployments only (Cloudflare docs, "Pages Functions → Wrangler configuration"). A preview deploy carrying the file sets config for *all* preview deployments, never production.
- **`_routes.json` in the output dir** limits which paths invoke the Function; everything else stays pure static (no invocation cost).
- **`wrangler.toml` wipes nothing on the first deploy** (checked via Pages API 2026-09-11, after review): production `deployment_configs` has no env_vars, KV, or D1; preview has only `COVER_DEFAULT`, which the file itself sets. Once the file exists, dashboard edits to these are no longer the source of truth.
- **Home is also fetched as RSC files** (`/index.txt`, `/__next.*.txt`, `/en/` twins) when a `<Link>` navigates there client-side; they must wake the Function too, or a cover visitor gets the floor's payload (review finding, 2026-09-11). For a cover variant the Function answers them with a 307 to the home document, which makes Next fall back to a full page load.
- **Old home** = `hub/components/home-page.tsx` at `afea700^` (363 lines, own `LangSwitcher`, reads `tagline/name/bio/heroBadges/pitch/founder/projects/socials/footerTagline`). Those dictionary fields and two tests were removed as dead in `c9f6d08`; `dictionaries.ts` has had no commits since, so reversing that commit restores them cleanly. `SiteHeader` predates the quest (`00d86fe` is an ancestor of `afea700`), so floor = exactly the pre-quest page.
- **Next App Router treats `_folder` as private** (excluded from routing). Ruling: the cover path is `/cover/<id>/` instead of the spec's `/_cover/<id>/` — same role (hidden, noindex, unlinked), no `%5F` escape risk.
- **No `trend-adweek-2026-09.json` exists yet** in `NAUTILUS/core/desops/themes/` (only `trend-kak-2026-09.json`); Adweek appears only in `taste/candidates.jsonl`. Ruling: the registry carries the provenance id; building that trend JSON is a NAUTILUS task outside this plan (a cross-repo file check inside mc_hub CI would either fail or silently skip).

---

### Task 1: Restore the floor

**Files:** Restore `hub/components/home-page.tsx`, `hub/lib/dictionaries.ts` fields, `hub/lib/dictionaries.founder.test.ts`, `hub/lib/dictionaries.hero-badges.test.ts`.

- [ ] `git checkout afea700^ -- hub/components/home-page.tsx`
- [ ] `git show c9f6d08 | git apply -R` (reverses exactly the dead-field removal: fields, interfaces, both tests)
- [ ] `npx vitest run lib/dictionaries` → PASS (founder + hero-badges suites back)
- [ ] Commit.

### Task 2: Covers registry (data only, no React — the Function imports it)

**Files:** Create `hub/lib/covers.ts`, `hub/lib/covers.test.ts`.

```ts
export type CoverLocale = 'ru' | 'en'
export interface Cover { id: string; kind: 'floor' | 'trend'; trend?: string }
export const FLOOR = 'floor'
export const COVERS: readonly Cover[] = [
  { id: FLOOR, kind: 'floor' },
  { id: 'trend-adweek-2026-09', kind: 'trend', trend: 'trend-adweek-2026-09' },
]
export const COVER_IDS: readonly string[] = COVERS.map((c) => c.id)
export const trendCovers = (): Cover[] => COVERS.filter((c) => c.kind === 'trend')
export const isKnownCover = (id: unknown): id is string => typeof id === 'string' && COVER_IDS.includes(id)
export function coverPath(id: string, locale: CoverLocale): string {
  return `${locale === 'en' ? '/en' : ''}/cover/${id}/`
}
```

Tests: exactly one floor; ids unique kebab-case; every trend cover has `trend` matching `/^trend-[a-z0-9]+(-[a-z0-9]+)*-\d{4}-\d{2}$/`; `coverPath` for both locales.

### Task 3: Pure variant choice

**Files:** Create `hub/lib/cover-select.ts`, `hub/lib/cover-select.test.ts`.

Contract: `parseConfig(raw)` → `null` (key absent) | `'invalid'` | `{active, ab}`; `chooseVariant({raw, defaultCover, cookie, rand})` → `{variant, setCookie, reason}`.
Rules: invalid JSON/shape, unknown cover, share outside 0–100 integer, `ab.cover` = floor or unknown → **floor**; key absent → `defaultCover` if known else floor; A/B with share 0 → active, cookie cleared of meaning; share > 0 → cookie `"<variant>.<share>"` sticks only while the share is unchanged, else roll `rand*100 < share`.
Tests cover: null raw + no default → floor; null raw + preview default → cover; `'{bad'` → floor; unknown active → floor; share 0 → active, no cookie; share 100 → cover + cookie; sticky cookie kept at same share; stale-share cookie re-rolled; ab.cover = floor → floor.

### Task 4: Middleware core + Function entry

**Files:** Create `hub/lib/cover-middleware.ts`, `hub/lib/cover-middleware.test.ts`, `hub/functions/_middleware.ts`, `hub/public/_routes.json`, `hub/wrangler.toml`.

`handleCover(request, env, next, rand)`: only `/` and `/en/` (else `next()`); KV `get('config')` throwing = invalid → floor; floor → `next()`; cover → `env.ASSETS.fetch(coverPath)` with the cover's robots meta stripped; always sets `x-mc-cover`, `Vary: Cookie`, `Cache-Control: private, max-age=0, must-revalidate`; `Set-Cookie mc_variant` only when chosen by A/B.
Tests with a fake env: floor passthrough; default cover rewrite + noindex stripped; KV throws → floor; `/en/` maps to the EN cover path; other paths untouched; A/B sets cookie.
`_routes.json`: `{"version":1,"include":["/","/en/","/index.txt","/__next.*","/en/index.txt","/en/__next.*"],"exclude":[]}` (RSC paths added after review).
`wrangler.toml`: name, `pages_build_output_dir = "./out"`, `compatibility_date = "2026-05-16"` (the dashboard value), `[env.preview.vars] COVER_DEFAULT`, `[[env.preview.kv_namespaces]] SITE_COVER` = the preview namespace. **No top-level binding** → production serves the floor until the owner orders a namespace.
**Update 2026-09-12 (owner granted `cf-deploy` Workers KV Storage:Edit):** the env-var deviation is closed. Top-level `[[kv_namespaces]] SITE_COVER` = `mc-site-cover` (`bf31826576e54a6b9912b68b1e3db9d0`, seeded `{"active":"floor"}` — production behaviour unchanged); `[[env.preview.kv_namespaces]] SITE_COVER` = `mc-site-cover-preview` (`9466f652f8be4e6ebea979cfccd72aad`, seeded with the cover active). `COVER_DEFAULT` stays as the preview fallback when the key is missing.

### Task 5: Pages — floor at home, cover at a hidden path

**Files:** Modify `hub/app/page.tsx`, `hub/app/en/page.tsx` (back to `HomePage` with the pre-quest metadata); create `hub/app/cover/[id]/page.tsx`, `hub/app/en/cover/[id]/page.tsx`, `hub/components/cover-home.tsx`.
Cover pages: `generateStaticParams` from `trendCovers()`, `dynamicParams = false`, `robots: { index: false, follow: false }`, quest SEO title/description. Sitemap unchanged (only `/`).

### Task 6: Acceptance scripts follow the new layout

**Files:** Modify `hub/scripts/quest-smoke.mjs`, `quest-video-check.mjs`, `quest-shots.mjs`; create `hub/scripts/cover.ps1`.
Smoke: quest checks move to `out/cover/<id>/index.html` + EN; floor needles on `out/index.html` + EN; cover HTML has robots noindex, floor has none; **no HTML file anywhere in `out/` links to `/cover/`**. Playwright tools take an optional path (default: the cover).
`cover.ps1 -Env preview|production status|ab <id> <share>|promote <id>|rollback`: writes `config` in KV with wrangler; production requires `-NamespaceId` (none exists yet) and prints before/after. (Superseded after review: the namespace id is read from `wrangler.toml` per `-Env`, and production writes need `-ConfirmProduction`.)

### Task 7: CI deploys from `hub/` so the Function ships

**Files:** Modify `.github/workflows/deploy.yml` (deploy-hub: `working-directory: hub`, `npx wrangler pages deploy --project-name=mamaev-coach-hub --branch=main`, retry loop kept). Takes effect only when the owner merges to main.

### Task 8: Preview deploy + live smoke

Create KV namespace `mamaev-coach-hub-site-cover-preview` (preview only), build, `npx wrangler pages deploy --branch=feat-site-covers` from `hub/`, then prove on `feat-site-covers.mamaev-coach-hub.pages.dev`:
1. no key → `/` = cover (`x-mc-cover: trend-adweek-2026-09`), no noindex in the served HTML;
2. `/cover/trend-adweek-2026-09/` carries noindex;
3. `config = '{bad'` → `/` = floor;
4. A/B share 100 → cover + `Set-Cookie`; share 0 → floor;
5. delete the key → back to the preview default.

If Functions do not run on direct upload, stop and record the fact.
