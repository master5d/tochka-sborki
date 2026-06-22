# Telegram Companion Bot — Slice 1a Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A secret-token-verified Telegram webhook on the existing Worker that handles `/start` and `/continue`, computing the learner's next-in-order lesson from D1 progress and replying with a deep-link button into the Mini App.

**Architecture:** Raw (no framework) webhook handler reusing the dependency-free Worker patterns. Pure units (`course-order`, `telegram-update`) hold the logic; thin `telegram-api.sendMessage` does I/O; the handler authenticates, routes, reads D1, and always returns 200 for legit updates.

**Tech Stack:** Cloudflare Workers, D1 SQLite, raw Telegram Bot API over `fetch`, Vitest (env=node). Spec: `docs/superpowers/specs/2026-06-22-telegram-companion-bot-1a-design.md`.

**Conventions:**
- Worker tests mock D1 via `prepare().bind().first()/all()` stubs and mock `globalThis.fetch` (see `workers/src/handlers/auth.test.ts`).
- Run worker tests from `workers/`: `cd workers && npx vitest run <file>`.
- No migration — 1a reuses `users` and `progress`.
- Telegram user ids are assumed `< 2^53` (true today); `parseUpdate` stringifies the parsed numeric id, matching the decimal string Phase 0 stored in `telegram_id`.

---

### Task 1: Course order + next-lesson logic

**Files:**
- Create: `workers/src/lib/course-order.ts`
- Test: `workers/src/lib/course-order.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/course-order.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { MODULE_ORDER, nextLesson, lessonUrl, homeUrl } from './course-order'

describe('nextLesson', () => {
  it('returns the first module when nothing is done', () => {
    expect(nextLesson(new Set(), new Set())).toEqual({ slug: '00-kickstart', resume: false })
  })

  it('returns the earliest incomplete module (no-skip)', () => {
    const completed = new Set(['00-kickstart', '01-introduction'])
    expect(nextLesson(completed, completed)).toEqual({ slug: '02-setup-guide', resume: false })
  })

  it('marks resume when the next module was viewed but not completed', () => {
    const completed = new Set(['00-kickstart'])
    const viewed = new Set(['00-kickstart', '01-introduction'])
    expect(nextLesson(completed, viewed)).toEqual({ slug: '01-introduction', resume: true })
  })

  it('returns null when every module is completed', () => {
    const all = new Set(MODULE_ORDER)
    expect(nextLesson(all, all)).toBeNull()
  })
})

describe('lessonUrl / homeUrl', () => {
  it('builds ru and en lesson URLs', () => {
    expect(lessonUrl('02-setup-guide', 'ru')).toBe('https://ai.mamaev.coach/lessons/02-setup-guide/')
    expect(lessonUrl('02-setup-guide', 'en')).toBe('https://ai.mamaev.coach/en/lessons/02-setup-guide/')
  })
  it('builds ru and en home URLs', () => {
    expect(homeUrl('ru')).toBe('https://ai.mamaev.coach/')
    expect(homeUrl('en')).toBe('https://ai.mamaev.coach/en/')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/course-order.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `workers/src/lib/course-order.ts`:

```ts
// Canonical module order — mirrors content/{ru,en}/ directory order. Engine config:
// the Worker can't import web content, so the ordered slug list lives here.
export const MODULE_ORDER = [
  '00-kickstart', '01-introduction', '02-setup-guide', '03-stack-selection',
  '04-prompt-engineering', '05-context-memory', '06-audio-pipeline', '07-tools',
  '08-agent-engineering',
] as const

export interface NextLesson { slug: string; resume: boolean }

// Earliest module not completed. resume = it was viewed but not completed.
// null when every module is completed.
export function nextLesson(completed: Set<string>, viewed: Set<string>): NextLesson | null {
  for (const slug of MODULE_ORDER) {
    if (!completed.has(slug)) return { slug, resume: viewed.has(slug) }
  }
  return null
}

export function lessonUrl(slug: string, locale: 'ru' | 'en'): string {
  const base = locale === 'en' ? 'https://ai.mamaev.coach/en' : 'https://ai.mamaev.coach'
  return `${base}/lessons/${slug}/`
}

