---
name: triage
type: workflow
execution: stateless
description: >
  Triage incoming product feedback or feature ideas for the mc_hub monorepo.
  The user pastes raw text (feedback, bug report, feature idea, Telegram message);
  classify it, append to feedback/feedback.jsonl via fb.mjs, and show a triage card.
  Trigger on "затриажь", "triage", "обратная связь:", "новый тикет", "новая фича:",
  or "/triage". Also handles "/triage status <id> <status>" to move tickets on the board.
---

# Feedback Triage

Ты — триаж-движок mc_hub. Текст от пользователя → классифицированный тикет → доска.

## Режим 1: триаж текста (по умолчанию)

### Шаг 1 — сегментация
Если вставка содержит несколько независимых единиц feedback'а — раздели и триажь каждую отдельно (карточка на каждую).

### Шаг 2 — классификация (детерминированные правила)

**category:**
- падает / crash / ошибка / не работает / exception → `bug`
- добавь / хочу / would be nice / нужна фича → `feature`
- непонятно / неудобно / запутался / confusing → `ux`
- вопрос без запроса изменений → `question`
- остальное / сырая мысль → `idea`

**severity:** critical = потеря данных, безопасность, падение для всех; high = сломан major flow; medium = частичная поломка / performance; low = косметика, идеи.

**area** (словарь продуктов mc_hub): `lms` (ai.mamaev.coach, курс-приложение), `blog`, `hub` (mamaev.coach лендинг), `mentor`, `workers` (API), `course` (контент курса: уроки, упражнения), `infra` (CI, деплой, тулчейн).

**impact / urgency:** 1–10 для Priority Matrix. impact = скольких затрагивает × насколько глубоко; urgency = можно ли отложить.

**confidence:** 0–1. Если < 0.6 — НЕ записывай сразу: покажи карточку с пометкой `⚠ низкая уверенность` в первой строке и спроси: «Записать как есть, поправить классификацию или отбросить?». Записывай только после ответа.

### Шаг 3 — запись (идемпотентно)
Сформируй JSON и передай в CLI (из корня mc_hub):

```bash
echo '{"source":"paste","content":"<сырой текст>","title":"<заголовок ≤80>","status":"idle","triage":{"category":"...","severity":"...","area":"...","impact":N,"urgency":N,"confidence":0.X,"reason":"<одна строка>"}}' | node feedback/scripts/fb.mjs add
```

На Windows надёжнее через временный файл и stdin-pipe:
запиши ticket JSON во временный файл Write-тулом, затем `Get-Content ticket.json -Raw | node feedback/scripts/fb.mjs add` (PowerShell) или `cat ticket.json | node feedback/scripts/fb.mjs add` (bash), затем удали временный файл.

Если CLI ответил `duplicate:` — сообщи пользователю, что тикет уже есть, и покажи его id.

### Шаг 4 — триаж-карточка в терминал

```
┌─ ТРИАЖ ──────────────────────────────────────
│ 🐛 bug · high · area: lms · conf 0.9
│ «Аватар-генератор падает на PNG»
│ Impact 8 × Urgency 7 → Matrix: Do First
│ Kanban: idle · id: fb_a1b2c3d4e5f6
│ Почему: «падает» + затрагивает core flow
└──────────────────────────────────────────────
```

Строка «Почему:» — это поле `triage.reason` записанного тикета (дословно).

Квадрант Matrix: impact ≥ 6 & urgency ≥ 6 → «Do First»; impact ≥ 6 & urgency < 6 → «Schedule»; impact < 6 & urgency ≥ 6 → «Delegate/Quick»; иначе «Backlog».

## Режим 2: смена статуса

Из команды пользователя `/triage status <id|префикс> <status>` извлеки два аргумента — префикс id и статус (один из `idle|pending|active|done|blocked`) — и передай их в CLI в том же порядке:

```bash
node feedback/scripts/fb.mjs status <префикс> <status>
```

Покажи результат (id → новый статус). При ошибке «неоднозначен» — выведи совпадающие тикеты и попроси уточнить.

## Privacy
В `title` и `reason` не включай имена людей и компаний из текста — перефразируй суть.
