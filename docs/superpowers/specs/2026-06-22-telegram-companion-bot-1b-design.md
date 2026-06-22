# Telegram companion bot — Slice 1b (daily nudge cron + throttle) — Design Spec

**Date:** 2026-06-22
**Ticket:** `fb_5e4afe37ca6b` (Batch 3 · TELEGRAM, Phase 1), Slice **1b** of 2. Builds on Slice 1a
(webhook + `/start`/`/continue` + `course-order`/`bot-copy`/`telegram-api`, deployed dark). **Level:** engine.

## Goal

A CF cron fires a `scheduled()` Worker export daily; it sends at most one "continue where you left off"
nudge to each eligible learner, reusing Slice 1a's `nextLesson`/`lessonUrl`/`sendMessage`. Eligibility is a
pure guard-chain that honors the owner's no-pressure/authenticity boundary.

## Decisions (owner-selected)

- **Consent = opt-out + smart guards.** Default-ON for users who started the bot (implicit consent); `/stop`
  opts out, `/start` re-subscribes. Guard-chain prevents nagging (one/day, skip recently-active, stop after a
  14-day lapse). (Rejected: opt-in `/subscribe` — tiny reach defeats the habit nudge; bare opt-out — nags
  ghosts and mid-session learners.)

## Guard-chain (pure)

`shouldNudge` returns `false` (skip), evaluated in order:
1. `nudge_optout` truthy → never.
2. no incomplete module (`!hasIncomplete`, course finished) → never.
3. `lastNudgeAt` within `THROTTLE_SEC` (20h) → not again today.
4. `lastActivityAt` within `ACTIVE_SEC` (20h) → don't nag mid-session.
5. `nowSec - lastActivityAt > LAPSE_SEC` (14d) → stop chasing ghosts.
6. else → `true` (send the continue nudge).

`lastActivityAt = MAX(progress.viewed_at, progress.completed_at)` for the user, falling back to
`users.created_at` when there are no progress rows (so a brand-new signup gets one quiet day before the first
nudge, and a 20-day-old account with zero progress is treated as lapsed).

## Units (small, isolated, testable)

**`workers/src/lib/nudge-policy.ts` (+`.test.ts`) — pure**

```ts
export const THROTTLE_SEC = 20 * 60 * 60  // 20h — at most one nudge/day, dedupes double cron runs
export const ACTIVE_SEC   = 20 * 60 * 60  // 20h — skip if the learner was just active
export const LAPSE_SEC    = 14 * 24 * 60 * 60  // 14d — stop nudging the lapsed

export interface NudgeInput {
  optout: boolean
  lastNudgeAt: number | null
  lastActivityAt: number   // MAX(viewed,completed) ?? created_at
  hasIncomplete: boolean
  nowSec: number
}
export function shouldNudge(i: NudgeInput): boolean
```

**`workers/src/handlers/nudge-cron.ts` (+`.test.ts`)** — `runDailyNudge(env, nowSec?)`:
1. Candidate query (pre-filter): `SELECT id, telegram_id, language, created_at, last_nudge_at FROM users
   WHERE telegram_id IS NOT NULL AND nudge_optout = 0 AND (last_nudge_at IS NULL OR last_nudge_at < ?)`
   (`? = now - THROTTLE_SEC`).
2. Per candidate: load `progress` rows → compute `completed`/`viewed` sets + `lastActivityAt` (MAX timestamps
   ?? `created_at`); `hasIncomplete = nextLesson(completed,viewed) !== null`.
3. `shouldNudge({ optout:false, lastNudgeAt, lastActivityAt, hasIncomplete, nowSec })` — if true, send
   `sendMessage(chatId=Number(telegram_id), nudgeIntro, { text: nudgeLabel, url: lessonUrl(next.slug, locale) })`
   then `UPDATE users SET last_nudge_at = ? WHERE id = ?`. Locale from `users.language`.
4. Each user wrapped in try/catch (one failure does not abort the batch; `console.error` + continue).
   Returns `{ sent }` count.

**`workers/src/lib/bot-copy.ts`** — add to `BotCopy`: `nudgeIntro`, `nudgeLabel`, `stopAck`, `startResub`
(RU/EN). The nudge is a warm proactive "continue", distinct in tone from the in-session `continueIntro`.

**`workers/src/lib/telegram-update.ts`** — add `'stop'` to `BotIntent['kind']`; `/stop` → stop.

**`workers/src/handlers/telegram-webhook.ts`** — handle `intent.kind === 'stop'`: if linked,
`UPDATE users SET nudge_optout = 1 WHERE id = ?`; reply `stopAck`. On `intent.kind === 'start'` for a linked
user, also `UPDATE users SET nudge_optout = 0 WHERE id = ?` (re-subscribe). Greeting copy is unchanged; the
`startResub` line is appended only when that `/start` actually flipped an existing opt-out back on. (Unlinked
`/stop` → just ack with `stopAck`; there's nothing to toggle, so no DB write when unlinked.)

**`workers/migrations/0009_nudge.sql`**

```sql
ALTER TABLE users ADD COLUMN last_nudge_at INTEGER;
ALTER TABLE users ADD COLUMN nudge_optout INTEGER NOT NULL DEFAULT 0;
```

**`workers/src/index.ts`** — add a `scheduled()` export beside `fetch`:
```ts
export default {
  async fetch(request, env, ctx) { /* unchanged */ },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runDailyNudge(env))
  },
}
```

**`workers/wrangler.toml`** — `[triggers]` `crons = ["0 16 * * *"]` (16:00 UTC ≈ 19:00 MSK / 11:00 ET;
one-line adjustable).

## Error handling

| Condition | Behavior |
|---|---|
| One user's `sendMessage` throws | catch + `console.error` + continue the batch |
| `last_nudge_at` | set only after a successful send |
| Cron runs twice in a window | throttle guard (`last_nudge_at`) prevents a double nudge |
| `/stop` from an unlinked user | ack only, no DB write |

## Security

No new external surface. The cron is internal; `/stop`/`/start` writes go through the already-authenticated
(secret-token) webhook. Bot token never logged.

## Testing (TDD, vitest env=node)

- **`nudge-policy.test.ts`** — opted-out→false; finished→false; throttled (recent `lastNudgeAt`)→false;
  recently-active→false; lapsed (>14d)→false; otherwise→true; brand-new (activity==created, recent)→false
  (one quiet day).
- **`nudge-cron.test.ts`** (mock D1 candidates + per-user progress + mock `fetch`) — sends to an eligible user
  with a button to the next lesson + issues the `last_nudge_at` UPDATE; skips a throttled/just-active/finished
  candidate; a `sendMessage` throw doesn't abort the others; returns the sent count.
- **`telegram-update.test.ts`** — `/stop` → `kind:'stop'`.
- **`telegram-webhook.test.ts`** — `/stop` (linked) issues `UPDATE ... nudge_optout = 1`; `/start` (linked)
  issues `UPDATE ... nudge_optout = 0`.

## Deploy gate

I apply **migration 0009** via the Cloudflare-api MCP `/query` (additive ALTERs, like 0007/0008), with
`PRAGMA table_info(users)` before/after. The cron auto-registers on Worker deploy — **no owner step**.
Nudges only flow once the webhook is registered (Slice 1a's owner step) and learners exist; until then the
cron runs and finds zero eligible users (harmless).

## Out of scope (follow-on)

- Timezone-aware send time (per-user local hour) — MVP uses one daily UTC cron.
- RAG Q&A + lead/booking bridge (`fb_a13b15a54835`).
