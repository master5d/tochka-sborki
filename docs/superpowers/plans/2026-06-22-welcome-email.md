# Welcome Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a warm bilingual welcome email to a learner the first time they register, alongside the existing transactional magic-link email — best-effort, idempotent, honoring the authenticity boundary.

**Architecture:** New `lib/welcome-email.ts` holds a pure bilingual builder (`buildWelcomeEmail`, the Точка Сборки copy = course-data) + a best-effort sender (`sendWelcomeEmail`, mirrors `owner-notify.ts`/`purchase-email.ts`). `handlers/auth.ts handleSendLink` queues the send via `ctx.waitUntil` inside its existing `isNewUser`/`newLead` branch — fires only on first registration, never blocks or fails signup.

**Tech Stack:** Cloudflare Worker (TypeScript, zero deps), Resend REST (`POST /emails`, Bearer), vitest `env=node`.

## Global Constraints

- **Working dir:** worker commands from `/c/telo/Efforts/Ongoing/mc_hub/workers`; git from repo root `/c/telo/Efforts/Ongoing/mc_hub`. cwd drifts — use absolute paths in git.
- **Zero runtime deps** — raw `fetch` to Resend; no SDK.
- **Best-effort send:** `sendWelcomeEmail` NEVER throws; no-op `false` when `RESEND_API_KEY` unset; `false` on non-OK/throw. Logs without leaking the key.
- **Bilingual:** `lang === 'en'` → English; anything else → Russian (default). Mirrors `buildMagicLinkEmail`.
- **From address:** `'Точка Сборки <noreply@mamaev.coach>'` (exact).
- **Authenticity boundary:** the copy is fixed (below). Do NOT add testimonials, countdowns, income claims, scarcity, or upsell. Keep the anti-fluff "what you won't get" block and the single primary CTA (intake quest).
- **No migration, no new secret, no new route.** `RESEND_API_KEY` + `OWNER_EMAIL` already exist on `Env`.
- **Single test file run:** `npx vitest run src/path/to/file.test.ts` from `workers/`.

## File Structure

| File | Responsibility | Task |
|---|---|---|
| `workers/src/lib/welcome-email.ts` | `buildWelcomeEmail` (builder + copy) | 1 |
| | `+ sendWelcomeEmail` (best-effort sender) | 2 |
| `workers/src/lib/welcome-email.test.ts` | builder tests | 1 |
| | `+ sender tests` | 2 |
| `workers/src/handlers/auth.ts` | `+ ctx.waitUntil(sendWelcomeEmail)` in `newLead` block | 3 |
| `workers/src/handlers/auth.test.ts` | trigger + idempotency tests | 4 |

---

### Task 1: Bilingual welcome-email builder

**Files:**
- Create: `workers/src/lib/welcome-email.ts`
- Test: `workers/src/lib/welcome-email.test.ts`

**Interfaces:**
- Produces: `WelcomeEmail { subject; text; html; listUnsubscribe }`, `buildWelcomeEmail(lang: string, ctx: { verifyUrl: string; ownerEmail: string }): WelcomeEmail`.

- [ ] **Step 1: Write the failing test**

