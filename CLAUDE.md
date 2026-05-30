# Project Context

## Проект
Точка Сборки — открытый курс по agentic AI в потоке. **Agent-agnostic**: концепции работают с Claude Code, Hermes (SOVERN), Aider, Cline, и др. 9 модулей + упражнения + шпаргалка. **Bilingual**: RU (основной) + EN (`/en/` маршруты). Refactor 2026-05-18: добавлен модуль 03-stack-selection (Behind-GFW + Sovereign), модули 03→04 ... 07→08.

## Три сайта (один репо, три CF Pages проекта)
- **`web/`** → `ai.mamaev.coach` — LMS курса (проект `tochka-sborki`)
- **`hub/`** → `mamaev.coach` — личный лендинг + **блог** (`/blog`, реестр `hub/lib/posts.ts`); agent-ready слои: llms.txt, /.well-known/agent-description.md, sitemap.xml, robots.txt, /blog/rss.xml, JSON-LD (проект `mamaev-coach-hub`)
- **`mentor/`** → `mentor.mamaev.coach` — B2B agent-engineering (проект `mamaev-coach-mentor`)
- **`workers/`** → `ai.mamaev.coach/api/*` — CF Worker (auth magic-link, progress, feedback, CRM). Все три сайта bilingual (RU `/`, EN `/en/`).

## Структура
```
ROADMAP.md              — Карта уровней Vibe Coder / AI Generalist
00-kickstart.md         — Meeting 0 (опционально): карта местности для нонкодеров
01-introduction.md      — Meeting 1: Software 3.0, четыре сдвига
02-setup-guide.md       — Meeting 2: Установка инструментов (Warp, Claude Code, Git, Marp)
03-stack-selection      — Meeting 3 (НОВЫЙ): Выбор стека (Claude/Sovereign/Cloud-OSS/Behind-GFW), Hermes, миграция. Только в web/content/, markdown-версии в корне нет.
04-prompt-engineering.md — Meeting 4: Промпт-инжиниринг, магические слова
05-context-memory.md    — Meeting 5: Контекст, память, агенты
06-audio-pipeline.md    — Meeting 6: Pipeline скрапинг → анализ → insights
07-tools.md             — Meeting 7: MCP-серверы, Agent Skills, Hooks, Superpowers
08-agent-engineering.md — Meeting 8: Агентский инжиниринг и оркестрация
EXERCISES.md            — 8 практических упражнений
CHEATSHEET.md           — Быстрая справка по командам
INDEX.md                — Полный навигатор по курсу
README.md               — Обзор и путь обучения
PERSONAL-CONTEXT.md     — Шаблон профиля студента
my-experiments/         — Рабочая папка студента (шаблоны, результаты)
my-templates/           — Шаблоны для работы
course-feedback/        — Author layer feedback-петли (submissions/, digests/, README)
docs/superpowers/       — Spec'ы и планы (brainstorming, writing-plans)
web/                    — Next.js 16 LMS сайт (ai.mamaev.coach), см. web/README.md
  web/app/              — App Router; RU `/` + EN `/en/` зеркало. Маршруты: lessons,
                          quest-intake, dashboard, character, dungeon, roadmap,
                          cheatsheet, exercises, feedback, certificate, login, admin
  web/content/{ru,en}/  — MDX-версии уроков (9 модулей) с frontmatter
  web/components/       — Nav, Sidebar, UnitWizard, MDX-компоненты, OsToggle/OsBlock,
                          AgentToggle/AgentBlock/StackMatrix, MobileGate, LangSuggestBanner;
                          rpg/ cs/ quests/ dungeon/ intake/ help/ wellbeing/ — RPG-слой (см. ниже)
  web/lib/              — content.ts, dictionaries.ts (RU+EN), os-pref.ts, тесты;
                          rpg/ cs/ quests/ dungeon/ intake/ help/ pacing/ wellbeing/ — логика RPG-слоя
hub/                    — лендинг mamaev.coach (Next.js, bilingual)
mentor/                 — B2B mentor.mamaev.coach (Next.js, bilingual)
workers/                — CF Worker (Hono-less router): auth/progress/feedback/CRM
.github/workflows/      — deploy.yml: 4 jobs (web/hub/mentor/workers) → CF Pages/Workers
```

## Стек

### Контент (Markdown)
- Markdown (весь контент курса)
- Marp (конвертация .md → слайды HTML/PDF/PPTX)
- Firecrawl (веб-скрапинг в Meeting 5)

### Web / LMS (папка `web/`)
- Next.js 16 App Router, `output: 'export'` (статичный сайт), `trailingSlash: true`
- MDX (`next-mdx-remote`) — контент из `web/content/{ru,en}/**`
- Локализация: `lib/dictionaries.ts` (RU+EN), компоненты принимают `locale`
- CSS Custom Properties + Tailwind 4 — light/dark темы через `data-theme` (`light`/`dark`), дефолт = система (prefers-color-scheme), выбор в nav (`lib/theme-pref.ts` + `ThemeProvider` + 3-сегментный `ThemeToggle`); FOUC-guard inline-скрипт в `layout`
- Cloudflare Pages хостинг + CF Worker для API (`workers/`)
- GitHub Actions — CI/CD (`.github/workflows/deploy.yml`)
- Vitest — тесты (`web/lib/content.test.ts`)

