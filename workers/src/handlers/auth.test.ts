import { describe, it, expect, vi } from 'vitest'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './auth'
import type { Env } from '../lib/types'

function makeEnv(): Env {
  return {
    DB: {
      prepare: (sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  }
}

describe('handleSendLink', () => {
  it('returns 400 for missing email', async () => {
    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email format', async () => {
    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, makeEnv())
    expect(res.status).toBe(400)
  })

  it('returns 200 and calls Resend for valid email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'email123' }), { status: 200 })
    )
    const env = makeEnv()
    const firstMock = vi.fn().mockResolvedValue(null)
    const runMock = vi.fn().mockResolvedValue({ success: true })
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ first: firstMock, run: runMock }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    expect(fetchSpy).toHaveBeenCalledOnce()
    const [url] = fetchSpy.mock.calls[0] as [string]
    expect(url).toBe('https://api.resend.com/emails')
    fetchSpy.mockRestore()
  })
})

describe('handleLogout', () => {
  it('clears session cookie', async () => {
    const req = new Request('https://mamaev.coach/api/auth/logout', { method: 'POST' })
    const res = await handleLogout(req, makeEnv())
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('session=;')
  })
})
