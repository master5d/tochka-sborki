# Project Context

## Монорепо (mc_hub)
Корень репо — `mc_hub`: контейнер для нескольких продуктов. Курсы живут под `LMS/<course>/` (первый — `LMS/tochka-sborki/`, задел на следующие). Лендинг (`hub/`), блог (`blog/` — отдельный апп), B2B (`mentor/`) и API (`workers/`) — соседи в корне. `docs/` (superpowers specs/plans) и `skills/` — repo-wide, в корне.

> **Конвенция путей в этом файле:** полные пути типа `LMS/tochka-sborki/web/...` даются от корня репо. Краткие `lib/`, `content/`, `components/`, `app/` — относительно web-аппа курса (`LMS/tochka-sborki/web/`).

## Проект
Точка Сборки — открытый курс по agentic AI в потоке. **Agent-agnostic**: концепции работают с Claude Code, Hermes (SOVERN), Aider, Cline, и др. 9 модулей + упражнения + шпаргалка. **Bilingual**: RU (основной) + EN (`/en/` маршруты). Refactor 2026-05-18: добавлен модуль 03-stack-selection (Behind-GFW + Sovereign), модули 03→04 ... 07→08.

## Три сайта (один репо, три CF Pages проекта)
- **`LMS/tochka-sborki/web/`** → `ai.mamaev.coach` — LMS курса (проект `tochka-sborki`). `public/` хостит one-liner установщики (раздаются по `ai.mamaev.coach/install.sh` и т.д., запуск одной строкой через curl/irm): `install.sh`/`install.ps1` (Claude-стек: Node+Git+Claude Code) и `install-gfw.sh`/`.ps1` (GFW cloud-relay: Python+LiteLLM proxy:4000+Aider); точки входа — в `02-setup-guide`/`u3-behind-gfw`.
- **`hub/`** → `mamaev.coach` — личный лендинг + **whole-site agent-ready слои** всего домена: llms.txt (×2), /.well-known/agent-description.md, sitemap.xml, robots.txt. Читают `blog/out/posts-manifest.json` через `hub/lib/site.ts` (данные, не импорт). Проект `mamaev-coach-hub`.
- **`blog/`** → `mamaev.coach/blog/*` + `/en/blog/*` — **отдельный** Next-апп (реестр `blog/lib/posts.ts`, JSON-LD, `/blog/rss.xml`, OG, «read with AI»). Модель B: `assetPrefix:'/blog'`, при деплое его вывод мёржится в `hub/out` (`scripts/merge-blog.mjs`) → один CF-проект `mamaev-coach-hub`. Общий chrome — копии из hub с маркерами `// SHARED CHROME`. Деплоит job `deploy-hub` (build blog → build hub → merge).
- **`mentor/`** → `mentor.mamaev.coach` — B2B agent-engineering (проект `mamaev-coach-mentor`)
- **`workers/`** → `ai.mamaev.coach/api/*` — CF Worker (auth magic-link, progress, feedback, CRM, **Telegram Mini App + companion bot**, **Stripe support checkout**, daily-nudge **cron**). Все три сайта bilingual (RU `/`, EN `/en/`).

