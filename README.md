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

**mc_hub — монорепо экосистемы Точки Сборки** · курс + лендинг + блог + B2B + API · один git-репо, независимые деплои на Cloudflare · RU + EN

[![Deploy](https://img.shields.io/badge/deploy-Cloudflare-orange?style=flat-square&logo=cloudflare)](https://mamaev.coach)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Workers](https://img.shields.io/badge/edge-CF_Workers-f38020?style=flat-square&logo=cloudflareworkers)](https://workers.cloudflare.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Курс →](https://ai.mamaev.coach) · [Лендинг →](https://mamaev.coach) · [Блог →](https://mamaev.coach/blog/)

</div>

---

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
