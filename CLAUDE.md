# Project Context

## Монорепо (mc_hub)
Корень репо — `mc_hub`: личный контур `mamaev.coach`. Лендинг (`hub/`), блог (`blog/` — отдельный апп) и B2B (`mentor/`) — соседи в корне; `feedback/`, `docs/` (superpowers specs/plans) и `skills/` — repo-wide, в корне.

> **Курс «Точка Сборки» (`LMS/`), академия (`academy/`), зонтик `synergify/` и CF Worker API (`workers/`) здесь больше НЕ живут** — переехали в репо lms-engine (`C:\telo\Efforts\On\lms-engine`, GitHub `master5d/synergify-platform`; cutover 2026-08-06). Всё про курс/академию/worker — в его CLAUDE.md/README.
> Агентский канон курса, RPG, scaffold, гвардов контента и Gemini-Notebook перенесён в `lms-engine/CLAUDE.md` (2026-10-04).

## Сайты (domain split 2026-07-30: учебное → synergify.com (lms-engine), личное → mamaev.coach (этот репо))
- **`hub/`** → `mamaev.coach` — личный лендинг + **whole-site agent-ready слои** всего домена: llms.txt (×2), /.well-known/agent-description.md, sitemap.xml, robots.txt. Читают `blog/out/posts-manifest.json` через `hub/lib/site.ts` (данные, не импорт). Проект `mamaev-coach-hub`. **Events-поверхность** (slice 1, fb_8d2e32ceff62): `/events/` индекс + `/events/[slug]/` лендинг (×ru/en, `generateStaticParams`), данные config-driven в `hub/lib/events.ts` (`EVENTS` keyed bilingual, `getEvent`/`listEvents` — **НЕ MDX**, hub без MDX), порт `hub/components/capture-form.tsx` (relative POST `/api/leads/capture`), `capture`-блок в `hub/lib/dictionaries.ts`. Сид `retreat-inner-evolution`. Authenticity: даты прозой, без countdown/scarcity/глянца. Эпик-остаток (платный ticketing/расписание-схема/multi-umbrella/admin) — позже. **Visual refresh (fb_fb9fc1f8):** gradient-токены `--accent-gradient`/`--hero-glow` в `hub/themes/model-kit.css` (ОБЕ темы) + честные `heroBadges` (non-vanity) в `hub/lib/dictionaries.ts` → hero-glow (`aria-hidden`, за текстом z-index) + gradient-eyebrow (только hero) + badge-ряд + per-card gradient-fade в `home-page.tsx`; бан-лист (без countdown/vanity/press/testimonials/pricing).
- **Главная hub = пол + обложки** (спек `docs/superpowers/specs/2026-09-11-site-covers-floor-ab.md`, прод с 2026-09-12): на `/` и `/en/` **пол** (прежняя `home-page.tsx`); квест-обложка `trend-adweek-2026-09` (`QuestHome`) собрана на `/cover/<id>/` — noindex, без ссылок, без переключателя у посетителя. Что отдать на `/` решает Pages Function `hub/functions/_middleware.ts` по KV `SITE_COVER` (прод `mc-site-cover`, превью `mc-site-cover-preview`, привязки в `hub/wrangler.toml`): `{active}` или A/B-доля с cookie `mc_variant`, любой сбой → пол, заголовок `x-mc-cover`. **Смена/откат — только `hub/scripts/cover.ps1` и только по команде владельца** (`-Env production -ConfirmProduction`). До утверждения финала — только превью. Обложка — авторский синтез по тренду, не клон: ручные решения `quest.css` не выносить и не «подгонять» под JSON тренда. Функции попадают в деплой только из `hub/` (CI так и работает). Гварды обложки: `quest-pixels.mjs` (растяжение по оси ≤0.005 жёстко; апскейл ≤1.75× и видимая доля ≥0.78 на desktop — пороги приняты владельцем), `quest-framing.mjs` (персонажи целиком и не под текстом, 901–1920); ждущие 2K кадры — `hub/lib/quest/awaiting-2k.json`. ⚠ `10429` в CI деплоя может значить мёртвый токен: сперва дата секрета `gh secret list` (2026-09-11: секрет пережил ротацию и 5 деплоев упали).
- **`blog/`** → `mamaev.coach/blog/*` + `/en/blog/*` — **отдельный** Next-апп (реестр `blog/lib/posts.ts`, JSON-LD, `/blog/rss.xml`, OG, «read with AI»). Модель B: `assetPrefix:'/blog'`, при деплое его вывод мёржится в `hub/out` (`scripts/merge-blog.mjs`) → один CF-проект `mamaev-coach-hub`. Общий chrome — копии из hub с маркерами `// SHARED CHROME`. Деплоит job `deploy-hub` (build blog → build hub → merge). **Knowledge-graph:** `/blog/graph` (+/en) viz `components/blog/post-graph.tsx` ← pure `lib/graph.ts buildGraph` (nodes=entries, edges=`related[]`, цвет по `tags[0]`). **Phase B (fb_2367bdbf2304):** `Post.kind?:'note'|'post'` (опц., дефолт post) — `getAllPosts` essays-only (индекс/RSS/manifest чистые), новый `getGraphEntries` posts+notes (граф); note-узлы меньше (r6); движок ТЁМНЫЙ (0 заметок, контент владельца). **Аналитика блога:** PostHog cookieless (`lib/analytics.ts`) + Яндекс Метрика 113342606 (`lib/metrika.ts`, 2026-10-02, вебвизор выкл) — обе dark-ship по repo variables `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_YM_ID`; Метрика считает первую страницу сама при init (`defer` игнорирует), ручной hit — только на client-навигацию; проверять тег чистым Chromium, не Camoufox. **CLI scaffolder:** `npm run new:post -- <slug> [--kind note]` (`blog/scripts/new-post.mjs` + pure `templates.mjs`+test) — генерит component+2 route, ПЕЧАТАЕТ registry-stub (НЕ мутирует `posts.ts`), no-overwrite guard, TODO-плейсхолдеры.
- **`mentor/`** → `mentor.mamaev.coach` — B2B agent-engineering (проект `mamaev-coach-mentor`)
- **API `mamaev.coach/api/*`** (events-форма `/api/leads/capture`, `/api/care`, product-чекаут магазина `/api/checkout/product`) обслуживает worker `tochka-sborki-api` из lms-engine (apex-route; relative `/api/*` долетает с hub). `hub/lib/store/products.data.ts` держать в синхроне с `workers/src/lib/products.ts` в lms-engine. Все сайты bilingual (RU `/`, EN `/en/`).

