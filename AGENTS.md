# AGENTS.md — mc_hub

Монорепо личного контура `mamaev.coach`: лендинг `hub/`, блог `blog/` (отдельный Next-апп,
мёрж в `hub/out`), B2B `mentor/` (`mentor.mamaev.coach`); деплой — CI на CF Pages по `git push main`.
Курс, академия и Worker API переехали в `lms-engine`. Общий контракт всех агентов —
`C:\telo\AGENTS.md` (HARD RULES там, здесь не дублируются).

**Проектные правила живут в `CLAUDE.md`** (структура, дизайн-контур, скаффолд поста) — читать
его первым, этот файл только указатель. Шпаргалка лаборатории — `NAUTILUS/docs/cheatsheets/61-mc-hub.md`.

## Проверка

```
cd hub  && npm test      # vitest
cd blog && npm test
npm run build            # в hub/ и blog/: next build; «зелёная сборка» = страница реально существует
```
Дизайн — `lint-design` и `test-identity.ps1` из NAUTILUS/core/desops (см. CLAUDE.md «Дизайн-контур»).
