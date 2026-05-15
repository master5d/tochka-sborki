# Design: mamaev.coach — LMS Phase 1

**Date:** 2026-05-10
**Project:** Точка Сборки → mamaev.coach
**Scope:** Phase 1 — публичный docs-сайт с темами, CF Pages деплой, фундамент для LMS

---

## 1. Цели Phase 1

Запустить `mamaev.coach` как публичный сайт курса «Точка Сборки»:
- Весь контент из Markdown-файлов рендерится как красивые страницы
- Первая тема: **"Модель для сборки"** (dark, high-contrast, mechanical aesthetic)
- Система тем (themes) заложена архитектурно — новые темы добавляются без переписывания
- GitHub → CF Pages auto-deploy (CI/CD из коробки)
- Фундамент для Phase 2 (LMS: auth, progress, feedback loop, AI self-update)

**Вне Phase 1 scope:** auth, user progress tracking, платный доступ, quiz динамика, AI self-update pipeline (проектируется, не реализуется).

---

## 2. Архитектура

```
GitHub repo: master5d/tochka-sborki
        │
        ├── app/                 ← Next.js 15 App Router
        ├── content/             ← MDX файлы (скопировать из MDS_AI_COURSE)
        │   ├── 01-introduction.mdx
        │   ├── 02-setup-guide.mdx
        │   └── ...
        ├── themes/              ← CSS theme files
        │   └── model-kit.css    ← Phase 1 тема
        └── public/
              └── assets/

CF Pages CI/CD
        │
        ▼
mamaev.coach  (Cloudflare CDN + Pages)
        │
        ├── /                    ← Course overview (README → landing)
        ├── /roadmap             ← ROADMAP.md
        ├── /lessons/[slug]      ← Dynamic MDX lesson pages
        ├── /exercises           ← EXERCISES.md
        ├── /cheatsheet          ← Rebuilt cheatsheet (Phase 1)
        └── /feedback            ← Форма (Phase 1: статичная, Phase 2: n8n webhook)
```

---

## 3. Технический стек

| Слой | Технология | Обоснование |
|------|-----------|-------------|
| Framework | Next.js 15 App Router | MDX поддержка, `output: 'export'` для CF Pages |
| Контент | MDX (`.mdx` файлы) | Markdown + React компоненты |
| Стилизация | CSS Custom Properties + Tailwind | Themes через `data-theme` атрибут |
| Хостинг | Cloudflare Pages | Домен уже в CF, бесплатно, CI/CD из GitHub |
| Repo | GitHub | CF Pages trigger, source of truth, AI-агент коммитит сюда |
| MDX обработка | `@next/mdx` + `next-mdx-remote` | Frontmatter + компоненты в контенте |
| Иконки | `lucide-react` | Walk-away, MIT |
| Шрифты | Geist (уже в cheatsheet build) | Консистентно с существующим |

**Не используется:** Vercel, headless CMS, платные SaaS.

---

## 4. Themes System

Темы реализованы через CSS Custom Properties на уровне `:root`. Смена темы = смена `data-theme` атрибута на `<html>`.

```css
/* themes/model-kit.css — Phase 1 */
[data-theme="model-kit"] {
  --bg-primary: #0a0a0f;
  --bg-secondary: #111118;
  --text-primary: #e8e8f0;
  --text-accent: #00ff88;       /* neon green — индикатор сборки */
  --border-color: #2a2a3a;
  --surface: #16161f;
  --font-mono: 'Geist Mono', monospace;
}
```

Структура файловой системы тем:
```
themes/
├── model-kit.css    ← Phase 1: тёмная, механическая
├── default.css      ← Phase 2: светлая / нейтральная
└── index.ts         ← реестр тем (name, label, file)
```

**Новая тема = один CSS файл + запись в `index.ts`**. Не требует изменений в компонентах.

---

## 5. Контент: Markdown → MDX миграция

Существующие `.md` файлы копируются в `content/` и получают frontmatter:

```mdx
---
title: "Meeting 1: Знакомство"
description: "Software 3.0 и почему это меняет всё"
order: 1
duration: "30 мин"
level: 1
---

# Meeting 1: Знакомство
...
```

