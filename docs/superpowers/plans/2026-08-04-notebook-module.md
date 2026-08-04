# Notebook-pack (M1) + модуль 09-ai-notebook (M2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **Исполнители:** Codex — код/каркас (Tasks 1, 2, 5, 6); контроллер (Claude) — проза MDX (Tasks 3, 4), финальная верификация (Task 7) и ВСЕ git-коммиты.

**Goal:** страница `/notebook` (пакет для ИИ-тетрадки: паки источников + промпт-кит с обязательными цитатами + чек-лист верификации) и опциональный модуль курса `09-ai-notebook` с инверсией fast.ai (юнит 1 = рабочая тетрадка за 15 минут).

**Architecture:** канон курса engine+data — `lib/course/notebook-pack.ts` (`Bi{ru;en}` + resolver) → тонкий компонент → открытые страницы ×2 локали; модуль = MDX `content/{ru,en}/09-ai-notebook/` + швы (скины ×7, World Map, course-order). Ноль backend/LLM/ключей (prompt-emitter семья).

**Tech Stack:** Next.js 16 App Router (`output: 'export'`), MDX, Vitest, TypeScript strict.

**Spec:** `docs/superpowers/specs/2026-08-04-notebook-module-design.md`

## Time Estimate

| Task | Scope | Est |
|---|---|---|
| 1 | notebook-pack.ts engine+data+tests | 0:25–0:40 |
| 2 | компонент + маршруты + sitemap | 0:25–0:40 |
| 3 | проза RU 5 юнитов (контроллер) | 1:00–1:30 |
| 4 | проза EN зеркало (контроллер) | 0:40–1:00 |
| 5 | _meta ×2 + course-order + гварды | 0:20–0:30 |
| 6 | скин-паки ×7 + World Map + transformations | 0:25–0:40 |
| 7 | full suite + tsc + next build + смок | 0:15–0:25 |

Итого 3:30–5:25; GTE-калибровка тянет к нижней границе.

## Global Constraints

- Рабочий апп: `LMS/tochka-sborki/web/` (краткие пути `lib/`, `components/`, `app/`, `content/` — от него).
- Тесты: `cd LMS/tochka-sborki/web && npx vitest run` — все существующие (1268) остаются зелёными; `npx tsc --noEmit` обязателен (type-ошибки в `*.test.ts` vitest НЕ ловит).
- Копи: НИКАКОГО хардкода строк в компонентах — только `Bi{ru;en}` в `lib/course/*` или dictionaries; вся новая копи проходит `lintDehustle` (импорт из `@/lib/authoring/dehustle`).
- MDX inline array/object props НЕ работают (`next-mdx-remote@6`) — данные в `lib/`, string-props.
- Модуль 09 НЕ добавляется в `workers/src/lib/course-catalog.ts` (admission-гейт не трогаем).
- Коммиты — только контроллер, `git add` поимённо.

---

### Task 1 (Codex): `lib/course/notebook-pack.ts` + тест

**Files:**
- Create: `LMS/tochka-sborki/web/lib/course/notebook-pack.ts`
- Create: `LMS/tochka-sborki/web/lib/course/notebook-pack.test.ts`

**Interfaces (Produces):**
- `NotebookPack { id: string; icon: string; title: Bi; situation: Bi; sources: Bi; steps: Bi[] }`
- `PROMPT_KIT: NotebookPrompt[]` где `NotebookPrompt { id: string; label: Bi; prompt: Bi }`
- `VERIFY_CHECKLIST: Bi[]`
- `PACKS: NotebookPack[]` (ids: `youtube-playlist`, `lesson-sources`, `own-docs`)
- `resolveNotebookPack(id: string, locale: Locale): ResolvedNotebookPack | null` (null на неизвестный id)
- `resolvePromptKit(locale: Locale)`, `resolveChecklist(locale: Locale)`

- [ ] **Step 1: тест** (`notebook-pack.test.ts`):

