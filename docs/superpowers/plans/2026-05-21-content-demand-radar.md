# Content Demand Radar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn free-text intake demand (F3, F2-other) into classified signals and Gemini-drafted content briefs for an architect, surfaced through an owner-gated admin page and brief API.

**Architecture:** A fire-and-forget tail to `/api/intake/submit` (scheduled via `ctx.waitUntil`) extracts demand signals, classifies them with Gemini flash against the 9-module catalog, stores them in D1, and raises a Gemini-pro-drafted brief when a signal is high-value or a topic crosses a threshold. Pure decision logic is isolated and unit-tested; all Gemini calls take an injectable `fetchImpl` and fall back to templates on failure.

**Tech Stack:** Cloudflare Worker (TypeScript), D1 SQLite, Google Gemini API (flash + pro), Next.js 16 static export (admin page), Vitest.

**Spec:** `docs/superpowers/specs/2026-05-21-content-demand-radar-design.md`

**Test commands:** workers — `cd workers && npx vitest run`; web — `cd web && npx vitest run` and `cd web && npx tsc --noEmit`.

---

### Task 1: D1 migration for demand tables

**Files:**
- Create: `workers/migrations/0004_content_demand.sql`

- [ ] **Step 1: Write the migration SQL**

```sql
-- 0004_content_demand.sql — Content Demand Radar storage
CREATE TABLE IF NOT EXISTS content_demand_signals (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  source_question TEXT NOT NULL,            -- 'F3' | 'F2_other'
  raw_text        TEXT NOT NULL,
  classification  TEXT NOT NULL,            -- 'covered' | 'gap' | 'not_feasible' | 'unclassified'
  matched_module  TEXT,
  gap_topic_key   TEXT,
  gap_topic_label TEXT,                     -- JSON {ru,en}
  feasibility_note TEXT,
  value_tier      TEXT NOT NULL DEFAULT 'normal',
  brief_id        TEXT,
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demand_topic ON content_demand_signals (gap_topic_key, created_at);

CREATE TABLE IF NOT EXISTS content_demand_briefs (
  id            TEXT PRIMARY KEY,
  gap_topic_key TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'open', -- 'open' | 'accepted' | 'rejected' | 'shipped'
  proposal_json TEXT NOT NULL,
  signal_count  INTEGER NOT NULL,
  created_at    INTEGER NOT NULL,
  decided_at    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_brief_status ON content_demand_briefs (status, created_at);
```

- [ ] **Step 2: Apply locally to verify the SQL parses**

Run: `cd workers && npx wrangler d1 execute tochka-sborki-db --local --file=migrations/0004_content_demand.sql`
Expected: command succeeds (tables created in the local D1). If `--local` DB does not exist yet, that is fine — the command creates it. The goal is only to confirm the SQL is valid.

- [ ] **Step 3: Commit**

```bash
git add workers/migrations/0004_content_demand.sql
git commit -m "feat(workers): migration 0004 — content demand signals + briefs tables"
```

> Remote D1 apply is deferred to Task 12 (owner runs it in the Cloudflare dashboard console; the prod API token lacks D1 migration permission).

---

### Task 2: Add OWNER_EMAIL to the Env type

**Files:**
- Modify: `workers/src/lib/types.ts:1-10`

- [ ] **Step 1: Add the field to the Env interface**

In `workers/src/lib/types.ts`, add `OWNER_EMAIL` to the `Env` interface so it reads:

```ts
export interface Env {
  DB: D1Database
  WORKER_JWT_SECRET: string
  RESEND_API_KEY: string
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
  N8N_CRM_WEBHOOK_URL: string
  N8N_CRM_SECRET: string
  GEMINI_API_KEY: string
  OWNER_EMAIL: string
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `cd workers && npx tsc --noEmit`
Expected: exit 0 (no errors).

- [ ] **Step 3: Commit**

```bash
git add workers/src/lib/types.ts
git commit -m "feat(workers): add OWNER_EMAIL to Env"
```

---

### Task 3: Pure demand-signal logic

**Files:**
- Create: `workers/src/lib/demand-signals.ts`
- Test: `workers/src/lib/demand-signals.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/demand-signals.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { extractSignals, valueTier, normalizeTopicKey, shouldRaiseBrief, THRESHOLD } from './demand-signals'

describe('extractSignals', () => {
  it('picks F3 and F2__other, trims, skips empties', () => {
    const s = extractSignals({ F3: '  automate my DMs ', F2__other: 'tarot reader', F1: 'solo' })
    expect(s).toEqual([
      { source: 'F3', text: 'automate my DMs' },
      { source: 'F2_other', text: 'tarot reader' },
    ])
  })
  it('returns empty when no demand text', () => {
    expect(extractSignals({ F3: '   ', F1: 'solo' })).toEqual([])
    expect(extractSignals({})).toEqual([])
  })
})

describe('valueTier', () => {
  it('high when F5=yes regardless of gemini', () => {
    expect(valueTier({ F5: 'yes' }, 'normal')).toBe('high')
  })
  it('high when gemini says high', () => {
    expect(valueTier({ F5: 'no' }, 'high')).toBe('high')
  })
  it('normal otherwise', () => {
    expect(valueTier({ F5: 'no' }, 'normal')).toBe('normal')
    expect(valueTier({}, 'normal')).toBe('normal')
  })
})

