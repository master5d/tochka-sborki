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
