# Companion Setup — durable role-prompt + per-agent memory install

**Тикет:** `fb_82646a4b4d05` (severity: low, impact 7 × urgency 5, area: course, cat: feature)
**Дата:** 2026-06-17
**Связан:** `fb_e60901c90115` (per-unit handoff dock — session-слой; этот тикет = стоячий memory-слой), `lib/intake/charter.ts` (`profileToCharter` — переиспользуем), `components/intake/charter-card.tsx` (живёт рядом).

## Назначение

Дать ученику **copy-paste role-prompt**, который он вставляет **один раз** в постоянную *память* своего агента (ChatGPT / Claude / Gemini / Copilot), чтобы тот стал study-компаньоном по курсу «Точка Сборки» и помнил роль между сессиями. Ровно ticket-ask: «build up their agent's memory» через готовый блок под learning-режим, на собственной подписке ученика.

Отличие от уже построенного `fb_e60901c90115`: тот док делает **эфемерный handoff контекста текущего урока** в сессию. Этот тикет — **стоячая роль в памяти агента** (course-wide, без per-unit контекста). Два слоя одной системы «учиться вместе с ИИ»: memory-слой (этот) + session-слой (док).

## Решение

Секция-аккордеон «Настрой ИИ-компаньона на весь курс» на `/character` под `CharterCard`. Персонализ. из intake-профиля (залогинен) или generic (гость). Один role-prompt + табы 4 агентов с инструкцией «куда вставить в память».

## Файлы

### 1. `lib/intake/companion-role-prompt.ts` (новый, чистый)
```ts
buildCompanionRolePrompt(profile: any | null, locale: Locale): string
```
- **Залогинен:** переиспользует `profileToCharter(profile, locale)` как блок личности + оборачивает в **стоячую course-wide роль**: постоянный наставник по курсу; директива запомнить роль на все будущие сессии; когда ученик приносит урок/задачу — вести по Learning Loop (намерение→система→дизайн→шаг→todo); co-thinking, не «сделай за меня»; голос/решение за учеником. БЕЗ `lesson_title`/`unit` (это session-слой дока).
- **Гость (`profile === null`):** generic-вариант той же роли без профиля (курс про vibe coding / agentic AI; co-thinking-напарник).
- RU+EN. Co-thinking-закон присутствует в обоих.

### 2. `lib/intake/agent-memory.ts` (новый, чистый)
```ts
export interface AgentMemory { key: string; label: string; where: { ru: string; en: string } }
export const AGENT_MEMORY: AgentMemory[]
```
4 агента — куда вставить role-prompt в постоянную память:
- **ChatGPT** — Настройки → Персонализация → Кастомные инструкции (или «Память») / Settings → Personalization → Custom Instructions (or "Memory")
- **Claude** — Создай Project → Project instructions / Create a Project → Project instructions
- **Gemini** — Создай Gem → Instructions (или Saved info) / Create a Gem → Instructions (or Saved info)
- **Copilot** — Вставь как первое сообщение и закрепи (memory ограничен) / Paste as first message & pin (limited memory)

### 3. `components/intake/companion-setup.tsx` (новый, 'use client')
- `<details>`-аккордеон, свёрнут по умолчанию.
- `<pre>` с `buildCompanionRolePrompt(profile, locale)` + кнопка «Скопировать роль» (clipboard, паттерн `CharterCard`).
- Табы `AGENT_MEMORY`: активный таб показывает строку `where[locale]` для своего агента. Контент промпта един; меняется только инструкция-куда.
- Аналитика: `plausible('companion_setup_copied', { props: { agent } })` на copy.

## Интеграция
- `app/character/profile-client.tsx`: `<CompanionSetup profile={profile} locale={locale} />` под `<CharterCard>`.

## Тесты (vitest env=node — только чистые ф-ции)
- `companion-role-prompt.test.ts`: персонализ. вшивает мир/нишу/F3 при профиле; generic при `null`; присутствует «memory/запомни на все сессии»-формулировка; co-thinking-закон; RU+EN вариант.
- `agent-memory.test.ts`: ровно 4 агента; у каждого непустые `where.ru` и `where.en`.
- Компонент — без рендер-теста (env=node); полагаемся на `tsc --noEmit`.

## Guardrails
- Никаких секретов/PII в промпте: только учебный профиль (мир/ниша/стиль/F3), как в `profileToCharter`. Не email/телефон.
- Диалог идёт во ВНЕШНЕМ ИИ ученика → рантайм-инъекций в наш бэкенд нет; курс не хранит переписку.
- Co-thinking-законы наследуются из `profileToCharter`/charter-инфры.

## Вне scope
- Указатель из дашборда/дока на эту секцию (отдельная микро-правка, follow-up; YAGNI здесь).
- Embedded-чат, серверное хранение, реальная запись в память агента (копирует ученик).
- Per-unit контекст (это session-слой `fb_e60901c90115`).

## Критерий готовности
Секция «Companion Setup» на `/character`: durable role-prompt (персонализ./generic, RU+EN) + табы 4 агентов с инструкцией памяти + copy + аналитика. Чистые билдеры покрыты тестами. tsc (web+workers) и wrangler dry-run зелёные.
