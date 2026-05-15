```
████████╗ ██████╗  ██████╗██╗  ██╗██╗  ██╗ █████╗
   ██╔══╝██╔═══██╗██╔════╝██║  ██║██║ ██╔╝██╔══██╗
   ██║   ██║   ██║██║     ███████║█████╔╝ ███████║
   ██║   ██║   ██║██║     ██╔══██║██╔═██╗ ██╔══██║
   ██║   ╚██████╔╝╚██████╗██║  ██║██║  ██╗██║  ██║
   ╚═╝    ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝

 ███████╗██████╗  ██████╗ ██████╗ ██╗  ██╗██╗
 ██╔════╝██╔══██╗██╔═══██╗██╔══██╗██║ ██╔╝██║
 ███████╗██████╔╝██║   ██║██████╔╝█████╔╝ ██║
 ╚════██║██╔══██╗██║   ██║██╔══██╗██╔═██╗ ██║
 ███████║██████╔╝╚██████╔╝██║  ██║██║  ██╗██║
 ╚══════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝
```

<div align="center">

**AI Vibe-Coding Course · 7 модулей · Claude Code + MCP + Агенты**

[![Deploy](https://img.shields.io/badge/deploy-Cloudflare_Pages-orange?style=flat-square&logo=cloudflare)](https://mamaev.coach)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## О курсе

**Точка Сборки** — практический курс по вайб-кодингу. Освоение Claude Code, MCP-серверов, агентов и автоматизации через 7 модулей и 28 когнитивных юнитов.

Каждый модуль разбит на юниты по циклу Колба: **Активация → Рефлексия → Концепция → Практика**.

## Структура

```
7 модулей × 3–5 юнитов = 28 когнитивных юнитов

M0  Kickstart            — карта AI-мира для нонкодеров
M1  Знакомство           — Software 3.0, четыре сдвига
M2  Сетап                — рабочая среда, Claude Code CLI
M3  Промпты              — формулировка ТЗ, магические слова
M4  Контекст             — память агента, CLAUDE.md, sub-agents
M5  Pipeline             — URL → scrape → analyze → insights
M6  Инструменты          — MCP, Hooks, Skills, Superpowers
```

## Стек

| Слой | Технология |
|------|-----------|
| LMS (web) | Next.js 16 App Router · `output: export` · MDX |
| Контент | Markdown / MDX · Kolb-cycle unit structure |
| Стилизация | CSS Custom Properties · Geist Mono |
| Хостинг | Cloudflare Pages |
| CI/CD | GitHub Actions |
| Тесты | Vitest |

## Быстрый старт

```bash
git clone https://github.com/master5d/tochka-sborki.git
cd tochka-sborki/web
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000)

## Разработка контента

Каждый модуль — папка в `web/content/ru/`:

```
web/content/ru/
  01-introduction/
    _meta.json          ← метаданные модуля (title, module, units[])
    u1-activation.mdx   ← юнит 1
    u2-four-shifts.mdx  ← юнит 2
    ...
```

MDX-юнит использует `<Phase>` компоненты:

```mdx
<Phase type="activation">
  Вопрос для разогрева...
</Phase>

<Phase type="reflection">
  Рефлексия...
</Phase>

<Phase type="concept">
  Теория...
</Phase>

<Phase type="practice">
  Практическое задание...
</Phase>
```

## Команды

```bash
npm run dev          # dev-сервер
npm run build        # production build (static export)
npm test             # vitest
```

## Деплой

Push в `main` → GitHub Actions → Cloudflare Pages автоматически.

---

<div align="center">
  <sub>Сделано с Claude Code · <a href="https://mamaev.coach">mamaev.coach</a></sub>
</div>
