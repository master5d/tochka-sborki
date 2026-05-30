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
