# Telegram bot `/store` deep-link

**Ticket:** fb_c20c437fe85d (Checkout for merch + donations — residual delta only)
**Date:** 2026-07-04
**Status:** approved

## Goal

Add a `/store` command to the Telegram companion bot that deep-links to the
web `/store` (merch) page — mirroring the already-shipped `/support` command
— so the ticket's "deep-link out from the Telegram companion bot" line covers
merch, not just tips. Worker-bot only; no web, D1, or migration changes.

## Context (grep-verified — the ticket is ~95% already shipped)

The merch + tips checkout is live: engine (`handleProductCheckout`,
`handleSupportCheckout`), web pages (`/store`, `/support`, `+thanks`, nav),
sole-prop copy everywhere (explicitly "not a nonprofit"), signed idempotent
webhook, purchase email, and a Telegram bot `/support` deep-link. The bot has
**no** `/store` deep-link — that is the only genuine code delta. The ticket's
"donations to the nonprofit" wording is stale: the shipped copy is already
correctly sole-prop.

Out of scope (YAGNI): R2 digital delivery (`resolveAssetUrl` throws — catalog
is empty), filling the catalog (owner content), the "all-umbrella"
abstraction, and registering `/store` in the BotFather command menu (external
API; `/support` also works by typing — noted as an owner follow-up).

## Constraints

- **Mirror the shipped `/support` path exactly** — same structure, same
  `sendMessage(chatId, intro, { text, url })` shape.
- **Sole-prop, NEVER nonprofit** framing; authenticity — no push, no
  scarcity, no vanity goals.
- Trunk-based on `main`; TDD; commit per task. Repo worker change → CI
  deploys on push. No migration.

## Architecture (all four edits mirror `/support`)

### 1. `workers/src/lib/course-order.ts` — `storeUrl`

```ts
export function storeUrl(locale: 'ru' | 'en'): string {
  return locale === 'en' ? 'https://ai.mamaev.coach/en/store/' : 'https://ai.mamaev.coach/store/'
}
```
(Mirror of `supportUrl`; the `/store` and `/en/store` routes already exist.)

### 2. `workers/src/lib/telegram-update.ts` — `store` intent

- `BotIntent['kind']` union gains `'store'`:
  `'start' | 'continue' | 'stop' | 'support' | 'store' | 'ask' | 'other'`.
- New branch after the `/support` branch, before `/ask`:
  ```ts
  } else if (/^\/store(\b|@|$)/.test(text)) {
    kind = 'store'
  ```

### 3. `workers/src/lib/bot-copy.ts` — store copy

- `BotCopy` interface gains `storeIntro: string` and `storeButton: string`.
- RU object:
  - `storeIntro: 'Мерч и цифровые наборы проекта. Если что-то пригодится — вот витрина:'`
  - `storeButton: '🛍 Магазин'`
- EN object:
  - `storeIntro: 'Project merch and digital kits. If something’s useful — here’s the store:'`
  - `storeButton: '🛍 Store'`

### 4. `workers/src/handlers/telegram-webhook.ts` — wire the branch

- Import `storeUrl` from `../lib/course-order` (alongside the existing
  `supportUrl`).
- New branch after `intent.kind === 'support'`:
  ```ts
  } else if (intent.kind === 'store') {
    await sendMessage(env, intent.chatId, copy.storeIntro, { text: copy.storeButton, url: storeUrl(locale) })
  ```

## Testing

- `workers/src/lib/telegram-update.test.ts`: `/store` → `kind === 'store'`;
  `/store@bot` also → `'store'`.
- `workers/src/handlers/telegram-webhook.test.ts`: a `/store` update sends
  `copy.storeIntro` with a button whose `url` is `storeUrl(locale)` — mirror
  the existing `/support` webhook test.
- If `course-order` / `bot-copy` have existing pattern tests, add a focused
  `storeUrl` / store-copy assertion; otherwise the two above suffice.
- Gate: `cd workers && npx tsc --noEmit && npx vitest run`.

## Decomposition → SDD tasks (writing-plans finalizes)

1. Lib layer: `storeUrl` + `store` intent parse + store copy + their tests.
2. Handler wire: `telegram-webhook.ts` `store` branch + webhook test.

## Out of scope

R2 digital delivery; catalog content; all-umbrella abstraction; BotFather
command-menu registration; any web/D1/migration change; any nonprofit
framing.
