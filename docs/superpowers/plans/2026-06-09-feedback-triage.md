# Feedback Triage Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy-paste текст → классифицированный тикет в `feedback/feedback.jsonl` + нода на визуальной доске sovern-mindmap (Kanban / Matrix / MindMap) с auto-reload.

**Architecture:** Ground truth — append-only JSONL в mc_hub. Производный `board.canvas` (JSON Canvas) пересобирается детерминированным Node-скриптом. Skill `/triage` классифицирует текст и вызывает скрипт. Приложение sovern-mindmap (отдельный репо `C:\telo\Efforts\On\MindMapping\sovern-mindmap`) патчится: fetch canvas по HTTP + polling auto-reload + новые слои.

**Tech Stack:** Node 18+ (`node:test`, `node:crypto` — без новых зависимостей), JSON Canvas (Obsidian-формат), Vite plugin (serve board), React 19 + Zustand (существующий стек sovern-mindmap).

**Spec:** `docs/superpowers/specs/2026-06-09-feedback-triage-design.md`

**Два репозитория:** Tasks 1–4 коммитятся в mc_hub. Tasks 5–7 — в sovern-mindmap (там свой git; коммитить от его корня `C:\telo\Efforts\On\MindMapping\sovern-mindmap`).

---

## Словари (используются во всех задачах — единые написания)

```
category: bug | feature | ux | question | idea
severity: critical | high | medium | low
area:     lms | blog | hub | mentor | workers | course | infra
status:   idle | pending | active | done | blocked     (словарь sovern-mindmap)
```

Severity → цвет canvas-ноды (поле `color`, hex): critical `#ef4444`, high `#f97316`, medium `#eab308`, low `#64748b`.

Category → emoji в title ноды: bug 🐛, feature ✨, ux 🎨, question ❓, idea 💡.

Формат строки JSONL (из спека):

```json
{
  "id": "fb_a1b2c3d4e5f6",
  "source": "paste",
  "created": "2026-06-09T12:00:00Z",
  "content": "сырой текст",
  "title": "Короткий заголовок",
  "status": "idle",
  "triage": {
    "category": "bug",
    "severity": "high",
    "area": "lms",
    "impact": 8,
    "urgency": 7,
    "confidence": 0.9,
    "reason": "одна строка почему"
  }
}
```

`id` = `"fb_" + sha256(normalize(content)).slice(0,12)`, где `normalize` = trim + collapse whitespace + lowercase.

---

### Task 1: Pure-библиотека feedback-конвейера (`lib.mjs`) — TDD

**Files:**
- Create: `feedback/scripts/lib.mjs`
- Test: `feedback/scripts/lib.test.mjs`

- [ ] **Step 1: Write the failing tests**

