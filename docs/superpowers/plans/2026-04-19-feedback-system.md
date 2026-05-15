# Feedback System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить структурированную NPS + JTBD feedback-петлю в MDS_AI_COURSE (8 модулей) через two-layer систему: student layer (my-experiments/) + author layer (course-feedback/).

**Architecture:** Два слоя петли. Student заполняет Light-feedback после каждого Meeting (NPS + 2 JTBD) и Deep JTBD после всего курса. Author копирует opt-in submissions в `course-feedback/submissions/`, затем просит Claude Code сгенерировать digest по `TEMPLATE.md`. Digest ранжирует action items с file:line ссылками → автор правит модули.

**Tech Stack:** Markdown. Никакого кода, никаких тестов. "Тест" = read-after-write + структурная проверка ссылок.

**Spec:** `docs/superpowers/specs/2026-04-19-feedback-system-design.md`

---

## File Structure

### New files (5)

| Path | Responsibility |
| :--- | :------------- |
| `my-templates/feedback-template.md` | Light-feedback template (NPS + 2 JTBD + 1 change-suggestion), ~3–5 мин |
| `my-templates/feedback-final-jtbd.md` | Deep JTBD interview (10 секций: Push/Pull/Anxieties/Habits + before-after + NPS rollup) |
| `course-feedback/README.md` | Документация author layer: структура, loop, privacy rules, digest trigger |
| `course-feedback/digests/TEMPLATE.md` | Структура digest-отчёта (7 секций: NPS, Friction, Wins, Forces, Before/After, Action Items, Non-Actions) |
| `course-feedback/submissions/example-sky-fox-lantern-m1.md` | Демо-пример заполненного light-feedback |

### Modified files (11)

| Path | Change |
| :--- | :----- |
| `00-kickstart.md` | Pointer блок в конец (light, m0) |
| `01-introduction.md` | Pointer блок в конец (light, m1) |
| `02-setup-guide.md` | Pointer блок в конец (light, m2) |
| `03-prompt-engineering.md` | Pointer блок в конец (light, m3) |
| `04-context-memory.md` | Pointer блок в конец (light, m4) |
| `05-audio-pipeline.md` | Pointer блок в конец (light, m5) |
| `06-tools.md` | Pointer блок в конец (light, m6) |
| `EXERCISES.md` | Pointer блок в конец (final-jtbd) |
| `INDEX.md` | Навигация: quick-start список + file tree + quick reference |
| `README.md` | Упоминание feedback-системы в структуре курса |
| `CLAUDE.md` | Новые файлы + course-feedback/ в структуре |

---

## Task Granularity

Задачи группируются по слоям: сначала шаблоны (student + author), потом pointer'ы в модули, потом навигация. Это даёт логические commit boundaries.

**Commit policy:** каждая Task = один commit. Если MDS_AI_COURSE — не git-репо, steps "Commit" пропускаются (но не меняют остальное).

---

## Task 1: Student Light Template

**Files:**
- Create: `my-templates/feedback-template.md`

- [ ] **Step 1.1: Write file**

Path: `my-templates/feedback-template.md`

```markdown
---
meeting: m<N>
date: YYYY-MM-DD
anon_id: <3-словное имя, напр. sky-fox-lantern>
---

# Feedback: Meeting <N>

> Время заполнения: 3–5 минут. После — (опционально) скопируй анонимизированную версию в `course-feedback/submissions/<anon_id>-m<N>.md`.

## NPS

Насколько вероятно, что ты порекомендуешь **этот конкретный модуль** коллеге/другу с таким же бэкграундом?

**0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9 — 10**

→ Твой ответ:

## JTBD-Pull (что сработало)

Какую **конкретную задачу** ты хотел решить, начиная этот модуль — и на сколько он её закрыл? (1–2 предложения)

→

## JTBD-Friction (что мешало)

Где ты **застрял, сомневался или хотел бросить**? Что именно — материал, формулировка, инструмент, твой контекст, время дня? (1–2 предложения)

→

## Одно изменение

Если бы ты мог изменить **одну вещь** в этом модуле — что это?

→

---

**Как использовать:**
1. Скопируй этот файл в `my-experiments/feedback-m<N>.md`
2. Заполни frontmatter (meeting, date, anon_id)
3. Ответь на 4 секции
4. (опционально) Скопируй анонимизированную версию в `course-feedback/submissions/<anon_id>-m<N>.md` — твой сигнал в общий digest
```

