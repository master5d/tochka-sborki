# `/api/feedback` → direct D1 (drop n8n) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist course-feedback submissions directly in a new D1 table instead of forwarding them to n8n, so `ModuleSurvey`/`FeedbackForm` can never 502 and lose data.

**Architecture:** Replace the n8n `fetch` in `handleFeedback` with an `INSERT` into a new additive `course_feedback` table. Drop the now-unused `N8N_WEBHOOK_*` fields from `Env` and the stale test-env literals. Mirrors the `/api/leads/capture` direct-D1 pattern. No dual-write, no Resend, no admin view.

**Tech Stack:** Cloudflare Worker (TypeScript) + D1, Vitest (env=node).

## Global Constraints

- **Full replace** — no n8n forward, no dual-write. After this change `N8N_*` appears nowhere in `workers/src/`.
- `course_feedback` columns/order: `(id, lesson, recommend, impact, apply, unclear, other, locale, created_at)` — the handler's positional `INSERT` must match this exactly.
- `lesson` is the only required field (unchanged validation); Likert/open fields are nullable (the survey is skippable). Missing `lesson` → 400 with no insert.
- `id = crypto.randomUUID()`; `created_at = Math.floor(Date.now()/1000)`; optional fields bound via `?? null`.
- `handleFeedback(request, env)` signature unchanged (plain awaited insert; no `ctx`).
- Migration is **additive**; prod application is via the cloudflare-api MCP `/query` (zero-token), not wrangler.
- Worker tests: `cd workers && npx vitest run src/`. Tests are env=node.
- All git commands run from repo root `C:\telo\Efforts\Ongoing\mc_hub` (use `cd` to the root in each commit step).

---

## File Structure

- `workers/migrations/0013_course_feedback.sql` — new additive `course_feedback` table (+ lesson index).
- `workers/src/handlers/feedback.ts` — rewrite: D1 insert, no n8n.
- `workers/src/handlers/feedback.test.ts` — rewrite: D1-persistence tests (drop n8n forward/502 tests).
- `workers/src/lib/types.ts` — remove `N8N_WEBHOOK_URL` + `N8N_WEBHOOK_SECRET` from `Env`.
- `workers/src/handlers/auth.test.ts` — remove stale `N8N_*` env literals.
- `workers/src/handlers/progress.test.ts` — remove stale `N8N_*` env literals.

---

## Task 1: Additive `course_feedback` migration

**Files:**
- Create: `workers/migrations/0013_course_feedback.sql`

**Interfaces:**
- Produces: a `course_feedback` table whose columns exactly match the Task 2 `INSERT`:
  `(id, lesson, recommend, impact, apply, unclear, other, locale, created_at)`.

- [ ] **Step 1: Write the migration file**

Create `workers/migrations/0013_course_feedback.sql`:

```sql
-- workers/migrations/0013_course_feedback.sql
-- Course-feedback submissions, persisted directly in D1 (replaces the n8n forward).
-- Likert/open fields are nullable — the post-class survey is skippable (only lesson required).
CREATE TABLE IF NOT EXISTS course_feedback (
  id TEXT PRIMARY KEY,
  lesson TEXT NOT NULL,
  recommend TEXT,
  impact TEXT,
  apply TEXT,
  unclear TEXT,
  other TEXT,
  locale TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_course_feedback_lesson ON course_feedback(lesson);
```

- [ ] **Step 2: Verify the column list/order matches the handler contract**

Run: `grep -nE "id|lesson|recommend|impact|apply|unclear|other|locale|created_at" workers/migrations/0013_course_feedback.sql`
Expected: the `CREATE TABLE` lists exactly these 9 columns, in this order; `lesson` and `created_at` are `NOT NULL`; `id` is `PRIMARY KEY`.

- [ ] **Step 3: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add workers/migrations/0013_course_feedback.sql
git commit -m "feat(workers): additive course_feedback table"
```

> **Note for the controller (not a code step):** apply this migration to the prod D1 via the cloudflare-api MCP `/query` before deploying the new handler. Local Vitest mocks the DB.

---

## Task 2: Rewrite `handleFeedback` for D1 persistence

**Files:**
- Modify: `workers/src/handlers/feedback.ts` (full rewrite of the handler body)
- Modify: `workers/src/handlers/feedback.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `course_feedback` table (Task 1); `Env` from `workers/src/lib/types.ts`.
- Produces: `handleFeedback(request: Request, env: Env): Promise<Response>` — unchanged signature; now persists to D1 and never calls n8n.

- [ ] **Step 1: Rewrite the failing tests**

Replace the entire contents of `workers/src/handlers/feedback.test.ts` with:

```ts
import { describe, it, expect } from 'vitest'
import { handleFeedback } from './feedback'
import type { Env } from '../lib/types'

type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { calls?: DbCall[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return { run: async () => ({ success: true }) }
      },
    }),
  } as unknown as D1Database
  return {
    DB,
    WORKER_JWT_SECRET: 'test-secret',
    RESEND_API_KEY: '',
  } as Env
}

function req(body: unknown) {
  return new Request('https://ai.mamaev.coach/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

const feedbackInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO course_feedback/.test(c.sql))

describe('handleFeedback', () => {
  it('returns 400 and writes nothing when lesson is missing', async () => {
    const calls: DbCall[] = []
    const res = await handleFeedback(req({ recommend: '5' }), makeEnv({ calls }))
    expect(res.status).toBe(400)
    expect(feedbackInsert(calls)).toBeUndefined()
  })

  it('persists a full payload to course_feedback and returns 200', async () => {
    const calls: DbCall[] = []
    const res = await handleFeedback(
      req({ lesson: '01-introduction', recommend: '5', impact: '4', apply: '5', unclear: 'x', other: 'y', locale: 'ru' }),
      makeEnv({ calls }),
    )
    expect(res.status).toBe(200)
    const ins = feedbackInsert(calls)
    expect(ins).toBeDefined()
    expect(ins!.binds).toContain('01-introduction')
  })

  it('persists a skippable (lesson-only) payload and returns 200', async () => {
    const calls: DbCall[] = []
    const res = await handleFeedback(req({ lesson: '01-introduction' }), makeEnv({ calls }))
    expect(res.status).toBe(200)
    expect(feedbackInsert(calls)).toBeDefined()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd workers && npx vitest run src/handlers/feedback.test.ts`