Создать `feedback/scripts/lib.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ticketId, parseJsonl, ticketToNode, buildCanvas } from './lib.mjs'

test('ticketId: детерминирован и нечувствителен к whitespace/регистру', () => {
  const a = ticketId('Аватар  падает на PNG')
  const b = ticketId('  аватар падает на png \n')
  assert.equal(a, b)
  assert.match(a, /^fb_[0-9a-f]{12}$/)
})

test('ticketId: разный контент → разный id', () => {
  assert.notEqual(ticketId('текст один'), ticketId('текст два'))
})

test('parseJsonl: парсит строки, скипает битые с warning', () => {
  const warnings = []
  const out = parseJsonl('{"id":"fb_1","title":"a"}\nне json\n{"id":"fb_2","title":"b"}\n', w => warnings.push(w))
  assert.equal(out.length, 2)
  assert.equal(out[1].id, 'fb_2')
  assert.equal(warnings.length, 1)
})

test('parseJsonl: пустой файл → пустой массив', () => {
  assert.deepEqual(parseJsonl('', () => {}), [])
})

const sample = {
  id: 'fb_abc123def456', source: 'paste', created: '2026-06-09T12:00:00Z',
  content: 'Аватар-генератор падает на PNG', title: 'Аватар падает на PNG', status: 'idle',
  triage: { category: 'bug', severity: 'high', area: 'lms', impact: 8, urgency: 7, confidence: 0.9, reason: 'crash в core flow' },
}

test('ticketToNode: маппит тикет в canvas-ноду со всеми sovern:* полями', () => {
  const node = ticketToNode(sample, 0)
  assert.equal(node.id, 'fb_abc123def456')
  assert.equal(node.type, 'text')
  assert.equal(node.text, '🐛 Аватар падает на PNG')
  assert.equal(node.color, '#f97316') // high
  assert.equal(node.metadata['sovern:layer'], 'lms')
  assert.equal(node.metadata['sovern:status'], 'idle')
  assert.equal(node.metadata['sovern:impact'], 8)
  assert.equal(node.metadata['sovern:urgency'], 7)
  assert.deepEqual(node.metadata['feedback'], sample.triage)
})

test('buildCanvas: area-корни + edges корень→тикет', () => {
  const canvas = buildCanvas([sample])
  const root = canvas.nodes.find(n => n.id === 'area_lms')
  assert.ok(root, 'есть корневая нода area_lms')
  assert.equal(root.metadata['sovern:layer'], 'lms')
  const edge = canvas.edges.find(e => e.fromNode === 'area_lms' && e.toNode === 'fb_abc123def456')
  assert.ok(edge, 'есть edge от area-корня к тикету')
})

test('buildCanvas: area-корень не создаётся для пустых area', () => {
  const canvas = buildCanvas([sample])
  assert.equal(canvas.nodes.filter(n => n.id.startsWith('area_')).length, 1)
})

test('buildCanvas: детерминирован (одинаковый вход → одинаковый JSON)', () => {
  const a = JSON.stringify(buildCanvas([sample]))
  const b = JSON.stringify(buildCanvas([sample]))
  assert.equal(a, b)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run (из корня mc_hub): `node --test feedback/scripts/`
Expected: FAIL — `Cannot find module ... lib.mjs`

- [ ] **Step 3: Write the implementation**

Создать `feedback/scripts/lib.mjs`:

```js
// feedback/scripts/lib.mjs
// Pure-функции feedback-конвейера: id, парсинг JSONL, генерация board.canvas.
// Без I/O — всё тестируется node:test без моков. I/O живёт в fb.mjs.
import { createHash } from 'node:crypto'

const SEVERITY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#64748b' }
const CATEGORY_EMOJI = { bug: '🐛', feature: '✨', ux: '🎨', question: '❓', idea: '💡' }
const AREAS = ['lms', 'blog', 'hub', 'mentor', 'workers', 'course', 'infra']

/** id тикета: fb_<sha256(normalized)[:12]>. Нормализация — trim/collapse/lowercase. */
export function ticketId(content) {
  const normalized = content.trim().replace(/\s+/g, ' ').toLowerCase()
  return 'fb_' + createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 12)
}

/** JSONL → массив тикетов. Битые строки скипаются через onWarn (конвейер не валится). */
export function parseJsonl(text, onWarn) {
  const tickets = []
  for (const [i, line] of text.split('\n').entries()) {
    if (!line.trim()) continue
    try {
      tickets.push(JSON.parse(line))
    } catch {
      onWarn(`feedback.jsonl: битая строка ${i + 1} пропущена`)
    }
  }
  return tickets
}

/** Тикет → JSON Canvas нода. index задаёт детерминированную позицию в grid. */
export function ticketToNode(ticket, index) {
  const t = ticket.triage ?? {}
  return {
    id: ticket.id,
    type: 'text',
    x: 300 + (index % 4) * 280,
    y: 200 + Math.floor(index / 4) * 180,
    width: 240,
    height: 140,
    color: SEVERITY_COLOR[t.severity] ?? '#64748b',
    text: `${CATEGORY_EMOJI[t.category] ?? '📌'} ${ticket.title}`,
    metadata: {
      'sovern:layer': t.area ?? 'infra',
      'sovern:status': ticket.status ?? 'idle',
      'sovern:impact': t.impact ?? 5,
      'sovern:urgency': t.urgency ?? 5,
      feedback: t,
    },
  }
}