- [ ] **Step 1.2: Verify by reading**

Run: `Read my-templates/feedback-template.md`

Expected: файл создан, frontmatter с `meeting/date/anon_id`, 4 секции (NPS, JTBD-Pull, JTBD-Friction, Одно изменение), инструкция копирования в конце.

- [ ] **Step 1.3: Commit (if git)**

```bash
git add my-templates/feedback-template.md
git commit -m "feat(feedback): add light per-module feedback template"
```

---

## Task 2: Student Deep JTBD Template

**Files:**
- Create: `my-templates/feedback-final-jtbd.md`

- [ ] **Step 2.1: Write file**

Path: `my-templates/feedback-final-jtbd.md`

```markdown
---
course: MDS_AI_COURSE
completed_date: YYYY-MM-DD
anon_id: <тот же nickname, что в light-feedback'ах>
---

# Deep JTBD Interview: MDS_AI_COURSE

> Время заполнения: 20–30 минут. Это финальная рефлексия по всему курсу через призму Jobs-to-be-Done: 4 силы (Push / Pull / Anxieties / Habits) + before/after + ранжирование правок.
>
> Заполняется **один раз в конце курса** (после EXERCISES.md). Не раньше.

## 1. Push — что толкнуло

Когда ты **впервые** подумал "мне нужно освоить Claude Code / агентное программирование"? Что именно произошло в тот момент?

→

## 2. Pull — что притянуло

Что ты **надеялся** получить, начиная курс? Не фичи курса, а состояние **твоей** жизни/работы после.

→

## 3. Anxieties — что пугало

Что тебя **останавливало** от старта? Какие страхи были? Какие из них оказались обоснованными, какие — нет?

→

## 4. Habits — что продолжало тянуть назад

Какие **старые привычки работы** мешали освоить новый подход? (например, писать код вручную, командовать вместо делегирования, не вести память)

→

## 5. Before / After

| Область                            | До курса | После курса |
| :--------------------------------- | :------- | :---------- |
| Как я формулирую задачу агенту     |          |             |
| Сколько я делегирую vs делаю сам   |          |             |
| Моя система памяти (CLAUDE/TODO)   |          |             |
| Автоматизации в моей жизни         |          |             |
| Уверенность в vibe coding подходе  |          |             |

## 6. Surprise

Что **удивило** — в хорошую или плохую сторону? То, чего ты не ожидал?

→

## 7. Recommend

Кому конкретно ты **уже** порекомендовал или собираешься порекомендовать этот курс? **Почему именно им** — что в их ситуации делает курс применимым?

→

## 8. Критические правки

Если бы ты стал co-автором курса на один день — какие **3 изменения** внёс бы первыми? Конкретные Meeting / файлы / формулировки.

1.
2.
3.

## 9. Модульный NPS (перенеси из light-feedback'ов)

| Meeting          | NPS | Ключевой friction |
| :--------------- | :-- | :---------------- |
| m0 (kickstart)   |     |                   |
| m1 (intro)       |     |                   |
| m2 (setup)       |     |                   |
| m3 (prompting)   |     |                   |
| m4 (context)     |     |                   |
| m5 (pipeline)    |     |                   |
| m6 (tools)       |     |                   |
| EXERCISES        |     |                   |

## 10. Курсовой NPS

Общий NPS за весь курс:

**0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9 — 10**

→ Твой ответ:

---

**Как использовать:**
1. Скопируй в `my-experiments/feedback-final.md`
2. Заполни (20–30 мин, лучше в один заход)
3. (опционально) Скопируй анонимизированную версию в `course-feedback/submissions/<anon_id>-final.md`
```

