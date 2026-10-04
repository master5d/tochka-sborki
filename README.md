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

**mc_hub — личный контур `mamaev.coach`** · лендинг + блог + B2B · один git-репо, независимые деплои на Cloudflare · RU + EN

[![Deploy](https://img.shields.io/badge/deploy-Cloudflare-orange?style=flat-square&logo=cloudflare)](https://mamaev.coach)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

[Лендинг →](https://mamaev.coach) · [Блог →](https://mamaev.coach/blog/) · [Mentor →](https://mentor.mamaev.coach)

</div>

---

Личные проекты Александра Мамаева (`mamaev.coach`). Один git-репозиторий, несколько независимых деплоев на Cloudflare.

> Курс «Точка Сборки» (`LMS/`), академия (`academy/`), зонтик `synergify/` и CF Worker API (`workers/`) переехали в отдельный репо **lms-engine** (`C:\telo\Efforts\On\lms-engine`, GitHub `master5d/synergify-platform`; cutover 2026-08-06).

## Структура

| Папка | Что это | Деплой |
|-------|---------|--------|
| `hub/` | Личный лендинг + магазин + events + care | `mamaev.coach` (CF Pages `mamaev-coach-hub`) |
| `blog/` | Блог — отдельный Next-апп, при деплое мёржится в `hub/out` | `mamaev.coach/blog/*` (тот же CF-проект) |
| `mentor/` | B2B agent-engineering | `mentor.mamaev.coach` (CF Pages `mamaev-coach-mentor`) |
| `feedback/` | Triage-конвейер: `feedback.jsonl` + `board.canvas` (skill `/triage`) | — |
| `docs/superpowers/` | Spec'ы и планы (brainstorming, writing-plans) | — |
| `skills/` | Claude Code skills | — |

## Деплой

Автоматический через GitHub Actions (`.github/workflows/deploy.yml`): `git push main` → 2 job'а по path-фильтрам (`deploy-hub` = blog + hub, `deploy-mentor`) → CF Pages. Все сборки на Node 24.

> Структура и конвенции репо для AI-ассистентов — в [`CLAUDE.md`](./CLAUDE.md).