```ts
// workers/src/lib/welcome-email.test.ts
import { describe, it, expect } from 'vitest'
import { buildWelcomeEmail } from './welcome-email'

const ctx = { verifyUrl: 'https://ai.mamaev.coach/auth/verify?token=TOK', ownerEmail: 'owner@example.com' }

describe('buildWelcomeEmail ru', () => {
  const m = buildWelcomeEmail('ru', ctx)
  it('has the name-less RU subject', () => {
    expect(m.subject).toBe('Добро пожаловать в Точку Сборки')
  })
  it('resolves every placeholder (no {{ left) in text and html', () => {
    expect(m.text).not.toContain('{{')
    expect(m.html).not.toContain('{{')
  })
  it('embeds verify, intake and cheatsheet urls (ru, no /en prefix)', () => {
    for (const body of [m.text, m.html]) {
      expect(body).toContain('https://ai.mamaev.coach/auth/verify?token=TOK')
      expect(body).toContain('https://ai.mamaev.coach/quest-intake/')
      expect(body).toContain('https://ai.mamaev.coach/cheatsheet/')
    }
  })
  it('keeps the anti-fluff block and omits a community step', () => {
    expect(m.text).toContain('НЕ будет')
    expect(m.text).not.toContain('сообществ')
  })
  it('builds the List-Unsubscribe value pointing at the owner mailbox', () => {
    expect(m.listUnsubscribe).toBe('<mailto:owner@example.com?subject=unsubscribe>')
  })
})

describe('buildWelcomeEmail en', () => {
  const m = buildWelcomeEmail('en', ctx)
  it('has the name-less EN subject', () => {
    expect(m.subject).toBe('Welcome to Tochka Sborki')
  })
  it('uses the /en prefix on intake and cheatsheet urls', () => {
    expect(m.text).toContain('https://ai.mamaev.coach/en/quest-intake/')
    expect(m.text).toContain('https://ai.mamaev.coach/en/cheatsheet/')
  })
  it('has the EN founder note and anti-fluff block, no {{', () => {
    expect(m.text).toContain("won't get")
    expect(m.text).not.toContain('{{')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/lib/welcome-email.test.ts`
Expected: FAIL — cannot find module `./welcome-email`.

- [ ] **Step 3: Write minimal implementation**

```ts
// workers/src/lib/welcome-email.ts
export interface WelcomeEmail {
  subject: string
  text: string
  html: string
  listUnsubscribe: string   // value for the List-Unsubscribe header
}

// lang: 'en' → English; anything else → Russian (default), mirroring buildMagicLinkEmail.
export function buildWelcomeEmail(
  lang: string,
  ctx: { verifyUrl: string; ownerEmail: string },
): WelcomeEmail {
  const en = lang === 'en'
  const base = 'https://ai.mamaev.coach'
  const prefix = en ? '/en' : ''
  const intake = `${base}${prefix}/quest-intake/`
  const cheatsheet = `${base}${prefix}/cheatsheet/`
  const magic = ctx.verifyUrl
  const listUnsubscribe = `<mailto:${ctx.ownerEmail}?subject=unsubscribe>`

  if (en) {
    const subject = 'Welcome to Tochka Sborki'
    const text = `Hi there,

You've just joined Tochka Sborki — glad you're here.

Quick why. I spent 13 years as a coach and mentor, and a producer before that. When agentic AI arrived, I feared exactly what many creative people fear: "it'll do it for me — and then it won't be me." The opposite turned out to be true — AI doesn't replace your voice, it amplifies it and takes the busywork off your plate, once you know how to talk to it. That's what this course teaches. Free. All of it.

The thing I hear most: "I don't even know what to want from AI." That's normal — no one showed you the menu. So step one here isn't "study" — it's "see what's even possible".

Two steps to start:

1. Take the intake quest → ${intake}
   10 minutes. The course tailors itself to your niche and goal — everything after is about you, not "in general".

2. Open module 1 and set up your tools → ${magic}
   One button signs you in, no password. Start with the map of the terrain.

If you want one quick win right now:
Cheatsheet — the moves that actually work, on one page → ${cheatsheet}

What you won't get here: no spam, no fluff, no "buy before it's gone" pressure. The course is free and stays free. If it's not for you, you can unsubscribe with the "Unsubscribe" button in your mail client.

