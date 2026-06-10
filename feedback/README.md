# Feedback Triage

Конвейер: copy-paste текст → skill `/triage` → `feedback.jsonl` (ground truth) → `board.canvas` (JSON Canvas, производный) → дэшборд sovern-mindmap / Obsidian.

- `feedback.jsonl` — append-only, одна JSON-строка на тикет, id = hash контента (идемпотентно)
- `board.canvas` — НЕ редактировать руками: пересобирается `node feedback/scripts/fb.mjs build`
- Смена статуса: `/triage status <id> <status>`, `node feedback/scripts/fb.mjs status <id> <status>`, или drag-and-drop на kanban-доске дэшборда (POST `/api/feedback/status` → `fb.mjs` → jsonl + rebuild)
- Тесты: `node --test "feedback/scripts/lib.test.mjs" "feedback/scripts/fb.test.mjs"`
- Дэшборд: `npm run dev` в `C:\telo\Efforts\On\MindMapping\sovern-mindmap` → http://localhost:1420. Виды: mindmap (кластеры по area), matrix (квадранты impact×urgency), timeline (по `created`), kanban (DnD-статусы). Поллит board.canvas каждые 3 сек — правки видны живьём.
- Spec: `docs/superpowers/specs/2026-06-09-feedback-triage-design.md`

Контур `LMS/tochka-sborki/course-feedback/` (NPS/JTBD курса) — отдельный, сюда не сливается.
