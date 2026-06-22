# Telegram "Ask a Question" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/ask` flow to the live companion bot that captures a learner's question (D1 + owner email) and hands them to learn-with-AI — no RAG, no booking.

**Architecture:** Extends the existing secret-token webhook. A pure parser recognizes `/ask` (and replies to a `force_reply` prompt); the handler persists the question to a new `questions` table, emails the owner via Resend, and acks with a Mini App button.

**Tech Stack:** Cloudflare Workers, D1 SQLite, raw Telegram Bot API + Resend over `fetch`, Vitest (env=node). Spec: `docs/superpowers/specs/2026-06-22-telegram-ask-question-design.md`.

**Conventions:** worker tests mock D1 (`prepare().bind().first()/all()/run()`) + `globalThis.fetch`. Run from `workers/`: `cd workers && npx vitest run <file>`. No new route, no cron.

---

### Task 1: Ask copy + ASK_PROMPTS recognizer set

**Files:**
- Modify: `workers/src/lib/bot-copy.ts`

- [ ] **Step 1: Add three fields to `BotCopy`**

In `workers/src/lib/bot-copy.ts`, in `interface BotCopy`, after `startResub: string` add:

```ts
  startResub: string
  askPrompt: string
  askThanks: string
  askButton: string
}
```

- [ ] **Step 2: Add the RU strings**

In the `RU` object, after its `startResub: '...'` line, add:

```ts
  askPrompt: 'Напиши свой вопрос одним сообщением — передам куратору, а пока подскажу, где спросить своего AI.',
  askThanks: 'Спасибо, передал твой вопрос куратору. А пока — открой курс и спроси своего AI прямо в уроке.',
  askButton: '▶️ Открыть курс',
```

- [ ] **Step 3: Add the EN strings**

In the `EN` object, after its `startResub: '...'` line, add:

```ts
  askPrompt: 'Send your question in one message — I’ll pass it to the curator, and meanwhile point you to your own AI.',
  askThanks: 'Thanks — I’ve passed your question to the curator. Meanwhile, open the course and ask your own AI right in the lesson.',
  askButton: '▶️ Open course',
```

- [ ] **Step 4: Export the recognizer set**

In `workers/src/lib/bot-copy.ts`, after the `EN` object definition (before or after `botCopy`), add:

```ts
// The force_reply prompts, locale-free — so the update parser can recognize a reply to "ask".
export const ASK_PROMPTS: string[] = [RU.askPrompt, EN.askPrompt]
```

- [ ] **Step 5: Typecheck**

Run: `cd workers && npx tsc --noEmit`
Expected: clean (both locales now satisfy `BotCopy`).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/bot-copy.ts
git commit -m "feat(workers): ask-flow bot copy + ASK_PROMPTS recognizer"
```

---

### Task 2: `/ask` intent + question payload in the parser

**Files:**
- Modify: `workers/src/lib/telegram-update.ts`
- Modify: `workers/src/lib/telegram-update.test.ts`

- [ ] **Step 1: Update existing exact-match tests + add new ones**

The `BotIntent` will gain a `text` field, so the four `toEqual({...})` assertions must include `text`. In
`workers/src/lib/telegram-update.test.ts`:

(a) In `'parses /start'`, change the assertion to:
```ts
    expect(r).toEqual({ kind: 'start', fromId: '42', chatId: 42, languageCode: 'ru', text: null })
```
(b) In `'parses /continue'`:
```ts
    expect(r).toEqual({ kind: 'continue', fromId: '5', chatId: 5, languageCode: 'en', text: null })
```
(c) In `'parses a continue callback_query'`:
```ts
    expect(r).toEqual({ kind: 'continue', fromId: '9', chatId: 9, languageCode: 'ru', text: null })
```
(d) In `'returns nulls for an empty update'`:
```ts
    expect(parseUpdate({})).toEqual({ kind: 'other', fromId: null, chatId: null, languageCode: null, text: null })
```

Then add these three tests inside the `describe('parseUpdate', …)` block (before its closing `})`):
```ts
  it('parses /ask with an inline question', () => {
    const r = parseUpdate({ message: { text: '/ask how do I install?', from: { id: 3 }, chat: { id: 3 } } })
    expect(r.kind).toBe('ask')
    expect(r.text).toBe('how do I install?')
  })

  it('parses bare /ask as an empty-payload ask', () => {
    const r = parseUpdate({ message: { text: '/ask', from: { id: 3 }, chat: { id: 3 } } })
    expect(r.kind).toBe('ask')
    expect(r.text).toBeNull()
  })

  it('treats a reply to the RU ask-prompt as an ask carrying the reply text', async () => {
    const { botCopy } = await import('./bot-copy')
    const prompt = botCopy('ru').askPrompt
    const r = parseUpdate({ message: { text: 'как поставить Claude Code?', reply_to_message: { text: prompt }, from: { id: 3 }, chat: { id: 3 } } })
    expect(r.kind).toBe('ask')
    expect(r.text).toBe('как поставить Claude Code?')
  })
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: the 3 new tests FAIL (and the 4 updated ones FAIL until impl adds `text`).

