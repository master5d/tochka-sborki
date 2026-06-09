# Feedback Triage Pipeline + Visual Control Plane — Design

**Date:** 2026-06-09
**Status:** approved (brainstorm)
**Owner:** Sasha

## Проблема

Накопилась обратная связь (Telegram, разговоры, собственные идеи фич) — нет конвейера, который превращает сырой текст в классифицированный тикет с видимым местом на доске. Нужно:

1. **Copy-paste интейк**: вставил текст → мгновенный триаж → видно классификацию и куда тикет пошёл.
2. **Визуальный дэшборд**: тикеты по категориям/приоритету (Kanban, Priority Matrix, MindMap).
3. Задел под Telegram-интейк позже (Telegram MCP plugin, когда подключён).

## Решение в одну строку

Claude Code skill `/triage` пишет тикеты в `feedback/feedback.jsonl` (ground truth) + `feedback/board.canvas` (JSON Canvas), а существующее приложение **sovern-mindmap** (`C:\telo\Efforts\On\MindMapping\sovern-mindmap`) рендерит canvas в browser-режиме с auto-reload.

## Архитектура

```
[copy-paste текст]──→ /triage skill (Claude Code)
                         │ классификация: category/severity/area/impact/urgency/confidence
                         ├──→ feedback/feedback.jsonl   (append-only, идемпотентно по id)
                         ├──→ feedback/board.canvas     (upsert ноды; Obsidian-совместимый)
                         └──→ терминал: триаж-карточка (что, куда, почему)
[Telegram @channel]──→ тот же skill, позже (вне scope этого спека)
[course-feedback/]──→ без изменений (NPS/JTBD контур курса — отдельный)
```

Мост между агентом и UI — **shared-файл** `board.canvas`. MCP-сервер sovern-mindmap не используется (он in-memory demo, не связан с UI).

## Компоненты

### 1. Данные — `feedback/` в корне mc_hub (git-tracked)

**`feedback/feedback.jsonl`** — одна JSON-строка на тикет:

```json
{
  "id": "fb_<sha256(content)[:12]>",
  "source": "paste | telegram | self",
  "created": "2026-06-09T12:00:00Z",
  "content": "<исходный текст, нормализованный>",
  "triage": {
    "category": "bug | feature | ux | question | idea",
    "severity": "critical | high | medium | low",
    "area": "lms | blog | hub | mentor | workers | course | infra",
    "impact": 1-10,
    "urgency": 1-10,
    "confidence": 0.0-1.0,
    "reason": "<одна строка: почему так классифицировано>"
  },
  "status": "idle | pending | active | done | blocked",
  "title": "<короткий заголовок ≤80 chars>"
}
```

- Идемпотентность: `id` = hash нормализованного контента; дубликат — не добавляется.
- `status` использует словарь sovern-mindmap (его Kanban-колонки).

**`feedback/board.canvas`** — JSON Canvas (формат Obsidian), производный от JSONL.
Маппинг тикет → нода:

| тикет | нода canvas |
|---|---|
| `title` + категория-emoji | `text` |
| `area` | `metadata.layer` (слой) |
| `status` | `metadata.status` (Kanban) |
| `impact`/`urgency` | `metadata.impact`/`metadata.urgency` (Matrix 2×2) |
| `severity` | `color` (critical=red, high=orange, medium=yellow, low=gray) |
| весь triage-блок | `metadata.feedback` |

Группирующие ноды (`type: "group"`) по `area` — для MindMap-вида.

### 2. `/triage` skill — `skills/triage/SKILL.md`

Шаги скилла:
1. Принять текст (аргумент или следующее сообщение пользователя).
2. Классифицировать по детерминированным правилам (таблица маппинга ключевых слов + здравый смысл; при неуверенности — `confidence ≤ 0.6`, category=`idea`/`question`).
3. Посчитать `id`, проверить дубликат в JSONL; если новый — append.
4. Перегенерировать/обновить `board.canvas` из JSONL (canvas — производный артефакт, его можно пересобрать целиком: меньше edge-case'ов, чем точечный upsert).
5. Вывести триаж-карточку в терминал: title, category, severity, area, impact×urgency, confidence, reason, позиция на доске.

Дополнительный режим: `/triage status <id|подстрока title> <status>` — смена статуса тикета (JSONL update + пересборка canvas). Без него Kanban был бы read-only.

Несколько тикетов одной вставкой: скилл сегментирует текст на независимые единицы feedback'а и триажит каждую.

### 3. Патч sovern-mindmap (вне mc_hub, отдельный коммит там)

1. **Browser-режим: загрузка canvas по HTTP.** При старте app пытается `fetch('/board.canvas')`; Vite dev server отдаёт файл (симлинк/конфиг `server.fs` или копия в `public/`). Решение по механике — на этапе плана; критерий: `npm run dev` показывает актуальный board без Tauri.
2. **Auto-reload:** polling fetch (интервал ~3 с, сравнение по hash/`Last-Modified`); при изменении — `setNodes/setEdges` с сохранением viewport.
3. **Слои:** расширить `SOVERNLayer` значениями `lms | blog | hub | mentor | workers | course | infra` + цвета/порядок в LAYER_ORDER. Существующие SOVERN-слои не трогаем (обратная совместимость с их canvas-файлами).

### 4. Терминальная триаж-карточка (формат)

```
┌─ ТРИАЖ ──────────────────────────────────────
│ 🐛 bug · high · area: lms · conf 0.9
│ «Аватар-генератор падает на PNG»
│ Impact 8 × Urgency 7 → Matrix: Do First
│ Kanban: idle → feedback/board.canvas
│ Почему: «падает» + затрагивает core flow
└──────────────────────────────────────────────
```

## Error handling

- Битая строка в JSONL — скипается с warning, не валит конвейер.
- `board.canvas` отсутствует/повреждён — пересобирается из JSONL (JSONL первичен).
- Низкий confidence (<0.6) — скилл показывает карточку и спрашивает подтверждение классификации перед записью.

## Тесты

- В sovern-mindmap: unit на canvas-конвертер новых слоёв (если там есть test-setup; если нет — smoke вручную через `npm run dev`).
- Скилл — процедурный (LLM-шаги), валидируется прогонами: дубликат-тест (одна вставка дважды → один тикет), мульти-тикет вставка, битый JSONL.

## Вне scope (backlog)

- Telegram-интейк (тот же скилл, когда Telegram MCP активен)
- GitHub Issues, Python-сервер, Docker, SQLite, embeddings (YAGNI — отброшены сознательно)
- Weekly summary report
- Двусторонний sync (правки на доске → JSONL): доска — read-only производная; статус меняется через `/triage status` (см. компонент 2)