/** Все тикеты → JSON Canvas: area-корни + тикеты + edges (иерархия для MindMap-вида). */
export function buildCanvas(tickets) {
  const usedAreas = AREAS.filter(a => tickets.some(t => (t.triage?.area ?? 'infra') === a))
  const areaNodes = usedAreas.map((area, i) => ({
    id: `area_${area}`,
    type: 'text',
    x: i * 320,
    y: 0,
    width: 200,
    height: 80,
    text: `📂 ${area.toUpperCase()}`,
    metadata: { 'sovern:layer': area, 'sovern:status': 'idle', 'sovern:impact': 5, 'sovern:urgency': 5 },
  }))
  const ticketNodes = tickets.map((t, i) => ticketToNode(t, i))
  const edges = tickets.map(t => ({
    id: `e_${t.id}`,
    fromNode: `area_${t.triage?.area ?? 'infra'}`,
    toNode: t.id,
  }))
  return { nodes: [...areaNodes, ...ticketNodes], edges }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test feedback/scripts/`
Expected: все 8 тестов PASS

- [ ] **Step 5: Commit**

```bash
git add feedback/scripts/lib.mjs feedback/scripts/lib.test.mjs
git commit -m "feat(feedback): pure-библиотека triage-конвейера (id, jsonl, canvas)"
```

---

### Task 2: CLI `fb.mjs` — add / status / build (I/O-обёртка)

**Files:**
- Create: `feedback/scripts/fb.mjs`
- Create: `feedback/feedback.jsonl` (пустой)
- Test: `feedback/scripts/fb.test.mjs`

- [ ] **Step 1: Write the failing tests**

Тесты гоняют CLI как child process на временной директории — проверяют идемпотентность и смену статуса end-to-end. Создать `feedback/scripts/fb.test.mjs`:

```js
import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const CLI = join(dirname(fileURLToPath(import.meta.url)), 'fb.mjs')
let dir

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'fb-'))
  writeFileSync(join(dir, 'feedback.jsonl'), '')
})

const run = (args, input) =>
  execFileSync('node', [CLI, ...args], { cwd: dir, input, encoding: 'utf8', env: { ...process.env, FEEDBACK_DIR: dir } })

const sampleTicket = JSON.stringify({
  source: 'paste', content: 'Аватар падает на PNG', title: 'Аватар падает на PNG', status: 'idle',
  triage: { category: 'bug', severity: 'high', area: 'lms', impact: 8, urgency: 7, confidence: 0.9, reason: 'crash' },
})

test('add: добавляет тикет, проставляет id+created, собирает canvas', () => {
  const out = run(['add'], sampleTicket)
  assert.match(out, /fb_[0-9a-f]{12}/)
  const lines = readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 1)
  const saved = JSON.parse(lines[0])
  assert.match(saved.id, /^fb_[0-9a-f]{12}$/)
  assert.ok(saved.created)
  assert.ok(existsSync(join(dir, 'board.canvas')))
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.ok(canvas.nodes.some(n => n.id === saved.id))
})

test('add: дубликат по контенту не добавляется (идемпотентность)', () => {
  run(['add'], sampleTicket)
  const out = run(['add'], sampleTicket)
  assert.match(out, /duplicate/i)
  const lines = readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim().split('\n')
  assert.equal(lines.length, 1)
})

test('status: меняет статус по префиксу id и пересобирает canvas', () => {
  const out = run(['add'], sampleTicket)
  const id = out.match(/fb_[0-9a-f]{12}/)[0]
  run(['status', id.slice(0, 8), 'active'])
  const saved = JSON.parse(readFileSync(join(dir, 'feedback.jsonl'), 'utf8').trim())
  assert.equal(saved.status, 'active')
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.equal(canvas.nodes.find(n => n.id === id).metadata['sovern:status'], 'active')
})

