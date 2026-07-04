# Telegram Bot `/store` Deep-Link Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/store` command to the Telegram companion bot that deep-links to the web `/store` (merch) page, mirroring the shipped `/support` command.

**Architecture:** Four edits in `workers/`, each a mirror of the existing `/support` path: a `storeUrl` helper, a `store` intent in the update parser, `storeIntro`/`storeButton` bot copy (ru+en), and a `store` branch in the webhook handler. Worker-only; no web, D1, or migration changes.

**Tech Stack:** TypeScript, Cloudflare Workers (`workers/`), Vitest.

## Global Constraints

- **Mirror the shipped `/support` path exactly** — same code shape and structure.
- **Sole-prop, NEVER nonprofit** framing; authenticity — no push, no scarcity, no vanity goals.
- Trunk-based on `main`; TDD; commit per task. Worker change → CI deploys on push. No migration.
- All commands run from `workers/`: `cd workers && npx vitest run <file>` / `npx tsc --noEmit`.

---

### Task 1: Lib layer — `storeUrl`, `store` intent, store copy

**Files:**
- Modify: `workers/src/lib/course-order.ts` (add `storeUrl` after `supportUrl`, line ~31)
- Modify: `workers/src/lib/telegram-update.ts` (add `'store'` to the `kind` union line 4; add `/store` branch after the `/support` branch, line ~55)
- Modify: `workers/src/lib/bot-copy.ts` (add `storeIntro`/`storeButton` to `BotCopy` interface + `RU` + `EN` objects)
- Test: `workers/src/lib/telegram-update.test.ts` (add `/store` cases)

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `storeUrl(locale: 'ru' | 'en'): string`
  - `BotIntent['kind']` now includes `'store'`
  - `BotCopy` now has `storeIntro: string` and `storeButton: string`

- [ ] **Step 1: Write the failing test**

In `workers/src/lib/telegram-update.test.ts`, add these two tests inside the top-level `describe` block, after the `/support` test (which ends at the line `expect(r.kind).toBe('support')` / `})`):

```ts
  it('parses /store', () => {
    const r = parseUpdate({ message: { text: '/store', from: { id: 4 }, chat: { id: 4 } } })
    expect(r.kind).toBe('store')
  })

  it('parses /store@botname', () => {
    const r = parseUpdate({ message: { text: '/store@tochka_sborki_lms_bot', from: { id: 4 }, chat: { id: 4 } } })
    expect(r.kind).toBe('store')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: FAIL — `parseUpdate` returns `kind: 'other'` for `/store` (no branch yet); also a TS error that `'store'` is not assignable to `BotIntent['kind']` until Step 3.

- [ ] **Step 3: Add the `store` intent to the parser**

In `workers/src/lib/telegram-update.ts`, change the `kind` union (line 4) from:

```ts
  kind: 'start' | 'continue' | 'stop' | 'support' | 'ask' | 'other'
```

to:

```ts
  kind: 'start' | 'continue' | 'stop' | 'support' | 'store' | 'ask' | 'other'
```

Then add a `/store` branch immediately after the `/support` branch (after the `kind = 'support'` block, before the `/ask` branch):

```ts
    } else if (/^\/store(\b|@|$)/.test(text)) {
      kind = 'store'
```

- [ ] **Step 4: Add `storeUrl` and store copy**

In `workers/src/lib/course-order.ts`, add after the `supportUrl` function (line ~31):

```ts
export function storeUrl(locale: 'ru' | 'en'): string {
  return locale === 'en' ? 'https://ai.mamaev.coach/en/store/' : 'https://ai.mamaev.coach/store/'
}
```

In `workers/src/lib/bot-copy.ts`, add to the `BotCopy` interface after `supportButton: string` (line 19):

```ts
  storeIntro: string
  storeButton: string
```

Add to the `RU` object after the `supportButton` line (line 38):

```ts
  storeIntro: 'Мерч и цифровые наборы проекта. Если что-то пригодится — вот витрина:',
  storeButton: '🛍 Магазин',
```

Add to the `EN` object after the `supportButton` line (line 57):

```ts
  storeIntro: 'Project merch and digital kits. If something’s useful — here’s the store:',
  storeButton: '🛍 Store',
```

- [ ] **Step 5: Run test + typecheck to verify they pass**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts && npx tsc --noEmit`
Expected: PASS — both `/store` tests green; tsc reports no errors (the `BotCopy` additions and `kind` union are consistent).

- [ ] **Step 6: Commit**

```bash
git add workers/src/lib/course-order.ts workers/src/lib/telegram-update.ts workers/src/lib/bot-copy.ts workers/src/lib/telegram-update.test.ts
git commit -m "feat(bot): /store intent + storeUrl + store copy, mirroring /support (fb_c20c437f)"
```

---

### Task 2: Webhook wire — `store` branch

**Files:**
- Modify: `workers/src/handlers/telegram-webhook.ts` (import `storeUrl`, line 3; add `store` branch after the `support` branch, line ~56)
- Test: `workers/src/handlers/telegram-webhook.test.ts` (add a `/store` webhook test after the `/support` test, line ~147)

**Interfaces:**
- Consumes: `storeUrl` from `../lib/course-order`; `copy.storeIntro` / `copy.storeButton` from Task 1.
- Produces: nothing downstream.

- [ ] **Step 1: Write the failing test**

In `workers/src/handlers/telegram-webhook.test.ts`, add this test after the `/support` test (which ends `expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/support/')` / `})`), inside the same `describe` block:

```ts
  it('/store sends a button to the store page', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/store', from: { id: 701 }, chat: { id: 701 } } }),
      makeEnv({ user: { id: 'u-701', language: 'ru', nudge_optout: 0 } })
    )
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/store/')
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: FAIL — the webhook has no `store` branch, so `/store` falls to the `else` hint branch and the button URL is the home URL, not `/store/`.

- [ ] **Step 3: Wire the `store` branch**

In `workers/src/handlers/telegram-webhook.ts`, extend the import on line 3 to include `storeUrl`:

```ts
import { nextLesson, lessonUrl, homeUrl, supportUrl, storeUrl } from '../lib/course-order'
```

Add a `store` branch immediately after the `support` branch (after the `intent.kind === 'support'` block that ends with the `supportUrl(locale)` `sendMessage`, before the `intent.kind === 'ask'` block):

```ts
    } else if (intent.kind === 'store') {
      await sendMessage(env, intent.chatId, copy.storeIntro, { text: copy.storeButton, url: storeUrl(locale) })
```

- [ ] **Step 4: Run test + full worker suite to verify they pass**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts && npx tsc --noEmit`
Expected: PASS — `/store` webhook test green; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add workers/src/handlers/telegram-webhook.ts workers/src/handlers/telegram-webhook.test.ts
git commit -m "feat(bot): wire /store webhook branch to store deep-link (fb_c20c437f)"
```

---

## Notes for the controller

- **Final gate** (whole feature): `cd workers && npx tsc --noEmit && npx vitest run`.
- No migration, no web change, no D1. Push → CI redeploys the worker.
- Follow-up (owner, out of scope): register `/store` in the BotFather command menu via `setMyCommands` if a menu entry is wanted; `/support` already works by typing without a menu entry.