- [ ] **Step 2.2: Verify by reading**

Run: `Read my-templates/feedback-final-jtbd.md`

Expected: 10 секций в порядке: Push → Pull → Anxieties → Habits → Before/After → Surprise → Recommend → Критические правки → Модульный NPS → Курсовой NPS. Таблицы корректные.

- [ ] **Step 2.3: Commit (if git)**

```bash
git add my-templates/feedback-final-jtbd.md
git commit -m "feat(feedback): add deep JTBD interview template"
```

---

## Task 3: Author Layer Infrastructure

**Files:**
- Create: `course-feedback/README.md`
- Create: `course-feedback/digests/TEMPLATE.md`
- Create: `course-feedback/submissions/example-sky-fox-lantern-m1.md`

- [ ] **Step 3.1: Write course-feedback/README.md**

Path: `course-feedback/README.md`

```markdown
# 📊 Course Feedback System

Это **авторский слой** feedback-петли MDS_AI_COURSE. Студенческие feedback'и приземляются сюда → агент генерирует digest → автор обновляет модули.

## Структура

```
course-feedback/
├── submissions/    — raw feedback от студентов (1 файл = 1 feedback)
│   ├── <anon-id>-m0.md
│   ├── <anon-id>-m1.md
│   └── <anon-id>-final.md
├── digests/        — синтез-отчёты агента (1 файл = 1 цикл)
│   └── YYYY-MM-DD-digest.md
│   └── TEMPLATE.md — структура отчёта
└── README.md       — этот файл
```

## Как feedback попадает в submissions/

На старте MDS_AI_COURSE в single-author демо-режиме механизм сбора **упрощён**: автор вручную кладёт присланные feedback'и в `submissions/`.

Production-варианты (на выбор автора, out of scope текущего демо):
- GitHub Issues с тегом `feedback` → export script
- Google Form → CSV → md-конвертер
- Private Git branch от студентов + merge

## Как запустить digest-цикл

Попроси Claude Code во время рабочей сессии:

> Сгенерируй feedback digest по `course-feedback/submissions/`.
> Используй структуру `course-feedback/digests/TEMPLATE.md`.
> Сохрани в `course-feedback/digests/YYYY-MM-DD-digest.md`.

Агент:
1. Читает все файлы в `submissions/`
2. Агрегирует NPS per module
3. Кластеризует friction points и wins
4. Синтезирует JTBD Forces из final-интервью
5. Ранжирует action items по impact × частота
6. Сохраняет digest по шаблону

## Loop

```
submissions/ ──▶ агент ──▶ digest ──▶ автор решает ──▶ Meeting-правки
     ▲                                                          │
     └──────────────── новые feedback'и ◀──────────────────────┘
```

## Privacy rules

- **anon_id** — 3-словный nickname, не PII. Студент генерирует сам.
- **Pre-merge review:** автор удаляет любые имена/компании/уникальные проекты из submissions/ перед commit.
- **Digests** — только агрегированные инсайты. Никаких цитат, идентифицирующих студента.
- **Non-Actions раздел** в digest — защита от карго-культа: не все предложения берутся, отклонённые фиксируются с обоснованием.
```

- [ ] **Step 3.2: Write course-feedback/digests/TEMPLATE.md**

Path: `course-feedback/digests/TEMPLATE.md`

