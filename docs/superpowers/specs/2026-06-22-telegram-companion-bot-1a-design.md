# Telegram companion bot — Slice 1a (webhook + "continue" deep-link) — Design Spec

**Date:** 2026-06-22
**Ticket:** `fb_5e4afe37ca6b` (Batch 3 · TELEGRAM, Phase 1), Slice **1a** of 2. Builds on Phase 0
(`fb_1d87217b78f7` — `users.telegram_id` exists; bot **@tochka_sborki_lms_bot** live;
`TELEGRAM_BOT_TOKEN` secret set). Research `fb_53ed0f17` = hybrid (bot = engagement layer).
**Level:** engine (reused by any future course).

## Decisions (owner-selected)

- **Drip = advisory next-step.** The bot always points to your next-in-order **incomplete** module
  (`no-skip` = earliest incomplete; `resume` = a viewed-but-not-completed module). The site stays fully
  open — drip is an ordering hint, never a lock. (Rejected: one-per-day time pacing; hard lock — both
  clash with the open/free/self-paced + clarity-first ethos.)
- **Raw minimal handler**, no framework. The Worker is dependency-free and already calls the Bot API via
  raw `fetch`; the bot's surface (start/continue) is small. (Rejected: grammY — first runtime dep + bundle
  weight, overkill for this scope.)

## Scope

**Slice 1a (this spec):** webhook route + `/start` + `/continue` (and its button) that deep-links into the
Mini App at the learner's next lesson. **Out of scope → Slice 1b:** daily nudge cron, throttle,
`last_nudge_at`. **→ later:** RAG Q&A (`fb_a13b15a54835`).

## Architecture & data flow

```
Telegram → POST /api/telegram/webhook  (header X-Telegram-Bot-Api-Secret-Token verified)
  → parseUpdate(update) → { kind: start | continue | other, fromId, languageCode, chatId }
  → start    : sendMessage(greeting + web_app button → lessonUrl(firstOrNext))
  → continue : SELECT user by telegram_id
                 ├ unlinked → sendMessage("open the course first" + open-course web_app button)
                 └ linked   → SELECT progress → nextLesson(completed, viewed)
                                ├ next  → sendMessage(continue copy + web_app button → lessonUrl(next))
                                └ null  → sendMessage("course finished 🎉")
  → other    : sendMessage(gentle hint + continue button)
  → always return 200 for a legit (secret-valid) update
```

Lesson progress is tracked at **module level**: `progress.lesson_slug` = the module slug, written via
`meta.slug` in the web `lesson-layout`. The bot reads the same rows.

## Units (small, isolated, testable)

**`workers/src/lib/course-order.ts` (+`.test.ts`) — pure**

