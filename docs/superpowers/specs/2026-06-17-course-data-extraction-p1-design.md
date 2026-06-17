# Course-data extraction — Phase 1

**Тикет:** `fb_8f1a05ce1150` (idea, area lms) — извлечь RPG/intake/showcase данные курса в course-data слой.
**Дата:** 2026-06-17
**Phase 2 (high-coupling):** `fb_f2c7279911ca` (skins-meta + intake, workers-careful).

## Цель
Ввести `lib/course/` как **слой данных курса**; движок читает данные оттуда, а не из разбросанных `lib/`. Первый шаг к multi-course платформе (новый курс меняет `lib/course/`, не движок).

## Scope Phase 1 — 3 low-risk pure-data модуля (НЕ потребляются воркером)
| Из | В | Consumers |
|---|---|---|
| `lib/showcase.ts` | `lib/course/showcase.ts` | `components/showcase-gallery.tsx` (+ test) |
| `lib/dungeon/flavor-bank.ts` | `lib/course/dungeon-flavor.ts` | `app/dashboard/dashboard-client.tsx`, `app/dungeon/dungeon-client.tsx` |
| `lib/rpg/niche-map.ts` | `lib/course/niche-map.ts` | dashboard-client, dungeon-client, `lib/cs/applied-challenge.ts`, `lib/dungeon/build-dungeon.ts` (+ test) |

## Подход (безопасно, по одному)
Для каждого модуля: `git mv` → починить внутренний относительный импорт (`./types` → `@/lib/<orig-dir>/types`, alias web-only OK т.к. воркер не тянет) → обновить импорты consumers + теста → `tsc --noEmit` + затронутый тест. После всех трёх — full vitest + build + **workers tsc** (подтвердить, что воркер не задет) + wrangler.

## Не-цели
- skins-meta / intake (Phase 2, `fb_f2c7279911ca`) — высокий coupling + workers cross-import.
- Переименование символов/логики — только перемещение данных + правка импортов.
- Shared-engine пакет (далёкая цель).

## Готовность
3 data-модуля в `lib/course/` + `lib/course/README.md` (конвенция). Все consumers обновлены. tsc (web+workers), vitest, build, wrangler — зелёные. Поведение неизменно (чистое перемещение).