See you in the flow,
Alexander Mamaev (Ravi Angad Singh)
author of the Tochka Sborki course`
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:560px">
<p>Hi there,</p>
<p>You've just joined <strong>Tochka Sborki</strong> — glad you're here.</p>
<p>Quick why. I spent 13 years as a coach and mentor, and a producer before that. When agentic AI arrived, I feared exactly what many creative people fear: "it'll do it <em>for</em> me — and then it won't be me." The opposite turned out to be true — AI doesn't replace your voice, it <em>amplifies</em> it and takes the busywork off your plate, once you know how to talk to it. That's what this course teaches. Free. All of it.</p>
<p>The thing I hear most: "I don't even know what to want from AI." That's normal — no one showed you the menu. So step one here isn't "study" — it's <strong>"see what's even possible"</strong>.</p>
<p><strong>Two steps to start:</strong></p>
<ol>
<li><a href="${intake}">Take the intake quest</a> — 10 minutes. The course tailors itself to your niche and goal.</li>
<li><a href="${magic}">Open module 1 and set up your tools</a> — one button signs you in, no password.</li>
</ol>
<p>If you want one quick win right now: <a href="${cheatsheet}">the cheatsheet</a> — the moves that actually work, on one page.</p>
<p style="color:#555"><strong>What you won't get here:</strong> no spam, no fluff, no "buy before it's gone" pressure. The course is free and stays free. If it's not for you, unsubscribe with the "Unsubscribe" button in your mail client.</p>
<p>See you in the flow,<br><strong>Alexander Mamaev</strong> (Ravi Angad Singh)<br><em>author of the Tochka Sborki course</em></p>
</div>`
    return { subject, text, html, listUnsubscribe }
  }

  const subject = 'Добро пожаловать в Точку Сборки'
  const text = `Привет!

Вы зарегистрировались в «Точке Сборки» — рад, что вы здесь.

Коротко зачем это всё. Я 13 лет был коучем и наставником, а до того продюсером. Когда пришёл агентный AI, я испугался того же, чего боятся многие creative-люди: «он сделает за меня — и это будет уже не я». Оказалось наоборот — AI не заменяет ваш голос, а усиливает его и снимает рутину, если знать, как с ним говорить. Этому и учит курс. Бесплатно. Полностью.

Самое частое, что я слышу: «я даже не знаю, чего хотеть от AI». Это нормально — никто не показал меню. Поэтому первый шаг здесь не «учись», а «посмотри, что вообще возможно».

Два шага, чтобы начать:

1. Пройдите intake-квест → ${intake}
   10 минут. Курс подстроится под вашу нишу и цель — дальше всё будет про вас, а не «вообще».

2. Откройте первый модуль и поставьте инструменты → ${magic}
   Одна кнопка — вы внутри, без пароля. Начните с карты местности.

На случай «с чего ухватиться прямо сейчас»:
Шпаргалка — самые рабочие приёмы на одной странице → ${cheatsheet}

Чего тут НЕ будет: ни спама, ни воды, ни дожимающих писем «успей купить». Курс бесплатный и останется бесплатным. Если что-то не зайдёт — отписаться можно кнопкой «Unsubscribe» в вашей почте.

До встречи в потоке,
Александр Мамаев (Рави Ангад Синх)
автор курса «Точка Сборки»`
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:560px">
<p>Привет!</p>
<p>Вы зарегистрировались в <strong>«Точке Сборки»</strong> — рад, что вы здесь.</p>
<p>Коротко зачем это всё. Я 13 лет был коучем и наставником, а до того продюсером. Когда пришёл агентный AI, я испугался того же, чего боятся многие creative-люди: «он сделает за меня — и это будет уже не я». Оказалось наоборот — AI не заменяет ваш голос, а <em>усиливает</em> его и снимает рутину, если знать, как с ним говорить. Этому и учит курс. Бесплатно. Полностью.</p>
<p>Самое частое, что я слышу: «я даже не знаю, чего хотеть от AI». Это нормально — никто не показал меню. Поэтому первый шаг здесь не «учись», а <strong>«посмотри, что вообще возможно»</strong>.</p>
<p><strong>Два шага, чтобы начать:</strong></p>
<ol>
<li><a href="${intake}">Пройдите intake-квест</a> — 10 минут. Курс подстроится под вашу нишу и цель.</li>
<li><a href="${magic}">Откройте первый модуль и поставьте инструменты</a> — одна кнопка, вы внутри, без пароля.</li>
</ol>
<p>На случай «с чего ухватиться прямо сейчас»: <a href="${cheatsheet}">шпаргалка</a> — самые рабочие приёмы на одной странице.</p>
<p style="color:#555"><strong>Чего тут НЕ будет:</strong> ни спама, ни воды, ни дожимающих писем «успей купить». Курс бесплатный и останется бесплатным. Если что-то не зайдёт — отписаться можно кнопкой «Unsubscribe» в вашей почте.</p>
<p>До встречи в потоке,<br><strong>Александр Мамаев</strong> (Рави Ангад Синх)<br><em>автор курса «Точка Сборки»</em></p>
</div>`
  return { subject, text, html, listUnsubscribe }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/lib/welcome-email.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/welcome-email.ts workers/src/lib/welcome-email.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): bilingual welcome-email builder (Точка Сборки copy)"
```