```markdown
---
date: YYYY-MM-DD
submissions_analyzed: <N>
period: YYYY-MM-DD → YYYY-MM-DD
previous_digest: <path или "none">
---

# Feedback Digest — YYYY-MM-DD

## 1. NPS по модулям

| Meeting          | N  | Promoters | Passives | Detractors | NPS  | Δ vs prev |
| :--------------- | :- | :-------- | :------- | :--------- | :--- | :-------- |
| m0 (kickstart)   |    |           |          |            |      |           |
| m1 (intro)       |    |           |          |            |      |           |
| m2 (setup)       |    |           |          |            |      |           |
| m3 (prompting)   |    |           |          |            |      |           |
| m4 (context)     |    |           |          |            |      |           |
| m5 (pipeline)    |    |           |          |            |      |           |
| m6 (tools)       |    |           |          |            |      |           |
| EXERCISES        |    |           |          |            |      |           |
| **Course total** |    |           |          |            |      |           |

**Формула NPS:** %Promoters (9–10) − %Detractors (0–6). Passives (7–8) не учитываются.

## 2. Top Friction Points

Кластеры жалоб. Каждый кластер: модуль / тема / частота / анонимные цитаты / предлагаемая правка со ссылкой на файл:строку.

### m<N> — "<название кластера>"

- **Частота:** X из Y submissions упоминают
- **Суть:** <1 предложение>
- **Цитаты** (анон):
  - "..."
  - "..."
- **Предлагаемая правка:** `<file>:<line>` — <что менять и как>

## 3. Top Wins

Что работает. НЕ трогать. Защищать от регрессий при правках.

### m<N> — "<что сработало>"

- **Частота:** X из Y
- **Почему сработало (гипотеза):** <объяснение>
- **Защитить:** <что именно не убирать, не переформулировать>

## 4. JTBD Forces (из final-интервью)

| Сила       | Доминирующие паттерны (из N final-submissions)       |
| :--------- | :-------------------------------------------------- |
| Push       | <что толкнуло студентов начать курс>                |
| Pull       | <какого состояния они хотели достичь>               |
| Anxieties  | <чего боялись, обоснованно/нет>                     |
| Habits     | <какие старые привычки мешали>                      |

## 5. Before / After — агрегированный

Качественный summary изменений по ключевым областям (3–5 предложений).

## 6. Action Items (ранжировано по impact × частота)

- [ ] **P1:** <правка> — `<file>:<line>` — <обоснование: N detractors упомянули это>
- [ ] **P1:** <правка>
- [ ] **P2:** <правка>
- [ ] **P3:** <правка>

## 7. Non-Actions

Предложения студентов, которые **не** берём. С обоснованием.

- "<предложение>" — **отклонено:** <причина: противоречит scope / редкое / снижает качество>

---

## Follow-up checkpoint

При следующем digest-цикле проверить, улучшились ли NPS по модулям с P1-правками. Если нет — пересмотреть подход к правке.

**Previous digest action items status:**

- [ ] P1 from <date>: <итог — сделано / в работе / отменено>
- [ ] ...
```

- [ ] **Step 3.3: Write course-feedback/submissions/example-sky-fox-lantern-m1.md**

Path: `course-feedback/submissions/example-sky-fox-lantern-m1.md`

```markdown
---
meeting: m1
date: 2026-04-17
anon_id: sky-fox-lantern
---

# Feedback: Meeting 1 (пример)

> **Это демо-пример** заполненного light-feedback. Реальные submissions приходят от студентов через opt-in механизм (см. `../README.md`).

## NPS

**0 — 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — **9** — 10**

→ Твой ответ: **9**

## JTBD-Pull (что сработало)

Хотел понять, в чём принципиальная разница между "использовать LLM как калькулятор" и реальным делегированием. Четыре сдвига закрыли это с первого прочтения — особенно From результат → к эксперименту. Ушло главное непонимание.

## JTBD-Friction (что мешало)

Секция про 5 типов клонов (Communication / Meeting Intelligence / ...) ощутилась вставленной. Логика до неё была линейная, а там вдруг таблица из другой методологии. Перечитал дважды, чтобы понять, зачем это здесь.

## Одно изменение

Дал бы явный мостик между "четыре сдвига" и "пять клонов": одно предложение типа "Клоны — это то, куда приходят эти четыре сдвига в реальной жизни: каждый клон = один применённый сдвиг". Сейчас связи нет.
```