## Структура
```
mc_hub/                   — корень монорепо
├── LMS/                  — контейнер курсов
│   └── tochka-sborki/    — курс «Точка Сборки» (всё ниже — относительно него)
│       ROADMAP.md              — Карта уровней Vibe Coder / AI Generalist
│       00-kickstart.md         — Meeting 0 (опц.): карта местности для нонкодеров
│       01-introduction.md      — Meeting 1: Software 3.0, четыре сдвига
│       02-setup-guide.md       — Meeting 2: Установка инструментов (Warp, Claude Code, Git, Marp)
│       03-stack-selection      — Meeting 3: Выбор стека (Claude/Sovereign/Cloud-OSS/Behind-GFW). Только в web/content/, markdown-версии нет.
│       04-prompt-engineering.md — Meeting 4: Промпт-инжиниринг, магические слова
│       05-context-memory.md    — Meeting 5: Контекст, память, агенты
│       06-audio-pipeline.md    — Meeting 6: Pipeline скрапинг → анализ → insights
│       07-tools.md             — Meeting 7: MCP-серверы, Agent Skills, Hooks, Superpowers
│       08-agent-engineering.md — Meeting 8: Агентский инжиниринг и оркестрация
│       EXERCISES.md / CHEATSHEET.md / INDEX.md / README.md / PERSONAL-CONTEXT.md
│       my-experiments/   — Рабочая папка студента (шаблоны, результаты)
│       my-templates/     — Шаблоны для работы
│       course-feedback/  — Author layer feedback-петли (submissions/, digests/, README)
│       scripts/          — Dev-time генераторы (gen-skins.mjs)
│       tools/            — Вспом. сборки (cheatsheet)
│       web/              — Next.js 16 LMS сайт (ai.mamaev.coach), см. web/README.md
│         app/            — App Router; RU `/` + EN `/en/`. Маршруты: lessons,
│                           quest-intake, dashboard, character, dungeon, roadmap,
│                           syllabus, cheatsheet, exercises, feedback, certificate,
│                           login, admin, offline, alumni, support; metadata-routes manifest/sitemap/robots
│         content/{ru,en}/ — MDX-версии уроков (9 модулей) с frontmatter
│         components/     — Nav, Sidebar, UnitWizard, MDX-компоненты, OsToggle/OsBlock,
│                           AgentToggle/AgentBlock/StackMatrix, MobileGate, LangSuggestBanner;
│                           rpg/ cs/ quests/ dungeon/ intake/ help/ wellbeing/ — RPG-слой
│         lib/            — content.ts, dictionaries.ts (RU+EN), os-pref.ts, course.ts
│                           (central config), materials.ts, sitemap.ts, pwa.ts, тесты;
│                           rpg/ cs/ quests/ dungeon/ intake/ help/ pacing/ wellbeing/ — RPG-логика
├── hub/                  — лендинг mamaev.coach + whole-site SEO (Next.js, bilingual)
├── blog/                 — блог mamaev.coach/blog/* — отдельный апп, мёрж в hub/out (model B)
├── mentor/               — B2B mentor.mamaev.coach (Next.js, bilingual)
├── workers/              — CF Worker (Hono-less router): auth/progress/feedback/CRM/telegram/checkout + scheduled() cron
├── docs/superpowers/     — Spec'ы и планы (brainstorming, writing-plans) — repo-wide
├── skills/               — Claude Code skills (tochka-sborki-update)
├── feedback/             — triage-конвейер: feedback.jsonl + board.canvas (skill /triage, дэшборд sovern-mindmap)
└── .github/workflows/    — deploy.yml: 4 jobs (web/hub/mentor/workers) → CF Pages/Workers
```

## Стек

### Контент (Markdown)
- Markdown (весь контент курса)
- Marp (конвертация .md → слайды HTML/PDF/PPTX)
- Firecrawl (веб-скрапинг в Meeting 5)

### Web / LMS (папка `LMS/tochka-sborki/web/`)
- Next.js 16 App Router, `output: 'export'` (статичный сайт), `trailingSlash: true`
- MDX (`next-mdx-remote`) — контент из `content/{ru,en}/**`
- Локализация: `lib/dictionaries.ts` (RU+EN), компоненты принимают `locale`
- CSS Custom Properties + Tailwind 4 — light/dark темы через `data-theme` (`light`/`dark`), дефолт = система (prefers-color-scheme), выбор в nav (`lib/theme-pref.ts` + `ThemeProvider` + 3-сегментный `ThemeToggle`); FOUC-guard inline-скрипт в `layout`
- Cloudflare Pages хостинг + CF Worker для API (`workers/`)
- GitHub Actions — CI/CD (`.github/workflows/deploy.yml`)
- Vitest — тесты (`lib/content.test.ts`)

### Backend (`workers/`)
- CF Worker на `ai.mamaev.coach/api/*`. Эндпоинты: auth (magic-link через Resend),
  progress (D1 SQLite), feedback, leads CRM.
- **CRM pipeline** (с 2026-06-15, заменил Notion+n8n): источник правды лидов — D1 `users`
  (email, created_at, language, source, telegram_handle), пишется на signup в `auth.ts`.
  Новый юзер → `ctx.waitUntil(addResendContact())` (`lib/crm.ts`) пушит **глобальный
  Resend-контакт** (`POST /contacts`; Audiences у Resend deprecated → Segments, контакты
  глобальные — `RESEND_AUDIENCE_ID` НЕ нужен, активно при наличии `RESEND_API_KEY`). Витрина —
  owner-gated `/admin/leads` (таблица + CSV + кнопка backfill `POST /api/admin/leads/sync-resend`).
  n8n `mds-crm` и Notion CRM выведены (секреты `N8N_CRM_*` удалены 2026-06-16).
