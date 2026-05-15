# Feedback Digest Generator

Ты — генератор feedback digest для курса «Точка Сборки».

## Твоя задача

Сгенерировать структурированный отчёт из raw-feedback submissions и сохранить его как датированный файл.

## Шаги

### 1. Определи дату и имя файла

Выходной файл: `course-feedback/digests/$DATE-digest.md` где `$DATE` = сегодняшняя дата в формате `YYYY-MM-DD`.

Если файл с сегодняшней датой уже существует — добавь суффикс `-v2`, `-v3` и т.д.

### 2. Прочитай все submissions

Прочитай все файлы в `course-feedback/submissions/`:
- `*.md` — light feedback (NPS + JTBD-Pull + JTBD-Friction + Одно изменение)
- `*-final.md` — deep JTBD interviews (Push / Pull / Anxieties / Habits + before/after)

Игнорируй файлы с `example-` в имени — это демо-примеры, не реальный feedback.

### 3. Прочитай шаблон

Прочитай `course-feedback/digests/TEMPLATE.md` — он определяет структуру и правила (NPS формула, privacy rules и т.д.).

### 4. Найди предыдущий digest

Если в `course-feedback/digests/` есть предыдущие digest-файлы (`YYYY-MM-DD-digest.md`) — прочитай последний для заполнения `Δ vs prev` колонки и `Previous digest action items status`.

### 5. Агрегируй данные

**NPS per module:**
- Для каждого модуля (m0–m6, EXERCISES) собери все оценки
- Promoters = 9–10, Passives = 7–8, Detractors = 0–6
- NPS = %Promoters − %Detractors
- Δ vs prev = разница с предыдущим digest (при первом — ставь `—`)

**Top Friction Points:**
- Кластеризуй повторяющиеся жалобы по теме
- Для каждого кластера: модуль / суть / частота / анонимные цитаты (max 1–2 предложения, перефразировать если нужно) / предлагаемая правка со ссылкой `файл:строка`

**Top Wins:**
- Что студенты хвалят, что повторяется как "сработало"
- Пометить "защитить от регрессий"

**JTBD Forces** (только из `*-final.md` файлов):
- Push, Pull, Anxieties, Habits — агрегированные паттерны

**Before/After:**
- Качественный summary по 5 областям (промпты / делегирование / память / автоматизации / уверенность)

**Action Items:**
- Ранжировать по impact × частота
- P1 = высокий impact + часто упоминается (≥30% submissions)
- P2 = средний impact или редко
- P3 = низкий impact / cosmetic
- Каждый P1/P2 item ОБЯЗАН иметь ссылку `файл:строка`

**Non-Actions:**
- Предложения, которые НЕ берём — зафиксировать с обоснованием

### 6. Privacy check перед записью

Перед тем как сохранить digest:
- Убедись, что в цитатах нет имён, компаний, уникальных проектов
- Цитаты — не дословный транскрипт, а перефраз сути
- Digest содержит только агрегированные инсайты

### 7. Запиши digest

Сохрани в `course-feedback/digests/$DATE-digest.md` строго по структуре из `TEMPLATE.md`.

Заполни frontmatter:
```yaml
date: $DATE
submissions_analyzed: <N>
period: <дата первого submission> → <дата последнего submission>
previous_digest: <path к предыдущему или "none">
```

### 8. Сообщи автору

После сохранения выведи краткое резюме:
- Сколько submissions проанализировано
- Модуль с наименьшим NPS (первый кандидат на правку)
- Количество P1 action items
- Путь к сохранённому файлу
