# `/api/feedback` → direct D1 (drop n8n) — Design

**Ticket:** `fb_df698341da2a` (migrate `/api/feedback` off retired n8n to direct D1 —
ModuleSurvey/FeedbackForm 502 / data-loss risk).

**Date:** 2026-06-23

## Goal

Stop routing course-feedback submissions through n8n. Persist them directly in D1 so the
already-shipped `ModuleSurvey` and standalone `FeedbackForm` (both POST `/api/feedback`) can
never silently 502 and lose data. Full replace: no n8n forward, no dual-write.

## Verification findings (these scoped the ticket)

- **n8n IS still wired for feedback.** The worker `tochka-sborki-api` still has both
  `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` configured as secrets (only the CRM `N8N_CRM_*`
  secrets were removed in the 2026-06-15 CRM teardown). So feedback's n8n is a *different*,
  still-configured workflow — not the retired CRM one.
- **No recent traffic.** Worker observability shows zero feedback-trigger events in the last
  7 days, so the 502 hypothesis can't be confirmed empirically. The fix does not depend on
  resolving n8n's live/dead status: making D1 the source of truth removes the data-loss risk
  regardless.
- **`feedback.ts` is the only consumer** of `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` in
  worker `src/` (confirmed by grep). The rest are test-env stubs. So dropping n8n from
  feedback fully detaches n8n from mc_hub.
- **Decision (owner):** full replace → D1-only. The owner confirmed n8n-feedback is not
  needed; no useful downstream (owner email/sheet) to preserve.

## Decisions locked during brainstorming

1. **Direct D1, no forward, no dual-write.** Mirrors the just-shipped `/api/leads/capture`
   pattern (D1 = source of truth).
2. **New additive `course_feedback` table.** Likert + open fields are nullable (the survey
   is skippable — only `lesson` is required, unchanged from current validation).
3. **Remove `N8N_WEBHOOK_URL` + `N8N_WEBHOOK_SECRET` from the `Env` type** and from the
   stale test-env literals that set them. Deleting the actual worker secrets is an ops step
   (gated on the owner at deploy).
4. **No Resend** (feedback is not a CRM lead). **No admin view** (YAGNI — data simply stops
   being lost; an `/admin/feedback` view is a follow-up).
5. **No handler signature change** — `handleFeedback(request, env)` stays (a plain awaited
   D1 insert; no `ctx`/best-effort side-effect needed).

## Components

### `workers/migrations/0013_course_feedback.sql` (new, additive)

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

Applied to prod D1 `tochka-sborki-db` via the cloudflare-api MCP `/query` (zero-token).

### `workers/src/handlers/feedback.ts` (rewrite)

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

The n8n `fetch`, the `X-Webhook-Secret` header, and the 502 branch are all removed.

### `workers/src/handlers/feedback.test.ts` (rewrite)

Drop the n8n forward / 502 tests (they assert behavior that no longer exists). Use the
`DbCall`-capturing mock-DB harness (same idiom as `auth.test.ts`/`leads-capture.test.ts`).
New tests:
- missing `lesson` (`{ recommend: '5' }`) → **400**, no `course_feedback` insert.
- full payload (`{ lesson, recommend, impact, apply, unclear, other, locale }`) → **200**,
  asserts an `INSERT INTO course_feedback` call whose binds include the `lesson`.
- skippable (`{ lesson: '01-introduction' }`, Likert omitted) → **200**, asserts the insert
  happened (nullable fields).

### `workers/src/lib/types.ts` (modified)

Remove the `N8N_WEBHOOK_URL: string` and `N8N_WEBHOOK_SECRET: string` lines from the `Env`
interface.

### `workers/src/handlers/auth.test.ts`, `workers/src/handlers/progress.test.ts` (modified)

Remove the now-stale `N8N_WEBHOOK_URL: ''` / `N8N_WEBHOOK_SECRET: ''` lines from their
`makeEnv` literals (dead after the `Env` change). No other change.

## Data flow

```
POST /api/feedback { lesson, recommend?, impact?, apply?, unclear?, other?, locale? }
  → invalid JSON → 400
  → !lesson → 400
  → INSERT course_feedback (id=uuid, created_at=unix) → 200 { ok: true }
```

## Edge cases

- **All Likert skipped** → nullable columns store `null`; insert succeeds → 200.
- **No `lesson`** → 400, nothing written (unchanged contract).
- **Malformed JSON** → 400.
- D1 insert failure (transient) → the unhandled rejection surfaces via the `index.ts` outer
  try as a 500 (acceptable — same as other handlers; no data is silently dropped, the client
  can retry). No n8n, so no 502 path remains.

## Testing

`workers/` (env=node, `cd workers && npx vitest run src/`):
- `feedback.test.ts` — the three cases above.
- The full suite must stay green after the `Env`/test-literal cleanup (auth, progress,
  leads-capture, etc. all construct `Env`).

## Files

| File | Responsibility |
|---|---|
| `workers/migrations/0013_course_feedback.sql` | additive `course_feedback` table |
| `workers/src/handlers/feedback.ts` | persist to D1, drop n8n |
| `workers/src/handlers/feedback.test.ts` | rewrite tests for D1 persistence |
| `workers/src/lib/types.ts` | drop `N8N_WEBHOOK_URL`/`N8N_WEBHOOK_SECRET` from `Env` |
| `workers/src/handlers/auth.test.ts` | remove stale `N8N_*` env literals |
| `workers/src/handlers/progress.test.ts` | remove stale `N8N_*` env literals |

One additive migration; direct D1; no n8n; no Resend. ~4 TDD tasks.

## Ops (post-merge, gated on owner)

- Apply migration 0013 to prod D1 via cloudflare-api MCP `/query`.
- Delete the `N8N_WEBHOOK_URL` and `N8N_WEBHOOK_SECRET` secrets from the `tochka-sborki-api`
  worker (cloudflare-api) — after this, `N8N_*` appears nowhere in mc_hub.

## Out of scope

- An `/admin/feedback` view (follow-up; mirror `/admin/leads`).
- Backfilling any feedback that may have been lost while n8n was unreachable (unrecoverable;
  no traffic in the last 7 days anyway).
- Touching `ModuleSurvey`/`FeedbackForm` frontends (their contract is unchanged — same POST,
  same fields; they just stop risking a 502).