### Backend (`workers/`)
- CF Worker на `ai.mamaev.coach/api/*`. Эндпоинты: auth (magic-link через Resend),
  progress (D1 SQLite), feedback, CRM webhook.
- **CRM pipeline**: новый юзер → Worker fires `N8N_CRM_WEBHOOK_URL` (n8n workflow
  `mds-crm` на n8n.synergify.com) → создаёт строку в Notion. Секрет
  `N8N_CRM_SECRET` должен совпадать с IF-нодой «Check Secret» в n8n.
- D1 база `tochka-sborki-db`; секреты через `wrangler secret put` (не в коде).

## RPG / геймификация (web/)
Поверх LMS построен RPG-слой. Все статичные данные — клиентские (localStorage); сервер хранит только intake-профиль и прогресс уроков.
- **Intake** (`/quest-intake`, `lib/intake/`): опросник → профиль `{ niche, cog_tier, world_skin, F3-outcome }` в D1 `intake_profiles`. `scoring.ts`, `attributes.ts`, `parse-outcome.ts`.
- **Квест-лог** (`/dashboard`) + **лист персонажа** (`/character`): World Map (зоны = модули), QuestFeed, CharacterStrip. `lib/rpg/` — `quest-log.ts`, `map-layout.ts`, `niche-map.ts`, `unit-framing.ts`.
- **Themed skins**: `lib/rpg/skins/*.json` (7 скинов) + `skins-meta.ts` — переосмысление формулировок юнитов под выбранный мир.
- **Cognitive Shards (CS)** — единая валюта вместо XP. 3 режима прохождения (commander 1.0× / copilot 1.5× / archmage 2.5×). `lib/cs/`: `wallet.ts`, `award.ts`, `modes.ts`, `applied-challenge.ts` (персонализация под niche/outcome).
- **Daily Quests** (`lib/quests/`) и **Niche Dungeons** (`/dungeon`, `lib/dungeon/`) — детерминированная генерация (FNV-1a seed + mulberry32).
- **Help-система** (`lib/help/`, `components/help/`): `<HelpTip>` (tap-popover) + `<IntroCard>` (авто-онбординг). Маркер «💭 в уме» на reflection-фазах.
- **Bisociation**: фазы `activation`/`reflection` урока — бисоциативные провокации (мысленные, без полей ввода). Drift-guard тест `web/lib/content/reflection-prompts.test.ts` запрещает «вводные» глаголы в этих блоках.
- **Pacing & Wellbeing (SP4)** (`lib/pacing/`, `lib/wellbeing/`, `components/wellbeing/`): `pacing`-store логирует таймстемпы завершений + режимы + калибровки. `<WellbeingPanel>` на dashboard показывает ОДИН мягкий dismissible-nudge по приоритету (re-engage на якоре G11 > anxiety check-in > rest-day > post-Boss калибровка). Калибровка → suggest-only бейдж режима в `ModeSelector`. Всё клиентское.
- **localStorage-ключи** (изолированы): `cs_wallet`, `unit_progress`, `daily_quests`, `niche_dungeon`, `help_seen`, `pacing`, `os`, `theme-pref`, `stack`, `lang-preference`.

## Инструкции для Claude Code
- Контент пишется на **русском** (основной), затем зеркалится в **EN** (`content/en/`, `/en/` маршруты)
- Новые клиентские фичи: паттерн **pure helpers + localStorage-store + React-hook** (эталоны: `lib/unit-progress.ts`, `lib/cs/wallet.ts` + `use-shards.ts`)
- Reflection-фазы (`activation`/`reflection`) — бисоциативные, мысленные; не добавлять «запиши/опиши/type/write» (drift-guard тест следит)
- Формат файлов — Markdown с emoji-заголовками
- Нумерация файлов: `XX-topic.md` (01, 02, 03...)
- Студенческие файлы → `my-experiments/`; шаблоны → `my-templates/`
- При добавлении нового Meeting обновлять: INDEX.md, README.md, оба `content/{ru,en}/`
- Новый UI-текст → в `web/lib/dictionaries.ts` (RU+EN), не хардкодить в компонентах
- OS-специфичные команды → `<OsBlock os="mac|windows">`; стек-специфичные → `<AgentBlock stack="...">`
- Сохранять единый стиль: секции с emoji, таблицы, чеклисты `- [ ]`, blockquote tips `> 💡`
- Лимит CLAUDE.md ~200 строк
- При обновлении урока (.md) — обновить соответствующий .mdx в `web/content/{ru,en}/`
- Деплой автоматический: `git push main` → CI (4 jobs по path-фильтрам)
- Секреты Worker'а — только через `wrangler secret put`, остерегаться BOM при copy-paste
