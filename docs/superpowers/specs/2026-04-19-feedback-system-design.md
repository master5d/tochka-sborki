# Design Spec: Feedback System for MDS_AI_COURSE

**Date:** 2026-04-19
**Status:** Approved — ready for implementation plan
**Author:** Via brainstorming session

---

## Goal

Добавить структурированную feedback-петлю в курс MDS_AI_COURSE (8 модулей: Meeting 0–6 + EXERCISES) так, чтобы курс становился **самообновляющимся и самосовершенствующимся**.

Методологическая база:
- **NPS (Net Promoter Score)** — численный сигнал на каждый модуль
- **Advanced JTBD Interview** (Push / Pull / Anxieties / Habits forces) — качественный разбор в конце курса

---

## Architecture: Two-Layer Feedback Loop

```
┌─ Student Layer (my-experiments/) ──────────────┐
│                                                 │
│ После каждого Meeting N:                       │
│   feedback-template.md → feedback-m<N>.md      │
│   (NPS + 2 JTBD вопроса + 1 change-suggestion) │
│                                                 │
│ После всего курса:                             │
│   feedback-final-jtbd.md → feedback-final.md   │
│   (Push/Pull/Anxieties/Habits, before/after,   │
│    surprise, recommend, top-3 правки)          │
│                                                 │
└─────────────────────────────────────────────────┘
                     │ opt-in
                     │ (демо-режим: manual copy;
                     │  production: на усмотрение автора)
                     ▼
┌─ Author Layer (course-feedback/) ──────────────┐
│                                                 │
│ submissions/  ← raw feedback файлы             │
│ digests/      ← агент-сгенерированные отчёты   │
│ README.md     ← объясняет систему              │
│                                                 │
│ /feedback-digest (Claude Code command):        │
│   submissions/ → digest.md                      │
│   - NPS trends per module                      │
│   - Top friction clusters                      │
│   - Top wins                                   │
│   - Ranked action items с file:line ссылками   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Ключевые решения

| # | Решение | Обоснование |
| :- | :------ | :---------- |
| 1 | Two-layer (student + author) | "Самосовершенствующийся" требует двух петель: личная рефлексия + курсовая эволюция |
| 2 | Adaptive depth (Light per module + Deep final) | Light 3–5 мин × 8 = ~30 мин за курс → низкий drop-off. Deep JTBD собирает forces в один проход в конце |
| 3 | Hybrid автоматизация: agent generates digest, author decides | Структурирует сигнал без риска стиле-дрейфа курса |
| 4 | Local-only demo сейчас | Упрощаем: фиксируем шаблоны + процесс, production collection pipeline автор строит позже под свой context (GitHub Issues / Form / PR) |
| 5 | Hybrid placement: pointer в Meeting + template в my-templates/ | Discoverable, чистые Meeting-файлы, single source шаблона |

---

## Component Specifications

### 1. `my-templates/feedback-template.md` (Light per-module)

Время заполнения: 3–5 мин.

**Секции:**
- Frontmatter: `meeting`, `date`, `anon_id` (3-словный nickname для cross-module трекинга)
- **NPS:** 0–10 score на модуль
- **JTBD-Pull:** какую конкретную задачу хотел решить + насколько закрыто
- **JTBD-Friction:** где застрял/сомневался/хотел бросить (материал? инструмент? контекст? время?)
- **Одно изменение:** если бы мог поменять одну вещь — что

### 2. `my-templates/feedback-final-jtbd.md` (Deep final)

Время заполнения: 20–30 мин. Классическая JTBD 4-force структура + before/after + NPS rollup.

**Секции (10):**
1. **Push** — что толкнуло начать курс (конкретный момент)
2. **Pull** — какое состояние жизни/работы надеялся получить
3. **Anxieties** — что пугало; какие страхи оказались обоснованными
4. **Habits** — какие старые привычки работы тянули назад
5. **Before / After** — таблица: задача / делегирование / память / автоматизации
6. **Surprise** — что удивило в обе стороны
7. **Recommend** — кому конкретно порекомендовал/ует и почему им
8. **Критические правки** — 3 топ-изменения от co-автора-на-день
9. **Модульный NPS rollup** — таблица из light-feedback'ов
10. **Курсовой NPS**

### 3. Pointer в каждом Meeting-файле (8 штук)

3-строчный блок в конце каждого Meeting:

```markdown
---

## 📊 Feedback после Meeting <N>