test('status: невалидный статус → ошибка, файл не тронут', () => {
  const out = run(['add'], sampleTicket)
  const id = out.match(/fb_[0-9a-f]{12}/)[0]
  assert.throws(() => run(['status', id, 'wat']))
})

test('build: пересобирает canvas из jsonl с нуля', () => {
  run(['add'], sampleTicket)
  writeFileSync(join(dir, 'board.canvas'), 'мусор')
  run(['build'])
  const canvas = JSON.parse(readFileSync(join(dir, 'board.canvas'), 'utf8'))
  assert.ok(canvas.nodes.length >= 2) // area-корень + тикет
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test feedback/scripts/fb.test.mjs`
Expected: FAIL — `Cannot find module ... fb.mjs`

- [ ] **Step 3: Write the CLI**

Создать пустой `feedback/feedback.jsonl` (0 байт) и `feedback/scripts/fb.mjs`:

```js
#!/usr/bin/env node
// feedback/scripts/fb.mjs — CLI triage-конвейера.
// Команды:
//   node fb.mjs add            — тикет-JSON из stdin → идемпотентный append + rebuild canvas
//   node fb.mjs status <id|префикс> <status> — смена статуса + rebuild
//   node fb.mjs build          — пересборка board.canvas из feedback.jsonl
// Директория данных: $FEEDBACK_DIR или ../ относительно скрипта (= feedback/).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ticketId, parseJsonl, buildCanvas } from './lib.mjs'

const DIR = process.env.FEEDBACK_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..')
const JSONL = join(DIR, 'feedback.jsonl')
const CANVAS = join(DIR, 'board.canvas')
const STATUSES = ['idle', 'pending', 'active', 'done', 'blocked']

const readTickets = () =>
  parseJsonl(existsSync(JSONL) ? readFileSync(JSONL, 'utf8') : '', w => console.warn('⚠', w))

const rebuild = tickets =>
  writeFileSync(CANVAS, JSON.stringify(buildCanvas(tickets), null, 2) + '\n')

const [cmd, ...args] = process.argv.slice(2)

switch (cmd) {
  case 'add': {
    const input = JSON.parse(readFileSync(0, 'utf8')) // stdin
    const id = ticketId(input.content)
    const tickets = readTickets()
    if (tickets.some(t => t.id === id)) {
      console.log(`duplicate: ${id} уже в feedback.jsonl — пропущено`)
      break
    }
    const ticket = { id, created: new Date().toISOString(), status: 'idle', ...input }
    appendFileSync(JSONL, JSON.stringify(ticket) + '\n')
    rebuild([...tickets, ticket])
    console.log(`added: ${id}`)
    break
  }
  case 'status': {
    const [prefix, status] = args
    if (!STATUSES.includes(status)) {
      console.error(`невалидный статус «${status}»; допустимо: ${STATUSES.join(', ')}`)
      process.exit(1)
    }
    const tickets = readTickets()
    const matches = tickets.filter(t => t.id.startsWith(prefix))
    if (matches.length !== 1) {
      console.error(matches.length === 0 ? `тикет «${prefix}» не найден` : `«${prefix}» неоднозначен (${matches.length} совпадений)`)
      process.exit(1)
    }
    matches[0].status = status
    writeFileSync(JSONL, tickets.map(t => JSON.stringify(t)).join('\n') + '\n')
    rebuild(tickets)
    console.log(`status: ${matches[0].id} → ${status}`)
    break
  }
  case 'build': {
    const tickets = readTickets()
    rebuild(tickets)
    console.log(`built: ${tickets.length} тикетов → board.canvas`)
    break
  }
  default:
    console.error('usage: fb.mjs add|status <id> <status>|build')
    process.exit(1)
}
```

- [ ] **Step 4: Run all tests to verify they pass**

Run: `node --test feedback/scripts/`
Expected: 13 тестов PASS (8 из Task 1 + 5 новых)

- [ ] **Step 5: Commit**

```bash
git add feedback/scripts/fb.mjs feedback/scripts/fb.test.mjs feedback/feedback.jsonl
git commit -m "feat(feedback): fb.mjs CLI — идемпотентный add, status, build canvas"
```

---

### Task 3: Skill `/triage`

**Files:**
- Create: `skills/triage/SKILL.md`

- [ ] **Step 1: Write the skill**

Создать `skills/triage/SKILL.md`:

````markdown
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

**confidence:** 0–1. Если < 0.6 — НЕ записывай сразу: покажи карточку с пометкой «низкая уверенность» и спроси подтверждение классификации.

### Шаг 3 — запись (идемпотентно)
Сформируй JSON и передай в CLI (из корня mc_hub):

```bash
echo '{"source":"paste","content":"<сырой текст>","title":"<заголовок ≤80>","status":"idle","triage":{"category":"...","severity":"...","area":"...","impact":N,"urgency":N,"confidence":0.X,"reason":"<одна строка>"}}' | node feedback/scripts/fb.mjs add
```

На Windows надёжнее через временный файл или stdin-pipe в PowerShell:
`Get-Content ticket.json -Raw | node feedback/scripts/fb.mjs add`
(можешь писать ticket JSON во временный файл Write-тулом, затем pipe, затем удалить).

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

Квадрант Matrix: impact ≥ 6 & urgency ≥ 6 → «Do First»; impact ≥ 6 & urgency < 6 → «Schedule»; impact < 6 & urgency ≥ 6 → «Delegate/Quick»; иначе «Backlog».

## Режим 2: смена статуса

`/triage status <id|префикс> <idle|pending|active|done|blocked>` →

```bash
node feedback/scripts/fb.mjs status <префикс> <status>
```

Покажи результат (id → новый статус). При ошибке «неоднозначен» — выведи совпадающие тикеты и попроси уточнить.

## Privacy
В `title` и `reason` не включай имена людей и компаний из текста — перефразируй суть.
````

- [ ] **Step 2: Smoke-тест скилла вручную**

Прогнать конвейер руками (как сделал бы скилл):

```bash
echo '{"source":"paste","content":"smoke: тестовый тикет конвейера","title":"Smoke-тест конвейера","status":"idle","triage":{"category":"idea","severity":"low","area":"infra","impact":2,"urgency":2,"confidence":1,"reason":"smoke"}}' | node feedback/scripts/fb.mjs add
node feedback/scripts/fb.mjs build
```

Expected: `added: fb_...`, в `feedback/board.canvas` появились нода `area_infra` и нода тикета. Затем удалить smoke-строку из `feedback.jsonl` и выполнить `node feedback/scripts/fb.mjs build` (canvas очистится).

- [ ] **Step 3: Commit**

```bash
git add skills/triage/SKILL.md
git commit -m "feat(skills): /triage — классификация feedback в JSONL + board.canvas"
```

---

### Task 4: README для feedback/ + строка в CLAUDE.md

**Files:**
- Create: `feedback/README.md`
- Modify: `CLAUDE.md` (секция «Структура» — одна строка после `skills/`)

- [ ] **Step 1: Write README**

Создать `feedback/README.md`:

```markdown
# Feedback Triage

Конвейер: copy-paste текст → skill `/triage` → `feedback.jsonl` (ground truth) → `board.canvas` (JSON Canvas, производный) → дэшборд sovern-mindmap / Obsidian.

- `feedback.jsonl` — append-only, одна JSON-строка на тикет, id = hash контента (идемпотентно)
- `board.canvas` — НЕ редактировать руками: пересобирается `node feedback/scripts/fb.mjs build`
- Смена статуса: `/triage status <id> <status>` или `node feedback/scripts/fb.mjs status <id> <status>`
- Тесты: `node --test feedback/scripts/`
- Дэшборд: `npm run dev` в `C:\telo\Efforts\On\MindMapping\sovern-mindmap` → http://localhost:1420
- Spec: `docs/superpowers/specs/2026-06-09-feedback-triage-design.md`

Контур `LMS/tochka-sborki/course-feedback/` (NPS/JTBD курса) — отдельный, сюда не сливается.
```

- [ ] **Step 2: Add line to CLAUDE.md**

В `CLAUDE.md`, в дереве структуры, после строки `├── skills/               — Claude Code skills (tochka-sborki-update)` добавить:

```
├── feedback/             — triage-конвейер: feedback.jsonl + board.canvas (skill /triage, дэшборд sovern-mindmap)
```

- [ ] **Step 3: Commit**

```bash
git add feedback/README.md CLAUDE.md
git commit -m "docs(feedback): README конвейера + строка в CLAUDE.md"
```

---

### Task 5: sovern-mindmap — новые слои + impact/urgency в конвертере

**Репо:** `C:\telo\Efforts\On\MindMapping\sovern-mindmap` (коммиты здесь!)

**Files:**
- Modify: `src/types/index.ts:6-16` (SOVERNLayer)
- Modify: `src/types/index.ts:20-36` (SOVERNNodeData — явные impact/urgency)
- Modify: `src/utils/canvasConverter.ts` (читать/писать impact/urgency/color/feedback)
- Modify: `src/components/nodes/SOVERNNode.tsx:5-16` (цвета слоёв)
- Modify: `src/store/useWorkflowStore.ts:18-20` (LAYER_ORDER)

- [ ] **Step 1: Extend SOVERNLayer + SOVERNNodeData**

В `src/types/index.ts` заменить тип SOVERNLayer:

```ts
export type SOVERNLayer =
  | 'human'
  | 'boss'
  | 'skills'
  | 'coding'
  | 'gateway'
  | 'memory'
  | 'tools'
  | 'observability'
  | 'hosting'
  | 'projects'
  // mc_hub feedback areas (триаж-доска)
  | 'lms'
  | 'blog'
  | 'hub'
  | 'mentor'
  | 'workers'
  | 'course'
  | 'infra';
```

В `SOVERNNodeData` после `agent?: string;` добавить явные поля (сейчас они проходят через `[key: string]: any`, Matrix их уже читает):

```ts
  impact?: number;   // 1-10, Priority Matrix Y
  urgency?: number;  // 1-10, Priority Matrix X
```

- [ ] **Step 2: Patch canvasConverter — impact/urgency/color round-trip**

В `src/utils/canvasConverter.ts`, в `toJSONCanvas`, в объект `metadata` добавить после `'sovern:dates': node.data.dates,`:

```ts
        'sovern:impact': node.data.impact,
        'sovern:urgency': node.data.urgency,
```

В `fromJSONCanvas`, в `data: {` после `dates: node.metadata?.['sovern:dates'],` добавить:

```ts
      impact: node.metadata?.['sovern:impact'],
      urgency: node.metadata?.['sovern:urgency'],
```

- [ ] **Step 3: Layer colors + order**

В `src/components/nodes/SOVERNNode.tsx` в `layerColors` добавить перед закрывающей скобкой:

```ts
  // mc_hub feedback areas
  lms: '#10b981',     // emerald-500
  blog: '#8b5cf6',    // violet-500
  hub: '#0ea5e9',     // sky-500
  mentor: '#d946ef',  // fuchsia-500
  workers: '#f59e0b', // amber-500
  course: '#84cc16',  // lime-500
  infra: '#64748b',   // slate-500
```

В `src/store/useWorkflowStore.ts` заменить LAYER_ORDER:

```ts
const LAYER_ORDER: SOVERNLayer[] = [
  'human', 'boss', 'skills', 'projects', 'coding', 'tools', 'gateway', 'memory', 'observability', 'hosting',
  'lms', 'blog', 'hub', 'mentor', 'workers', 'course', 'infra',
];
```

- [ ] **Step 4: Verify build**

Run (в sovern-mindmap): `npx tsc --noEmit`
Expected: 0 ошибок (или только pre-existing, не связанные с патчем — зафиксировать какие)

- [ ] **Step 5: Commit (в репо sovern-mindmap)**

```bash
git add src/types/index.ts src/utils/canvasConverter.ts src/components/nodes/SOVERNNode.tsx src/store/useWorkflowStore.ts
git commit -m "feat(layers): mc_hub feedback areas + impact/urgency в canvas round-trip"
```

---

### Task 6: sovern-mindmap — Vite отдаёт board.canvas

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Add serve plugin**

Заменить содержимое `vite.config.ts`:

```ts
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync, existsSync } from 'node:fs';

// Путь к board.canvas: env SOVERN_BOARD или дефолт — mc_hub feedback board.
const BOARD_PATH =
  process.env.SOVERN_BOARD ?? 'C:/telo/Efforts/Ongoing/mc_hub/feedback/board.canvas';

// Dev-only: отдаёт /board.canvas с диска на каждый запрос (никакого кэша) —
// polling на клиенте видит свежий файл сразу после записи fb.mjs.
const serveBoard = (): Plugin => ({
  name: 'sovern-serve-board',
  configureServer(server) {
    server.middlewares.use('/board.canvas', (_req, res) => {
      if (!existsSync(BOARD_PATH)) {
        res.statusCode = 404;
        res.end('board.canvas not found at ' + BOARD_PATH);
        return;
      }
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(readFileSync(BOARD_PATH, 'utf8'));
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), serveBoard()],
  // Tauri expects a fixed port, fail if it's already in use
  server: {
    port: 1420,
    strictPort: true,
  },
  // env vars starting with `VITE_` are exposed to the client
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    // Standard ES target for modern browsers/Tauri
    target: 'es2020',
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

- [ ] **Step 2: Verify serving**

Запустить dev-сервер фоном: `npm run dev`. Затем:

Run: `curl -s http://localhost:1420/board.canvas | head -5`
Expected: JSON c `"nodes":` (board из mc_hub; если Task 3 smoke удалён — там пустые массивы, тоже ок). Остановить сервер.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(dev): serve /board.canvas из mc_hub (env SOVERN_BOARD)"
```

---

### Task 7: sovern-mindmap — загрузка board + polling auto-reload

**Files:**
- Create: `src/hooks/useBoardSync.ts`
- Modify: `src/App.tsx:56-80` (инициализация Flow)

- [ ] **Step 1: Write the hook**

Создать `src/hooks/useBoardSync.ts`:

```ts
import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '../store/useWorkflowStore';
import { fromJSONCanvas } from '../utils/canvasConverter';

const POLL_MS = 3000;

/**
 * Browser-режим: грузит /board.canvas при старте и поллит изменения.
 * Возвращает true из loadBoard-попытки через onLoaded (для fallback на demo-ноды).
 * Сравнение по сырому тексту файла — дешевле и надёжнее hash'а.
 */
export const useBoardSync = (onFirstLoad: (loaded: boolean) => void) => {
  const lastText = useRef<string | null>(null);
  const onFirstLoadRef = useRef(onFirstLoad);
  onFirstLoadRef.current = onFirstLoad;

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async (first: boolean) => {
      try {
        const res = await fetch('/board.canvas', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        const text = await res.text();
        if (!alive) return;
        if (text !== lastText.current) {
          lastText.current = text;
          const { nodes, edges } = fromJSONCanvas(JSON.parse(text));
          const store = useWorkflowStore.getState();
          store.setNodes(nodes);
          store.setEdges(edges);
          // пере-применить layout текущего вида, чтобы новые ноды встали по местам
          store.setViewMode(store.viewMode);
        }
        if (first) onFirstLoadRef.current(true);
      } catch {
        if (first && alive) onFirstLoadRef.current(false);
      } finally {
        if (alive) timer = setTimeout(() => tick(false), POLL_MS);
      }
    };

    tick(true);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);
};
```

- [ ] **Step 2: Wire into App.tsx**

В `src/App.tsx`:

1. Добавить импорт после остальных:

```ts
import { useBoardSync } from './hooks/useBoardSync';
```

2. Заменить инициализирующий `useEffect` внутри `Flow` (строки ~68–80, блок `if (!initialized.current) { setNodes(prdNodes); ... }`) на:

```ts
  useBoardSync((loaded) => {
    if (initialized.current) return;
    initialized.current = true;
    if (!loaded) {
      // board недоступен (нет vite-плагина / файла) — fallback на demo PRD-граф
      console.log('[SOVERN] board.canvas недоступен — demo-граф');
      setNodes(prdNodes);
      setEdges(prdEdges);
    }
    setTimeout(() => fitView({ padding: 0.2 }), 500);
  });

  useEffect(() => {
    console.log('[SOVERN] Mounting Flow...');
  }, []);
```

(переменные `setNodes`, `setEdges`, `fitView`, `initialized`, `prdNodes`, `prdEdges`, `setError` уже в scope; `setError` и `error`-обвязку не трогать.)

- [ ] **Step 3: Verify types**

Run: `npx tsc --noEmit`
Expected: 0 новых ошибок

- [ ] **Step 4: End-to-end smoke**

1. В sovern-mindmap: `npm run dev` (фоном).
2. Из корня mc_hub добавить тикет:

```bash
echo '{"source":"paste","content":"e2e: дэшборд показывает тикет","title":"E2E smoke","status":"idle","triage":{"category":"idea","severity":"low","area":"infra","impact":3,"urgency":3,"confidence":1,"reason":"e2e"}}' | node feedback/scripts/fb.mjs add
```

3. Открыть http://localhost:1420 → в течение ~3 с появляются ноды `📂 INFRA` и `💡 E2E smoke` (без перезагрузки страницы). Проверить переключение видов: Kanban (тикет в колонке IDLE), Matrix (левый-нижний квадрант).
4. `node feedback/scripts/fb.mjs status <id-префикс> active` → нода переехала в колонку ACTIVE сама.
5. Удалить e2e-строку из `feedback/feedback.jsonl`, выполнить `node feedback/scripts/fb.mjs build`, остановить dev-сервер.

Expected: все 4 пункта наблюдаемы. Если polling не подхватывает — проверить консоль браузера и `curl http://localhost:1420/board.canvas`.

- [ ] **Step 5: Commit (в репо sovern-mindmap)**

```bash
git add src/hooks/useBoardSync.ts src/App.tsx
git commit -m "feat(sync): загрузка board.canvas + polling auto-reload (browser-режим)"
```

---

### Task 8: финальный коммит mc_hub (board.canvas baseline)

**Files:**
- Modify: `feedback/board.canvas` (пустой baseline после удаления smoke-тикетов)

- [ ] **Step 1: Rebuild чистый canvas и закоммитить**

Run (из корня mc_hub): `node feedback/scripts/fb.mjs build && node --test feedback/scripts/`
Expected: `built: 0 тикетов` (или N реальных, если уже затриажены), все тесты PASS

```bash
git add feedback/board.canvas
git commit -m "chore(feedback): baseline board.canvas"
```

---

## Definition of Done

- [ ] `node --test feedback/scripts/` — все тесты зелёные
- [ ] `/triage <текст>` создаёт тикет, дубликат вставки не плодит второй
- [ ] `npm run dev` в sovern-mindmap показывает доску из mc_hub, обновления видны ≤3 с
- [ ] Kanban/Matrix/MindMap отражают status/impact×urgency/area
- [ ] `board.canvas` открывается в Obsidian как валидный canvas
- [ ] Оба репо закоммичены