```ts
import { describe, it, expect } from 'vitest'
import { PACKS, PROMPT_KIT, VERIFY_CHECKLIST, resolveNotebookPack, resolvePromptKit, resolveChecklist } from './notebook-pack'
import { lintDehustle } from '@/lib/authoring/dehustle'

const allBi = () => {
  const out: { ru: string; en: string }[] = []
  for (const p of PACKS) {
    out.push(p.title, p.situation, p.sources, ...p.steps)
  }
  for (const pr of PROMPT_KIT) out.push(pr.label, pr.prompt)
  out.push(...VERIFY_CHECKLIST)
  return out
}

describe('notebook-pack data', () => {
  it('обе локали заполнены у каждой строки', () => {
    for (const b of allBi()) {
      expect(b.ru.trim().length).toBeGreaterThan(0)
      expect(b.en.trim().length).toBeGreaterThan(0)
    }
  })
  it('копи чистая по lintDehustle', () => {
    for (const b of allBi()) {
      expect(lintDehustle(b.ru)).toEqual([])
      expect(lintDehustle(b.en)).toEqual([])
    }
  })
  it('три пака с ожидаемыми id', () => {
    expect(PACKS.map(p => p.id)).toEqual(['youtube-playlist', 'lesson-sources', 'own-docs'])
  })
  it('каждый промпт требует цитату с точкой в источнике', () => {
    for (const pr of PROMPT_KIT) {
      expect(pr.prompt.ru).toMatch(/цитат/i)
      expect(pr.prompt.en).toMatch(/quot/i)
    }
  })
  it('чек-лист верификации не короче 5 пунктов', () => {
    expect(VERIFY_CHECKLIST.length).toBeGreaterThanOrEqual(5)
  })
  it('resolver: локаль и fail-closed', () => {
    const r = resolveNotebookPack('youtube-playlist', 'en')
    expect(r?.title).toBeTruthy()
    expect(resolveNotebookPack('nope', 'ru')).toBeNull()
    expect(resolvePromptKit('ru').length).toBe(PROMPT_KIT.length)
    expect(resolveChecklist('en').length).toBe(VERIFY_CHECKLIST.length)
  })
})
```

- [ ] **Step 2: прогнать — падает** (`npx vitest run lib/course/notebook-pack.test.ts`).

- [ ] **Step 3: реализация.** Полная копи (использовать ДОСЛОВНО):