- [ ] **Step 3.4: Verify all three files**

Run (sequential):
```
Read course-feedback/README.md
Read course-feedback/digests/TEMPLATE.md
Read course-feedback/submissions/example-sky-fox-lantern-m1.md
```

Expected: все три файла существуют, README содержит диаграмму loop'а и privacy rules, TEMPLATE имеет 7 секций + follow-up, example заполнен (NPS=9, все 4 поля).

- [ ] **Step 3.5: Commit (if git)**

```bash
git add course-feedback/
git commit -m "feat(feedback): add author layer (course-feedback/) with README, digest template, and example submission"
```

---

## Task 4: Add Pointer Blocks to Meeting Files

**Files:**
- Modify: `00-kickstart.md`
- Modify: `01-introduction.md`
- Modify: `02-setup-guide.md`
- Modify: `03-prompt-engineering.md`
- Modify: `04-context-memory.md`
- Modify: `05-audio-pipeline.md`
- Modify: `06-tools.md`
- Modify: `EXERCISES.md`

Каждый Meeting получает **одинаковый** 3-строчный блок, меняется только `<N>`. EXERCISES получает variant со ссылкой на final-jtbd.

- [ ] **Step 4.1: Identify anchor for each file**

Для каждого из 8 файлов найти последнюю осмысленную секцию-якорь. Обычно это "**Готов к Meeting N+1? Перейди к ...**" или "**Быстрая справка:**". Pointer вставляется **перед** этим якорем (чтобы feedback шёл перед переходом к следующему модулю).

Run:
```
Grep pattern="Готов к Meeting|Быстрая справка:" path="." -n
```

Зафиксировать для каждого файла строку якоря. Если якоря нет — pointer идёт в самый конец файла.

- [ ] **Step 4.2: Add pointer to `00-kickstart.md`**

Template для m0 (light):

```markdown
---

## 📊 Feedback после Meeting 0

Перед переходом к Meeting 1 — заполни `my-experiments/feedback-m0.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

Вставить **перед** найденным якорем в Step 4.1 (или в конец файла, если якоря нет).

- [ ] **Step 4.3: Add pointer to `01-introduction.md`**

Template для m1 (light) — идентичен Step 4.2, но `Meeting 0` → `Meeting 1`, `feedback-m0.md` → `feedback-m1.md`, "Meeting 1" → "Meeting 2" в переходе:

```markdown
---

## 📊 Feedback после Meeting 1

Перед переходом к Meeting 2 — заполни `my-experiments/feedback-m1.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

Вставить перед якорем.

- [ ] **Step 4.4: Add pointer to `02-setup-guide.md`**

Template для m2:

```markdown
---

## 📊 Feedback после Meeting 2

Перед переходом к Meeting 3 — заполни `my-experiments/feedback-m2.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

- [ ] **Step 4.5: Add pointer to `03-prompt-engineering.md`**

Template для m3:

```markdown
---

## 📊 Feedback после Meeting 3

Перед переходом к Meeting 4 — заполни `my-experiments/feedback-m3.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

- [ ] **Step 4.6: Add pointer to `04-context-memory.md`**

Template для m4:

```markdown
---

## 📊 Feedback после Meeting 4

Перед переходом к Meeting 5 — заполни `my-experiments/feedback-m4.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

- [ ] **Step 4.7: Add pointer to `05-audio-pipeline.md`**

Template для m5:

```markdown
---

## 📊 Feedback после Meeting 5

Перед переходом к Meeting 6 — заполни `my-experiments/feedback-m5.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

- [ ] **Step 4.8: Add pointer to `06-tools.md`**

Template для m6 (последний Meeting перед EXERCISES):

