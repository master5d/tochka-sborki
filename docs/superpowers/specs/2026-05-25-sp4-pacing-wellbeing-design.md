# SP4 — Pacing & Wellbeing — Design

**Дата:** 2026-05-25
**Статус:** Approved (design), pending plan
**Программа:** последний слайс RPG-роадмапа (`2026-05-19-rpg-roadmap-program.md`): «Burnout / Calibration / Re-engagement». Deps SP1/SP2/SP3 — все отгружены.

## Проблема / мотивация
Курс самостоятельный, без дедлайнов. Нет механик, оберегающих темп: ничто не тормозит переработку, не возвращает отвалившихся, не подстраивает сложность. Критично: **сейчас не хранятся таймстемпы активности** — `unit_progress` = `{module:{unit:true}}` без времени, `daily_quests` хранит только сегодняшний день и сбрасывается. Поэтому у SP4 есть обязательный фундамент — pacing-store.

## Решения (зафиксированы с пользователем)
- **Скоуп:** все 4 столпа — rest days, G11 re-engagement, post-Boss calibration, anxiety check-in.
- **Постура:** только мягкие dismissible-nudge. Ничего не блокируется (rest day = предложение, не запрет).
- **Anxiety:** гибрид — инференс решает КОГДА показать, сам check-in = самоотчёт.
- **Калибровка:** suggest-only (рекомендация режима, не авто-смена).
- Всё клиентское (localStorage), сервер/D1 не трогаем.

## 1. Фундамент: pacing-store (`web/lib/pacing/`)
Новый localStorage-ключ `pacing`. Паттерн: чистые helpers + storage-shell + React-hook (эталон `lib/unit-progress.ts`, `lib/quests/daily-store.ts`).

```ts
import type { Mode } from '@/lib/cs/types'

export interface Completion { unitKey: string; date: string; mode: Mode }

export interface PacingState {
  activeDates: string[]                                   // YYYY-MM-DD, dedup+sorted, cap 60
  lastSeen: string                                        // YYYY-MM-DD последнего touch()
  completions: Completion[]                               // cap 50 (FIFO)
  calibration: Record<string, 'easier' | 'right' | 'harder'>  // by module slug
  dismissed: Record<string, string>                       // nudgeKey -> YYYY-MM-DD
}
```

**Мутации (чистые, иммутабельные):**
- `logCompletion(state, unitKey, mode, date): PacingState` — push в `completions` (cap 50), add `date` в `activeDates` (dedup, cap 60). Идемпотентно по `unitKey` за сегодня (не дублировать тот же юнит в один день).
- `touch(state, date): PacingState` — `lastSeen = date`, add в `activeDates`.
- `recordCalibration(state, module, rating): PacingState`.
- `dismissNudge(state, key, date): PacingState`.

**Чистые деривации (отдельный модуль `derive.ts`):**
- `todayCount(state, today): number`
- `currentStreak(state, today): number` — подряд активные дни, заканчивающиеся сегодня или вчера.
- `daysSinceActive(state, today): number` — дни с последней активной даты (Infinity если пусто).
- `recentDowngrade(state): boolean` — последние ≥2 завершения показывают понижение ранга режима (archmage→copilot→commander) по `MODE` весам.

**Storage-shell** `read()/write()` (browser-only, try/catch). **Hook** `usePacing()` → `{ state, ready, logCompletion, touch, recordCalibration, dismissNudge }` + удобные деривации.

**Wiring:**
- `UnitWizard.handleComplete` — рядом с `markCompleted`+`award` вызвать `logCompletion(unitKey, chosenMode)`.
- Dashboard mount — `touch()`.

## 2. Выбор вмешательства: `selectNudge` (один слот, приоритет)
Чистая функция `selectNudge(state, ctx, today): Nudge | null`, где `ctx = { daysSinceActive, todayCount, currentStreak, recentDowngrade, hasIncomplete, freshModule, g11, outcome, questsLeft }`. Возвращает первую подходящую по приоритету карточку (или null). Дедуп: если `dismissed[key] === today` — пропустить.