```ts
// web/lib/course/notebook-pack.ts
// Движок+данные страницы «Пакет тетрадки» (/notebook). Отображение — components/notebook-pack.tsx.
//
// Зачем: source-grounded тетрадка (Gemini Notebook, бывший NotebookLM, и класс инструментов
// вокруг) превращает кучу видео и PDF в конспект, где каждое утверждение кликабельно в точку
// источника. Курс НЕ ходит в LLM сам: страница собирает пакет — что положить, какие промпты
// дать, как проверить. Промпты работают и в обычном чате с приложенными файлами.
//
// Методологическое ядро: каждый промпт ТРЕБУЕТ цитату с точкой в источнике. Конспект без
// улик — пересказ; проверить пересказ нельзя. Мост к модулю 00/u4 «Первоисточник или упаковка».
import type { Locale } from '@/lib/intake/types'

interface Bi { ru: string; en: string }

export interface NotebookPrompt { id: string; label: Bi; prompt: Bi }

export interface NotebookPack {
  id: string
  icon: string
  title: Bi
  situation: Bi
  sources: Bi
  steps: Bi[]
}

export const PACKS: NotebookPack[] = [
  {
    id: 'youtube-playlist',
    icon: '🎬',
    title: { ru: 'Плейлист вместо вечера у экрана', en: 'A playlist instead of an evening of watching' },
    situation: {
      ru: 'Накопился плейлист докладов или обучающих роликов. Смотреть всё подряд — вечер; бросить — жалко.',
      en: 'A playlist of talks or tutorials has piled up. Watching it all takes an evening; dropping it feels like a waste.',
    },
    sources: {
      ru: 'Ссылки на ролики или весь плейлист. В тетрадке: «Добавить источник» → «YouTube» — по ссылке на каждый ролик. Тетрадка читает субтитры, а не смотрит видео: ролик без субтитров останется пустым источником.',
      en: 'Links to the videos or the whole playlist. In the notebook: "Add source" → "YouTube" — one link per video. The notebook reads subtitles, not the video itself: a video without subtitles stays an empty source.',
    },
    steps: [
      { ru: 'Собери ссылки роликов и добавь каждый источником в новую тетрадку.', en: 'Collect the video links and add each one as a source in a fresh notebook.' },
      { ru: 'Задай вопрос «О чём эти ролики расходятся между собой?» — расхождения интереснее пересказа.', en: 'Ask "Where do these videos disagree with each other?" — disagreements are more useful than a summary.' },
      { ru: 'Возьми из промпт-кита «Сравнение в таблицу» и «Вопросы с цитатами».', en: 'Take "Comparison table" and "Questions with citations" from the prompt kit.' },
      { ru: 'Пройди чек-лист верификации по двум-трём ответам, прежде чем верить конспекту.', en: 'Run the verification checklist on two or three answers before trusting the digest.' },
    ],
  },
  {
    id: 'lesson-sources',
    icon: '📚',
    title: { ru: 'Материалы юнита глубже', en: 'Going deeper on unit materials' },
    situation: {
      ru: 'Юнит курса даёт внешние первоисточники, а времени прочитать их целиком нет.',
      en: 'A course unit points to external primary sources, and there is no time to read them in full.',
    },
    sources: {
      ru: 'Ссылки из раздела «Материалы» юнита: статьи, документация, каталоги примеров. PDF можно загрузить файлом.',
      en: 'Links from the unit "Materials" section: articles, documentation, example catalogs. PDFs can be uploaded as files.',
    },
    steps: [
      { ru: 'Положи в тетрадку два-три первоисточника юнита — не пересказы о них.', en: 'Put two or three of the unit’s primary sources in the notebook — not retellings of them.' },
      { ru: 'Спроси: «Что здесь противоречит тому, как это обычно пересказывают?»', en: 'Ask: "What here contradicts the way this is usually retold?"' },
      { ru: 'Сгенерируй конспект с цитатами и сверь пару цитат кликом в источник.', en: 'Generate a digest with citations and spot-check a couple of them by clicking into the source.' },
    ],
  },
  {
    id: 'own-docs',
    icon: '🗂️',
    title: { ru: 'Свои документы под вопросы', en: 'Your own documents, questionable' },
    situation: {
      ru: 'Папка своих PDF, заметок или выгрузок, в которой давно никто не ориентируется.',
      en: 'A folder of your own PDFs, notes, or exports that nobody can navigate anymore.',
    },
    sources: {
      ru: 'Свои файлы: PDF, текст, таблицы. Личные данные остаются твоим решением — в тетрадку попадает только то, что ты сам загрузил.',
      en: 'Your own files: PDFs, text, spreadsheets. Personal data stays your call — the notebook only sees what you yourself upload.',
    },
    steps: [
      { ru: 'Выбери 5–10 документов одной темы и загрузи их источниками.', en: 'Pick 5–10 documents on one topic and upload them as sources.' },
      { ru: 'Спроси то, ради чего папку вообще открывал — своими словами, без «правильных» формулировок.', en: 'Ask the question you opened the folder for — in your own words, no "proper" phrasing.' },
      { ru: 'Потребуй цитату на каждый вывод; вывод без цитаты — кандидат на выдумку.', en: 'Demand a citation for every conclusion; a conclusion without one is a fabrication candidate.' },
    ],
  },
]

export const PROMPT_KIT: NotebookPrompt[] = [
  {
    id: 'compare-table',
    label: { ru: 'Сравнение в таблицу', en: 'Comparison table' },
    prompt: {
      ru: 'Сравни, как источники отвечают на вопрос [твой вопрос], таблицей: строка на источник, колонки — позиция, аргумент, цитата. В колонке «цитата» — дословная фраза из источника, не пересказ.',
      en: 'Compare how the sources answer [your question] in a table: one row per source, columns — position, argument, quote. The "quote" column must hold a verbatim phrase from the source, not a retelling.',
    },
  },
  {
    id: 'cited-answers',
    label: { ru: 'Вопросы с цитатами', en: 'Questions with citations' },
    prompt: {
      ru: 'Ответь на вопрос [твой вопрос] только по загруженным источникам. К каждому утверждению — цитата с указанием источника. Если в источниках ответа нет, скажи это прямо, не отвечай из общих знаний.',
      en: 'Answer [your question] using the uploaded sources only. Attach a source citation to every claim. If the sources do not contain the answer, say so directly — do not answer from general knowledge.',
    },
  },
  {
    id: 'audio-brief',
    label: { ru: 'Аудио-обзор с фокусом', en: 'Focused audio overview' },
    prompt: {
      ru: 'Сделай короткий аудио-обзор с фокусом на [трудная для тебя тема]. Пусть ведущие называют, из какого источника берут каждый тезис, — тезис без источника пропускай.',
      en: 'Create a short audio overview focused on [the topic you find hard]. Have the hosts name which source each point comes from — skip any point without a source.',
    },
  },
  {
    id: 'mind-map',
    label: { ru: 'Карта связей', en: 'Mind map' },
    prompt: {
      ru: 'Построй карту связей между [тема А] и [тема Б] по источникам. Для каждой связи укажи источник и цитату, на которой связь держится.',
      en: 'Build a mind map linking [topic A] and [topic B] from the sources. For every link, name the source and the quote the link rests on.',
    },
  },
  {
    id: 'slides',
    label: { ru: 'Слайды по источникам', en: 'Slides from sources' },
    prompt: {
      ru: 'Собери слайды по теме [тема] строго из загруженных источников. На каждом слайде — сноска: источник и цитата. Слайд без сноски убери.',
      en: 'Assemble slides on [topic] strictly from the uploaded sources. Every slide carries a footnote: source and quote. Remove any slide without one.',
    },
  },
]

export const VERIFY_CHECKLIST: Bi[] = [
  { ru: 'Кликни две-три цитаты: они обязаны вести в точку источника, где эта фраза действительно стоит.', en: 'Click two or three citations: they must land on the exact spot in the source where the phrase actually appears.' },
  { ru: 'Уверенный ответ без единой цитаты — пересказ. Переспроси с требованием цитат.', en: 'A confident answer with no citation at all is a retelling. Re-ask and demand citations.' },
  { ru: 'Числа и проценты сверяй с источником отдельно: именно на них пересказ чаще всего плывёт.', en: 'Check numbers and percentages against the source separately: that is where retellings drift most.' },
  { ru: 'Спроси о том, чего в источниках заведомо нет. Честный ответ — «в источниках этого нет», а не ответ из головы.', en: 'Ask about something you know is not in the sources. The honest reply is "the sources do not cover this," not an answer from memory.' },
  { ru: 'Вывод, который держится на одном источнике, не выдавай за консенсус — проверь, кто ещё это утверждает.', en: 'Do not pass off a single-source conclusion as consensus — check who else actually claims it.' },
  { ru: 'Ролик без субтитров — пустой источник: тетрадка «читала» не его, а свои общие знания.', en: 'A video without subtitles is an empty source: the notebook "read" its general knowledge, not the video.' },
]

export interface ResolvedNotebookPack {
  id: string
  icon: string
  title: string
  situation: string
  sources: string
  steps: { n: number; text: string }[]
}

export function resolveNotebookPack(id: string, locale: Locale): ResolvedNotebookPack | null {
  const p = PACKS.find(x => x.id === id)
  if (!p) return null
  return {
    id: p.id, icon: p.icon,
    title: p.title[locale], situation: p.situation[locale], sources: p.sources[locale],
    steps: p.steps.map((s, i) => ({ n: i + 1, text: s[locale] })),
  }
}

export function resolvePromptKit(locale: Locale) {
  return PROMPT_KIT.map(p => ({ id: p.id, label: p.label[locale], prompt: p.prompt[locale] }))
}

export function resolveChecklist(locale: Locale) {
  return VERIFY_CHECKLIST.map(b => b[locale])
}
```

