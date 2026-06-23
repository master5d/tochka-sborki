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