Expected: FAIL — the old `feedback.ts` calls `env.N8N_WEBHOOK_URL`/`fetch`, so the `course_feedback` insert these tests assert never happens (and the mock DB has no `run` path exercised); the new tests do not match the old behavior.

- [ ] **Step 3: Rewrite the handler**

Replace the entire contents of `workers/src/handlers/feedback.ts` with:

```ts
import type { Env } from '../lib/types'

interface FeedbackBody {
  lesson: string
  recommend?: string
  impact?: string
  apply?: string
  unclear?: string
  other?: string
  locale?: string
}

export async function handleFeedback(request: Request, env: Env): Promise<Response> {
  let body: FeedbackBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.lesson) {
    return Response.json({ error: 'Missing required field: lesson' }, { status: 400 })
  }

  await env.DB.prepare(
    `INSERT INTO course_feedback (id, lesson, recommend, impact, apply, unclear, other, locale, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    body.lesson,
    body.recommend ?? null,
    body.impact ?? null,
    body.apply ?? null,
    body.unclear ?? null,
    body.other ?? null,
    body.locale ?? null,
    Math.floor(Date.now() / 1000),
  ).run()

  return Response.json({ ok: true })
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd workers && npx vitest run src/handlers/feedback.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add workers/src/handlers/feedback.ts workers/src/handlers/feedback.test.ts
git commit -m "feat(workers): persist /api/feedback to D1 course_feedback, drop n8n forward"
```

---

## Task 3: Drop `N8N_WEBHOOK_*` from `Env` and stale test literals

**Files:**
- Modify: `workers/src/lib/types.ts`
- Modify: `workers/src/handlers/auth.test.ts`
- Modify: `workers/src/handlers/progress.test.ts`

**Interfaces:**
- Consumes: nothing. Removes two fields from the `Env` interface that no longer have any consumer (Task 2 removed the last one).

- [ ] **Step 1: Remove the two fields from the `Env` interface**

In `workers/src/lib/types.ts`, delete these two lines from the `Env` interface:

```ts
  N8N_WEBHOOK_URL: string
  N8N_WEBHOOK_SECRET: string
```

- [ ] **Step 2: Remove the stale literals from `auth.test.ts`**

In `workers/src/handlers/auth.test.ts`, delete these two lines from the `makeEnv` return object:

```ts
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
```

- [ ] **Step 3: Remove the stale literals from `progress.test.ts`**

In `workers/src/handlers/progress.test.ts`, delete these two lines from the `makeEnv` return object:

```ts
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
```

- [ ] **Step 4: Confirm `N8N_` is gone from worker source**

Run: `grep -rn "N8N_" workers/src`
Expected: NO matches (empty output). If anything remains, remove it (it is dead after this change).

- [ ] **Step 5: Run the full worker suite**

Run: `cd workers && npx vitest run src/`
Expected: PASS — all suites green (the `Env` type no longer requires `N8N_*`, and no test constructs them).

- [ ] **Step 6: Commit**

```bash
cd /c/telo/Efforts/Ongoing/mc_hub
git add workers/src/lib/types.ts workers/src/handlers/auth.test.ts workers/src/handlers/progress.test.ts
git commit -m "chore(workers): drop N8N_WEBHOOK_* from Env and stale test env literals"
```

---

## Self-Review (completed by plan author)

**1. Spec coverage:**
- `course_feedback` additive table → Task 1. ✅
- Handler rewrite (D1 insert, drop n8n fetch/secret/502, lesson-only required, nullable Likert) → Task 2. ✅
- Test rewrite (no-lesson→400 no-insert, full→insert+200 binds include lesson, skippable→insert+200) → Task 2. ✅
- `Env` cleanup + stale test literals → Task 3. ✅
- `grep N8N_ workers/src` empty (full detachment) → Task 3 Step 4. ✅
- Ops (prod migration + secret deletion) → controller notes (Task 1 note + handoff), gated post-merge. ✅
- No Resend, no admin view, no frontend change → none added (YAGNI honored). ✅

**2. Placeholder scan:** No TBD/TODO/"handle edge cases"; every code step carries complete code or an exact command. ✅

**3. Type consistency:**
- `course_feedback` 9-column order in Task 1 DDL matches the positional `INSERT … VALUES (?×9)` in Task 2. ✅
- `handleFeedback(request, env)` signature identical in Task 2 handler + test + the unchanged `index.ts` route (no route edit needed). ✅
- `Env` after Task 3 still carries `DB, WORKER_JWT_SECRET, RESEND_API_KEY, …` used by the Task 2 test's `makeEnv` cast. ✅

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-23-feedback-d1-migration.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints.

Which approach?