```markdown
---

## 📊 Feedback после Meeting 6

Перед переходом к EXERCISES — заполни `my-experiments/feedback-m6.md` (скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).

Это делает курс самосовершенствующимся: твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) и помогает автору улучшать модули.

---
```

- [ ] **Step 4.9: Add pointer to `EXERCISES.md` (final variant)**

Template для EXERCISES — другой! Ведёт на deep JTBD:

```markdown
---

## 📊 Финальный feedback: Deep JTBD Interview

После выполнения упражнений — заполни `my-experiments/feedback-final.md` (скопируй из [`my-templates/feedback-final-jtbd.md`](./my-templates/feedback-final-jtbd.md), 20–30 мин).

Это глубокая рефлексия по всему курсу через 4 силы JTBD (Push / Pull / Anxieties / Habits) + before/after + ранжирование правок. Твой сигнал (опционально, анонимно) идёт в [`course-feedback/`](./course-feedback/) как ключевой вход для эволюции курса.

---
```

Вставить перед последним якорем (обычно "**Быстрая справка:** [CHEATSHEET.md]...").

- [ ] **Step 4.10: Verify all 8 files**

Run:
```
Grep pattern="Feedback после Meeting|Финальный feedback" path="." -n
```

Expected: 8 матчей — по одному в каждом из 7 Meeting-файлов + 1 в EXERCISES.md.

- [ ] **Step 4.11: Commit (if git)**

```bash
git add 00-kickstart.md 01-introduction.md 02-setup-guide.md 03-prompt-engineering.md 04-context-memory.md 05-audio-pipeline.md 06-tools.md EXERCISES.md
git commit -m "feat(feedback): add pointer blocks to all 8 modules"
```

---

## Task 5: Update Navigation Files

**Files:**
- Modify: `INDEX.md`
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 5.1: Update `INDEX.md` — file tree**