- [ ] **Step 3: Implement**

In `workers/src/lib/telegram-update.ts`:

(a) Add the import at the top:
```ts
import { ASK_PROMPTS } from './bot-copy'
```
(b) Change the `BotIntent` interface to add `'ask'` and a `text` field:
```ts
export interface BotIntent {
  kind: 'start' | 'continue' | 'stop' | 'ask' | 'other'
  fromId: string | null    // telegram numeric id as decimal string (< 2^53 assumed)
  chatId: number | null
  languageCode: string | null
  text: string | null      // question payload for 'ask'; null otherwise
}
```
(c) In the `callback_query` branch, add `text: null` to the returned object:
```ts
    return {
      kind: cq.data === 'continue' ? 'continue' : 'other',
      fromId: idToStr(cq.from?.id),
      chatId: numOrNull(cq.message?.chat?.id),
      languageCode: strOrNull(cq.from?.language_code),
      text: null,
    }
```
(d) Replace the entire `if (u.message) { ... }` block with:
```ts
  if (u.message) {
    const m = u.message
    const text = typeof m.text === 'string' ? m.text.trim() : ''
    const replyText = typeof m.reply_to_message?.text === 'string' ? m.reply_to_message.text : null

    let kind: BotIntent['kind'] = 'other'
    let payload: string | null = null

    if (replyText && ASK_PROMPTS.includes(replyText)) {
      kind = 'ask'
      payload = text || null
    } else if (/^\/start(\b|@|$)/.test(text)) {
      kind = 'start'
    } else if (/^\/continue(\b|@|$)/.test(text)) {
      kind = 'continue'
    } else if (/^\/stop(\b|@|$)/.test(text)) {
      kind = 'stop'
    } else if (/^\/ask(\b|@|$)/.test(text)) {
      kind = 'ask'
      payload = text.replace(/^\/ask(@\S+)?\s*/, '').trim() || null
    }

    return {
      kind,
      fromId: idToStr(m.from?.id),
      chatId: numOrNull(m.chat?.id),
      languageCode: strOrNull(m.from?.language_code),
      text: payload,
    }
  }
```
(e) Change the final fallback return to include `text: null`:
```ts
  return { kind: 'other', fromId: null, chatId: null, languageCode: null, text: null }
```

- [ ] **Step 4: Run to verify all pass**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/telegram-update.ts workers/src/lib/telegram-update.test.ts
git commit -m "feat(workers): parse /ask intent + question payload (command + reply-to-prompt)"
```

---

### Task 3: Owner email notification

**Files:**
- Create: `workers/src/lib/owner-notify.ts`
- Test: `workers/src/lib/owner-notify.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/owner-notify.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { notifyOwnerQuestion } from './owner-notify'
import type { Env } from './types'

afterEach(() => vi.restoreAllMocks())

const fullEnv = { RESEND_API_KEY: 'rk', OWNER_EMAIL: 'owner@example.com' } as Env

