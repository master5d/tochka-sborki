# Точка Сборки — Web (LMS)

Публичный сайт открытого курса «Точка Сборки» на [ai.mamaev.coach](https://ai.mamaev.coach).
**Bilingual**: русский (`/`) + английский (`/en/`). Часть мульти-сайтового репо
(`web/` = курс, `hub/` = mamaev.coach, `mentor/` = mentor.mamaev.coach).

## Стек

| Слой | Технология |
|------|-----------|
| Framework | Next.js 16 App Router, `output: 'export'`, `trailingSlash: true` |
| Контент | MDX (`next-mdx-remote` + `gray-matter`) |
| Локализация | `lib/dictionaries.ts` (RU+EN), компоненты принимают `locale` prop |
| Стилизация | CSS Custom Properties + Tailwind 4 (`data-theme="model-kit"`) |
| Шрифты | Geist / Geist Mono / Unbounded (display) |
| Backend | CF Worker `workers/` на `ai.mamaev.coach/api/*` (auth, progress, feedback, CRM) |
| Хостинг | Cloudflare Pages (проект `tochka-sborki`) |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`, job `deploy-web`) |
| Тесты | Vitest |

## Структура

```
web/
├── app/
│   ├── layout.tsx                 — root layout, тема, LangSuggestBanner
│   ├── page.tsx                   — RU главная (HomePage locale="ru")
│   ├── en/                        — EN зеркало всех маршрутов
│   │   ├── page.tsx               — EN главная
│   │   ├── feedback/page.tsx
│   │   ├── lessons/...
│   │   ├── roadmap, cheatsheet, exercises, certificate/
│   ├── lessons/[slug]/page.tsx        — landing модуля (ModulePage)
│   ├── lessons/[slug]/[unit]/page.tsx — unit-урок (UnitPage + UnitWizard)
│   ├── roadmap, cheatsheet, exercises, feedback, certificate/
│   ├── login, dashboard, onboarding, auth/verify/  — auth flow
│   └── globals.css
├── components/
│   ├── nav.tsx                    — навигация + active-state + OS/lang switch
│   ├── footer.tsx                 — footer (showCertificateCta опционально)
│   ├── sidebar.tsx                — оглавление модулей/units
│   ├── lesson-layout.tsx          — обёртка landing модуля
│   ├── unit-page.tsx (pages/)     — обёртка unit-урока
│   ├── unit-wizard.tsx            — пошаговый wizard фаз урока
│   ├── mdx-components.tsx         — регистрация всех MDX-компонентов
│   ├── os-toggle.tsx / os-block.tsx        — Mac/Windows переключатель команд
│   ├── agent-toggle.tsx / agent-block.tsx  — выбор стека (4 варианта)
│   ├── stack-matrix.tsx           — интерактивная матрица стеков (модуль 03)
│   ├── mobile-gate.tsx            — desktop-gate на unit-страницах (email/QR)
│   ├── lang-suggest-banner.tsx    — баннер смены языка по navigator.language
│   ├── feedback-form.tsx          — форма фидбека (locale-aware)
│   └── pages/                     — home-page, module-page, unit-page, mdx-page, certificate-page
├── content/
│   ├── ru/                        — 9 модулей × units (00-kickstart … 08-agent-engineering)
│   │   ├── 03-stack-selection/    — НОВЫЙ: выбор стека, Behind-GFW, Hermes
│   │   ├── cheatsheet.mdx, roadmap.mdx, exercises.mdx
│   └── en/                        — полное зеркало ru/
├── lib/
│   ├── content.ts                 — getAllModules, getUnitContent, навигация
│   ├── dictionaries.ts            — RU+EN словарь всего UI-текста
│   ├── themes.ts, use-pretext.ts
│   └── content.test.ts            — Vitest
├── public/author.jpg
└── next.config.ts
```

## Запуск локально

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Сборка и деплой

```bash
npm run build      # генерирует web/out/ (~112 страниц: RU+EN)
```

Деплой **автоматический** при `git push main`, если изменены `web/`. Воркер деплоится
отдельным job при изменениях в `workers/`.

Ручной деплой:
```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy out --project-name=tochka-sborki --branch=main
```

## Локализация (bilingual)

- Весь UI-текст — в `lib/dictionaries.ts` (`dictionaries.ru` / `dictionaries.en`).
  Компоненты получают `locale` и берут строки через `getDictionary(locale)`.
- Контент уроков — параллельные деревья `content/ru/` и `content/en/`.
- EN-маршруты живут в `app/en/**` и рендерят те же компоненты с `locale="en"`.
- `LangSuggestBanner` (в `layout.tsx`) предлагает сменить язык по `navigator.language`,
  выбор сохраняется в `localStorage.lang-preference`.

## Контент уроков (MDX)

Модуль = папка `content/{ru,en}/NN-slug/` с `_meta.json` (module, title, description,
duration, level, units[]) и `uX-*.mdx` файлами. Frontmatter unit-а: `title, unit, module, duration`.

Спец-компоненты в MDX:
- `<OsToggle />` + `<OsBlock os="mac|windows">…</OsBlock>` — Mac/Win команды
- `<AgentToggle />` + `<AgentBlock stack="claude|sovereign|cloud-oss|behind-gfw">…</AgentBlock>`
- `<StackMatrix />` — карта 4 стеков (модуль 03)
- `<Phase type="activation|reflection|concept|practice">` — фазы урока

## Backend / API (`workers/`)

CF Worker обслуживает `ai.mamaev.coach/api/*`:
- `auth/send-link`, `auth/verify`, `auth/me`, `auth/logout` — magic-link через Resend
- `progress/*` — прогресс по урокам (D1 `tochka-sborki-db`)
- `feedback` — приём формы фидбека
- CRM: новый юзер → webhook `N8N_CRM_WEBHOOK_URL` → n8n `mds-crm` → Notion

CORS разрешает `ai./mamaev.coach/mentor.mamaev.coach`. Секреты — `wrangler secret put`.

## Тесты

```bash
npm test           # vitest run
npm run test:watch
```

## CI/CD секреты

В GitHub репо (`master5d/tochka-sborki`):
- `CLOUDFLARE_API_TOKEN` — токен CF с правами Pages:Edit + Workers
