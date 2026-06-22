# Telegram "Ask a question" — lead-capture + handoff — Design Spec

**Date:** 2026-06-22
**Ticket:** `fb_a13b15a54835` (Batch 3 · TELEGRAM), **right-sized**. The ticket as written assumed a
server-side RAG over course content "mirroring the in-LMS chatbot panel" and a bridge into booking — but
there is **no RAG infrastructure** (no embeddings/vector store; the Worker can't import web MDX), the in-LMS
"chatbot" is actually **learn-with-AI** (a key-less handoff to the learner's own AI, deliberately sovereign),
and the booking ticket (`fb_57c6302d436f`) is **unbuilt**. So this spec delivers the buildable, on-brand
core: capture the question as a lead + nudge the learner to their own AI. **Level:** engine.

## Decisions (owner-selected)

- **Right-size = lead-capture + handoff** (not RAG, not booking). `/ask` captures the question, notifies the
  owner, and hands the learner to learn-with-AI. True RAG and the booking bridge are split off.
- **Ask UX = `force_reply` 2-step** (`/ask` → prompt → reply), plus a `/ask <text>` one-message fast path.
- **Owner notification = Resend email** to `OWNER_EMAIL` (reuses `auth.ts` send pattern).
- **Handoff button → Mini App home** (`homeUrl(locale)`), where the per-lesson learn-with-AI dock lives.

## Architecture & data flow

```
/ask (no text)        → sendForceReply(askPrompt)
learner's reply       → parseUpdate sees reply_to_message.text ∈ ASK_PROMPTS → kind:'ask', text=reply
/ask <text>           → kind:'ask', text=<text>   (fast path)

on kind:'ask' with a non-empty question:
  INSERT INTO questions (user_id?, telegram_id, text, locale, created_at, status='new')
  await notifyOwnerQuestion(env, { question, asker, locale })   // Resend → OWNER_EMAIL, best-effort
  sendMessage(askThanks, { text: askButton, url: homeUrl(locale) })   // handoff into the Mini App
  → 200 (always, via the handler's existing try/catch)
on kind:'ask' with an empty question:
  sendForceReply(askPrompt) → 200
```

The bot is already live (Phase 1 1a+1b); this rides the same secret-token-verified webhook. Works for both
linked (`user_id` set) and unlinked (`user_id` null, `telegram_id` only) askers.

## Units (small, isolated, testable)

**`workers/src/lib/bot-copy.ts`** — add to `BotCopy`: `askPrompt`, `askThanks`, `askButton` (RU/EN). Export
a locale-free recognizer set:
```ts
export const ASK_PROMPTS: string[] = [RU.askPrompt, EN.askPrompt]
```
Copy intent — RU: `askPrompt` "Напиши свой вопрос одним сообщением — передам куратору, а пока подскажу, где
спросить своего AI."; `askThanks` "Спасибо, передал твой вопрос куратору. А пока — открой курс и спроси
своего AI прямо в уроке."; `askButton` "▶️ Открыть курс". EN mirrors.

**`workers/src/lib/telegram-update.ts`** — add `'ask'` to `BotIntent['kind']` and a field
`text: string | null` (the question payload; `null` for non-ask intents and for an empty `/ask`).
`parseUpdate` recognizes ask when, on a `message`:
1. `reply_to_message?.text` is a string in `ASK_PROMPTS` → `kind:'ask'`, `text = (message.text ?? '').trim() || null`; **or**
2. text matches `/^\/ask(\b|@|$)/` → `kind:'ask'`, `text` = the remainder after the command, trimmed, or `null` if empty.
(Imports `ASK_PROMPTS` from `./bot-copy`; no cycle — `bot-copy` doesn't import `telegram-update`.)

**`workers/src/lib/owner-notify.ts` (+`.test.ts`)** — `notifyOwnerQuestion(env, { question, asker, locale })`:
POST Resend `/emails` (`from: 'Точка Сборки <noreply@mamaev.coach>'`, `to: [env.OWNER_EMAIL]`, plain-text body
with the question + asker handle/id + locale). No-op if `RESEND_API_KEY` or `OWNER_EMAIL` is empty. Wrapped in
try/catch — logs, never throws (mirrors `crm.ts`).

**`workers/src/lib/telegram-api.ts`** — add `sendForceReply(env, chatId, text)` →
`reply_markup: { force_reply: true }`. (Existing `sendMessage(env, chatId, text, button?)` reused for the ack.)

**`workers/src/handlers/telegram-webhook.ts`** — handle `intent.kind === 'ask'`:
- `const question = intent.text?.trim()`. If empty → `await sendForceReply(env, chatId, copy.askPrompt)`.
- Else: `INSERT INTO questions (id, user_id, telegram_id, text, locale, created_at, status) VALUES
  (?, ?, ?, ?, ?, ?, 'new')` with `id = crypto.randomUUID()`, `user_id = user?.id ?? null`,
  `telegram_id = intent.fromId`, `locale`, `created_at = now`; then
  `await notifyOwnerQuestion(env, { question, asker: intent.fromId, locale })`; then
  `await sendMessage(env, chatId, copy.askThanks, { text: copy.askButton, url: homeUrl(locale) })`.

**`workers/migrations/0010_questions.sql`**
```sql
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

**`workers/src/index.ts`** — no change (webhook route already exists; no cron).

## Error handling

| Condition | Behavior |
|---|---|
| Empty `/ask` (or empty reply) | `sendForceReply(askPrompt)`, no DB write |
| Resend / owner-notify fails | logged inside `notifyOwnerQuestion`; learner still gets the ack |
| Any throw in capture | caught by the handler's existing try/catch → 200 (Telegram no retry-storm) |
| Unlinked asker | captured with `user_id` null; still notifies owner + acks |

## Security

Same authenticated webhook (secret-token). Question text is a **parameterized D1 bind** (no SQL injection) and
goes into a **plain-text** Resend body (no HTML injection vector). No new external endpoint.

## Testing (TDD, vitest env=node)

- **`telegram-update.test.ts`** — `/ask how do I install?` → `kind:'ask'`, `text:'how do I install?'`; `/ask`
  alone → `kind:'ask'`, `text:null`; a message with `reply_to_message.text` = the RU `askPrompt` → `kind:'ask'`,
  `text` = the message text.
- **`owner-notify.test.ts`** (mock `fetch`) — posts to `https://api.resend.com/emails` with `to:[OWNER_EMAIL]`
  and the question in the body; missing `RESEND_API_KEY` → no fetch, no throw.
- **`telegram-webhook.test.ts`** (mock D1 + `fetch`) — `/ask` alone → a `force_reply` send; `/ask <q>` (linked)
  → an `INSERT INTO questions` call (bind: telegram_id + text) + an ack with a button; reply-to-prompt path
  captured; unlinked `/ask <q>` still INSERTs (user_id null).

## Deploy gate

I apply **migration 0010** via the Cloudflare-api MCP `/query` (additive `CREATE TABLE`, zero-token), verify
with `PRAGMA table_info(questions)`. No owner step — activates on deploy (bot already live).

## Out of scope (split tickets / follow-on)

- **RAG answering** — content-indexing + retrieval (Vectorize/embeddings) epic; arguably off-brand vs the
  sovereign learn-with-AI handoff. Split ticket.
- **Booking bridge** — `fb_57c6302d436f` is unbuilt; bridge it once it exists.
- **Owner `/admin/questions` view** — the email notification covers MVP; a UI can come later.
- Carrying the question text into the Mini App learn-with-AI dock (pre-filled `?q=`).
