import { describe, it, expect, vi } from 'vitest'
import { handleView, handleComplete, handleList } from './progress'
import type { Env } from '../lib/types'
import { signJWT } from '../lib/jwt'

const SECRET = 'test-secret-32-characters-minimum!!'

async function makeAuthRequest(url: string, method: string, body: unknown): Promise<Request> {
  const now = Math.floor(Date.now() / 1000)
  const jwt = await signJWT({ sub: 'user1', email: 'a@b.com', iat: now, exp: now + 3600 }, SECRET)
  return new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${jwt}`,
    },
  })
}

function makeEnv(): Env {
  const run = vi.fn().mockResolvedValue({ success: true })
  const all = vi.fn().mockResolvedValue({ results: [] })
  return {
    DB: {
      prepare: (_sql: string) => ({
        bind: (..._args: unknown[]) => ({ run, all, first: vi.fn().mockResolvedValue(null) }),
      }),
    } as unknown as D1Database,
    WORKER_JWT_SECRET: SECRET,
    RESEND_API_KEY: '',
    N8N_WEBHOOK_URL: '',
    N8N_WEBHOOK_SECRET: '',
  }
}

describe('handleView', () => {
  it('returns 401 without auth', async () => {
    const req = new Request('https://mamaev.coach/api/progress/view', {
      method: 'POST',
      body: JSON.stringify({ lesson_slug: '01-introduction' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await handleView(req, makeEnv())
    expect(res.status).toBe(401)
  })

  it('returns 200 with valid auth and lesson_slug', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/view', 'POST', { lesson_slug: '01-introduction' })
    const res = await handleView(req, makeEnv())
    expect(res.status).toBe(200)
  })
})

describe('handleComplete', () => {
  it('returns 200 with valid auth and lesson_slug', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/complete', 'POST', { lesson_slug: '01-introduction' })
    const res = await handleComplete(req, makeEnv())
    expect(res.status).toBe(200)
  })
})

describe('handleList', () => {
  it('returns 200 with empty array when no progress', async () => {
    const req = await makeAuthRequest('https://mamaev.coach/api/progress/list', 'GET', null)
    const res = await handleList(req, makeEnv())
    expect(res.status).toBe(200)
    const data = await res.json() as unknown[]
    expect(Array.isArray(data)).toBe(true)
  })
})