| Приоритет | Nudge | Условие |
|-----------|-------|---------|
| 1 | `reengage` | `daysSinceActive ≥ 7` И `hasIncomplete` |
| 2 | `checkin` | (`todayCount ≥ 4` ИЛИ `recentDowngrade`) И не показан сегодня |
| 3 | `rest` | `todayCount ≥ 4` ИЛИ `currentStreak ≥ 5` |
| 4 | `calibrate` | `freshModule` (только что завершён модуль без записи `calibration[module]`) |

Пороги — именованные константы в `lib/pacing/thresholds.ts`: `REST_DAILY=4`, `REST_STREAK=5`, `LAPSE_DAYS=7`.

## 3. UI: `<WellbeingPanel>` (`web/components/wellbeing/`)
Один компонент на дашборде (над `DailyPanel`), рендерит **одну** выбранную карточку:
- **reengage** — якорь на G11 (вдохновляющая фигура) + F3 (результат) + `questsLeft`: «N квестов до „{outcome}". {g11} тоже не останавливался(ась).» CTA → к следующему незавершённому юниту.
- **checkin** — «Как ты держишься? [Норм] [Перегружен(а)]». «Перегружен» → успокаивающий текст + предложение commander-режима; пишет `dismissed.checkin=today`.
- **rest** — «Сделай паузу — прогресс не сгорит.» Кнопка «понятно» (dismiss на сегодня).
- **calibrate** — «„{moduleTitle}" пройден. Как сложность? [Легко] [В самый раз] [Тяжело]» → `recordCalibration(module, …)`.

Все карточки: акцент по скину (`accent`), двуязычно (Bi-константы), dismiss пишет `dismissed[key]=today`. Контент — `lib/wellbeing/content.ts` (как `help-content.ts`).

G11 берём из уже грузимого intake-профиля (`answers.G11`); парсер `parseAspiration(profile)` рядом с `parseOutcome` (`lib/intake/`). `questsLeft` = total units − completed (из `useUnitProgress`+content).

## 4. Эффект калибровки (suggest-only)
Чистая `suggestModeFromCalibration(rating): Mode | null` — `harder`→`commander`, `easier`→`archmage`, `right`→null. В `UnitWizard`: если у предыдущего модуля есть калибровка, передать `suggested` в `ModeSelector`, который подсвечивает рекомендованный режим бейджем «рекомендуем» (не авто-выбор).

## Архитектура / поток
- `lib/pacing/` — `types.ts`, `store.ts` (мутации + read/write), `derive.ts`, `thresholds.ts`, `use-pacing.ts`.
- `lib/wellbeing/` — `types.ts`, `content.ts` (Bi-копия), `select-nudge.ts`.
- `lib/intake/parse-aspiration.ts` — G11 экстрактор.
- `lib/cs/suggest-mode.ts` (или в pacing) — `suggestModeFromCalibration`.
- `components/wellbeing/wellbeing-panel.tsx`.
- Правки: `unit-wizard.tsx` (logCompletion + suggested mode), `components/cs/mode-selector.tsx` (опц. `suggested` бейдж), `app/dashboard/dashboard-client.tsx` (touch + `<WellbeingPanel>`).
- Новой персистентности на сервере нет; единственный новый ключ — `pacing`.

## Тестирование
- `derive.test.ts` — `currentStreak` (вкл. вчера-граница), `daysSinceActive` (пусто→Infinity), `todayCount`, `recentDowngrade`.
- `store.test.ts` — иммутабельность, cap 50/60, идемпотентность `logCompletion` за день.
- `select-nudge.test.ts` — приоритет (reengage > checkin > rest > calibrate), дедуп по `dismissed[key]===today`, null когда нет сигналов.
- `suggest-mode.test.ts` — маппинг рейтингов.
- `parse-aspiration.test.ts` — G11 из строкового/объектного `answers`, отсутствие → null.

## Вне охвата (v1)
- Пер-скиновые тексты карточек (только акцент-цвет).
- Серверная/кросс-девайс синхронизация pacing.
- Жёсткие блокировки (mandatory rest day из трекера сознательно смягчён до nudge).
- Калибровка не авто-меняет режим, только рекомендует.
- Трекинг «начатых-но-брошенных» юнитов (нет сигнала в текущей архитектуре).