describe('notifyOwnerQuestion', () => {
  it('emails the owner with the question in the body', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await notifyOwnerQuestion(fullEnv, { question: 'how do I install?', asker: '500', locale: 'ru' })
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body as string)
    expect(body.to).toEqual(['owner@example.com'])
    expect(body.text).toContain('how do I install?')
  })

  it('no-ops (no fetch, no throw) when RESEND_API_KEY is missing', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await notifyOwnerQuestion({ OWNER_EMAIL: 'owner@example.com' } as Env, { question: 'q', asker: null, locale: 'ru' })
    expect(spy).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd workers && npx vitest run src/lib/owner-notify.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `workers/src/lib/owner-notify.ts`:

```ts
import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// Best-effort owner notification for a learner question. Never throws (mirrors crm.ts).
export async function notifyOwnerQuestion(
  env: Env,
  q: { question: string; asker: string | null; locale: string },
): Promise<void> {
  const apiKey = strip(env.RESEND_API_KEY)
  const owner = strip(env.OWNER_EMAIL)
  if (!apiKey || !owner) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Точка Сборки <noreply@mamaev.coach>',
        to: [owner],
        subject: 'Новый вопрос из Telegram-бота',
        text: `Вопрос от Telegram-пользователя ${q.asker ?? 'unknown'} (locale: ${q.locale}):\n\n${q.question}`,
      }),
    })
    if (!res.ok) console.error('owner-notify non-OK', res.status, await res.text())
  } catch (e) {
    console.error('owner-notify failed', e)
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd workers && npx vitest run src/lib/owner-notify.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/owner-notify.ts workers/src/lib/owner-notify.test.ts
git commit -m "feat(workers): owner email notification for learner questions"
```

---

### Task 4: `sendForceReply` Bot API helper

**Files:**
- Modify: `workers/src/lib/telegram-api.ts`
- Modify: `workers/src/lib/telegram-api.test.ts`

- [ ] **Step 1: Add the failing test**

In `workers/src/lib/telegram-api.test.ts`, add the import for `sendForceReply` to the existing import line so it reads:
```ts
import { sendMessage, sendForceReply } from './telegram-api'
```
Then add this test inside the existing top-level `describe(...)` (or as a new `describe`) block:
```ts
describe('sendForceReply', () => {
  it('sends a message with a force_reply markup', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await sendForceReply(env, 7, 'ask me')
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.chat_id).toBe(7)
    expect(body.reply_markup).toEqual({ force_reply: true })
    spy.mockRestore()
  })
})
```
(The `env` const and `vi` import already exist in this test file.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-api.test.ts`
Expected: FAIL — `sendForceReply` is not exported.

- [ ] **Step 3: Implement**

In `workers/src/lib/telegram-api.ts`, add at the end of the file:

```ts
// Prompt the user to reply (Telegram shows a reply box pre-targeted at this message).
export async function sendForceReply(env: Env, chatId: number, text: string): Promise<void> {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: { force_reply: true } }),
  })
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd workers && npx vitest run src/lib/telegram-api.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/telegram-api.ts workers/src/lib/telegram-api.test.ts
git commit -m "feat(workers): sendForceReply Bot API helper"
```

---

### Task 5: Webhook `/ask` handler branch + migration

**Files:**
- Modify: `workers/src/handlers/telegram-webhook.ts`
- Modify: `workers/src/handlers/telegram-webhook.test.ts`
- Create: `workers/migrations/0010_questions.sql`

- [ ] **Step 1: Add the failing tests**

In `workers/src/handlers/telegram-webhook.test.ts`, add these tests inside the `describe('handleTelegramWebhook', …)` block (before its closing `})`):

```ts
  it('bare /ask sends a force_reply prompt', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/ask', from: { id: 600 }, chat: { id: 600 } } }),
      makeEnv({ user: { id: 'u-600', language: 'ru', nudge_optout: 0 } })
    )
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.reply_markup).toEqual({ force_reply: true })
  })

  it('/ask <question> from a linked user inserts a question and acks with a button', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const calls: DbCall[] = []
    await handleTelegramWebhook(
      req({ message: { text: '/ask how do I install?', from: { id: 601 }, chat: { id: 601 } } }),
      makeEnv({ user: { id: 'u-601', language: 'ru', nudge_optout: 0 }, calls })
    )
    const ins = calls.find(c => /INSERT INTO questions/.test(c.sql))
    expect(ins).toBeDefined()
    expect(ins!.binds[3]).toBe('how do I install?') // id, user_id, telegram_id, text, ...
    expect(ins!.binds[1]).toBe('u-601')             // user_id
    const tgCall = (spy.mock.calls as [string, RequestInit][]).find(([u]) => /api\.telegram\.org/.test(u) && /sendMessage/.test(u))
    const ackBody = JSON.parse(tgCall![1].body as string)
    expect(ackBody.reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/')
  })

  it('captures a question from an unlinked user with user_id null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const calls: DbCall[] = []
    await handleTelegramWebhook(
      req({ message: { text: '/ask anonymous q', from: { id: 602 }, chat: { id: 602 } } }),
      makeEnv({ user: null, calls })
    )
    const ins = calls.find(c => /INSERT INTO questions/.test(c.sql))
    expect(ins).toBeDefined()
    expect(ins!.binds[1]).toBeNull()            // user_id null
    expect(ins!.binds[2]).toBe('602')           // telegram_id
  })