- [ ] **Step 4: прогнать до зелени; затем `npx tsc --noEmit`.**
- [ ] **Step 5: контроллер коммитит** `feat(lms): notebook-pack engine+data (M1 Task 1)`.

---

### Task 2 (Codex): компонент + маршруты + sitemap

**Files:**
- Create: `LMS/tochka-sborki/web/components/notebook-pack.tsx`
- Create: `LMS/tochka-sborki/web/app/notebook/page.tsx`, `app/en/notebook/page.tsx`
- Modify: `LMS/tochka-sborki/web/lib/sitemap.ts` (добавить `/notebook` в publicPaths — по образцу `/try`)

**Interfaces:**
- Consumes: `resolveNotebookPack`, `resolvePromptKit`, `resolveChecklist`, `PACKS` из Task 1.
- Компонент — по образцу `components/try-chains.tsx` (найти и скопировать структуру: секции-карточки, copy-кнопки как в learn-with-AI, инлайн-стили как у соседей, `aria`-атрибуты у кнопок копирования).

- [ ] **Step 1:** посмотреть `components/try-chains.tsx` и `app/try/page.tsx` — снять фактическую структуру (metadata, layout-обёртка, как задаётся locale).
- [ ] **Step 2:** `notebook-pack.tsx` — server-компонент с `locale` prop: интро (что такое source-grounded тетрадка, Gemini Notebook как референс, «работает и в обычном чате»; копи из dictionaries НЕ нужна — всё в notebook-pack.ts, интро добавить туда же строками `INTRO: Bi[]` + тест на локали/dehustle), три пака, промпт-кит (каждый промпт в `<pre>` с copy-кнопкой `'use client'`-островком по образцу try-chains), чек-лист.
- [ ] **Step 3:** страницы `/notebook` + `/en/notebook` (metadata title/description ×2 локали, open — без гейта).
- [ ] **Step 4:** sitemap: оба пути; прогнать `npx vitest run lib/sitemap` + `sitemap-completeness`.
- [ ] **Step 5:** `npx vitest run && npx tsc --noEmit` — всё зелёное; `npx next build` собирается.
- [ ] **Step 6: контроллер коммитит** `feat(lms): /notebook страница пакета тетрадки (M1 Task 2)`.

