# mamaev.coach — blog

Блог Александра Мамаева (эссе/лонгриды об AI, практике и агентском инжиниринге) —
**отдельный Next.js App Router апп** (`output: 'export'`, `assetPrefix: '/blog'`).
Служит смысловой мета-обвязкой для всех проектов, не только курса.

Деплоится **не сам по себе**: при сборке его вывод (`out/blog`, `out/en/blog`,
`out/_next`) вкладывается в вывод лендинга (`hub/out`) скриптом
`scripts/merge-blog.mjs`, и весь сайт едет одним CF Pages проектом
`mamaev-coach-hub`. Поэтому URL остаются `mamaev.coach/blog/*` и `/en/blog/*`
(модель B). См. `docs/superpowers/specs/2026-06-02-blog-split-design.md`.

## Структура

- **Реестр постов:** `lib/posts.ts` — единственный источник правды (`Post[]` + `getAllPosts`/`getPost`/`formatDate`/`postUrl` + `SITE`).
- **Индекс:** `/blog` (`app/blog/page.tsx` + `components/blog/blog-index.tsx`); EN — `app/en/blog/`.
- **Пост:** `/blog/<slug>/` обёрнут в `components/blog/post-layout.tsx` (мастхед + «По теме» + JSON-LD). Тело поста — bespoke-компонент (как `components/prologue/`).
- **Манифест для hub:** `app/posts-manifest.json/route.ts` эмитит `out/posts-manifest.json` — лендинг читает его для whole-site sitemap/llms (данные, не импорт исходников). Не мёржится в публичный сайт.
- **Общий chrome** (`app/layout.tsx`, `components/site-header.tsx`, `theme-*`, `lang-suggest-banner`, `lib/dictionaries.ts`, `lib/theme-pref.ts`, `app/globals.css`, `themes/model-kit.css`) — **копии из `hub/`**, помеченные `// SHARED CHROME — mirror of hub/...`. Меняешь шапку/тему — синхронь обе копии.

### Добавить пост
1. Добавить запись в `posts` (`lib/posts.ts`). `draft: true` скрывает из индекса/sitemap/llms/RSS.
2. Создать тело поста и роут `app/blog/<slug>/page.tsx`, обернув в `<PostLayout post={getPost('<slug>')!}>…</PostLayout>` (+ EN под `app/en/blog/<slug>/`).
3. (Опц.) заполнить `tags`/`related` — `related` рендерит блок «По теме».

## Agent-ready слои (блог-овладельческие)
Всё дерёт из `lib/posts.ts`, поэтому не расходится:
- **JSON-LD** `BlogPosting`/`Blog` — `components/blog/json-ld.tsx`.
- **`/blog/rss.xml`** + **`/en/blog/rss.xml`** — `app/blog/rss.xml/route.ts` (+ en) (`force-static`).
- Whole-site `sitemap.xml` / `llms.txt` / `robots.txt` / `.well-known` живут в `hub/` и читают `posts-manifest.json`.

**Правило:** агент пишет черновик (`draft: true` / PR), человек ревьюит и публикует. Агент не публикует и не удаляет контент сам.

## Разработка
```bash
npm install
npm run dev     # http://localhost:3000 (локально без /blog-префикса в дев-режиме)
npm run build   # static export → out/
npm test        # vitest (lib/posts.test.ts, lib/ai-prompt.test.ts)
```
Полная сборка сайта: собрать blog, затем hub, затем `node ../scripts/merge-blog.mjs` из корня репо.