---

### Task 2: Best-effort welcome sender

**Files:**
- Modify: `workers/src/lib/welcome-email.ts` (append `sendWelcomeEmail` + imports)
- Test: `workers/src/lib/welcome-email.test.ts` (append a describe block)

**Interfaces:**
- Consumes: `buildWelcomeEmail` (Task 1), `Env`.
- Produces: `sendWelcomeEmail(env: Env, p: { email: string; lang: string; verifyUrl: string }): Promise<boolean>`.

- [ ] **Step 1: Write the failing test** (append to `workers/src/lib/welcome-email.test.ts`)

```ts
import { vi, afterEach } from 'vitest'
import { sendWelcomeEmail } from './welcome-email'
import type { Env } from './types'

afterEach(() => vi.restoreAllMocks())

const env = { RESEND_API_KEY: 're_x', OWNER_EMAIL: 'owner@example.com' } as Env
const p = { email: 'b@e.com', lang: 'ru', verifyUrl: 'https://ai.mamaev.coach/auth/verify?token=T' }

describe('sendWelcomeEmail', () => {
  it('sends via Resend with the welcome subject and List-Unsubscribe header, returns true', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const ok = await sendWelcomeEmail(env, p)
    expect(ok).toBe(true)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body as string)
    expect(body.from).toBe('Точка Сборки <noreply@mamaev.coach>')
    expect(body.to).toEqual(['b@e.com'])
    expect(body.subject).toBe('Добро пожаловать в Точку Сборки')
    expect(body.headers['List-Unsubscribe']).toBe('<mailto:owner@example.com?subject=unsubscribe>')
  })
  it('is a no-op (false) when RESEND_API_KEY is unset', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const ok = await sendWelcomeEmail({ OWNER_EMAIL: 'o@e.com' } as Env, p)
    expect(ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
  it('returns false (never throws) when Resend responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 422 }))
    const ok = await sendWelcomeEmail(env, p)
    expect(ok).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/lib/welcome-email.test.ts`
Expected: FAIL — `sendWelcomeEmail` is not exported.

- [ ] **Step 3: Write minimal implementation** (append to `workers/src/lib/welcome-email.ts`; add the import at the top of the file)