Найти блок с file tree (`MDS_AI_COURSE/` ... ``` контур дерева). Добавить две вещи:

1. В `my-templates/` после `automation-recipes.md` добавить:

```
    ├── 📄 feedback-template.md     ← Light feedback (NPS + JTBD) после каждого Meeting
    ├── 📄 feedback-final-jtbd.md   ← Deep JTBD interview после курса
```

2. Перед закрывающим ``` (в корне дерева) добавить:

```
├── 📁 course-feedback/             ← Авторский слой feedback-петли
│   ├── 📄 README.md                ← Как работает loop
│   ├── 📁 submissions/             ← Raw feedback от студентов
│   └── 📁 digests/                 ← Агент-сгенерированные отчёты
│       └── 📄 TEMPLATE.md          ← Структура digest-отчёта
│
├── 📁 docs/superpowers/            ← Spec + plan документы
│
```

- [ ] **Step 5.2: Update `INDEX.md` — quick reference**

Найти секцию `## 📞 Быстрая справка` с таблицей `| Нужна информация... | Открой файл |`. Добавить строки **перед** `| Практические упражнения? | EXERCISES.md |`:

```
| Как оставить feedback после модуля? | my-templates/feedback-template.md |
| Финальное JTBD-интервью? | my-templates/feedback-final-jtbd.md |
| Как работает author feedback loop? | course-feedback/README.md |
```

- [ ] **Step 5.3: Update `INDEX.md` — стартовый список**

Найти нумерованный список "Новичок? Вот твой путь:". После последней строки (`| [CHEATSHEET.md]...`) добавить:

```
13. [course-feedback/README.md](./course-feedback/README.md) - 📊 Feedback loop курса (опционально, для автора/вдумчивых студентов)
```

- [ ] **Step 5.4: Update `README.md`**

Найти секцию `## 📚 Структура курса`. После `### [Шпаргалка (Cheat Sheet)](./CHEATSHEET.md)` блока добавить:

```
### [📊 Feedback System](./course-feedback/README.md)
Two-layer NPS + JTBD loop: light feedback после каждого Meeting + deep JTBD в конце. Делает курс самообновляющимся через структурированные сигналы от студентов.
```

- [ ] **Step 5.5: Update `CLAUDE.md`**

Найти блок структуры (``` с `00-kickstart.md — ...`). После строки `my-templates/           — Шаблоны для работы` добавить:

```
course-feedback/        — Author layer feedback-петли (submissions/, digests/, README)
docs/superpowers/       — Spec'ы и планы (brainstorming, writing-plans)
```

- [ ] **Step 5.6: Verify navigation**

Run:
```
Grep pattern="course-feedback|feedback-template|feedback-final-jtbd" path="INDEX.md" -n
Grep pattern="Feedback System|course-feedback" path="README.md" -n
Grep pattern="course-feedback|docs/superpowers" path="CLAUDE.md" -n
```

Expected:
- INDEX.md: минимум 5 матчей (file tree × 2, quick ref × 3, стартовый список × 1)
- README.md: 2 матча
- CLAUDE.md: 2 матча

- [ ] **Step 5.7: Commit (if git)**

```bash
git add INDEX.md README.md CLAUDE.md
git commit -m "docs(feedback): update navigation (INDEX, README, CLAUDE) with feedback system references"
```

---

## Final Verification

- [ ] **Step F.1: Check all new files exist**

Run: `Glob pattern="{my-templates/feedback-*.md,course-feedback/**/*.md}"`

Expected 5 files:
- `my-templates/feedback-template.md`
- `my-templates/feedback-final-jtbd.md`
- `course-feedback/README.md`
- `course-feedback/digests/TEMPLATE.md`
- `course-feedback/submissions/example-sky-fox-lantern-m1.md`

- [ ] **Step F.2: Check pointer consistency**

Run:
```
Grep pattern="Feedback после Meeting \d|Финальный feedback" path="." -n --output_mode=content
```

Expected: 8 матчей, формат одинаковый (только номер Meeting меняется + EXERCISES — другой variant).

- [ ] **Step F.3: Check all cross-links resolve**

Run (manual review):
- Откр `my-templates/feedback-template.md` — ссылки работают?
- Откр `course-feedback/README.md` — ссылки на TEMPLATE.md работают?
- Pointer в `01-introduction.md` — ссылка на `my-templates/feedback-template.md` корректная относительно Meeting-файла?

Expected: все links resolvable.

- [ ] **Step F.4: Success criteria check против spec**

Open: `docs/superpowers/specs/2026-04-19-feedback-system-design.md` → секция "Success Criteria".

Прогнать каждый пункт вручную:
- [ ] Студент может заполнить light за 5 мин без вопросов (read template → cohesive? да/нет)
- [ ] Deep JTBD даёт 4-forces портрет (10 секций есть, Push/Pull/Anxieties/Habits явно выделены? да/нет)
- [ ] Digest структурно корректен для 5–10 submissions (TEMPLATE.md покрывает NPS + кластеры + actions? да/нет)
- [ ] Каждое action item в digest имеет file:line (TEMPLATE требует этого явно? да/нет)
- [ ] Privacy: digest не содержит identifying info (есть правило в README + Non-Actions? да/нет)
- [ ] Pointer блоки не засоряют (3 строки, одинаковые? да/нет)

Если любой пункт "нет" — вернуться к релевантной Task и доработать.

---

## Execution Notes

- **Git repo status:** Если MDS_AI_COURSE не git-репо, все "Commit" шаги пропускаются без последствий для остального плана.
- **Порядок Tasks важен:** Task 4 и 5 ссылаются на файлы, создаваемые в Tasks 1–3. Не запускать параллельно.
- **Inside-task порядок шагов гибкий:** в Task 4 (pointers) 7 почти идентичных шагов — можно batch'ить в один проход, если executor умеет.
- **YAGNI check:** никаких feedback-сборщиков, dashboards, multi-language variants в этом плане. Только шаблоны + pointer'ы + навигация.
