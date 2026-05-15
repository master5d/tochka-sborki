# Cognitive Units — Design Spec

## Goal

Реструктурировать курс «Точка Сборки» по модели Цикла Колба: каждый meeting разбивается на 3–5 автономных когнитивных единиц (unit'ов). Каждый unit — 4-шаговый wizard (Активация → Рефлексия → Концепция → Практика). Прогресс хранится в localStorage. Навигация — вложенный sidebar.

## Problem

Все 7 модулей курса начинаются сразу с теории (Этап 3 Колба). Этапы 1 (Конкретный опыт) и 2 (Рефлексия) полностью отсутствуют в 6/7 модулях. Learner не активирован — материал не усваивается и не применяется на практике.

---

## Architecture

Статический Next.js 16 (`output: 'export'`). Прогресс learner'а хранится в `localStorage` (ключ `unit_progress`). Новый динамический роут `[meeting]/[unit]/`. Каждый meeting — папка MDX-файлов вместо одного файла. Никакого бэкенда не требуется.

---

## Content Structure

Каждый meeting превращается в папку с unit'ами:

```
web/content/ru/
  01-introduction/
    _meta.json          ← порядок и метаданные unit'ов
    u1-activation.mdx
    u2-four-shifts.mdx
    u3-clones.mdx
    u4-practice.mdx
  02-setup-guide/
    _meta.json
    u1-env-check.mdx
    u2-install.mdx
    u3-first-project.mdx
  03-prompt-engineering/
    _meta.json
    u1-activation.mdx
    u2-spec-formula.mdx
    u3-magic-words.mdx
    u4-sins.mdx
    u5-practice.mdx
  04-context-memory/
    _meta.json
    u1-activation.mdx
    u2-context-vs-prompt.mdx
    u3-memory.mdx
    u4-practice.mdx
  05-audio-pipeline/
    _meta.json
    u1-activation.mdx
    u2-pipeline-theory.mdx
    u3-build.mdx
    u4-reflect.mdx
  06-tools/
    _meta.json
    u1-activation.mdx
    u2-mcp.mdx
    u3-hooks.mdx
    u4-skills.mdx
    u5-practice.mdx
  00-kickstart/
    _meta.json
    u1-map.mdx
    u2-tools.mdx
    u3-first-steps.mdx
```

**Итого: 28 unit'ов**

### `_meta.json` format

```json
{
  "meeting": 1,
  "title": "Meeting 1: Знакомство",
  "description": "Software 3.0 и почему это меняет всё",
  "duration": "30 мин",
  "level": 1,
  "units": [
    { "slug": "u1-activation", "title": "Твой опыт с AI" },
    { "slug": "u2-four-shifts", "title": "Четыре сдвига" },
    { "slug": "u3-clones", "title": "Пять клонов" },
    { "slug": "u4-practice", "title": "Первый промпт" }
  ]
}
```

---

## MDX Unit Format

Каждый `.mdx`-файл unit'а использует frontmatter + четыре `<Phase>` компонента:

```mdx
---
title: "Четыре сдвига"
unit: 2
meeting: 1
duration: "10 мин"
---

<Phase type="activation">

Вспомни последний раз, когда ты давал задачу AI и результат тебя разочаровал.
Что именно пошло не так?

</Phase>

<Phase type="reflection">

Почему это произошло? Чего не хватало в запросе — контекста, роли, критериев успеха?

</Phase>

<Phase type="concept">

## Сдвиг 1: От команд → к делегированию

LLM — не калькулятор, это джуниор-коллега. Ему нужен контекст и цель, а не пошаговая инструкция...

</Phase>

<Phase type="practice">

Перепиши свой старый промпт используя структуру Role + Task + Output.
Сохрани в `my-experiments/u2-four-shifts.md`

</Phase>
```

**Правило:** blank line между тегом `<Phase>` и содержимым обязателен для корректного MDX-парсинга.

---

## User Flow

```
/lessons/01-introduction/
       ↓
MeetingIndex (client component)
  читает localStorage.unit_progress
       ↓
  редирект на первый незавершённый unit
       ↓
/lessons/01-introduction/u2-four-shifts/
       ↓
UnitWizard — Шаг 1/4: Активация
  [Далее →]
       ↓
UnitWizard — Шаг 2/4: Рефлексия
  [Далее →]
       ↓
UnitWizard — Шаг 3/4: Концепция
  [Далее →]
       ↓
UnitWizard — Шаг 4/4: Практика
  [Отметить пройденным ✓]
       ↓
localStorage.unit_progress обновляется
Sidebar перерисовывается (✓ на unit'е)
Показывается кнопка [Следующий unit →]
```

---

## Routing

| Роут | Файл | Назначение |
|------|------|-----------|
| `/lessons/[meeting]/` | `web/app/lessons/[meeting]/page.tsx` | Редирект на первый незавершённый unit |
| `/lessons/[meeting]/[unit]/` | `web/app/lessons/[meeting]/[unit]/page.tsx` | Unit-страница с wizard'ом |

Старый роут `/lessons/[slug]/page.tsx` заменяется вложенной структурой. Плоские файлы (exercises, cheatsheet, roadmap) остаются на `/lessons/[slug]/` без изменений — они не разбиваются на unit'ы.

---

## Components

### `<UnitWizard>` (новый)

**Файл:** `web/components/unit-wizard.tsx`

- `'use client'`
- Props: `phases: React.ReactNode[]`, `meetingSlug: string`, `unitSlug: string`
- State: `currentStep: number` (0–3), управляет какой Phase-блок видим
- Прогресс-бар: 4 сегмента, активный подсвечен `var(--text-accent)`
- Кнопка «Далее →» на шагах 0–2, «Отметить пройденным ✓» на шаге 3
- При нажатии «Отметить»: записывает в `localStorage.unit_progress`, вызывает `onComplete()`
- `onComplete`: показывает блок с кнопкой «Следующий unit →» (или «Встреча завершена» если последний)

### `<Phase>` (новый)

**Файл:** `web/components/phase.tsx`

- `'use client'`
- Props: `type: 'activation' | 'reflection' | 'concept' | 'practice'`, `children: React.ReactNode`
- Читает `currentStep` из `UnitWizardContext` (React context, предоставляется UnitWizard)
- Каждый тип фазы имеет фиксированный индекс: activation=0, reflection=1, concept=2, practice=3
- Рендерит `null` если `stepIndex !== currentStep`, иначе — label фазы + children
- UnitWizard оборачивает MDX-контент в `<UnitWizardContext.Provider value={{ currentStep, setCurrentStep }}>`

**Цвета по типу:**

| Тип | Цвет | Иконка |
|-----|------|--------|
| activation | `#00ff88` | ⚡ |
| reflection | `#00aaff` | 👁 |
| concept | `#ff9900` | 💡 |
| practice | `#ff44aa` | 🛠 |

### `UnitSidebar` (изменение `Sidebar`)

**Файл:** `web/components/sidebar.tsx`

- Добавить чтение `unit_progress` из localStorage в `useEffect`
- Для текущего meeting раскрывать unit'ы как вложенный список
- Каждый unit: `✓` (завершён, `var(--text-accent)`), `→` (текущий, белый), `○` (не начат, `var(--text-secondary)`)
- Unit'ы других meetings скрыты (раскрываются при переходе)

### `MeetingIndex` (новый)

**Файл:** `web/app/lessons/[meeting]/page.tsx`

- Серверный компонент: читает `_meta.json` meeting'а, получает список unit'ов
- Рендерит client-компонент `<MeetingRedirect units={units} meetingSlug={slug} />`
- `MeetingRedirect`: в `useEffect` читает `localStorage.unit_progress`, `router.replace()` на первый незавершённый unit (или u1 если прогресса нет)

### `content.ts` (изменение)

**Файл:** `web/lib/content.ts`

- Добавить `getMeetingMeta(slug)` — читает `_meta.json`
- Добавить `getUnitContent(meetingSlug, unitSlug)` — читает MDX + компилирует через `next-mdx-remote`
- Добавить `getAllMeetings()` — для статической генерации (`generateStaticParams`)

---

## localStorage Schema

```typescript
// ключ: "unit_progress"
type UnitProgress = {
  [meetingSlug: string]: {
    [unitSlug: string]: boolean
  }
}

// Пример:
{
  "01-introduction": {
    "u1-activation": true,
    "u2-four-shifts": true,
    "u3-clones": false
  },
  "02-setup-guide": {}
}
```

Существующий ключ `"os"` не затрагивается.

---

## Static Generation

Для `output: 'export'` необходим `generateStaticParams` в обоих роутах:

```typescript
// web/app/lessons/[meeting]/[unit]/page.tsx
export async function generateStaticParams() {
  const meetings = await getAllMeetings()
  return meetings.flatMap(m =>
    m.units.map(u => ({ meeting: m.slug, unit: u.slug }))
  )
}
```

---

## Kolb Cycle in Practice

Каждый unit обязан иметь все 4 фазы. Рекомендуемый объём:

| Фаза | Тип контента | Объём |
|------|-------------|-------|
| Activation | 1–2 вопроса, связывающих с личным опытом | 2–4 предложения |
| Reflection | Направляющий вопрос для осмысления | 2–4 предложения |
| Concept | Теория, модели, примеры кода | 50–200 строк MDX |
| Practice | Конкретное задание с путём сохранения | 3–8 строк |

---

## Migration Strategy

Старые плоские `.mdx`-файлы (`01-introduction.mdx` и т.д.) удаляются после того, как все unit'ы для данного meeting'а написаны и проверены. Миграция по meeting'ам, не все сразу.

**Порядок приоритета:**
1. M1 Introduction (самый посещаемый, активация критична)
2. M3 Prompt Engineering (сейчас дублирует M1, нуждается в реструктуризации)
3. M2 Setup Guide (функциональный, нужна activation)
4. M4, M5, M6

---

## Edge Cases

- **Learner очищает localStorage:** прогресс сбрасывается, redirect идёт на u1. Нормально.
- **Прямой URL на unit без прогресса:** открывается unit, wizard начинается с шага 0.
- **SSR/статическая сборка:** все `localStorage`-обращения в `useEffect` — нет ошибок при build.
- **Phase без wizard (future):** Phase-компонент работает и без UnitWizard как обычный styled div.

---

## What Is NOT in Scope

- Quiz или тест в конце unit'а — YAGNI
- Серверный прогресс (D1, база) — localStorage достаточно
- Email-уведомления о прогрессе — YAGNI
- Переписывание cheatsheet/roadmap/exercises под unit-формат — они не meeting'и
- Комментарии или обсуждения в unit'ах — YAGNI

---

## Files to Create / Modify

| Действие | Файл |
|----------|------|
| Создать | `web/components/unit-wizard.tsx` |
| Создать | `web/components/phase.tsx` |
| Создать | `web/app/lessons/[meeting]/page.tsx` |
| Создать | `web/app/lessons/[meeting]/[unit]/page.tsx` |
| Изменить | `web/components/sidebar.tsx` |
| Изменить | `web/components/mdx-components.tsx` (добавить Phase) |
| Изменить | `web/lib/content.ts` (новые функции) |
| Создать | `web/content/ru/01-introduction/_meta.json` + 4 MDX unit'а |
| Создать | `web/content/ru/02-setup-guide/_meta.json` + 3 MDX unit'а |
| Создать | `web/content/ru/03-prompt-engineering/_meta.json` + 5 MDX unit'а |
| Создать | `web/content/ru/04-context-memory/_meta.json` + 4 MDX unit'а |
| Создать | `web/content/ru/05-audio-pipeline/_meta.json` + 4 MDX unit'а |
| Создать | `web/content/ru/06-tools/_meta.json` + 5 MDX unit'а |
| Создать | `web/content/ru/00-kickstart/_meta.json` + 3 MDX unit'а |
| Удалить (после миграции) | `web/content/ru/0X-*.mdx` (плоские файлы) |