- **Welcome email** (LIVE с 2026-06-22): новый юзер в `handleSendLink` получает ДВА письма — транзакционный
  magic-link (без изменений, лучшая доставляемость) + welcome (`lib/welcome-email.ts buildWelcomeEmail`/
  `sendWelcomeEmail`, bilingual, best-effort `ctx.waitUntil`, никогда не роняет signup). Идемпотентно через
  `isNewUser`/`newLead` (existing-юзер → только magic-link), без новой колонки. Копия = course-data в билдере
  (де-хастленный Cabral; founder-нота → меню → ОДИН CTA intake → cheatsheet → anti-fluff). `List-Unsubscribe:
  <mailto:OWNER_EMAIL>` (нативная кнопка Gmail/Apple Mail; полный suppression-роут отложен до рекуррентных кампаний).
- D1 база `tochka-sborki-db`; секреты через `wrangler secret put` (не в коде). Миграции **0001–0011** применены
  (0008 telegram_id, 0009 nudge cols, 0010 questions, 0011 purchases); additive-миграции прода накатываются через
  Cloudflare-api MCP `/query` (zero-token), НЕ `wrangler migrations apply`.
- **Telegram** (Mini App Phase 0 + companion bot Phase 1, оба LIVE; бот **@tochka_sborki_lms_bot**):
  - `POST /api/auth/telegram` — auth-мост: верифицирует подписанный `initData` (HMAC, `lib/telegram-initdata.ts`)
    → выдаёт тот же `session` JWT-cookie; hybrid identity (telegram_id → handle → native synthetic email). Web:
    `<TelegramAuthBridge>` авто-логинит когда LMS открыт как Telegram WebApp.
  - `POST /api/telegram/webhook` — бот (raw, без grammY; secret-token verify). Команды `/start` `/continue`
    (advisory drip — следующий незавершённый модуль из `lib/course-order.ts`) `/stop` `/ask` `/support`. `/ask` →
    лид в `questions` + owner-email (`lib/owner-notify.ts`) + handoff. Bilingual copy в `lib/bot-copy.ts`.
  - **`scheduled()` cron `0 16 * * *`** → `runDailyNudge` (`handlers/nudge-cron.ts`): один daily nudge по
    guard-chain `lib/nudge-policy.ts` (optout/throttle 20h/active/lapse 14d; reuse паттерна wellbeing select-nudge).
  - Go-live скрипты: `workers/scripts/telegram-go-live.ps1` (token + menu button + `-RegisterWebhook`).
  - Secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`. Спека: `docs/superpowers/specs/2026-06-22-telegram-*`.
- **Stripe checkout** (engine; курсы всегда БЕСПЛАТНЫ — checkout только для support/tips + digital goods + physical
  later). **Framing = «поддержка/покупка у автора (ИП)», НЕ «нонпрофит/tax-deductible»** (нон-профит не
  зарегистрирован; до `fb_3dc7f76f5f4e`). Stripe-hosted Checkout Sessions (no PCI). Secrets `STRIPE_SECRET_KEY`
  (sandbox-LIVE; прод = restricted `rk_live` scope Checkout-Sessions-Write + новый аккаунт, НЕ Luma-managed) +
  `STRIPE_WEBHOOK_SECRET`. Скрипт `workers/scripts/stripe-set-key.ps1`.
  - **Slice 1 (support/PWYW)**: `POST /api/checkout/support` (`handlers/checkout.ts`), amount server-side $1–$1000
    (`lib/checkout.ts`), `submit_type=donate`. Web `/support` (пресеты $3/$7/$15 + custom) + бот `/support`.
  - **Slice 2 (digital goods, SHIPPED dark 2026-06-22)**: статичный каталог `lib/products.ts` (`PRODUCTS=[]` пока →
    фича тёмная; web-зеркало `lib/store/products.data.ts`, держать в синхроне). `POST /api/checkout/product` —
    цена из каталога (НЕ от клиента), `submit_type=pay`, `metadata[product_id/locale]`. `POST /api/stripe/webhook`
    (`handlers/stripe-webhook.ts`) — `Stripe-Signature` HMAC-verify (`lib/stripe-webhook.ts`, WebCrypto, 300s replay),
    идемпотентность `purchases.stripe_session_id UNIQUE` + `meta.changes`, доставка asset-ссылки письмом
    (`lib/purchase-email.ts`, Resend best-effort, `delivered_at` = retry-маркер). Web `/store` + `/en/store` (+thanks),
    nav «Магазин». Доставка: `delivery {kind:'url'}` реализована; `{kind:'r2'}` (presigned) отложена в свой слайс.
    Go-live (owner): добавить товары в ОБА products-файла + зарегистрировать webhook-эндпоинт + set `STRIPE_WEBHOOK_SECRET`.

## RPG / геймификация (LMS/tochka-sborki/web/)
Поверх LMS построен RPG-слой. Все статичные данные — клиентские (localStorage); сервер хранит только intake-профиль и прогресс уроков.
- **Intake** (`/quest-intake`, `lib/intake/`): опросник → профиль `{ niche, cog_tier, world_skin, F3-outcome }` в D1 `intake_profiles`. `scoring.ts`, `attributes.ts`, `parse-outcome.ts`. V2-инструмент (`questions.v2.ts`+`scoring-v2.ts`) — короткие evocative вопросы (фидбэк по старым вопросам часто устарел); V_HOOK/V_MODE — multi-select (`num()` берёт max по массиву); на `charter-reveal` — кнопка self-profile (`self-profile-prompt.ts`). Онбординг-мост (intake→quest-log) разоружает RPG-жаргон для нонгеймеров (`onboarding-bridge`).
- **Квест-лог** (`/dashboard`): QuestFeed, CharacterStrip, Daily, Dungeon, Vault. **Профиль** (`/character`, таб в nav): лист героя + **World Map** (зоны = модули; перенесён сюда с dashboard; **«Вы тут / You are here» локатор** = ✦-маркер на текущем узле + bilingual caption под картой, `lib/rpg/locator.ts buildLocator`) + карточка companion-charter (`profileToCharter` пересобирает устав из профиля). `lib/rpg/` — `quest-log.ts`, `map-layout.ts`, `locator.ts`, `niche-map.ts`, `unit-framing.ts`.
- **Themed skins**: `lib/rpg/skins/*.json` (7 скинов) + `skins-meta.ts` — переосмысление формулировок юнитов под выбранный мир.
- **Cognitive Shards (CS)** — единая валюта вместо XP. 3 режима прохождения (commander 1.0× / copilot 1.5× / archmage 2.5×). `lib/cs/`: `wallet.ts`, `award.ts`, `modes.ts`, `applied-challenge.ts` (персонализация под niche/outcome).
- **Daily Quests** (`lib/quests/`) и **Niche Dungeons** (`/dungeon`, `lib/dungeon/`) — детерминированная генерация (FNV-1a seed + mulberry32).
- **Help-система** (`lib/help/`, `components/help/`): `<HelpTip>` (tap-popover) + `<IntroCard>` (авто-онбординг). Маркер «💭 в уме» на reflection-фазах.
- **Bisociation**: фазы `activation`/`reflection` урока — бисоциативные провокации (мысленные, без полей ввода). Drift-guard тест `lib/content/reflection-prompts.test.ts` запрещает «вводные» глаголы в этих блоках.
- **Pacing & Wellbeing (SP4)** (`lib/pacing/`, `lib/wellbeing/`, `components/wellbeing/`): `pacing`-store логирует таймстемпы завершений + режимы + калибровки. `<WellbeingPanel>` на dashboard показывает ОДИН мягкий dismissible-nudge по приоритету (re-engage на якоре G11 > anxiety check-in > rest-day > post-Boss калибровка). Калибровка → suggest-only бейдж режима в `ModeSelector`. Всё клиентское.
- **localStorage-ключи** (изолированы): `cs_wallet`, `unit_progress`, `daily_quests`, `niche_dungeon`, `help_seen`, `pacing`, `os`, `theme-pref`, `stack`, `lang-preference`, `pwa_install_dismissed`, `lwai_dock_dismissed`.

## Платформа / scaffold + learn-with-AI (LMS/tochka-sborki/web/)
- **LMS-scaffold** (задел на будущие курсы): `lib/course.ts` (`COURSE = {name, fullName, domain, locales, publisher}` — единый источник бренда/домена для sitemap/robots/manifest, не хардкод). `lib/materials.ts` — декларативный манифест `MaterialGroup[]` (templates/links/tools). `/syllabus` (RU+EN, nav «Программа») = generic `syllabus-tree.tsx` (дерево модуль→юнит из `getAllModules`) + `materials-section.tsx`. Шаблоны для скачивания — `public/materials/`. Принцип: движок читает данные курса. Future: course-data слой для RPG/intake, `LMS/_template/` boilerplate.
- **Лендинг-витрина** (LMS home-page, `lib/course/showcase.ts` + `components/showcase-gallery.tsx`): секция «Возможности» с **видео-фасадом** (`showcase-video.tsx` `'use client'` — click-to-play, НЕ грузит iframe/`<video>` до клика; `resolveVideoSource` mp4/webm→file vs YT/Vimeo→embed, `withAutoplay`; `VIDEO.url`+`poster` = `null` плейсхолдер пока контента нет) + **две секции кейсов**: «Реальные истории» (`REAL_CASES` — proof-карточки с result-строкой + автором + опц. `href`→блог-разбор fb_83d05aa7ee6f; засеяны 4 своими проектами; рендерится ТОЛЬКО при `cases.length>0`, выше мечт) над «О чём можно мечтать» (`DREAM_CASES` аспирационные). Authenticity: result-копи качественное, без выдуманных метрик (fb_2fbf86ac3c67).
- **learn-with-AI** (handoff во внешний ИИ ученика, без ключей/OAuth): session-слой = `LearnWithAI` секция + `LearnWithAIDock` (per-unit, `buildLearnPrompt`/`buildBootstrapDeepLink`); memory-слой = `CompanionSetup` на `/character` (`buildCompanionRolePrompt` + `AGENT_MEMORY` — стоячая роль в память агента). ChatGPT/Claude несут `?q=` deep-link, Gemini/Copilot — copy.
- **PWA**: installable (`app/manifest.ts` + `public/icon-*.png` ← `scripts/gen-pwa-icons.mjs` sharp + `public/sw.js` network-first). `InstallPrompt` (iOS-хинт vs beforeinstallprompt-pill), `PwaRegister` в layout. `lib/pwa.ts` SSR-safe.
- **SEO bilingual**: hreflang ru/en/x-default через `app/sitemap.ts` (+pure `lib/sitemap.ts`), `app/robots.ts`, pre-paint lang-скрипт (`<html lang>` по локали), `metadataBase`. ⚠ Metadata-routes требуют `export const dynamic = 'force-static'` под `output: export`. ⚠ НЕ ставить `alternates.canonical` в root-layout metadata — протечёт на все страницы.

## Инструкции для Claude Code
- Контент пишется на **русском** (основной), затем зеркалится в **EN** (`content/en/`, `/en/` маршруты)
- Новые клиентские фичи: паттерн **pure helpers + localStorage-store + React-hook** (эталоны: `lib/unit-progress.ts`, `lib/cs/wallet.ts` + `use-shards.ts`)
- Reflection-фазы (`activation`/`reflection`) — бисоциативные, мысленные; не добавлять «запиши/опиши/type/write» (drift-guard тест следит)
- Формат файлов — Markdown с emoji-заголовками
- Нумерация файлов: `XX-topic.md` (01, 02, 03...)
- Студенческие файлы → `my-experiments/`; шаблоны → `my-templates/`
- При добавлении нового Meeting обновлять: INDEX.md, README.md, оба `content/{ru,en}/`
- Новый UI-текст → в `lib/dictionaries.ts` (RU+EN), не хардкодить в компонентах
- OS-специфичные команды → `<OsBlock os="mac|windows">`; стек-специфичные → `<AgentBlock stack="...">`
- Разбор примера (промпт/CLI/команда) → `<AnnotatedExample segments={[{text,label,note,accent}]} caption? mono?>` («exploded anatomy»: цветные номер-токены + callouts; engine-reusable, `lib/content/annotated-example.ts buildAnatomy` + 6-цветная `ACCENT`-палитра; коннектор = номер-бейдж ①②③, не SVG; server-компонент; fb_e92087192011)
- Сохранять единый стиль: секции с emoji, таблицы, чеклисты `- [ ]`, blockquote tips `> 💡`
- Лимит CLAUDE.md ~200 строк
- При обновлении урока (.md) — обновить соответствующий .mdx в `content/{ru,en}/`
- Деплой автоматический: `git push main` → CI (4 jobs по path-фильтрам)
- Секреты Worker'а — только через `wrangler secret put`, остерегаться BOM при copy-paste
