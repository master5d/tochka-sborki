# mc_hub

Монорепо проектов Александра Мамаева (`mamaev.coach`). Один git-репозиторий, несколько независимых деплоев на Cloudflare.

## Структура

| Папка | Что это | Деплой |
|-------|---------|--------|
| `LMS/` | Контейнер курсов. Первый — `LMS/tochka-sborki/` («Точка Сборки»), задел на следующие. | — |
| `LMS/tochka-sborki/web/` | Next.js 16 LMS-сайт курса | `ai.mamaev.coach` (CF Pages `tochka-sborki`) |
| `hub/` | Личный лендинг + блог | `mamaev.coach` (CF Pages `mamaev-coach-hub`) |
| `mentor/` | B2B agent-engineering | `mentor.mamaev.coach` (CF Pages `mamaev-coach-mentor`) |
| `workers/` | CF Worker API (auth / progress / feedback / CRM) | `ai.mamaev.coach/api/*` |
| `docs/superpowers/` | Spec'ы и планы (brainstorming, writing-plans) | — |
| `skills/` | Claude Code skills | — |

## Деплой

Автоматический через GitHub Actions (`.github/workflows/deploy.yml`): `git push main` → 4 job'а по path-фильтрам (web / hub / mentor / workers) → CF Pages / Workers. Все сборки на Node 24.

## Курсы

«Точка Сборки» — открытый курс по agentic AI. См. [`LMS/tochka-sborki/README.md`](./LMS/tochka-sborki/README.md).

> Структура и конвенции репо для AI-ассистентов — в [`CLAUDE.md`](./CLAUDE.md).
