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
