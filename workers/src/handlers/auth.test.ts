import { describe, it, expect, vi } from 'vitest'
import { handleSendLink, handleVerify, handleMe, handleLogout } from './auth'
import type { Env } from '../lib/types'

function makeEnv(): Env {
  const first = vi.fn().mockResolvedValue(null)
  const run = vi.fn().mockResolvedValue({ success: true })
  return {
    DB: {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ first, run }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
    N8N_CRM_WEBHOOK_URL: 'https://n8n.synergify.com/webhook/mds-crm',
    N8N_CRM_SECRET: 'test-crm-secret',
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
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      return new Response(JSON.stringify({ id: 'ok' }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    const resendCall = (fetchSpy.mock.calls as [string][]).find(([url]) => url === 'https://api.resend.com/emails')
    expect(resendCall).toBeDefined()
    fetchSpy.mockRestore()
  })

  it('returns 502 if Resend fetch fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if ((url as string).includes('mds-crm')) return new Response('ok', { status: 200 })
      throw new Error('network') // Resend fails
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database
    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(502)
    fetchSpy.mockRestore()
  })
})

describe('handleSendLink enrichment', () => {
  it('calls CRM webhook for new user with detected language', async () => {
    const calls: [string, RequestInit][] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push([url as string, init as RequestInit])
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', telegram_handle: '@sasha' }),
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
      },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    expect(calls.length).toBe(2)
    const [crmUrl, crmInit] = calls[0]
    expect(crmUrl).toBe('https://n8n.synergify.com/webhook/mds-crm')
    const crmBody = JSON.parse(crmInit.body as string)
    expect(crmBody.language).toBe('ru')
    expect(crmBody.telegram_handle).toBe('sasha') // stripped @
    fetchSpy.mockRestore()
  })

  it('does not call CRM webhook for existing user', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue({ id: 'existing-user-id' }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    const crmCall = (fetchSpy.mock.calls as [string, RequestInit][]).find(
      ([url]) => url === 'https://n8n.synergify.com/webhook/mds-crm'
    )
    expect(crmCall).toBeUndefined()
    fetchSpy.mockRestore()
  })

  it('still returns 200 even when CRM webhook fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if ((url as string).includes('mds-crm')) throw new Error('n8n down')
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleSendLink(req, env)
    expect(res.status).toBe(200)
    fetchSpy.mockRestore()
  })

  it('builds source from UTM params', async () => {
    const calls: [string, RequestInit][] = []
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      calls.push([url as string, init as RequestInit])
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    })
    const env = makeEnv()
    env.DB = {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: vi.fn().mockResolvedValue(null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    } as unknown as D1Database

    const req = new Request('https://mamaev.coach/api/auth/send-link', {
      method: 'POST',
      body: JSON.stringify({ email: 'utm@example.com', utm_source: 'telegram', utm_medium: 'post', utm_campaign: 'course1' }),
      headers: { 'Content-Type': 'application/json' },
    })
    await handleSendLink(req, env)
    const [, crmInit] = calls[0]
    const crmBody = JSON.parse(crmInit.body as string)
    expect(crmBody.source).toBe('telegram/post/course1')
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