---

### Task 3 (контроллер): проза RU модуля `09-ai-notebook`

**Files:** Create `content/ru/09-ai-notebook/{_meta.json,u1-first-notebook.mdx,u2-how-it-works.mdx,u3-where-it-lies.mdx,u4-formats.mdx,u5-practice.mdx}`

Контент-биты по юнитам — из спека §3 (инверсия #102: u1 = тетрадка за 15 минут ДО теории; u2 source-grounding/транскрипты; u3 = VERIFY_CHECKLIST в действии + мост к 00/u4-sources; u4 форматы и когда какой честнее; u5 практика под нишу). Каждый юнит: frontmatter как у соседей (см. `content/ru/00-kickstart/u4-sources.mdx`), 4-Phase структура, activation/reflection БЕЗ «запиши/опиши», ссылка u1 → `/notebook`, «если тетрадки нет» — путь через чат с файлами. ≥400 слов на юнит.

---

### Task 4 (контроллер): EN зеркало

**Files:** Create `content/en/09-ai-notebook/*` — зеркало Task 3 (перевод, не подстрочник; та же структура/frontmatter/слаги).

---

### Task 5 (Codex): `_meta.json` ×2 + course-order + гварды зелёные

**Files:**
- `_meta.json` уже созданы в Task 3/4 — сверить формат с `00-kickstart/_meta.json` (`module: 9, title: "AI-тетрадка" / "AI Notebook", level, duration, units[]`).
- Modify: `LMS/tochka-sborki/web/lib/course-order.ts` — добавить `09-ai-notebook` в конец.
- НЕ трогать: `workers/src/lib/course-catalog.ts` (admission), `macro-phases.ts`.

- [ ] Прогнать: `npx vitest run lib/content` (registry-integrity, links-integrity, sitemap-completeness) — новый модуль подхвачен, ссылка на `/notebook` валидна.
- [ ] `npx vitest run && npx tsc --noEmit` целиком.
- [ ] Контроллер коммитит `feat(lms): модуль 09-ai-notebook — контент+wiring (M2 Tasks 3-5)`.

---

### Task 6 (Codex): скин-паки ×7 + World Map + transformations

**Files:**
- Modify: `lib/rpg/skins/*.json` (все 7) — framing юнитов модуля 09 в голосе каждого скина (образец: как оформлен `u4-sources` в каждом паке; краткие переименования юнитов, БЕЗ новых механик).
- Modify: `lib/rpg/map-layout.ts` — зона модуля 09 (по образцу соседних зон).
- Modify: `lib/rpg/transformations.ts` — micro from→to модуля 09 (например ru: «смотрю часами → извлекаю с уликами»; en: "watch for hours → extract with evidence"; сверить стиль с соседями).

- [ ] Прогнать существующие rpg-тесты + полный сьют + tsc.
- [ ] Контроллер коммитит `feat(lms): модуль 09 в скинах, World Map, transformations (M2 Task 6)`.

---

### Task 7 (контроллер): финальная верификация

- [ ] `npx vitest run` (все), `npx tsc --noEmit`, `npx next build` — зелёные.
- [ ] Глазами: `/notebook` ru+en рендер (next build output или dev), модуль 09 в syllabus, World Map зона, юнит u1 открывается, ссылка на /notebook работает.
- [ ] Коммит остатков, push → CI (job deploy-web по path-фильтру).

## Self-Review
- Spec coverage: M1 паки/промпт-кит/чек-лист/страницы/sitemap (T1-T2); M2 юниты с инверсией (T3-T4), швы _meta/order/скины/карта (T5-T6), COURSE_CATALOG не тронут (T5 явно), верификация (T7). Инвариант «промпт требует цитату» под тестом (T1).
- Types: `Bi`/`Locale` как в try-chains; resolver-имена согласованы между T1 и T2.
- Placeholders: код и копи T1 даны дословно; T3/T4 — контроллерские (биты из спека, исполняет автор прозы, не контекстно-слепой имплементер).