```

- [ ] **Step 2: Run to verify the new tests fail**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: the 3 new tests FAIL (no `/ask` handling yet).

- [ ] **Step 3: Implement the handler branch**

In `workers/src/handlers/telegram-webhook.ts`:

(a) Extend the imports:
```ts
import { sendMessage } from '../lib/telegram-api'
import { sendForceReply } from '../lib/telegram-api'
import { notifyOwnerQuestion } from '../lib/owner-notify'
```
(If `sendMessage` is already imported from `'../lib/telegram-api'`, instead just widen that line to
`import { sendMessage, sendForceReply } from '../lib/telegram-api'` and add the `owner-notify` import.)

(b) Add an `ask` branch in the routing chain — place it right after the `stop` branch and before the
`continue` branch:
```ts
    } else if (intent.kind === 'ask') {
      const question = intent.text?.trim()
      if (!question) {
        await sendForceReply(env, intent.chatId, copy.askPrompt)
      } else {
        await env.DB.prepare(
          'INSERT INTO questions (id, user_id, telegram_id, text, locale, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(crypto.randomUUID(), user?.id ?? null, intent.fromId, question, locale, Math.floor(Date.now() / 1000), 'new').run()
        await notifyOwnerQuestion(env, { question, asker: intent.fromId, locale })
        await sendMessage(env, intent.chatId, copy.askThanks, { text: copy.askButton, url: homeUrl(locale) })
      }
    } else if (intent.kind === 'continue') {
```

- [ ] **Step 4: Run to verify all pass + typecheck**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts && npx tsc --noEmit`
Expected: PASS (10 tests: 7 prior + 3 new); tsc clean.

- [ ] **Step 5: Create the migration**

Create `workers/migrations/0010_questions.sql`:

```sql
-- Learner questions captured via the Telegram /ask flow (lead-capture). Additive.
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  telegram_id TEXT,
  text TEXT NOT NULL,
  locale TEXT,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new'
);
```

- [ ] **Step 6: Full worker suite + commit**

Run: `cd workers && npx vitest run`
Expected: all tests pass.

```bash
git add workers/src/handlers/telegram-webhook.ts workers/src/handlers/telegram-webhook.test.ts workers/migrations/0010_questions.sql
git commit -m "feat(workers): /ask handler (capture question + owner-notify + handoff) + 0010 questions table"
```

---

### Task 6: Apply migration 0010 + deploy (ops)

**Files:** none

- [ ] **Step 1: Confirm the table is absent**

Via the Cloudflare-api MCP `execute`: run `SELECT name FROM sqlite_master WHERE type='table' AND name='questions'`
on D1 `c904db4d-a900-4ff1-80ae-6056c150ca53`. Expect zero rows.

- [ ] **Step 2: Apply migration 0010**

Run the `CREATE TABLE` from `workers/migrations/0010_questions.sql` via the `/query` endpoint. Expect
`meta.ok: true`.

- [ ] **Step 3: Verify**

`PRAGMA table_info(questions)` → columns `id, user_id, telegram_id, text, locale, created_at, status` present.

- [ ] **Step 4: Deploy + smoke**

Push to `main`; after CI `deploy-workers` is green, the `/ask` flow is live. (Owner smoke test in Telegram:
`/ask` → reply with a question → expect a thanks + button, and an email to the owner address.)

---

## Self-Review

**Spec coverage:**
- ask copy + `ASK_PROMPTS` → Task 1 ✓
- `/ask` intent + `text` payload (command + reply-to-prompt) → Task 2 ✓
- owner email notify (no-op without key, never throws) → Task 3 ✓
- `sendForceReply` → Task 4 ✓
- handler: empty→force_reply; question→INSERT questions + owner-notify + ack button; unlinked user_id null → Task 5 ✓
- `questions` table migration → Task 5 (file) + Task 6 (apply) ✓
- no new route / no cron → consistent (untouched) ✓
- tests for parser, owner-notify, force_reply, handler → Tasks 2–5 ✓

**Placeholder scan:** none — full code in every step; commands have expected output.

**Type consistency:** `BotIntent` gains `text: string | null` in Task 2 and every return path sets it
(callback/message/fallback) — the four existing `toEqual` tests are updated in the same task to match. `'ask'`
added to `kind` (Task 2), handled in Task 5. `notifyOwnerQuestion(env, { question, asker, locale })` defined
Task 3, called Task 5 with matching shape. `sendForceReply(env, chatId, text)` defined Task 4, called Task 5.
`ASK_PROMPTS` exported Task 1, imported by Task 2. INSERT bind order `(id, user_id, telegram_id, text, locale,
created_at, status)` matches the Task 5 test's bind-index assertions (`binds[1]=user_id`, `binds[2]=telegram_id`,
`binds[3]=text`). Ack button URL `https://ai.mamaev.coach/` = `homeUrl('ru')` — consistent with Slice 1a.
