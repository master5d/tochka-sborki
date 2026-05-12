import { describe, it, expect, vi } from 'vitest'
import { handleFeedback } from './feedback'
import type { Env } from '../lib/types'

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: {} as D1Database,
    WORKER_JWT_SECRET: 'secret',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: 'https://n8n.example.com/webhook/feedback',
    N8N_WEBHOOK_SECRET: 'webhook_secret',
    ...overrides,
  }
}

describe('handleFeedback', () => {
  it('returns 400 if required fields missing', async () => {
    const req = new Request('https://mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: 'Meeting 1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('forwards to n8n with secret header on valid payload', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 200 })
    )
    const req = new Request('https://mamaev.coach/api/feedback', {
      method: 'POST',
      body: JSON.stringify({ lesson: 'Meeting 1', recommend: '5', impact: '4', apply: '5' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleFeedback(req, makeEnv())
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://n8n.example.com/webhook/feedback')
    expect((init.headers as Record<string, string>)['X-Webhook-Secret']).toBe('webhook_secret')
    fetchSpy.mockRestore()
  })
})