```ts
import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// Best-effort welcome send (mirrors owner-notify.ts / purchase-email.ts). Never throws; returns whether it sent.
export async function sendWelcomeEmail(
  env: Env,
  p: { email: string; lang: string; verifyUrl: string },
): Promise<boolean> {
  const apiKey = strip(env.RESEND_API_KEY)
  if (!apiKey) return false
  const mail = buildWelcomeEmail(p.lang, { verifyUrl: p.verifyUrl, ownerEmail: strip(env.OWNER_EMAIL) })
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Точка Сборки <noreply@mamaev.coach>',
        to: [p.email],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        headers: { 'List-Unsubscribe': mail.listUnsubscribe },
      }),
    })
    if (!res.ok) { console.error('welcome-email non-OK', res.status, await res.text()); return false }
    return true
  } catch (e) {
    console.error('welcome-email failed', e)
    return false
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/lib/welcome-email.test.ts && npx tsc --noEmit`
Expected: PASS (8 builder + 3 sender = 11 tests); tsc clean.

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/lib/welcome-email.ts workers/src/lib/welcome-email.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): sendWelcomeEmail — best-effort Resend send + List-Unsubscribe"
```

---

### Task 3: Wire the welcome send into the signup flow

**Files:**
- Modify: `workers/src/handlers/auth.ts` (import + one `ctx.waitUntil` in the `if (newLead)` block)

**Interfaces:**
- Consumes: `sendWelcomeEmail` (Task 2).
- Produces: no new exports — a side-effect on `handleSendLink` for new users.

- [ ] **Step 1: Add the import** at the top of `workers/src/handlers/auth.ts`, next to the existing `import { addResendContact } from '../lib/crm'`:

```ts
import { sendWelcomeEmail } from '../lib/welcome-email'
```

- [ ] **Step 2: Add the queued send** inside the existing `if (newLead) { ... }` block in `handleSendLink`. The block currently reads:

```ts
  if (newLead) {
    ctx.waitUntil(
      addResendContact(env, newLead)
        .catch(e => console.error('Resend contact add failed', e))
    )
  }
```

Change it to add the welcome send right after the `addResendContact` `waitUntil` (still inside the same `if`):

```ts
  if (newLead) {
    ctx.waitUntil(
      addResendContact(env, newLead)
        .catch(e => console.error('Resend contact add failed', e))
    )
    ctx.waitUntil(
      sendWelcomeEmail(env, { email, lang, verifyUrl })
        .catch(e => console.error('welcome email failed', e))
    )
  }
```

`email`, `lang` (the freshly parsed language for the new user), and `verifyUrl` are all already in scope at this point in `handleSendLink`.

- [ ] **Step 3: Typecheck**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx tsc --noEmit`
Expected: clean (no errors).

- [ ] **Step 4: Run the existing auth suite to confirm no regression**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/handlers/auth.test.ts`
Expected: PASS — the existing tests use a `ctx.waitUntil` that discards the promise, so the new send does not affect them.

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/handlers/auth.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "feat(workers): send welcome email on first registration (handleSendLink)"
```

---

### Task 4: Trigger + idempotency tests

**Files:**
- Modify: `workers/src/handlers/auth.test.ts` (append a describe block + a collecting-ctx helper)

**Interfaces:**
- Consumes: `handleSendLink` (existing), the welcome trigger (Task 3).

**Why a new ctx helper:** the existing test's `ctx.waitUntil` is `(_p) => {}` — it discards the queued promise, so the welcome send would never run. These tests need a ctx that collects the promises so the test can await them before asserting.

- [ ] **Step 1: Write the failing test** (append to `workers/src/handlers/auth.test.ts`)

```ts
// collecting ctx: capture waitUntil promises so the queued welcome send actually runs
function makeCollectingCtx() {
  const promises: Promise<unknown>[] = []
  const ctx = { waitUntil: (p: Promise<unknown>) => { promises.push(p) } } as unknown as ExecutionContext
  return { ctx, settle: () => Promise.allSettled(promises) }
}

const emailsCalls = (spy: ReturnType<typeof vi.spyOn>) =>
  (spy.mock.calls as [string, RequestInit][])
    .filter(([url]) => url === 'https://api.resend.com/emails')
    .map(([, init]) => JSON.parse(init.body as string) as { subject: string })

describe('welcome email trigger', () => {
  it('sends BOTH magic-link and welcome emails for a NEW user', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'ok' }), { status: 200 }))
    const { ctx, settle } = makeCollectingCtx()
    const res = await handleSendLink(sendLinkReq({ email: 'new@example.com' }), makeEnv({ existing: false }), ctx)
    expect(res.status).toBe(200)
    await settle()
    const subjects = emailsCalls(spy).map(b => b.subject)
    expect(subjects).toContain('Ваша ссылка для входа')              // magic-link
    expect(subjects).toContain('Добро пожаловать в Точку Сборки')    // welcome
    expect(subjects.length).toBe(2)
    spy.mockRestore()
  })

  it('sends ONLY the magic-link email for an EXISTING user (idempotent)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'ok' }), { status: 200 }))
    const { ctx, settle } = makeCollectingCtx()
    const res = await handleSendLink(sendLinkReq({ email: 'old@example.com' }), makeEnv({ existing: true }), ctx)
    expect(res.status).toBe(200)
    await settle()
    const subjects = emailsCalls(spy).map(b => b.subject)
    expect(subjects).toEqual(['Ваша ссылка для входа'])               // no welcome
    spy.mockRestore()
  })
})
```