```ts
// Canonical module order (engine config — mirrors content/{ru,en}/ dir order).
export const MODULE_ORDER = [
  '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
  '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools',
  '08-agent-engineering',
] as const

export interface NextLesson { slug: string; resume: boolean }

// Earliest module not completed. resume = it was viewed but not completed.
// Returns null when every module is completed.
export function nextLesson(completed: Set<string>, viewed: Set<string>): NextLesson | null

export function lessonUrl(slug: string, locale: 'ru' | 'en'): string
// → `https://ai.mamaev.coach/lessons/<slug>/`  (ru)
// → `https://ai.mamaev.coach/en/lessons/<slug>/` (en)
```

**`workers/src/lib/telegram-update.ts` (+`.test.ts`) — pure**

```ts
export interface BotIntent {
  kind: 'start' | 'continue' | 'other'
  fromId: string | null      // telegram numeric id as string (64-bit safe)
  chatId: number | null
  languageCode: string | null
}
export function parseUpdate(update: unknown): BotIntent
```
`/start` → start; `/continue` or a callback_query `data:'continue'` → continue; anything else → other.
`fromId` pulled 64-bit-safe (regex on the raw id when needed; message.from.id / callback_query.from.id).

**`workers/src/lib/bot-copy.ts`** — bilingual RU/EN strings: `greeting`, `openCourse` (button label),
`continueIntro`, `continueLabel`, `openFirst`, `finished`, `hint`. `botCopy(locale)` returns the set.

**`workers/src/lib/telegram-api.ts`** — `sendMessage(env, chatId, text, button?)`: raw
`fetch('https://api.telegram.org/bot<token>/sendMessage', …)` with an optional inline keyboard button.
Button type: `web_app` (primary) carrying the lesson URL; see integration risk below. Testable by mocking
`fetch`.

**`workers/src/handlers/telegram-webhook.ts` (+`.test.ts`)** — `handleTelegramWebhook(request, env)`:
verify the secret-token header; `parseUpdate`; route as in the data-flow; for `continue` load the user by
`telegram_id` and their `progress` rows. Always return 200 for a secret-valid update.

**`workers/src/lib/types.ts`** — add `TELEGRAM_WEBHOOK_SECRET: string`.
**`workers/src/index.ts`** — route `path === '/api/telegram/webhook' && method === 'POST'`.

## Identity

Webhook updates carry the Telegram numeric id (`from.id`). Look up `users WHERE telegram_id = ?`.
`/start` works for **unlinked** users (generic greeting + open-course button — opening the Mini App links
them via the Phase 0 bridge). `/continue` needs a linked user; unlinked → graceful "open the course first".
Language: `users.language` when linked, else the update's `language_code` (`en` → EN, else RU).

## Error handling

| Condition | Response |
|---|---|
| Missing/mismatched `X-Telegram-Bot-Api-Secret-Token` | **403** (spoofed) |
| Internal error on a legit update | **200** + `console.error` (no Telegram retry-storm) |
| `/continue` from an unlinked user | 200 + "open the course first" + button (not an error) |
| Course fully completed | 200 + "🎉 finished" message |

## Security

Webhook authenticated by Telegram's `secret_token` (set at `setWebhook`, stored as the
`TELEGRAM_WEBHOOK_SECRET` Worker secret). Only trusted inputs: the secret-verified update + Worker secrets.
No client field is trusted for auth. Bot token never logged.

## Testing (TDD, vitest env=node)

- **`course-order.test.ts`** — no progress → first module; some completed → first incomplete; viewed-not-
  completed → `resume:true`; all completed → `null`; `lessonUrl` ru vs en.
- **`telegram-update.test.ts`** — `/start`→start; `/continue`→continue; callback `data:'continue'`→continue;
  plain text→other; id + language_code extraction; missing fields → nulls.
- **`telegram-webhook.test.ts`** (mock D1 like `auth.test.ts` + mock `fetch`) — secret mismatch→403;
  `/start`→`sendMessage` called with a button; `/continue` linked (D1 returns user + progress)→button to the
  next lesson; `/continue` unlinked→open-course copy; legit update always→200.

## Deploy gate (owner/ops; ships dark until registered)

The route exists but receives nothing until the webhook is registered. Steps:
1. Generate a random `TELEGRAM_WEBHOOK_SECRET`; `wrangler secret put TELEGRAM_WEBHOOK_SECRET`.
2. `setWebhook` with `url=https://ai.mamaev.coach/api/telegram/webhook` and that `secret_token`.

I extend `workers/scripts/telegram-go-live.ps1` with a `-RegisterWebhook` path that generates the secret,
sets it, and calls `setWebhook` (token read the same secure way). Migration: **none** (1a reuses existing
tables; `last_nudge_at` is a 1b concern).

**Known integration risk (verify live):** inline `web_app` buttons require the URL's domain to match the
bot's configured Web App domain. The menu button already targets `ai.mamaev.coach` and works; if Telegram
rejects an inline `web_app` button, fall back to a plain `url:` button (opens the lesson in Telegram's
in-app browser — no Phase-0 auto-login there, but the menu button remains the primary auto-login entry).
Decide at deploy based on the live response.

## Out of scope (follow-on)

- Slice 1b: daily nudge `scheduled()` cron + throttle (reuse `wellbeing/select-nudge` "one nudge by
  priority" pattern) + `last_nudge_at` column.
- RAG Q&A + lead/booking bridge (`fb_a13b15a54835`).
- Named Mini App deep-link (`t.me/<bot>/<app>?startapp=`) via BotFather `/newapp` — only if the inline
  web_app button proves insufficient.