export function homeUrl(locale: 'ru' | 'en'): string {
  return locale === 'en' ? 'https://ai.mamaev.coach/en/' : 'https://ai.mamaev.coach/'
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/course-order.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/course-order.ts workers/src/lib/course-order.test.ts
git commit -m "feat(workers): course-order — next-in-order lesson + deep-link URLs"
```

---

### Task 2: Update parser

**Files:**
- Create: `workers/src/lib/telegram-update.ts`
- Test: `workers/src/lib/telegram-update.test.ts`

- [ ] **Step 1: Write the failing test**

Create `workers/src/lib/telegram-update.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { parseUpdate } from './telegram-update'

describe('parseUpdate', () => {
  it('parses /start', () => {
    const r = parseUpdate({ message: { text: '/start', from: { id: 42, language_code: 'ru' }, chat: { id: 42 } } })
    expect(r).toEqual({ kind: 'start', fromId: '42', chatId: 42, languageCode: 'ru' })
  })

  it('parses /start@botname', () => {
    const r = parseUpdate({ message: { text: '/start@tochka_sborki_lms_bot', from: { id: 7 }, chat: { id: 7 } } })
    expect(r.kind).toBe('start')
  })

  it('parses /continue', () => {
    const r = parseUpdate({ message: { text: '/continue', from: { id: 5, language_code: 'en' }, chat: { id: 5 } } })
    expect(r).toEqual({ kind: 'continue', fromId: '5', chatId: 5, languageCode: 'en' })
  })

  it('parses a continue callback_query', () => {
    const r = parseUpdate({ callback_query: { data: 'continue', from: { id: 9, language_code: 'ru' }, message: { chat: { id: 9 } } } })
    expect(r).toEqual({ kind: 'continue', fromId: '9', chatId: 9, languageCode: 'ru' })
  })

  it('treats plain text as other', () => {
    const r = parseUpdate({ message: { text: 'hello', from: { id: 1 }, chat: { id: 1 } } })
    expect(r.kind).toBe('other')
  })

  it('does not match /startfoo as start', () => {
    const r = parseUpdate({ message: { text: '/startfoo', from: { id: 1 }, chat: { id: 1 } } })
    expect(r.kind).toBe('other')
  })

  it('returns nulls for an empty update', () => {
    expect(parseUpdate({})).toEqual({ kind: 'other', fromId: null, chatId: null, languageCode: null })
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `workers/src/lib/telegram-update.ts`:

```ts
export interface BotIntent {
  kind: 'start' | 'continue' | 'other'
  fromId: string | null    // telegram numeric id as decimal string (< 2^53 assumed)
  chatId: number | null
  languageCode: string | null
}

function idToStr(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v === 'string' && /^\d+$/.test(v)) return v
  return null
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

export function parseUpdate(update: unknown): BotIntent {
  const u = (update ?? {}) as Record<string, any>

  if (u.callback_query) {
    const cq = u.callback_query
    return {
      kind: cq.data === 'continue' ? 'continue' : 'other',
      fromId: idToStr(cq.from?.id),
      chatId: numOrNull(cq.message?.chat?.id),
      languageCode: strOrNull(cq.from?.language_code),
    }
  }

  if (u.message) {
    const m = u.message
    const text = typeof m.text === 'string' ? m.text.trim() : ''
    let kind: BotIntent['kind'] = 'other'
    if (/^\/start(\b|@|$)/.test(text)) kind = 'start'
    else if (/^\/continue(\b|@|$)/.test(text)) kind = 'continue'
    return {
      kind,
      fromId: idToStr(m.from?.id),
      chatId: numOrNull(m.chat?.id),
      languageCode: strOrNull(m.from?.language_code),
    }
  }

  return { kind: 'other', fromId: null, chatId: null, languageCode: null }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/telegram-update.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add workers/src/lib/telegram-update.ts workers/src/lib/telegram-update.test.ts
git commit -m "feat(workers): pure Telegram update parser (start/continue/callback intents)"
```

---

### Task 3: Bilingual copy + Bot API sender + env var

**Files:**
- Create: `workers/src/lib/bot-copy.ts`
- Create: `workers/src/lib/telegram-api.ts`
- Test: `workers/src/lib/telegram-api.test.ts`
- Modify: `workers/src/lib/types.ts` (add `TELEGRAM_WEBHOOK_SECRET`)

- [ ] **Step 1: Add the env var**

In `workers/src/lib/types.ts`, add inside `interface Env` (after `TELEGRAM_BOT_TOKEN: string`):

```ts
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_WEBHOOK_SECRET: string
}
```

- [ ] **Step 2: Create the bilingual copy module**

Create `workers/src/lib/bot-copy.ts`:

```ts
export type BotLocale = 'ru' | 'en'

export interface BotCopy {
  greeting: string
  openCourse: string
  continueIntro: string
  continueLabel: string
  openFirst: string
  finished: string
  hint: string
}

const RU: BotCopy = {
  greeting: 'Привет! Это Точка Сборки — курс по agentic AI в потоке.\nНажми кнопку, чтобы открыть курс прямо здесь, в Telegram.',
  openCourse: '▶️ Открыть курс',
  continueIntro: 'Продолжаем с того места, где ты остановился.',
  continueLabel: '▶️ Продолжить',
  openFirst: 'Сначала открой курс — так я свяжу твой прогресс.',
  finished: '🎉 Ты прошёл все модули. Красавчик. Возвращайся за повторением в любой момент.',
  hint: 'Я подскажу, что дальше. Жми кнопку ниже.',
}

const EN: BotCopy = {
  greeting: 'Hi! This is Tochka Sborki — a course on agentic AI, in flow.\nTap the button to open the course right here in Telegram.',
  openCourse: '▶️ Open course',
  continueIntro: 'Picking up right where you left off.',
  continueLabel: '▶️ Continue',
  openFirst: 'Open the course first — that links your progress.',
  finished: '🎉 You finished every module. Nicely done. Come back for a refresher anytime.',
  hint: "I'll point you to what's next. Tap the button below.",
}

export function botCopy(locale: BotLocale): BotCopy {
  return locale === 'en' ? EN : RU
}

// Map a Telegram language_code or stored users.language to a bot locale (RU default).
export function pickLocale(code: string | null | undefined): BotLocale {
  return (code ?? '').toLowerCase().startsWith('en') ? 'en' : 'ru'
}
```

- [ ] **Step 3: Write the failing test for the sender**

Create `workers/src/lib/telegram-api.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendMessage } from './telegram-api'
import type { Env } from './types'

const env = { TELEGRAM_BOT_TOKEN: 'BOTTOKEN' } as Env

afterEach(() => vi.restoreAllMocks())

describe('sendMessage', () => {
  it('POSTs to the Bot API sendMessage endpoint with chat_id and text', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await sendMessage(env, 555, 'hello')
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.telegram.org/botBOTTOKEN/sendMessage')
    const body = JSON.parse(init.body as string)
    expect(body.chat_id).toBe(555)
    expect(body.text).toBe('hello')
    expect(body.reply_markup).toBeUndefined()
  })

  it('attaches a web_app inline button when provided', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await sendMessage(env, 1, 'go', { text: 'Open', url: 'https://ai.mamaev.coach/' })
    const body = JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)
    expect(body.reply_markup.inline_keyboard[0][0]).toEqual({ text: 'Open', web_app: { url: 'https://ai.mamaev.coach/' } })
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/lib/telegram-api.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 5: Implement the sender**

Create `workers/src/lib/telegram-api.ts`:

```ts
import type { Env } from './types'

export interface WebAppButton { text: string; url: string }

// Minimal raw Bot API sendMessage. Optional single web_app inline button.
export async function sendMessage(env: Env, chatId: number, text: string, button?: WebAppButton): Promise<void> {
  const reply_markup = button
    ? { inline_keyboard: [[{ text: button.text, web_app: { url: button.url } }]] }
    : undefined
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup }),
  })
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/lib/telegram-api.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 7: Commit**

```bash
git add workers/src/lib/types.ts workers/src/lib/bot-copy.ts workers/src/lib/telegram-api.ts workers/src/lib/telegram-api.test.ts
git commit -m "feat(workers): bilingual bot copy + raw sendMessage + webhook-secret env"
```

---

### Task 4: Webhook handler + route

**Files:**
- Create: `workers/src/handlers/telegram-webhook.ts`
- Test: `workers/src/handlers/telegram-webhook.test.ts`
- Modify: `workers/src/index.ts` (import + route)

- [ ] **Step 1: Write the failing test**

Create `workers/src/handlers/telegram-webhook.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleTelegramWebhook } from './telegram-webhook'
import type { Env } from '../lib/types'

const SECRET = 'wh-secret'

type Row = Record<string, unknown>
function makeEnv(opts: { user?: Row | null; progress?: Row[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (..._b: unknown[]) => ({
        first: vi.fn().mockResolvedValue(/FROM users/.test(sql) ? (opts.user ?? null) : null),
        all: vi.fn().mockResolvedValue({ results: /FROM progress/.test(sql) ? (opts.progress ?? []) : [] }),
      }),
    }),
  } as unknown as D1Database
  return { DB, TELEGRAM_BOT_TOKEN: 'BOT', TELEGRAM_WEBHOOK_SECRET: SECRET } as Env
}

function req(update: unknown, secret: string | null = SECRET): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== null) headers['X-Telegram-Bot-Api-Secret-Token'] = secret
  return new Request('https://ai.mamaev.coach/api/telegram/webhook', {
    method: 'POST', body: JSON.stringify(update), headers,
  })
}

afterEach(() => vi.restoreAllMocks())

const lastBody = (spy: ReturnType<typeof vi.spyOn>) =>
  JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)

describe('handleTelegramWebhook', () => {
  it('rejects a missing/wrong secret token with 403', async () => {
    const res = await handleTelegramWebhook(req({ message: { text: '/start' } }, 'wrong'), makeEnv())
    expect(res.status).toBe(403)
  })

  it('/start sends a greeting with an open-course button (unlinked ok)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const res = await handleTelegramWebhook(
      req({ message: { text: '/start', from: { id: 100, language_code: 'ru' }, chat: { id: 100 } } }),
      makeEnv({ user: null })
    )
    expect(res.status).toBe(200)
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/')
  })

  it('/continue from an unlinked user asks them to open the course first', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/continue', from: { id: 200 }, chat: { id: 200 } } }),
      makeEnv({ user: null })
    )
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/')
  })

  it('/continue from a linked user deep-links the next incomplete lesson', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/continue', from: { id: 300, language_code: 'ru' }, chat: { id: 300 } } }),
      makeEnv({ user: { id: 'u-300', language: 'ru' }, progress: [{ lesson_slug: '00-kickstart', completed_at: 123 }] })
    )
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url)
      .toBe('https://ai.mamaev.coach/lessons/01-introduction/')
  })

  it('returns 200 even when the update is junk', async () => {
    const res = await handleTelegramWebhook(req({ nonsense: true }), makeEnv())
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: FAIL — handler not found.

- [ ] **Step 3: Implement the handler**

Create `workers/src/handlers/telegram-webhook.ts`:

```ts
import type { Env } from '../lib/types'
import { parseUpdate } from '../lib/telegram-update'
import { nextLesson, lessonUrl, homeUrl } from '../lib/course-order'
import { botCopy, pickLocale, type BotLocale } from '../lib/bot-copy'
import { sendMessage } from '../lib/telegram-api'

async function loadProgress(env: Env, userId: string): Promise<{ completed: Set<string>; viewed: Set<string> }> {
  const { results } = await env.DB.prepare(
    'SELECT lesson_slug, completed_at FROM progress WHERE user_id = ?'
  ).bind(userId).all<{ lesson_slug: string; completed_at: number | null }>()
  const completed = new Set<string>()
  const viewed = new Set<string>()
  for (const r of results ?? []) {
    viewed.add(r.lesson_slug)
    if (r.completed_at) completed.add(r.lesson_slug)
  }
  return { completed, viewed }
}

export async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
  // authenticate: Telegram echoes the secret_token set at setWebhook time
  const secret = request.headers.get('X-Telegram-Bot-Api-Secret-Token')
  if (!env.TELEGRAM_WEBHOOK_SECRET || secret !== env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response('Forbidden', { status: 403 })
  }

  let update: unknown
  try { update = await request.json() } catch { return new Response('ok', { status: 200 }) }

  try {
    const intent = parseUpdate(update)
    if (intent.chatId == null) return new Response('ok', { status: 200 })

    let locale: BotLocale = pickLocale(intent.languageCode)
    let user: { id: string; language: string | null } | null = null
    if (intent.fromId) {
      user = await env.DB.prepare('SELECT id, language FROM users WHERE telegram_id = ?')
        .bind(intent.fromId).first<{ id: string; language: string | null }>()
      if (user?.language) locale = pickLocale(user.language)
    }
    const copy = botCopy(locale)

    if (intent.kind === 'start') {
      await sendMessage(env, intent.chatId, copy.greeting, { text: copy.openCourse, url: homeUrl(locale) })
    } else if (intent.kind === 'continue') {
      if (!user) {
        await sendMessage(env, intent.chatId, copy.openFirst, { text: copy.openCourse, url: homeUrl(locale) })
      } else {
        const { completed, viewed } = await loadProgress(env, user.id)
        const next = nextLesson(completed, viewed)
        if (!next) {
          await sendMessage(env, intent.chatId, copy.finished)
        } else {
          await sendMessage(env, intent.chatId, copy.continueIntro, { text: copy.continueLabel, url: lessonUrl(next.slug, locale) })
        }
      }
    } else {
      await sendMessage(env, intent.chatId, copy.hint, { text: copy.openCourse, url: homeUrl(locale) })
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('telegram webhook error', e)
    return new Response('ok', { status: 200 })
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd workers && npx vitest run src/handlers/telegram-webhook.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Wire the route in index.ts**

In `workers/src/index.ts`, add the import after the existing telegram-auth import:

```ts
import { handleTelegramAuth } from './handlers/telegram-auth'
import { handleTelegramWebhook } from './handlers/telegram-webhook'
```

And add a route branch after the `/api/auth/telegram` branch:

```ts
      } else if (path === '/api/auth/telegram' && method === 'POST') {
        response = await handleTelegramAuth(request, env)
      } else if (path === '/api/telegram/webhook' && method === 'POST') {
        response = await handleTelegramWebhook(request, env)
```

- [ ] **Step 6: Typecheck + full worker suite**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
git add workers/src/handlers/telegram-webhook.ts workers/src/handlers/telegram-webhook.test.ts workers/src/index.ts
git commit -m "feat(workers): Telegram companion bot webhook (start/continue + deep-link)"
```

---

### Task 5: Extend the go-live script to register the webhook

**Files:**
- Modify: `workers/scripts/telegram-go-live.ps1` (add `-RegisterWebhook` switch)

- [ ] **Step 1: Add the switch parameter**

In `workers/scripts/telegram-go-live.ps1`, add to the `param(...)` block:

```powershell
param(
  [switch]$RegisterWebhook,
  [string]$WebhookUrl = 'https://ai.mamaev.coach/api/telegram/webhook',
  [string]$MiniAppUrl = 'https://ai.mamaev.coach/',
  [string]$ButtonText = 'Открыть курс',
  [string]$ProdRoute  = 'https://ai.mamaev.coach/api/auth/telegram'
)
```

- [ ] **Step 2: Add the webhook-registration block**

In `workers/scripts/telegram-go-live.ps1`, inside the `try { … }` that already holds the token, after the
"set the Mini App menu button" step (step 3) and before the closing `}` of that `try`, add:

```powershell
  # --- 3b. register the webhook (only with -RegisterWebhook) --------------------------------
  if ($RegisterWebhook) {
    Write-Step '3b' 'Registering the Telegram webhook (secret_token) ...'
    # generate a random secret, store it as a Worker secret, then point Telegram at our route
    $whSecret = [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) `
      -replace '[^A-Za-z0-9]', ''
    Push-Location $workersDir
    try {
      $whSecret | npx --yes wrangler secret put TELEGRAM_WEBHOOK_SECRET
      if ($LASTEXITCODE -ne 0) { throw "wrangler secret put (webhook) exited $LASTEXITCODE" }
    } finally { Pop-Location }

    $whBody = @{
      url             = $WebhookUrl
      secret_token    = $whSecret
      allowed_updates = @('message', 'callback_query')
      drop_pending_updates = $true
    } | ConvertTo-Json -Depth 6
    $wh = Invoke-RestMethod -Uri "https://api.telegram.org/bot$plain/setWebhook" `
      -Method Post -ContentType 'application/json; charset=utf-8' -Body $whBody
    if ($wh.ok) {
      Write-Host '    OK — webhook registered' -ForegroundColor Green
    } else {
      Write-Warning "    setWebhook returned not-ok: $($wh | ConvertTo-Json -Compress)"
    }
    $whSecret = $null
  }
```

- [ ] **Step 3: Verify the script parses (syntax check, no token needed)**

Run: `pwsh -NoProfile -Command "Get-Command -Syntax C:\telo\Efforts\Ongoing\mc_hub\workers\scripts\telegram-go-live.ps1"`
Expected: prints the parameter syntax including `-RegisterWebhook` with no parse error.

- [ ] **Step 4: Commit**

```bash
git add workers/scripts/telegram-go-live.ps1
git commit -m "chore(workers): go-live script -RegisterWebhook (secret + setWebhook)"
```

---

### Task 6: Deploy + final verification (ops)

**Files:** none

- [ ] **Step 1: Confirm both suites green**

Run: `cd workers && npx tsc --noEmit && npx vitest run`
Expected: tsc clean; all tests pass (existing + 20 new across Tasks 1–4).

- [ ] **Step 2: Report the owner go-live step**

The webhook route ships dark (receives nothing until registered). Surface to the owner: run
`pwsh workers/scripts/telegram-go-live.ps1 -RegisterWebhook` (paste the same bot token) to mint
`TELEGRAM_WEBHOOK_SECRET`, store it, and register the webhook. Then `/start` and `/continue` go live.

- [ ] **Step 3: Live integration check (after registration)**

In Telegram, send `/start` then `/continue` to **@tochka_sborki_lms_bot**. Confirm a reply with a button.
**If the inline `web_app` button is rejected by Telegram** (BUTTON_TYPE_INVALID / nothing arrives), switch
the button in `telegram-api.ts` from `web_app: { url }` to `url`-based and redeploy (documented fallback in
the spec); the menu button remains the auto-login entry. Confirm via `npx wrangler tail tochka-sborki-api`.

---

## Self-Review

**Spec coverage:**
- Raw webhook handler + secret-token auth → Task 4 ✓
- `/start` (unlinked ok) + `/continue` (linked/unlinked/finished) → Task 4 ✓
- next-in-order advisory drip + resume → Task 1 (`nextLesson`) ✓
- deep-link URLs ru/en + home → Task 1 (`lessonUrl`/`homeUrl`) ✓
- pure update parser (start/continue/callback, id+lang) → Task 2 ✓
- bilingual copy → Task 3 (`bot-copy`) ✓
- raw sendMessage + web_app button → Task 3 (`telegram-api`) ✓
- `TELEGRAM_WEBHOOK_SECRET` env + route → Task 3 (env) + Task 4 (route) ✓
- always-200 on legit update / 403 on bad secret → Task 4 ✓
- webhook registration (secret + setWebhook) → Task 5 ✓
- deploy gate + web_app fallback → Task 6 ✓
- No migration (reuses users/progress) → consistent across tasks ✓

**Placeholder scan:** none — every code step is complete; commands have expected output.

**Type consistency:** `BotIntent` fields (`kind`, `fromId:string|null`, `chatId:number|null`,
`languageCode`) defined in Task 2, consumed identically in Task 4. `nextLesson(completed,viewed)` /
`NextLesson{slug,resume}` defined Task 1, used Task 4. `sendMessage(env, chatId, text, button?)` with
`WebAppButton{text,url}` defined Task 3, called Task 4. `botCopy`/`pickLocale`/`BotLocale` defined Task 3,
used Task 4. `homeUrl`/`lessonUrl` ru→`/`, en→`/en/` consistent between Task 1 def and Task 4 calls and the
Task 4 test assertions (`/lessons/01-introduction/` after `00-kickstart` completed).