Note: `makeEnv` already sets `RESEND_API_KEY: 'resend_key'`. For the welcome send to build the List-Unsubscribe value it reads `env.OWNER_EMAIL`, which may be undefined in `makeEnv` — that is fine (the `strip` helper yields `''`, the send still fires; these tests assert on subject/count, not the header).

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/handlers/auth.test.ts`
Expected: FAIL — the "NEW user" test fails because before Task 3's wiring only the magic-link fires (the welcome send is wired, so actually this should PASS if Task 3 landed; if running this task in isolation before Task 3, it fails on `subjects.length` 1 ≠ 2). Since Task 3 is already merged, run it to confirm it now PASSES — if it fails, the wiring regressed.

- [ ] **Step 3: (no new implementation)** — the behavior is provided by Task 3. If Step 2 shows a failure, the bug is in the Task 3 wiring (welcome not queued, or queued outside the `isNewUser` branch); fix there.

- [ ] **Step 4: Run the full auth suite**

Run: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/handlers/auth.test.ts`
Expected: PASS (existing send-link/logout tests + 2 new trigger tests).

- [ ] **Step 5: Commit**

```bash
git -C /c/telo/Efforts/Ongoing/mc_hub add workers/src/handlers/auth.test.ts
git -C /c/telo/Efforts/Ongoing/mc_hub commit -m "test(workers): welcome-email trigger + idempotency (new vs existing user)"
```

---

## Post-implementation (controller)

1. Run the worker suite scoped to `src/`: `cd /c/telo/Efforts/Ongoing/mc_hub/workers && npx vitest run src/` (NOT bare `npx vitest run`, which sweeps the web tests and false-fails on cwd — known gotcha).
2. `git push origin main` → CI deploys the worker (`deploy-workers` by path filter).
3. Feature ships quietly: `RESEND_API_KEY` is already set, so new registrations begin receiving the welcome immediately. Verify by registering a fresh test email and checking inbox placement (Primary vs Promotions) + the native Unsubscribe button.

## Self-Review

- **Spec coverage:** builder bilingual + resolved placeholders + name-less greeting + omitted community + softened unsubscribe + List-Unsubscribe value (T1) ✓; best-effort sender no-op/false/never-throws + from + List-Unsubscribe header (T2) ✓; wired in `isNewUser`/`newLead` branch via `ctx.waitUntil`, after magic-link, never blocks (T3) ✓; trigger test two-emails-new + idempotency one-email-existing (T4) ✓; no migration/secret/route ✓; engine/course seam (single builder) ✓.
- **Type consistency:** `WelcomeEmail`/`buildWelcomeEmail(lang, {verifyUrl, ownerEmail})` (T1) consumed by `sendWelcomeEmail(env, {email, lang, verifyUrl})` (T2); `sendWelcomeEmail` signature matches the T3 call site exactly (`{ email, lang, verifyUrl }`); subjects asserted in T4 (`Добро пожаловать в Точку Сборки`, `Ваша ссылка для входа`) match T1's RU subject and the existing `buildMagicLinkEmail` RU subject.
- **Placeholder scan:** none — full copy + code in every step.