## Структура
```
mc_hub/                   — корень монорепо
├── hub/                  — лендинг mamaev.coach + whole-site SEO (Next.js, bilingual)
├── blog/                 — блог mamaev.coach/blog/* — отдельный апп, мёрж в hub/out (model B)
├── mentor/               — B2B mentor.mamaev.coach (Next.js, bilingual)
├── docs/superpowers/     — Spec'ы и планы (brainstorming, writing-plans) — repo-wide
├── skills/               — Claude Code skills (triage, tochka-sborki-update)
├── feedback/             — triage-конвейер: feedback.jsonl + board.canvas (skill /triage, дэшборд sovern-mindmap)
├── scripts/              — merge-blog.mjs (blog/out → hub/out), sync-desops-kit.mjs
└── .github/workflows/    — deploy.yml: 2 jobs (deploy-hub = blog+hub, deploy-mentor) → CF Pages
```

## Дизайн-контур (проход 2026-08-02: hub, mentor, blog; academy и курс — теперь в lms-engine)
- **Шкала кеглей — общая на всех поверхностях**: токены `--text-xs/sm/base/lg/xl`
  (12/14/16/20/24) в каждом `themes/*.css`. Пол читаемости 12px; в разметке НЕ писать
  дробные rem (в живом рендере было до 29 кеглей, включая 0.35rem).
- **Акцент светлой темы = `#0063ab`** во всех копиях темы. Прежние `#0077cc`/`#0070c0`
  проходили AA только против `--bg-primary`; на `--bg-secondary` и полупрозрачных
  плашках давали 4.13-4.33. ⚠ Токен-гвард может быть зелёным при живых нарушениях —
  он мерит ОДНУ пару, а рендер кладёт акцент на разные фоны.
- **Тема ставится атрибутом `data-theme`.** hub раньше отдавал `class="dark"` из
  ui-kit-провайдера → селекторы не совпадали, страница рендерилась чёрным по чёрному.
  Гвард шва: `hub/lib/a11y/contrast.test.ts` (провайдер и CSS обязаны говорить об одном
  атрибуте) + fallback-токены в голом `:root` для пре-гидрации.
- **`identity.json` есть у hub / mentor** (`test-identity.ps1` = ok).
- ⚠ `themes/model-kit.css` — отдельные копии в blog / hub / mentor (и в курсе в lms-engine):
  фикс токена в одной НЕ пропагирует.
- Слепое пятно линта ЗАКРЫТО (2026-08-03): правило `no-hardcoded-colors-in-const`
  (`NAUTILUS/core/desops/rules/no-hardcoded-colors.yaml`) ловит цвет в объявлении
  переменной — раньше `const accent = '#00d1ff'` в панели mentor проходил чистым,
  потому что линт смотрел только внутрь `style={{…}}`. Проверено на до-версии
  `visuals.tsx`: 3 находки. OG-картинки из правила исключены по пути.
- OG-картинки (`opengraph-image.tsx`) — Satori рендерит их в изоляции: CSS-переменные
  там не работают, хардкод цветов обоснован и правилами не трогается.

## Инструкции для Claude Code
- Сохранять единый стиль: секции с emoji, таблицы, чеклисты `- [ ]`, blockquote tips `> 💡`
- Лимит CLAUDE.md ~200 строк
- Новый blog-пост/заметка → `cd blog && npm run new:post -- <kebab-slug> [--kind note]` (скаффолдит component+2 route, печатает Post-stub для `blog/lib/posts.ts`); заметки (`kind:'note'`) graph-only с плотным `related[]`.
- Деплой автоматический: `git push main` → CI (2 jobs по path-фильтрам: hub/blog, mentor)