Добавляемые поля:
- `title` — для `<title>` и навигации
- `description` — SEO meta description
- `order` — порядок в сайдбаре
- `duration` — время прохождения
- `level` — уровень (0–6, для ROADMAP маппинга)

---

## 6. Структура страниц

### `/` — Course Overview
Рендер из README.md: hero-секция, список meetings, learning path. Кнопка "Начать".

### `/roadmap`
Рендер ROADMAP.md с визуальным прогресс-индикатором (7 уровней). Phase 1 — статично.

### `/lessons/[slug]`
Dynamic MDX route. Slug = имя файла без `.mdx` (например `/lessons/01-introduction`).
Layout: сайдбар с оглавлением курса + main content + prev/next навигация.

### `/cheatsheet`
Rebuilt: статичная страница с командами и паттернами из `CHEATSHEET.md`. Phase 1 — MDX рендер.

### `/exercises`
Рендер `EXERCISES.md`.

### `/feedback`
Phase 1: статичная форма (Google Forms embed или simple HTML form). 
Phase 2: POST → n8n webhook на SOVERN Hetzner.

---

## 7. CF Pages деплой

**Шаги один раз:**
1. `git init` + push в GitHub (`master5d/tochka-sborki`)
2. CF Pages → Connect to Git → выбрать репо
3. Build command: `npm run build`
4. Output directory: `out`
5. DNS: В CF Dashboard → mamaev.coach → CNAME `@` → `tochka-sborki.pages.dev`

**После этого:** каждый `git push main` → CF Pages rebuild → mamaev.coach обновлён автоматически.

```json
// next.config.js
{
  "output": "export",
  "trailingSlash": true
}
```

---

## 8. Self-Update Pipeline (проектируется, Phase 2)

```
Студент → /feedback форма
    ↓ POST
n8n workflow (SOVERN Hetzner)
    ↓ AI анализ (LiteLLM → local или cloud)
Hermes Agent → tochka-sborki-update SKILL.md
    ↓ генерирует MDX правку
GitHub API → commit в content/ → PR
    ↓
CF Pages auto-rebuild
    ↓
mamaev.coach обновлён
```

Этот pipeline использует существующий `course-feedback/` дизайн и `.claude/commands/feedback-digest.md` slash command. В Phase 2 они подключаются к n8n вместо ручного запуска.

---

## 9. DeepVista Compliance (P1 задачи)

Параллельно с созданием сайта — фиксы из аудита:

**SKILL.md fix:**
```yaml
# skills/tochka-sborki-update/SKILL.md
---
name: tochka-sborki-update
type: workflow
execution: stateless
description: >...
---
```

**ENERV meta.json** — добавить в корень проекта:
```json
{
  "name": "tochka-sborki",
  "type": "project",
  "team": "ai",
  "status": "active",
  "priority": "P1",
  "domain": ["education", "web"],
  "tech": ["nextjs", "mdx", "cloudflare"],
  "confidentiality": "public"
}
```

---

## 10. Phase 2+ Roadmap (вне Phase 1 scope)

| Phase | Фича | Технология |
|-------|------|-----------|
| 2 | Auth + student profiles | CF Workers + CF D1 |
| 2 | Progress tracking | CF D1 (SQLite) |
| 2 | Feedback → n8n | CF Workers webhook → SOVERN n8n |
| 3 | AI self-update | Hermes + tochka-sborki-update SKILL |
| 3 | Interactive quiz | CF Workers + KV |
| 3 | Дополнительные темы | CSS файлы в `themes/` |

---

## 11. Решения, принятые явно

- **Vercel отклонён** — домен в CF, CF Pages бесплатно, нет смысла в лишнем SaaS
- **Nextra/Docusaurus отклонены** — темы требуют полного контроля
- **CMS (Contentful, Sanity) отклонены** — SOVERN walk-away economics, MDX в GitHub = sovereign
- **`output: 'export'`** — Phase 1 полностью статична, CF Workers добавляются в Phase 2 по потребности
- **Cheatsheet rebuild** — исходника нет, Phase 1 = MDX-версия; оригинальный интерактив Phase 2
