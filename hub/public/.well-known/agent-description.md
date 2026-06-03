# Agent Description — mamaev.coach

## What this site is
Личный сайт Александра Мамаева: AI builder, vibe coder, coach.
Содержит лендинг, блог (эссе/лонгриды об AI, практике и агентском инжиниринге)
и ссылки на курс «Точка Сборки» (ai.mamaev.coach).

## Content types
- Pages: главная (`/`), блог-индекс (`/blog/`)
- Posts: лонгриды под `/blog/<slug>/`

## Machine-readable data
- `/llms.txt` — обзор и список материалов
- `/sitemap.xml` — все URL с датами
- `/blog/rss.xml` — лента блога
- JSON-LD (BlogPosting/Blog) на страницах

## Source of truth
Метаданные постов — `blog/lib/posts.ts` (блог — отдельный апп, мёрж-сборка). Канонические URL — `/blog/<slug>/`.

## Permitted / restricted
- Read: вся публичная часть и машинные слои — разрешено.
- Suggest / draft: через PR в репозитории (человек ревьюит и мерджит).
- Publish / delete / overwrite: только человек. Агент не публикует и не удаляет контент.
