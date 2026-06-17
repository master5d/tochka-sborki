# Фикс языкового конфликта SEO (hreflang / lang) — LMS

**Тикет:** `fb_bd7e98abe883` (bug, sev medium, impact 6 × urgency 6, area lms)
**Дата:** 2026-06-17
**Стек:** Next 16 `output: 'export'`, домен `https://ai.mamaev.coach`, RU на `/*`, EN на `/en/*`.

## Диагноз (root cause)
Двуязычный RU/EN сайт с конфликтующими/отсутствующими language-сигналами:
1. **`<html lang="ru">` хардкод** в `app/layout.tsx` — отдаётся на ВСЕ страницы, включая `/en/*` (единый root-layout в static export). EN-страницы объявляют русский.
2. **Ноль hreflang-alternates** — нет `<link rel="alternate" hreflang>`; Google не знает, что `/path` и `/en/path` — переводы друг друга, а не дубликаты → может показать не ту локаль в сниппете.
3. Нет `metadataBase` (canonical/og резолвятся относительно), нет sitemap/robots, нет `og:locale`.

## Решение
Канонический способ для большого static-сайта: hreflang через **sitemap** (один файл на все URL) + правка `lang` по локали + `metadataBase` + robots.

### 1. `app/sitemap.ts` (+ pure helper) — ядро фикса
- Pure `buildSitemap(paths: string[], base: string): MetadataRoute.Sitemap`: для каждого locale-agnostic пути (`/`, `/roadmap/`, `/lessons/<slug>/`, `/lessons/<slug>/<unit>/`, …) эмитит ОДНУ запись с `alternates.languages: { ru: base+path, en: base+'/en'+path, 'x-default': base+path }`. Next рендерит `xhtml:link rel=alternate hreflang` per URL.
- `sitemap()` собирает пути из `getAllModules('ru')` (модули + юниты) + статические публичные страницы (`/`, `/roadmap/`, `/cheatsheet/`), вызывает `buildSitemap`. `export const dynamic = 'force-static'` (Gotcha 4).
- **Исключить** auth-gated/noindex: `/dashboard`, `/character`, `/login`, `/quest-intake`, `/admin`, `/dungeon`, `/exercises`, `/offline`.

### 2. `app/robots.ts`
`MetadataRoute.Robots`: allow `/`, disallow gated пути, `sitemap: base+'/sitemap.xml'`, `host`. `force-static`.

### 3. `app/layout.tsx` — lang по локали + metadataBase
- **lang-script** (pre-paint, зеркало themeScript): `document.documentElement.lang = location.pathname.replace(/\/+$/,'').match(/^\/en(\/|$)/) ? 'en' : 'ru'`. Static single-root-layout не даёт per-route static `lang`; Googlebot рендерит JS → корректный сигнал. Убирает прямой конфликт.
- `metadata.metadataBase = new URL('https://ai.mamaev.coach')`.
- `metadata.alternates = { canonical: '/', languages: { ru: '/', en: '/en' } }` как дефолт верхнего уровня; `openGraph.locale: 'ru_RU'`.

## Тесты (vitest env=node — чистое)
- `lib/sitemap.test.ts` → `buildSitemap`: для пути `/roadmap/` запись имеет `url` на RU base и `alternates.languages.en` = base+`/en/roadmap/` + `x-default`; пустой массив → пустой sitemap; trailing-slash сохраняется.
- robots/sitemap-route/layout-script — без рендер-теста (тонкие обёртки/browser); полагаемся на `next build` (артефакты `out/sitemap.xml`, `out/robots.txt`) + tsc.

## Гейты
vitest · web tsc · workers tsc (Gotcha 2) · wrangler dry-run (Gotcha 1) · `next build` → `out/sitemap.xml` (с `hreflang`), `out/robots.txt`, `<html lang>` корректируется скриптом.

## Вне scope
- Per-page уникальные `og:locale:alternate`/canonical на каждой из 16+ страниц (sitemap-hreflang покрывает дисамбигуацию; YAGNI).
- Перевод контента, x-default на отдельный лендинг-выбор языка.
- Серверный 1:1 static `lang` per route (архитектурно невозможно при едином root-layout; решено pre-paint скриптом).

## Критерий готовности
`out/sitemap.xml` содержит hreflang ru/en/x-default для всех публичных URL; `out/robots.txt` указывает на sitemap; EN-страницы получают `lang="en"`; `metadataBase` задан. Чистый `buildSitemap` покрыт тестом; все гейты зелёные.