describe('normalizeTopicKey', () => {
  it('produces a stable kebab slug', () => {
    expect(normalizeTopicKey('Telegram Intake Bot!')).toBe('telegram-intake-bot')
    expect(normalizeTopicKey('  already-kebab  ')).toBe('already-kebab')
    expect(normalizeTopicKey('A/B   testing')).toBe('ab-testing')
  })
})

describe('shouldRaiseBrief', () => {
  it('false if an open brief already exists', () => {
    expect(shouldRaiseBrief('high', 99, true)).toBe(false)
  })
  it('true for high-value when no open brief', () => {
    expect(shouldRaiseBrief('high', 0, false)).toBe(true)
  })
  it('true at or above threshold', () => {
    expect(shouldRaiseBrief('normal', THRESHOLD, false)).toBe(true)
  })
  it('false below threshold', () => {
    expect(shouldRaiseBrief('normal', THRESHOLD - 1, false)).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/demand-signals.test.ts`
Expected: FAIL — cannot find module `./demand-signals`.

- [ ] **Step 3: Write the implementation**

Create `workers/src/lib/demand-signals.ts`:

```ts
export interface DemandSignal {
  source: 'F3' | 'F2_other'
  text: string
}

export const THRESHOLD = 5
export const WINDOW_MS = 90 * 24 * 60 * 60 * 1000

export function extractSignals(answers: Record<string, unknown>): DemandSignal[] {
  const out: DemandSignal[] = []
  const f3 = answers['F3']
  if (typeof f3 === 'string' && f3.trim()) out.push({ source: 'F3', text: f3.trim() })
  const f2 = answers['F2__other']
  if (typeof f2 === 'string' && f2.trim()) out.push({ source: 'F2_other', text: f2.trim() })
  return out
}

export function valueTier(answers: Record<string, unknown>, geminiTier: string): 'high' | 'normal' {
  if (answers['F5'] === 'yes') return 'high'
  return geminiTier === 'high' ? 'high' : 'normal'
}

export function normalizeTopicKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function shouldRaiseBrief(tier: 'high' | 'normal', topicCount: number, hasOpenBrief: boolean): boolean {
  if (hasOpenBrief) return false
  if (tier === 'high') return true
  return topicCount >= THRESHOLD
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/demand-signals.test.ts`
Expected: PASS (all assertions).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/demand-signals.ts workers/src/lib/demand-signals.test.ts
git commit -m "feat(workers): pure demand-signal extraction and brief-trigger logic"
```

---

### Task 4: Course catalog

**Files:**
- Create: `workers/src/lib/course-catalog.ts`
- Test: `workers/src/lib/course-catalog.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/course-catalog.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { COURSE_CATALOG } from './course-catalog'

describe('COURSE_CATALOG', () => {
  it('has all 9 module slugs in order', () => {
    expect(COURSE_CATALOG.map(e => e.slug)).toEqual([
      '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
      '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools', '08-agent-engineering',
    ])
  })
  it('every entry has bilingual topic text', () => {
    for (const e of COURSE_CATALOG) {
      expect(e.topic.ru.length).toBeGreaterThan(0)
      expect(e.topic.en.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/course-catalog.test.ts`
Expected: FAIL — cannot find module `./course-catalog`.

- [ ] **Step 3: Write the implementation**

Create `workers/src/lib/course-catalog.ts`:

```ts
export interface CatalogEntry {
  slug: string
  topic: { ru: string; en: string }
}

// One-line topic per module — the grounding the demand classifier matches against.
export const COURSE_CATALOG: CatalogEntry[] = [
  { slug: '00-kickstart', topic: { ru: 'Карта местности для нонкодеров: что такое agentic AI и зачем', en: 'Orientation map for non-coders: what agentic AI is and why' } },
  { slug: '01-introduction', topic: { ru: 'Software 3.0, четыре сдвига в работе с ИИ', en: 'Software 3.0 and the four shifts in working with AI' } },
  { slug: '02-setup-guide', topic: { ru: 'Установка инструментов: Warp, Claude Code, Git, Marp', en: 'Installing tools: Warp, Claude Code, Git, Marp' } },
  { slug: '03-stack-selection', topic: { ru: 'Выбор стека: Claude/Sovereign/Cloud-OSS/Behind-GFW, Hermes, миграция', en: 'Choosing a stack: Claude/Sovereign/Cloud-OSS/Behind-GFW, Hermes, migration' } },
  { slug: '04-prompt-engineering', topic: { ru: 'Промпт-инжиниринг, магические слова, структура запроса', en: 'Prompt engineering, magic words, request structure' } },
  { slug: '05-context-memory', topic: { ru: 'Контекст, память, файлы контекста для агентов', en: 'Context, memory, and context files for agents' } },
  { slug: '06-audio-pipeline', topic: { ru: 'Pipeline: скрапинг → анализ → insights, работа с аудио/контентом', en: 'Pipeline: scraping → analysis → insights, working with audio/content' } },
  { slug: '07-tools', topic: { ru: 'MCP-серверы, Agent Skills, Hooks, Superpowers', en: 'MCP servers, Agent Skills, Hooks, Superpowers' } },
  { slug: '08-agent-engineering', topic: { ru: 'Агентский инжиниринг и оркестрация многоагентных систем', en: 'Agent engineering and multi-agent orchestration' } },
]
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/course-catalog.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/course-catalog.ts workers/src/lib/course-catalog.test.ts
git commit -m "feat(workers): course catalog for demand grounding"
```

---

### Task 5: Gemini demand classifier

**Files:**
- Create: `workers/src/lib/demand-gemini.ts`
- Test: `workers/src/lib/demand-gemini.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/demand-gemini.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { classifyDemand } from './demand-gemini'
import { COURSE_CATALOG } from './course-catalog'

function geminiResponse(jsonText: string) {
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: jsonText }] } }] }) }
}

describe('classifyDemand', () => {
  it('parses a JSON array of classifications', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse(JSON.stringify([
      { classification: 'gap', matched_module: null, gap_topic_key: 'telegram-intake-bot',
        gap_topic_label: { ru: 'Телеграм-бот приёма заявок', en: 'Telegram intake bot' },
        feasibility_note: null, value_tier: 'high' },
    ])))
    const out = await classifyDemand([{ source: 'F3', text: 'bot that books my clients' }], COURSE_CATALOG, 'key', fetchImpl as any)
    expect(out).toHaveLength(1)
    expect(out[0].classification).toBe('gap')
    expect(out[0].gap_topic_key).toBe('telegram-intake-bot')
  })

  it('falls back to unclassified markers on failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const out = await classifyDemand(
      [{ source: 'F3', text: 'x' }, { source: 'F2_other', text: 'y' }],
      COURSE_CATALOG, 'key', fetchImpl as any,
    )
    expect(out).toHaveLength(2)
    expect(out.every(c => c.classification === 'unclassified')).toBe(true)
    expect(out.every(c => c.value_tier === 'normal')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/demand-gemini.test.ts`
Expected: FAIL — cannot find module `./demand-gemini`.

- [ ] **Step 3: Write the implementation**

Create `workers/src/lib/demand-gemini.ts`:

```ts
import type { CatalogEntry } from './course-catalog'

export interface DemandClassification {
  classification: 'covered' | 'gap' | 'not_feasible' | 'unclassified'
  matched_module: string | null
  gap_topic_key: string | null
  gap_topic_label: { ru: string; en: string } | null
  feasibility_note: string | null
  value_tier: 'high' | 'normal'
}

function unclassified(n: number): DemandClassification[] {
  return Array.from({ length: n }, () => ({
    classification: 'unclassified' as const,
    matched_module: null, gap_topic_key: null, gap_topic_label: null,
    feasibility_note: null, value_tier: 'normal' as const,
  }))
}

export async function classifyDemand(
  signals: { source: string; text: string }[],
  catalog: CatalogEntry[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DemandClassification[]> {
  if (!signals.length) return []
  const model = 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const catalogText = catalog.map(c => `${c.slug}: ${c.topic.en}`).join('\n')
  const signalsText = signals.map((s, i) => `${i}. (${s.source}) ${s.text}`).join('\n')
  const prompt = [
    `You triage learner requests for an AI course against its existing modules.`,
    `Course modules:\n${catalogText}`,
    `Learner requests (one per line, index-prefixed):\n${signalsText}`,
    `For EACH request, decide: "covered" (an existing module already teaches it — set matched_module to its slug),`,
    `"gap" (feasible to build in an agentic-AI environment but not yet covered — set gap_topic_key to a short english kebab slug and gap_topic_label to {ru,en}),`,
    `or "not_feasible" (cannot be done with agentic AI — set feasibility_note explaining why).`,
    `Also set value_tier: "high" if it implies direct revenue or an explicit deadline, else "normal".`,
    `Return STRICT JSON array, one object per request IN ORDER, each:`,
    `{"classification","matched_module","gap_topic_key","gap_topic_label","feasibility_note","value_tier"}.`,
    `Use null for fields that do not apply.`,
  ].join('\n')
  try {
    const res = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
      }),
    })
    if (!res.ok) throw new Error(`gemini ${res.status}`)
    const data = await res.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text) as DemandClassification[]
    if (!Array.isArray(parsed) || parsed.length !== signals.length) throw new Error('shape')
    return parsed
  } catch {
    return unclassified(signals.length)
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/demand-gemini.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/demand-gemini.ts workers/src/lib/demand-gemini.test.ts
git commit -m "feat(workers): Gemini demand classifier with unclassified fallback"
```

---

### Task 6: Gemini brief drafter

**Files:**
- Modify: `workers/src/lib/demand-gemini.ts` (append)
- Modify: `workers/src/lib/demand-gemini.test.ts` (append)

- [ ] **Step 1: Write the failing test (append to existing test file)**

Append to `workers/src/lib/demand-gemini.test.ts`:

```ts
import { draftBrief } from './demand-gemini'

describe('draftBrief', () => {
  const label = { ru: 'Телеграм-бот приёма заявок', en: 'Telegram intake bot' }

  it('parses a proposal JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(geminiResponse(JSON.stringify({
      proposed_type: 'unit', title: { ru: 'Бот заявок', en: 'Intake bot' },
      learning_objective: 'Build a Telegram intake bot', slot: 'unit inside 07-tools',
      agentic_approach: 'Use an agent + Telegram MCP', unit_count_estimate: 1,
      source_quotes: ['bot that books my clients'],
    })))
    const p = await draftBrief(label, ['bot that books my clients'], COURSE_CATALOG, 'key', fetchImpl as any)
    expect(p.proposed_type).toBe('unit')
    expect(p.title.en).toBe('Intake bot')
  })

  it('falls back to a template proposal on failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })
    const p = await draftBrief(label, ['q1', 'q2'], COURSE_CATALOG, 'key', fetchImpl as any)
    expect(p.proposed_type).toBe('unit')
    expect(p.title.ru).toContain('Телеграм-бот')
    expect(p.source_quotes).toEqual(['q1', 'q2'])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/demand-gemini.test.ts`
Expected: FAIL — `draftBrief` is not exported.

- [ ] **Step 3: Append the implementation to `workers/src/lib/demand-gemini.ts`**

```ts
export interface BriefProposal {
  proposed_type: 'module' | 'unit'
  title: { ru: string; en: string }
  learning_objective: string
  slot: string
  agentic_approach: string
  unit_count_estimate: number
  source_quotes: string[]
}

function fallbackBrief(label: { ru: string; en: string }, quotes: string[]): BriefProposal {
  return {
    proposed_type: 'unit',
    title: { ru: label.ru, en: label.en },
    learning_objective: label.en,
    slot: 'to be decided by architect',
    agentic_approach: 'Drafted from raw demand (Gemini unavailable); architect to specify.',
    unit_count_estimate: 1,
    source_quotes: quotes,
  }
}

export async function draftBrief(
  topicLabel: { ru: string; en: string },
  quotes: string[],
  catalog: CatalogEntry[],
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<BriefProposal> {
  const model = 'gemini-2.5-pro'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const catalogText = catalog.map(c => `${c.slug}: ${c.topic.en}`).join('\n')
  const prompt = [
    `You are a course architect for an agentic-AI course. Learners asked for content not yet covered.`,
    `Topic: ${topicLabel.en} / ${topicLabel.ru}.`,
    `Learner quotes:\n${quotes.map(q => `- ${q}`).join('\n')}`,
    `Existing modules:\n${catalogText}`,
    `Pedagogy: each unit follows 4 phases — Activation, Reflection, Concept, Practice. Modules are numbered 00–08.`,
    `Propose how to deliver this. Return STRICT JSON:`,
    `{"proposed_type":"module"|"unit","title":{"ru","en"},"learning_objective","slot","agentic_approach","unit_count_estimate","source_quotes"}.`,
    `"slot" says where it fits (e.g. "unit inside 07-tools" or "new module after 08-agent-engineering").`,
    `"agentic_approach" explains how it is built and taught using agentic AI. Echo the input quotes in source_quotes.`,
  ].join('\n')
  try {
    const res = await fetchImpl(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.6 },
      }),
    })
    if (!res.ok) throw new Error(`gemini ${res.status}`)
    const data = await res.json() as any
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    const parsed = JSON.parse(text) as BriefProposal
    if (!parsed?.title?.ru || !parsed?.proposed_type) throw new Error('shape')
    return parsed
  } catch {
    return fallbackBrief(topicLabel, quotes)
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/demand-gemini.test.ts`
Expected: PASS (all four cases — classify ×2, draft ×2).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/demand-gemini.ts workers/src/lib/demand-gemini.test.ts
git commit -m "feat(workers): Gemini brief drafter with template fallback"
```

---

### Task 7: requireOwner middleware

**Files:**
- Modify: `workers/src/middleware.ts` (append)
- Test: `workers/src/middleware.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/middleware.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest'
import { requireOwner } from './middleware'

vi.mock('./lib/jwt', () => ({
  verifyJWT: async (token: string) => token === 'owner'
    ? { sub: 'u1', email: 'owner@x.com', iat: 0, exp: 0 }
    : token === 'other' ? { sub: 'u2', email: 'someone@x.com', iat: 0, exp: 0 } : null,
}))

function req(cookie: string) {
  return new Request('https://x/api/admin/x', { headers: { Cookie: cookie } })
}
const env = { WORKER_JWT_SECRET: 's', OWNER_EMAIL: 'owner@x.com' } as any

describe('requireOwner', () => {
  it('401 without session', async () => {
    const r = await requireOwner(req(''), env)
    expect((r as Response).status).toBe(401)
  })
  it('403 for a non-owner', async () => {
    const r = await requireOwner(req('session=other'), env)
    expect((r as Response).status).toBe(403)
  })
  it('returns payload for the owner', async () => {
    const r = await requireOwner(req('session=owner'), env)
    expect((r as any).email).toBe('owner@x.com')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/middleware.test.ts`
Expected: FAIL — `requireOwner` is not exported.

- [ ] **Step 3: Append the implementation to `workers/src/middleware.ts`**

```ts
export async function requireOwner(
  request: Request,
  env: Env
): Promise<JWTPayload | Response> {
  const auth = await requireAuth(request, env)
  if (auth instanceof Response) return auth
  if (!env.OWNER_EMAIL || auth.email !== env.OWNER_EMAIL) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }
  return auth
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/middleware.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/middleware.ts workers/src/middleware.test.ts
git commit -m "feat(workers): requireOwner middleware (owner-gated admin)"
```

---

### Task 8: Admin handlers (list briefs, list signals, decide)

**Files:**
- Create: `workers/src/handlers/demand.ts`
- Test: `workers/src/handlers/demand.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/demand.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { listBriefs, listSignals, decideBrief } from './demand'

// fake D1 that records the last SQL + bindings and returns canned rows
function fakeDb(rows: any[] = []) {
  const calls: { sql: string; binds: any[] }[] = []
  const db = {
    calls,
    prepare(sql: string) {
      return {
        bind(...binds: any[]) {
          calls.push({ sql, binds })
          return {
            all: async () => ({ results: rows }),
            first: async () => rows[0] ?? null,
            run: async () => ({ success: true }),
          }
        },
        all: async () => ({ results: rows }),
        first: async () => rows[0] ?? null,
        run: async () => ({ success: true }),
      }
    },
  } as any
  return db
}

describe('listBriefs', () => {
  it('parses proposal_json and returns 200', async () => {
    const db = fakeDb([{ id: 'b1', gap_topic_key: 'x', status: 'open', signal_count: 3,
      proposal_json: JSON.stringify({ title: { ru: 'Т', en: 'T' } }), created_at: 1, decided_at: null }])
    const res = await listBriefs(db, 'open')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].proposal.title.en).toBe('T')
  })
})

describe('decideBrief', () => {
  it('rejects an invalid status', async () => {
    const res = await decideBrief(fakeDb(), 'b1', 'bogus')
    expect(res.status).toBe(400)
  })
  it('accepts a valid status', async () => {
    const db = fakeDb()
    const res = await decideBrief(db, 'b1', 'accepted')
    expect(res.status).toBe(200)
    expect(db.calls.some((c: any) => c.binds.includes('accepted') && c.binds.includes('b1'))).toBe(true)
  })
})

describe('listSignals', () => {
  it('returns 200 with rows', async () => {
    const db = fakeDb([{ gap_topic_key: 'x', n: 4 }])
    const res = await listSignals(db)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/demand.test.ts`
Expected: FAIL — cannot find module `./demand`.

- [ ] **Step 3: Write the implementation**

Create `workers/src/handlers/demand.ts`:

```ts
const VALID_STATUS = ['open', 'accepted', 'rejected', 'shipped']

export async function listBriefs(db: D1Database, status?: string): Promise<Response> {
  const rows = status
    ? (await db.prepare('SELECT * FROM content_demand_briefs WHERE status = ? ORDER BY created_at DESC').bind(status).all()).results
    : (await db.prepare('SELECT * FROM content_demand_briefs ORDER BY created_at DESC').all()).results
  const briefs = (rows ?? []).map((r: any) => ({
    ...r,
    proposal: safeParse(r.proposal_json),
  }))
  return Response.json(briefs)
}

export async function listSignals(db: D1Database, classification?: string): Promise<Response> {
  const rows = classification
    ? (await db.prepare('SELECT * FROM content_demand_signals WHERE classification = ? ORDER BY created_at DESC').bind(classification).all()).results
    : (await db.prepare('SELECT * FROM content_demand_signals ORDER BY created_at DESC').all()).results
  return Response.json(rows ?? [])
}

export async function decideBrief(db: D1Database, id: string, status: string): Promise<Response> {
  if (!VALID_STATUS.includes(status)) {
    return Response.json({ error: 'invalid_status' }, { status: 400 })
  }
  await db.prepare('UPDATE content_demand_briefs SET status = ?, decided_at = ? WHERE id = ?')
    .bind(status, Date.now(), id).run()
  return Response.json({ ok: true })
}

function safeParse(s: string): unknown {
  try { return JSON.parse(s) } catch { return null }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/demand.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/src/handlers/demand.ts workers/src/handlers/demand.test.ts
git commit -m "feat(workers): admin handlers for demand briefs and signals"
```

---

### Task 9: Demand radar orchestrator

**Files:**
- Modify: `workers/src/handlers/demand.ts` (append `runDemandRadar`)
- Modify: `workers/src/handlers/demand.test.ts` (append)

- [ ] **Step 1: Write the failing test (append)**

Append to `workers/src/handlers/demand.test.ts`:

```ts
import { runDemandRadar } from './demand'
import { vi } from 'vitest'

function geminiResp(jsonText: string) {
  return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: jsonText }] } }] }) }
}

// fake D1 that tracks inserts into both tables and answers COUNT/open-brief queries
function radarDb() {
  const inserts: { table: string; binds: any[] }[] = []
  let openBrief: any = null
  const db = {
    inserts,
    prepare(sql: string) {
      return {
        bind(...binds: any[]) {
          return {
            run: async () => {
              if (sql.includes('INSERT INTO content_demand_signals')) inserts.push({ table: 'signals', binds })
              if (sql.includes('INSERT INTO content_demand_briefs')) { inserts.push({ table: 'briefs', binds }); openBrief = { id: binds[0] } }
              return { success: true }
            },
            first: async () => {
              if (sql.includes("status='open'")) return openBrief
              if (sql.includes('COUNT(*)')) return { n: 1 }
              return null
            },
            all: async () => ({ results: [{ raw_text: 'bot that books my clients' }] }),
          }
        },
      }
    },
  } as any
  return db
}

describe('runDemandRadar', () => {
  it('inserts a signal and raises a brief for a high-value gap', async () => {
    const db = radarDb()
    const fetchImpl = vi.fn().mockResolvedValue(geminiResp(JSON.stringify([
      { classification: 'gap', matched_module: null, gap_topic_key: 'telegram-intake-bot',
        gap_topic_label: { ru: 'Бот заявок', en: 'Intake bot' }, feasibility_note: null, value_tier: 'high' },
    ])))
    const env = { DB: db, GEMINI_API_KEY: 'k' } as any
    await runDemandRadar(env, 'u1', { F3: 'bot that books my clients', F5: 'yes' }, fetchImpl as any)
    expect(db.inserts.some((i: any) => i.table === 'signals')).toBe(true)
    expect(db.inserts.some((i: any) => i.table === 'briefs')).toBe(true)
  })

  it('does nothing when there are no demand signals', async () => {
    const db = radarDb()
    const fetchImpl = vi.fn()
    const env = { DB: db, GEMINI_API_KEY: 'k' } as any
    await runDemandRadar(env, 'u1', { F1: 'solo' }, fetchImpl as any)
    expect(db.inserts).toHaveLength(0)
    expect(fetchImpl).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/demand.test.ts`
Expected: FAIL — `runDemandRadar` is not exported.

- [ ] **Step 3: Append the implementation to `workers/src/handlers/demand.ts`**

Add imports at the top of the file (above the existing code):

```ts
import type { Env } from '../lib/types'
import { extractSignals, valueTier, normalizeTopicKey, shouldRaiseBrief, WINDOW_MS } from '../lib/demand-signals'
import { classifyDemand, draftBrief } from '../lib/demand-gemini'
import { COURSE_CATALOG } from '../lib/course-catalog'
```

Append at the end of the file:

```ts
export async function runDemandRadar(
  env: Env,
  userId: string,
  answers: Record<string, unknown>,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  try {
    const signals = extractSignals(answers)
    if (!signals.length) return
    const classifications = await classifyDemand(signals, COURSE_CATALOG, env.GEMINI_API_KEY, fetchImpl)
    const now = Date.now()
    for (let i = 0; i < signals.length; i++) {
      const s = signals[i]
      const c = classifications[i]
      const tier = valueTier(answers, c.value_tier)
      const topicKey = c.gap_topic_key ? normalizeTopicKey(c.gap_topic_key) : null
      await env.DB.prepare(
        `INSERT INTO content_demand_signals
           (id,user_id,source_question,raw_text,classification,matched_module,gap_topic_key,gap_topic_label,feasibility_note,value_tier,brief_id,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      ).bind(
        crypto.randomUUID(), userId, s.source, s.text, c.classification, c.matched_module, topicKey,
        c.gap_topic_label ? JSON.stringify(c.gap_topic_label) : null, c.feasibility_note, tier, null, now,
      ).run()

      if (c.classification === 'gap' && topicKey) {
        await maybeRaiseBrief(env, topicKey, c.gap_topic_label ?? { ru: topicKey, en: topicKey }, tier, now, fetchImpl)
      }
    }
  } catch (e) {
    console.error('demand radar error:', e)
  }
}

async function maybeRaiseBrief(
  env: Env,
  topicKey: string,
  label: { ru: string; en: string },
  tier: 'high' | 'normal',
  now: number,
  fetchImpl: typeof fetch,
): Promise<void> {
  const open = await env.DB.prepare(
    `SELECT id FROM content_demand_briefs WHERE gap_topic_key = ? AND status='open' LIMIT 1`,
  ).bind(topicKey).first()
  const hasOpen = !!open

  let count = 0
  if (tier !== 'high') {
    const row: any = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM content_demand_signals WHERE gap_topic_key = ? AND classification='gap' AND created_at > ?`,
    ).bind(topicKey, now - WINDOW_MS).first()
    count = (row?.n as number) ?? 0
  }

  if (!shouldRaiseBrief(tier, count, hasOpen)) return

  const quotesRes = await env.DB.prepare(
    `SELECT raw_text FROM content_demand_signals WHERE gap_topic_key = ? AND classification='gap'`,
  ).bind(topicKey).all()
  const quotes = (quotesRes.results ?? []).map((r: any) => r.raw_text as string)

  const proposal = await draftBrief(label, quotes, COURSE_CATALOG, env.GEMINI_API_KEY, fetchImpl)
  const briefId = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO content_demand_briefs (id,gap_topic_key,status,proposal_json,signal_count,created_at,decided_at)
     VALUES (?,?,'open',?,?,?,?)`,
  ).bind(briefId, topicKey, JSON.stringify(proposal), quotes.length, now, null).run()
  await env.DB.prepare(
    `UPDATE content_demand_signals SET brief_id = ? WHERE gap_topic_key = ? AND brief_id IS NULL`,
  ).bind(briefId, topicKey).run()
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/demand.test.ts`
Expected: PASS (list/decide cases from Task 8 + the two radar cases).

- [ ] **Step 5: Commit**

```bash
git add workers/src/handlers/demand.ts workers/src/handlers/demand.test.ts
git commit -m "feat(workers): demand radar orchestrator (classify, store, raise briefs)"
```

---

### Task 10: Wire the radar and admin routes into the Worker

**Files:**
- Modify: `workers/src/index.ts`

- [ ] **Step 1: Add imports**

In `workers/src/index.ts`, after the existing handler imports (line 5 area), add:

```ts
import { runDemandRadar, listBriefs, listSignals, decideBrief } from './handlers/demand'
import { requireAuth, requireOwner } from './middleware'
```

(Replace the existing `import { requireAuth } from './middleware'` line with the combined import above.)

- [ ] **Step 2: Add the execution context to the fetch signature**

Change the handler signature so it reads:

```ts
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
```

- [ ] **Step 3: Schedule the radar after a successful submit**

Find the `/api/intake/submit` branch. After `response = await handleIntakeSubmit(env.DB, auth.sub, { answers: body.answers ?? {} }, env.GEMINI_API_KEY)`, add the radar scheduling so the branch's `else` block becomes:

```ts
        } else {
          let body: { answers?: any }
          try { body = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }) }
          response = await handleIntakeSubmit(env.DB, auth.sub, { answers: body.answers ?? {} }, env.GEMINI_API_KEY)
          if (response.ok) ctx.waitUntil(runDemandRadar(env, auth.sub, body.answers ?? {}))
        }
```

- [ ] **Step 4: Add the admin routes**

Add these branches before the final `else { response = new Response('Not Found', { status: 404 }) }`:

```ts
      } else if (path === '/api/admin/content-demand/briefs' && method === 'GET') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth : await listBriefs(env.DB, url.searchParams.get('status') ?? undefined)
      } else if (path === '/api/admin/content-demand/signals' && method === 'GET') {
        const auth = await requireOwner(request, env)
        response = auth instanceof Response ? auth : await listSignals(env.DB, url.searchParams.get('classification') ?? undefined)
      } else if (path.startsWith('/api/admin/content-demand/briefs/') && method === 'PATCH') {
        const auth = await requireOwner(request, env)
        if (auth instanceof Response) {
          response = auth
        } else {
          const id = path.split('/').pop() ?? ''
          let b: { status?: string }
          try { b = await request.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }) }
          response = await decideBrief(env.DB, id, b.status ?? '')
        }
```

- [ ] **Step 5: Verify it typechecks and the full worker suite passes**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc exit 0; all test files pass (auth, intake, demand-signals, course-catalog, demand-gemini, middleware, demand).

- [ ] **Step 6: Commit**

```bash
git add workers/src/index.ts
git commit -m "feat(workers): wire demand radar (waitUntil) + owner-gated admin routes"
```

---

### Task 11: Admin page (web)

**Files:**
- Create: `web/app/admin/content-demand/page.tsx`
- Create: `web/app/admin/content-demand/content-demand-client.tsx`

- [ ] **Step 1: Create the server page**

Create `web/app/admin/content-demand/page.tsx`:

```tsx
import { ContentDemandClient } from './content-demand-client'

export default function Page() {
  return <ContentDemandClient />
}
```

- [ ] **Step 2: Create the client component**

Create `web/app/admin/content-demand/content-demand-client.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'

interface Brief {
  id: string
  gap_topic_key: string
  status: string
  signal_count: number
  proposal: {
    proposed_type: string
    title: { ru: string; en: string }
    learning_objective: string
    slot: string
    agentic_approach: string
    unit_count_estimate: number
    source_quotes: string[]
  } | null
}

interface Signal {
  id: string
  source_question: string
  raw_text: string
  classification: string
  gap_topic_key: string | null
  feasibility_note: string | null
  value_tier: string
}

export function ContentDemandClient() {
  const [briefs, setBriefs] = useState<Brief[] | null>(null)
  const [signals, setSignals] = useState<Signal[]>([])
  const [error, setError] = useState<string | null>(null)

  function load() {
    fetch('/api/admin/content-demand/briefs?status=open', { credentials: 'include' })
      .then(r => {
        if (r.status === 401 || r.status === 403) { setError('Доступ только для владельца.'); return null }
        return r.ok ? r.json() : null
      })
      .then(d => { if (d) setBriefs(d) })
      .catch(() => setError('Не удалось загрузить.'))
    fetch('/api/admin/content-demand/signals', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setSignals(d) })
      .catch(() => {})
  }
  useEffect(load, [])

  async function decide(id: string, status: string) {
    await fetch(`/api/admin/content-demand/briefs/${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
    load()
  }

  if (error) return <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>{error}</main>
  if (!briefs) return <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>Загрузка…</main>

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '1.5rem' }}>Кузница квестов · открытые брифы</h1>
      {briefs.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Пока нет открытых брифов.</p>}
      {briefs.map(b => (
        <div key={b.id} style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: '1.2rem', marginBottom: '1.2rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.7rem', color: 'var(--text-accent)', textTransform: 'uppercase' }}>
            {b.proposal?.proposed_type} · {b.gap_topic_key} · {b.signal_count} сигнал(ов)
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '.4rem 0' }}>{b.proposal?.title.ru}</h2>
          <p style={{ margin: '.3rem 0' }}><b>Цель:</b> {b.proposal?.learning_objective}</p>
          <p style={{ margin: '.3rem 0' }}><b>Куда:</b> {b.proposal?.slot} · ~{b.proposal?.unit_count_estimate} юнит(ов)</p>
          <p style={{ margin: '.3rem 0' }}><b>Agentic-подход:</b> {b.proposal?.agentic_approach}</p>
          {b.proposal?.source_quotes?.length ? (
            <ul style={{ margin: '.5rem 0', paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '.85rem' }}>
              {b.proposal.source_quotes.map((q, i) => <li key={i}>«{q}»</li>)}
            </ul>
          ) : null}
          <div style={{ display: 'flex', gap: 10, marginTop: '.8rem' }}>
            <button onClick={() => decide(b.id, 'accepted')} style={{ background: 'var(--text-accent)', color: '#000', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>Принять</button>
            <button onClick={() => decide(b.id, 'rejected')} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>Отклонить</button>
          </div>
        </div>
      ))}

      <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2.5rem 0 1rem' }}>Сигналы спроса</h2>
      {signals.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>Сигналов пока нет.</p>}
      {signals.map(s => (
        <div key={s.id} style={{ borderLeft: '3px solid var(--border-color)', paddingLeft: '.9rem', margin: '.7rem 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '.66rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {s.classification}{s.gap_topic_key ? ` · ${s.gap_topic_key}` : ''} · {s.source_question} · {s.value_tier}
          </div>
          <div style={{ fontSize: '.9rem' }}>«{s.raw_text}»</div>
          {s.feasibility_note && <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>↳ {s.feasibility_note}</div>}
        </div>
      ))}
    </main>
  )
}
```

This single list covers the spec's "signal queue" and "not feasible" views: `not_feasible` rows render
inline with their `feasibility_note`, and each row shows its `classification` + `gap_topic_key` + `value_tier`.

- [ ] **Step 3: Verify the web build generates the route and typechecks**

Run: `cd web && npx tsc --noEmit && npx next build`
Expected: tsc exit 0; build succeeds and the output includes `/admin/content-demand` as a static route.

- [ ] **Step 4: Commit**

```bash
git add web/app/admin/content-demand/page.tsx web/app/admin/content-demand/content-demand-client.tsx
git commit -m "feat(web): owner admin page for content-demand briefs (Quest Forge)"
```

---

### Task 12: Deployment — remote migration, OWNER_EMAIL, push

**Files:**
- Modify: `workers/wrangler.toml` (add `[vars]` entry if vars block exists; otherwise instruct secret)

- [ ] **Step 1: Add OWNER_EMAIL as a Worker var**

Open `workers/wrangler.toml`. If it has a `[vars]` table, add `OWNER_EMAIL = "mamaev.sasha@gmail.com"`. If there is no `[vars]` table, add one:

```toml
[vars]
OWNER_EMAIL = "mamaev.sasha@gmail.com"
```

> `OWNER_EMAIL` is the owner's login email; this gates the admin routes. It is not a secret, so a plain var is appropriate. The value must match the email the owner logs in with (magic-link).

- [ ] **Step 2: Surface the remote migration SQL for the owner**

The prod CF API token cannot apply D1 migrations (code 7403/10000). Print the contents of `workers/migrations/0004_content_demand.sql` and instruct the owner to run it in the Cloudflare dashboard → D1 → `tochka-sborki-db` → Console. Do NOT attempt `wrangler d1 execute --remote` (it will fail on permissions).

Run (to display the SQL for copy-paste): `cat workers/migrations/0004_content_demand.sql`
Expected: the two `CREATE TABLE` + two `CREATE INDEX` statements from Task 1.

- [ ] **Step 3: Commit the wrangler change and push**

```bash
git add workers/wrangler.toml
git commit -m "chore(workers): set OWNER_EMAIL var for admin gating"
git push
```

- [ ] **Step 4: Verify CI deploy**

Run: `gh run list --branch main --limit 1`
Expected: the latest run for this push completes with status `success` (deploys web + workers).

- [ ] **Step 5: Post-deploy smoke (manual, owner)**

After the owner has (a) run the 0004 SQL in the dashboard console and (b) CI has deployed:
- Log in as the owner, submit an intake answer with a clear gap + deadline (F3 = a concrete novel AI outcome, F5 = yes) → expect a signal + brief to be created.
- Visit `https://ai.mamaev.coach/admin/content-demand/` → expect the open brief to render with accept/reject.
- Log in as a non-owner (or hit the API unauthenticated) → expect 403/401.

---

## Notes for the executor

- Run worker tests from `workers/` and web checks from `web/` — they are separate vitest projects.
- All Gemini wrappers and `runDemandRadar` accept an injected `fetchImpl`; tests must use it and never hit the network.
- The radar must never throw into the request path — it runs inside `ctx.waitUntil` and is wrapped in try/catch.
- Update the program tracker (`docs/superpowers/specs/2026-05-19-rpg-roadmap-program.md`) "Current position" after shipping, noting Content Demand Radar shipped and the remote-migration + OWNER_EMAIL steps.
