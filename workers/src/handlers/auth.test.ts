import { describe, it, expect, vi } from 'vitest'
import { handleSendLink, handleLogout } from './auth'
import type { Env } from '../lib/types'

type DbCall = { sql: string; binds: unknown[] }

function makeEnv(opts: { existing?: boolean; calls?: DbCall[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (...binds: unknown[]) => {
        opts.calls?.push({ sql, binds })
        return {
          first: vi.fn().mockResolvedValue(opts.existing ? { id: 'existing-user-id' } : null),
          run: vi.fn().mockResolvedValue({ success: true }),
        }
      },
    }),
  } as unknown as D1Database
  return {
    DB,
    WORKER_JWT_SECRET: 'test-secret-32-characters-minimum!!',
    RESEND_API_KEY: 'resend_key',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  } as Env
}

// waitUntil that simply lets the fire-and-forget promise run
const ctx = { waitUntil: (_p: Promise<unknown>) => {} } as unknown as ExecutionContext

function sendLinkReq(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  return new Request('https://ai.mamaev.coach/api/auth/send-link', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json', ...headers },
  })
}

const usersInsert = (calls: DbCall[]) => calls.find(c => /INSERT INTO users/.test(c.sql))

describe('handleSendLink', () => {
  it('returns 400 for missing email', async () => {
    const res = await handleSendLink(sendLinkReq({}), makeEnv(), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await handleSendLink(sendLinkReq({ email: 'not-an-email' }), makeEnv(), ctx)
    expect(res.status).toBe(400)
  })

  it('returns 200 and calls Resend email for valid email', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ id: 'ok' }), { status: 200 }))
    const res = await handleSendLink(sendLinkReq({ email: 'test@example.com' }), makeEnv(), ctx)
    expect(res.status).toBe(200)
    const resendCall = (fetchSpy.mock.calls as [string][]).find(([url]) => url === 'https://api.resend.com/emails')
    expect(resendCall).toBeDefined()
    fetchSpy.mockRestore()
  })

  it('returns 502 if Resend email fetch fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if ((url as string) === 'https://api.resend.com/emails') throw new Error('network')
      return new Response('{}', { status: 200 })
    })
    const res = await handleSendLink(sendLinkReq({ email: 'test@example.com' }), makeEnv(), ctx)
    expect(res.status).toBe(502)
    fetchSpy.mockRestore()
  })
})

describe('handleSendLink enrichment (persisted to D1 users)', () => {
  it('persists detected language and stripped telegram handle for a new user', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const calls: DbCall[] = []
    const req = sendLinkReq({ email: 'new@example.com', telegram_handle: '@sasha' }, { 'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8' })
    const res = await handleSendLink(req, makeEnv({ calls }), ctx)
    expect(res.status).toBe(200)
    const ins = usersInsert(calls)
    expect(ins).toBeDefined()
    // binds: id, email, created_at, language, source, telegram_handle
    expect(ins!.binds[3]).toBe('ru')
    expect(ins!.binds[5]).toBe('sasha') // stripped @
    fetchSpy.mockRestore()
  })

  it('builds source from UTM params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const calls: DbCall[] = []
    const req = sendLinkReq({ email: 'utm@example.com', utm_source: 'telegram', utm_medium: 'post', utm_campaign: 'course1' })
    await handleSendLink(req, makeEnv({ calls }), ctx)
    expect(usersInsert(calls)!.binds[4]).toBe('telegram/post/course1')
    fetchSpy.mockRestore()
  })
})

describe('handleSendLink Resend contact', () => {
  it('adds a new user as a Resend contact', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await handleSendLink(sendLinkReq({ email: 'new@example.com' }), makeEnv(), ctx)
    const contactCall = (fetchSpy.mock.calls as [string][]).find(([url]) => url === 'https://api.resend.com/contacts')
    expect(contactCall).toBeDefined()
    fetchSpy.mockRestore()
  })

  it('does not add an existing user as a contact', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await handleSendLink(sendLinkReq({ email: 'existing@example.com' }), makeEnv({ existing: true }), ctx)
    const contactCall = (fetchSpy.mock.calls as [string][]).find(([url]) => (url as string).endsWith('/contacts'))
    expect(contactCall).toBeUndefined()
    fetchSpy.mockRestore()
  })

  it('still returns 200 when the contact add fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if ((url as string).endsWith('/contacts')) throw new Error('resend down')
      return new Response('{}', { status: 200 })
    })
    const res = await handleSendLink(sendLinkReq({ email: 'test@example.com' }), makeEnv(), ctx)
    expect(res.status).toBe(200)
    fetchSpy.mockRestore()
  })
})

describe('handleLogout', () => {
  it('clears session cookie', async () => {
    const req = new Request('https://ai.mamaev.coach/api/auth/logout', { method: 'POST' })
    const res = await handleLogout(req, makeEnv())
    expect(res.status).toBe(200)
    expect(res.headers.get('Set-Cookie')).toContain('session=;')
  })
})