Перед переходом к следующему — заполни `my-experiments/feedback-m<N>.md`
(скопируй из [`my-templates/feedback-template.md`](./my-templates/feedback-template.md), 3–5 мин).
Это делает курс самосовершенствующимся: твой сигнал идёт в [`course-feedback/`](./course-feedback/).
```

Для `EXERCISES.md` pointer указывает на `feedback-final-jtbd.md` (Deep).

### 4. `course-feedback/README.md`

Документирует автора:
- Структура папки (submissions/ + digests/ + README)
- Как feedback попадает в submissions/ (демо-режим vs production опции)
- Как запускать `/feedback-digest`
- Диаграмма loop'а
- Privacy rules (anon_id, удаление PII, агрегация в digest)

### 5. `course-feedback/digests/TEMPLATE.md`

Структура автогенерируемого digest:
1. **NPS per module** — таблица с Promoters/Passives/Detractors/NPS/Δ
2. **Top Friction Points** — кластеры жалоб (частота + цитаты анон + file:line предложение)
3. **Top Wins** — что работает (не трогать / защитить)
4. **JTBD Forces** — агрегат Push/Pull/Anxieties/Habits из final-интервью
5. **Before/After** — качественный summary
6. **Action Items** — ранжированы по impact × частота (P1/P2/P3)
7. **Non-Actions** — отклонённые предложения с обоснованием

### 6. Demo submission

`course-feedback/submissions/example-sky-fox-lantern-m1.md` — заполненный пример для демонстрации формата.

---

## Files Changed

**New (5):**
- `my-templates/feedback-template.md`
- `my-templates/feedback-final-jtbd.md`
- `course-feedback/README.md`
- `course-feedback/digests/TEMPLATE.md`
- `course-feedback/submissions/example-sky-fox-lantern-m1.md`

**Modified (11):**
- `00-kickstart.md` — pointer блок
- `01-introduction.md` — pointer блок
- `02-setup-guide.md` — pointer блок
- `03-prompt-engineering.md` — pointer блок
- `04-context-memory.md` — pointer блок
- `05-audio-pipeline.md` — pointer блок
- `06-tools.md` — pointer блок
- `EXERCISES.md` — pointer на final-jtbd
- `INDEX.md` — навигация + file tree + quick reference
- `README.md` — упоминание feedback-системы
- `CLAUDE.md` — новые файлы в структуре

---

## Self-Update Loop

```
1. Студент проходит Meeting N
2. Заполняет my-experiments/feedback-m<N>.md (3–5 мин)
3. (opt-in) Копирует в course-feedback/submissions/
4. Автор запускает /feedback-digest
5. Агент генерирует digests/YYYY-MM-DD-digest.md
6. Автор читает digest → решает какие P1 брать
7. Автор (или агент по директиве) правит Meeting-файлы
8. Следующий digest измеряет, улучшились ли метрики P1
```

**Триггер digest'а:** on-demand. В демо-режиме — автор просит Claude Code простой фразой ("сгенерируй feedback digest") со ссылкой на `course-feedback/submissions/` и `digests/TEMPLATE.md`. Формальный slash-command file — out of scope (см. ниже).

---

## Privacy / Anti-patterns

- **anon_id** генерируется студентом сам (3 слова, не PII). Один и тот же nickname используется на всех модулях → возможно track эволюции одного человека без identity.
- **PII scrubbing:** при переносе в submissions/ автор (или агент) удаляет всё, что указывает на личность (имена, компании, уникальные проекты).
- **Digests содержат только агрегаты.** Никаких цитат, идентифицирующих студента.
- **Non-actions раздел в digest** — защита от карго-культа: не все предложения имплементируются.

---

## Out of Scope (YAGNI)

Следующее **не** делаем сейчас:
- Автоматический collection pipeline (GitHub Issues / Form integration) — автор настроит production-вариант позже
- Dashboard / визуализация NPS trends — markdown достаточен для демо
- Multi-language support feedback-шаблонов — курс на русском, шаблоны тоже
- A/B testing правок из digest'ов — over-engineering для демо-стадии
- Формальный `/feedback-digest` slash-command — в демо автор вызывает digest фразой к Claude Code, не через skill/command file

---

## Success Criteria

- [ ] Студент может заполнить light-feedback за 5 мин без вопросов к формулировкам
- [ ] Deep JTBD даёт автору читабельный 4-forces портрет студента
- [ ] Агент может сгенерировать digest из 5–10 submissions корректно
- [ ] Каждое предложение правки в digest ссылается на файл:строку
- [ ] Privacy: digest не содержит идентифицируемой инфы о студенте
- [ ] Pointer блоки не засоряют учебные файлы (одинаковы, 3 строки)
