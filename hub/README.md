# mamaev.coach — hub

Личный лендинг Александра Мамаева. Next.js App Router, `output: 'export'`,
deploy на Cloudflare Pages (`mamaev-coach-hub`) через `.github/workflows/deploy.yml`.

Hub отвечает за лендинг (`/`, `/en/`) и **whole-site agent-ready слои** всего домена.
**Блог — отдельный апп** (`../blog/`); при деплое его вывод вкладывается в `hub/out`
(модель B, см. `scripts/merge-blog.mjs`), поэтому `mamaev.coach/blog/*` обслуживается
этим же CF-проектом, но кодом из `blog/`.

## Whole-site agent-ready слои
Лендинг берёт данные из `lib/site.ts` (`SITE` + чтение `blog/out/posts-manifest.json`,
который эмитит блог-сборка — данные, не импорт исходников блога):
- **`/sitemap.xml`** — `app/sitemap.ts` (лендинг + посты с hreflang).
- **`/robots.txt`** — `app/robots.ts` (разрешает AI-краулеров).
- **`/llms.txt`** + **`/en/llms.txt`** — `app/llms.txt/route.ts` (+ en), `force-static`.
- **`/.well-known/agent-description.md`** — `public/.well-known/agent-description.md`.

> `lib/site.ts` падает с ошибкой при сборке, если `blog/out/posts-manifest.json` нет —
> значит блог не собрался перед hub. В CI блог всегда собирается первым.

## Разработка
```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export → out/  (sitemap/llms читают ../blog/out/posts-manifest.json)
npm test        # vitest (lib/site.test.ts)
```
Полная сборка сайта (с блогом): из корня репо — собрать `blog`, затем `hub`, затем
`node scripts/merge-blog.mjs`. Документация блога — `../blog/README.md`.
