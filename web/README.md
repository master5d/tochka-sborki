# Точка Сборки — Web (LMS Phase 1)

Публичный docs-сайт курса «Точка Сборки» на [mamaev.coach](https://mamaev.coach).

## Стек

| Слой | Технология |
|------|-----------|
| Framework | Next.js 16 App Router |
| Контент | MDX (`next-mdx-remote` + `gray-matter`) |
| Стилизация | CSS Custom Properties + Tailwind 4 |
| Шрифты | Geist / Geist Mono |
| Хостинг | Cloudflare Pages |
| CI/CD | GitHub Actions (`.github/workflows/deploy.yml`) |
| Тесты | Vitest |

## Структура

```
web/
├── app/
│   ├── layout.tsx              — root layout, dark theme, nav
│   ├── page.tsx                — главная (hero, программа, FAQ, автор)
│   ├── lessons/[slug]/page.tsx — динамические страницы уроков
│   ├── roadmap/page.tsx
│   ├── cheatsheet/page.tsx
│   ├── exercises/page.tsx
│   ├── feedback/page.tsx
│   └── globals.css             — CSS custom properties (model-kit тема)
├── components/
│   ├── nav.tsx                 — навигация
│   ├── sidebar.tsx             — сайдбар с оглавлением
│   ├── lesson-layout.tsx       — обёртка страниц уроков
│   ├── mdx-components.tsx      — кастомные MDX компоненты
│   └── assignment-block.tsx    — блок упражнений
├── content/ru/                 — MDX-файлы уроков
│   ├── 00-kickstart.mdx
│   ├── 01-introduction.mdx
│   └── ... (до 06-tools.mdx)
├── lib/
│   ├── content.ts              — парсинг MDX, getAllLessons()
│   └── content.test.ts         — Vitest тесты
├── public/
│   └── author.jpg              — фото автора
└── next.config.ts              — output: 'export', trailingSlash: true
```

## Запуск локально

```bash
cd web
npm install
npm run dev        # http://localhost:3000
```

## Сборка и деплой

```bash
npm run build      # генерирует web/out/
```

Деплой происходит **автоматически** при `git push` в ветку `main`, если изменены файлы в `web/` или `.github/workflows/deploy.yml`.

Ручной деплой:
```bash
CLOUDFLARE_API_TOKEN=<token> npx wrangler pages deploy out --project-name=tochka-sborki --branch=main
```

## Тесты

```bash
npm test           # vitest run
npm run test:watch # watch mode
```

## Контент (MDX frontmatter)

Каждый файл в `content/ru/` должен иметь frontmatter:

```mdx
---
title: "Meeting 1: Знакомство"
description: "Software 3.0 и почему это меняет всё"
order: 1
level: 1
duration: "2–3 часа"
---
```

Порядок в навигации определяется полем `order`. Для добавления нового урока: создай `.mdx` файл в `content/ru/` и обнови `page.tsx` (секция программа) если нужно.

## Темы

Цветовые переменные определены в `app/globals.css` под `[data-theme="model-kit"]`. Тема задаётся через `data-theme` атрибут на `<html>` в `layout.tsx`. Для новой темы — добавь блок CSS переменных, не меняя компоненты.

## CI/CD секреты

В GitHub репо (`master5d/tochka-sborki`) нужны secrets:
- `CLOUDFLARE_API_TOKEN` — токен CF с правами Pages:Edit
