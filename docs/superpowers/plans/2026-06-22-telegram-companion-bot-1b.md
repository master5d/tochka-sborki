# Telegram Companion Bot — Slice 1b Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A daily CF cron that sends at most one "continue" nudge to each eligible learner via a pure guard-chain, plus `/stop`/`/start` opt-out wired into the existing webhook.

**Architecture:** A `scheduled()` Worker export calls `runDailyNudge`, which queries opted-in candidates, computes per-user next-lesson + activity, runs the pure `shouldNudge` guard-chain, and sends one nudge (reusing Slice 1a's `nextLesson`/`lessonUrl`/`sendMessage`). Opt-out toggled by `/stop` (set) and `/start` (clear) in the webhook.

**Tech Stack:** Cloudflare Workers (cron triggers + `scheduled`), D1 SQLite, raw Bot API, Vitest (env=node). Spec: `docs/superpowers/specs/2026-06-22-telegram-companion-bot-1b-design.md`.

**Conventions:** worker tests mock D1 (`prepare().bind().all()/run()/first()`) + `globalThis.fetch`. Run from `workers/`: `cd workers && npx vitest run <file>`. Cookie/handler patterns per Slice 1a (`handlers/telegram-webhook.ts`).

---

### Task 1: Nudge guard-chain (pure)

**Files:**
- Create: `workers/src/lib/nudge-policy.ts`
- Test: `workers/src/lib/nudge-policy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/nudge-policy.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { shouldNudge, THROTTLE_SEC, LAPSE_SEC } from './nudge-policy'

const NOW = 1_800_000_000
const base = { optout: false, lastNudgeAt: null as number | null, lastActivityAt: NOW - 2 * 24 * 3600, hasIncomplete: true, nowSec: NOW }

describe('shouldNudge', () => {
  it('nudges an eligible learner (incomplete, idle 2 days, never nudged)', () => {
    expect(shouldNudge(base)).toBe(true)
  })
  it('never nudges an opted-out learner', () => {
    expect(shouldNudge({ ...base, optout: true })).toBe(false)
  })
  it('never nudges a finished learner', () => {
    expect(shouldNudge({ ...base, hasIncomplete: false })).toBe(false)
  })
  it('skips when nudged within the throttle window', () => {
    expect(shouldNudge({ ...base, lastNudgeAt: NOW - (THROTTLE_SEC - 60) })).toBe(false)
  })
  it('skips a just-active learner (mid-session)', () => {
    expect(shouldNudge({ ...base, lastActivityAt: NOW - 3600 })).toBe(false)
  })
  it('stops nudging a lapsed learner (> 14 days idle)', () => {
    expect(shouldNudge({ ...base, lastActivityAt: NOW - (LAPSE_SEC + 3600) })).toBe(false)
  })
  it('gives a brand-new signup a quiet day (activity == created, just now)', () => {
    expect(shouldNudge({ ...base, lastActivityAt: NOW - 3600 })).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/nudge-policy.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `workers/src/lib/nudge-policy.ts`:

```ts
export const THROTTLE_SEC = 20 * 60 * 60        // 20h — at most one nudge/day; dedupes double cron runs
export const ACTIVE_SEC = 20 * 60 * 60          // 20h — skip if the learner was just active
export const LAPSE_SEC = 14 * 24 * 60 * 60      // 14d — stop nudging the lapsed

export interface NudgeInput {
  optout: boolean
  lastNudgeAt: number | null
  lastActivityAt: number      // MAX(viewed, completed) ?? created_at
  hasIncomplete: boolean
  nowSec: number
}

// Priority guard-chain (mirrors web wellbeing/select-nudge): returns whether to send today.
export function shouldNudge(i: NudgeInput): boolean {
  if (i.optout) return false
  if (!i.hasIncomplete) return false
  if (i.lastNudgeAt != null && i.nowSec - i.lastNudgeAt < THROTTLE_SEC) return false
  if (i.nowSec - i.lastActivityAt < ACTIVE_SEC) return false
  if (i.nowSec - i.lastActivityAt > LAPSE_SEC) return false
  return true
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/nudge-policy.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/nudge-policy.ts workers/src/lib/nudge-policy.test.ts
git commit -m "feat(workers): nudge-policy guard-chain (throttle/active/lapse/optout)"
```

---

### Task 2: Add the `/stop` intent to the parser

**Files:**
- Modify: `workers/src/lib/telegram-update.ts`
- Modify: `workers/src/lib/telegram-update.test.ts`

- [ ] **Step 1: Add the failing test**

In `workers/src/lib/telegram-update.test.ts`, add inside the `describe('parseUpdate', …)` block (before its closing `})`):

```ts
  it('parses /stop', () => {
    const r = parseUpdate({ message: { text: '/stop', from: { id: 8 }, chat: { id: 8 } } })
    expect(r.kind).toBe('stop')
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: FAIL — `kind` is `'other'`, expected `'stop'`.

- [ ] **Step 3: Implement**

In `workers/src/lib/telegram-update.ts`, change the `kind` union on the `BotIntent` interface:

```ts
  kind: 'start' | 'continue' | 'stop' | 'other'
```

And in the `if (u.message) { … }` branch, add the `/stop` case after the `/continue` case:

```ts
    if (/^\/start(\b|@|$)/.test(text)) kind = 'start'
    else if (/^\/continue(\b|@|$)/.test(text)) kind = 'continue'
    else if (/^\/stop(\b|@|$)/.test(text)) kind = 'stop'
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/telegram-update.ts workers/src/lib/telegram-update.test.ts
git commit -m "feat(workers): parse /stop intent"
```

---

### Task 3: Opt-out copy + webhook /stop and /start re-subscribe

**Files:**
- Modify: `workers/src/lib/bot-copy.ts`
- Modify: `workers/src/handlers/telegram-webhook.ts`
- Modify: `workers/src/handlers/telegram-webhook.test.ts`

- [ ] **Step 1: Extend the copy type + both locales**

In `workers/src/lib/bot-copy.ts`, add four fields to `interface BotCopy` (after `hint: string`):

```ts
  hint: string
  nudgeIntro: string
  nudgeLabel: string
  stopAck: string
  startResub: string
}
```

Add them to `RU` (after `hint: …`):

```ts
  hint: 'Я подскажу, что дальше. Жми кнопку ниже.',
  nudgeIntro: 'Привет! Не теряем темп — у тебя есть незаконченный модуль. Продолжим?',
  nudgeLabel: '▶️ Продолжить',
  stopAck: 'Окей, больше не буду напоминать. Захочешь снова — отправь /start.',
  startResub: 'Снова на связи — буду мягко напоминать продолжить. Выключить в любой момент: /stop.',
```

Add them to `EN` (after `hint: …`):

```ts
  hint: "I'll point you to what's next. Tap the button below.",
  nudgeIntro: "Hey! Let's keep the momentum — you've got an unfinished module. Continue?",
  nudgeLabel: '▶️ Continue',
  stopAck: "Got it — I won't remind you anymore. Want them back? Send /start.",
  startResub: "Back on — I'll gently remind you to continue. Turn off anytime: /stop.",
```

- [ ] **Step 2: Add the failing webhook tests**

In `workers/src/handlers/telegram-webhook.test.ts`, replace the `makeEnv` function with this call-recording version (adds an optional `calls` recorder; existing tests still pass):

```ts
type DbCall = { sql: string; binds: unknown[] }
function makeEnv(opts: { user?: Row | null; progress?: Row[]; calls?: DbCall[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...b: unknown[]) => {
        opts.calls?.push({ sql, binds: b })
        return {
          first: vi.fn().mockResolvedValue(/FROM users/.test(sql) ? (opts.user ?? null) : null),
          all: vi.fn().mockResolvedValue({ results: /FROM progress/.test(sql) ? (opts.progress ?? []) : [] }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }
      },
    }),
  } as unknown as D1Database
  return { DB, TELEGRAM_BOT_TOKEN: 'BOT', TELEGRAM_WEBHOOK_SECRET: SECRET } as Env
}
```

Then add these tests inside the `describe('handleTelegramWebhook', …)` block (before its closing `})`):

```ts
  it('/stop from a linked user sets nudge_optout = 1 and acks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const calls: DbCall[] = []
    await handleTelegramWebhook(
      req({ message: { text: '/stop', from: { id: 400 }, chat: { id: 400 } } }),
      makeEnv({ user: { id: 'u-400', language: 'ru', nudge_optout: 0 }, calls })
    )
    const upd = calls.find(c => /UPDATE users SET nudge_optout = 1/.test(c.sql))
    expect(upd).toBeDefined()
    expect(upd!.binds[0]).toBe('u-400')
  })

  it('/start from an opted-out user clears nudge_optout = 0', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const calls: DbCall[] = []
    await handleTelegramWebhook(
      req({ message: { text: '/start', from: { id: 401 }, chat: { id: 401 } } }),
      makeEnv({ user: { id: 'u-401', language: 'ru', nudge_optout: 1 }, calls })
    )
    expect(calls.find(c => /UPDATE users SET nudge_optout = 0/.test(c.sql))).toBeDefined()
  })
```

- [ ] **Step 3: Run to verify the new tests fail**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: FAIL — the two new tests (no `UPDATE nudge_optout` issued yet).

- [ ] **Step 4: Implement the webhook changes**

In `workers/src/handlers/telegram-webhook.ts`, change the user SELECT to also read `nudge_optout`, and widen the `user` type:

```ts
    let user: { id: string; language: string | null; nudge_optout: number } | null = null
    if (intent.fromId) {
      user = await env.DB.prepare('SELECT id, language, nudge_optout FROM users WHERE telegram_id = ?')
        .bind(intent.fromId).first<{ id: string; language: string | null; nudge_optout: number }>()
      if (user?.language) locale = pickLocale(user.language)
    }
```

Then replace the routing block. The current block is:

```ts
    if (intent.kind === 'start') {
      await sendMessage(env, intent.chatId, copy.greeting, { text: copy.openCourse, url: homeUrl(locale) })
    } else if (intent.kind === 'continue') {
```

Replace those first two lines (the `start` branch only) and insert a `stop` branch, so it reads:

```ts
    if (intent.kind === 'start') {
      await sendMessage(env, intent.chatId, copy.greeting, { text: copy.openCourse, url: homeUrl(locale) })
      if (user && user.nudge_optout) {
        await env.DB.prepare('UPDATE users SET nudge_optout = 0 WHERE id = ?').bind(user.id).run()
        await sendMessage(env, intent.chatId, copy.startResub)
      }
    } else if (intent.kind === 'stop') {
      if (user) {
        await env.DB.prepare('UPDATE users SET nudge_optout = 1 WHERE id = ?').bind(user.id).run()
      }
      await sendMessage(env, intent.chatId, copy.stopAck)
    } else if (intent.kind === 'continue') {
```

(The `continue` and `else` branches stay exactly as they are.)

- [ ] **Step 5: Run to verify all pass**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: PASS (7 tests — 5 prior + 2 new).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/bot-copy.ts workers/src/handlers/telegram-webhook.ts workers/src/handlers/telegram-webhook.test.ts
git commit -m "feat(workers): /stop opt-out + /start re-subscribe + nudge copy"
```

---

### Task 4: Daily nudge runner + migration

**Files:**
- Create: `workers/src/handlers/nudge-cron.ts`
- Test: `workers/src/handlers/nudge-cron.test.ts`
- Create: `workers/migrations/0009_nudge.sql`

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/nudge-cron.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { runDailyNudge } from './nudge-cron'
import { MODULE_ORDER } from '../lib/course-order'
import type { Env } from '../lib/types'

const NOW = 1_800_000_000
const TWO_DAYS = 2 * 24 * 3600

type Row = Record<string, unknown>
type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { candidates?: Row[]; progress?: Row[]; calls?: DbCall[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...b: unknown[]) => {
        opts.calls?.push({ sql, binds: b })
        return {
          all: vi.fn().mockResolvedValue({
            results: /FROM users/.test(sql) ? (opts.candidates ?? [])
              : /FROM progress/.test(sql) ? (opts.progress ?? []) : [],
          }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }
      },
    }),
  } as unknown as D1Database
  return { DB, TELEGRAM_BOT_TOKEN: 'BOT' } as Env
}

const candidate = (over: Row = {}): Row => ({ id: 'u1', telegram_id: '500', language: 'ru', created_at: NOW - 10 * 24 * 3600, last_nudge_at: null, ...over })

afterEach(() => vi.restoreAllMocks())

describe('runDailyNudge', () => {
  it('nudges an eligible learner with a button to the next lesson and stamps last_nudge_at', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const calls: DbCall[] = []
    const res = await runDailyNudge(
      makeEnv({ candidates: [candidate()], progress: [{ lesson_slug: '00-kickstart', viewed_at: NOW - TWO_DAYS, completed_at: NOW - TWO_DAYS }], calls }),
      NOW
    )
    expect(res.sent).toBe(1)
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.chat_id).toBe(500)
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/lessons/01-introduction/')
    expect(calls.find(c => /UPDATE users SET last_nudge_at/.test(c.sql))).toBeDefined()
  })

  it('skips a just-active learner', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const res = await runDailyNudge(
      makeEnv({ candidates: [candidate()], progress: [{ lesson_slug: '00-kickstart', viewed_at: NOW - 600, completed_at: null }] }),
      NOW
    )
    expect(res.sent).toBe(0)
    expect(spy).not.toHaveBeenCalled()
  })

  it('skips a finished learner', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const progress = MODULE_ORDER.map(slug => ({ lesson_slug: slug, viewed_at: NOW - TWO_DAYS, completed_at: NOW - TWO_DAYS }))
    const res = await runDailyNudge(makeEnv({ candidates: [candidate()], progress }), NOW)
    expect(res.sent).toBe(0)
    expect(spy).not.toHaveBeenCalled()
  })

  it('does not abort the batch when a send throws', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('telegram down'))
    const res = await runDailyNudge(
      makeEnv({ candidates: [candidate()], progress: [{ lesson_slug: '00-kickstart', viewed_at: NOW - TWO_DAYS, completed_at: NOW - TWO_DAYS }] }),
      NOW
    )
    expect(res.sent).toBe(0)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd workers && npx vitest run src/handlers/nudge-cron.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the runner**

Create `workers/src/handlers/nudge-cron.ts`:

```ts
import type { Env } from '../lib/types'
import { nextLesson, lessonUrl } from '../lib/course-order'
import { shouldNudge, THROTTLE_SEC } from '../lib/nudge-policy'
import { botCopy, pickLocale } from '../lib/bot-copy'
import { sendMessage } from '../lib/telegram-api'

interface Candidate {
  id: string
  telegram_id: string
  language: string | null
  created_at: number
  last_nudge_at: number | null
}

export async function runDailyNudge(env: Env, nowSec: number = Math.floor(Date.now() / 1000)): Promise<{ sent: number }> {
  const throttleBefore = nowSec - THROTTLE_SEC
  const { results: candidates } = await env.DB.prepare(
    'SELECT id, telegram_id, language, created_at, last_nudge_at FROM users ' +
    'WHERE telegram_id IS NOT NULL AND nudge_optout = 0 AND (last_nudge_at IS NULL OR last_nudge_at < ?)'
  ).bind(throttleBefore).all<Candidate>()

  let sent = 0
  for (const c of candidates ?? []) {
    try {
      const { results: prog } = await env.DB.prepare(
        'SELECT lesson_slug, viewed_at, completed_at FROM progress WHERE user_id = ?'
      ).bind(c.id).all<{ lesson_slug: string; viewed_at: number; completed_at: number | null }>()

      const completed = new Set<string>()
      const viewed = new Set<string>()
      let lastActivityAt = c.created_at
      for (const r of prog ?? []) {
        viewed.add(r.lesson_slug)
        if (r.completed_at) completed.add(r.lesson_slug)
        lastActivityAt = Math.max(lastActivityAt, r.viewed_at ?? 0, r.completed_at ?? 0)
      }

      const next = nextLesson(completed, viewed)
      const ok = shouldNudge({
        optout: false,
        lastNudgeAt: c.last_nudge_at,
        lastActivityAt,
        hasIncomplete: next !== null,
        nowSec,
      })
      if (!ok || !next) continue

      const locale = pickLocale(c.language)
      const copy = botCopy(locale)
      await sendMessage(env, Number(c.telegram_id), copy.nudgeIntro, { text: copy.nudgeLabel, url: lessonUrl(next.slug, locale) })
      await env.DB.prepare('UPDATE users SET last_nudge_at = ? WHERE id = ?').bind(nowSec, c.id).run()
      sent++
    } catch (e) {
      console.error('nudge send failed for', c.id, e)
    }
  }
  return { sent }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd workers && npx vitest run src/handlers/nudge-cron.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create the migration**

Create `workers/migrations/0009_nudge.sql`:

```sql
-- Companion-bot daily nudge: throttle stamp + opt-out flag. Additive, idempotent-friendly.
ALTER TABLE users ADD COLUMN last_nudge_at INTEGER;
ALTER TABLE users ADD COLUMN nudge_optout INTEGER NOT NULL DEFAULT 0;
```

- [ ] **Step 6: Commit**

```bash
git add workers/src/handlers/nudge-cron.ts workers/src/handlers/nudge-cron.test.ts workers/migrations/0009_nudge.sql
git commit -m "feat(workers): daily nudge runner + 0009 nudge columns migration"
```

---

### Task 5: Wire the cron trigger + scheduled() export

**Files:**
- Modify: `workers/src/index.ts` (import + `scheduled` export)
- Modify: `workers/wrangler.toml` (cron trigger)

- [ ] **Step 1: Import the runner**

In `workers/src/index.ts`, add after the existing webhook import:

```ts
import { handleTelegramWebhook } from './handlers/telegram-webhook'
import { runDailyNudge } from './handlers/nudge-cron'
```

- [ ] **Step 2: Add the `scheduled` export**

In `workers/src/index.ts`, the default export currently ends like this:

```ts
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  },
}
```

Replace that tail with (adds `scheduled` beside `fetch`):

```ts
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }
  },

  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runDailyNudge(env))
  },
}
```

- [ ] **Step 3: Add the cron trigger**

In `workers/wrangler.toml`, append:

```toml
[triggers]
crons = ["0 16 * * *"]
```

- [ ] **Step 4: Typecheck + full worker suite**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add workers/src/index.ts workers/wrangler.toml
git commit -m "feat(workers): daily nudge cron trigger + scheduled() export"
```

---

### Task 6: Apply migration 0009 + deploy verification (ops)

**Files:** none

- [ ] **Step 1: Confirm the columns are absent**

Via the Cloudflare-api MCP `execute`: `PRAGMA table_info(users)` on D1 `c904db4d-a900-4ff1-80ae-6056c150ca53`.
Confirm `last_nudge_at` and `nudge_optout` are absent.

- [ ] **Step 2: Apply migration 0009**

Run the two `ALTER TABLE` statements from `workers/migrations/0009_nudge.sql` via the `/query` endpoint
(MCP `execute`). Expect `meta.ok: true` for each.

- [ ] **Step 3: Verify the columns landed**

`PRAGMA table_info(users)` → both `last_nudge_at` and `nudge_optout` present (`nudge_optout` default 0).

- [ ] **Step 4: Deploy + confirm the cron registered**

Push to `main`; after CI `deploy-workers` is green, confirm via the Cloudflare-builds MCP
(`workers_get_worker` / cron schedules) or `npx wrangler deployments list` that the `0 16 * * *` trigger is
attached to `tochka-sborki-api`. The cron runs daily and finds zero eligible users until the webhook is
registered and learners exist (harmless).

---

## Self-Review

**Spec coverage:**
- Guard-chain (optout/finished/throttle/active/lapse) → Task 1 (`shouldNudge`) ✓
- `last_nudge_at` + `nudge_optout` columns → Task 4 (migration) + Task 6 (apply) ✓
- `/stop` intent → Task 2 ✓
- `/stop` sets optout + `/start` re-subscribe + nudge/ack copy → Task 3 ✓
- daily runner (candidate query, per-user activity, send + stamp, per-user try/catch) → Task 4 ✓
- `scheduled()` export + cron trigger → Task 5 ✓
- bilingual nudge + locale from users.language → Task 3 (copy) + Task 4 (`pickLocale(c.language)`) ✓
- lastActivity = MAX(viewed,completed) ?? created_at → Task 4 ✓
- testing for every unit → Tasks 1–4 ✓

**Placeholder scan:** none — every code step has full code; commands have expected output.

**Type consistency:** `shouldNudge(NudgeInput)` + thresholds defined Task 1, consumed Task 4 with matching
field names (`optout`, `lastNudgeAt`, `lastActivityAt`, `hasIncomplete`, `nowSec`). `BotCopy` new fields
(`nudgeIntro`, `nudgeLabel`, `stopAck`, `startResub`) defined Task 3, used Tasks 3–4. `BotIntent.kind` gains
`'stop'` in Task 2, handled in Task 3. `sendMessage(env, chatId:number, text, button)` (Slice 1a) reused
Task 4 with `Number(c.telegram_id)`. `nextLesson`/`lessonUrl` (Slice 1a) reused Task 4. The Task 4 test
asserts `/lessons/01-introduction/` after `00-kickstart` completed — consistent with `nextLesson` semantics.
