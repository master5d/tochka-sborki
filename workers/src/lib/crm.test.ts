import { describe, it, expect, vi, afterEach } from 'vitest'
import { addContactToAudience } from './crm'

const baseEnv = { RESEND_API_KEY: 'rk_test', RESEND_AUDIENCE_ID: 'aud_1' } as any

afterEach(() => vi.restoreAllMocks())

describe('addContactToAudience', () => {
  it('POSTs to the audience contacts endpoint with bearer + body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await addContactToAudience(baseEnv, { email: 'a@b.com', language: 'ru', source: 'site' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/audiences/aud_1/contacts')
    expect((init as any).method).toBe('POST')
    expect((init as any).headers.Authorization).toBe('Bearer rk_test')
    expect(JSON.parse((init as any).body)).toMatchObject({ email: 'a@b.com', unsubscribed: false })
  })
  it('no-ops when RESEND_AUDIENCE_ID is empty', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await addContactToAudience({ ...baseEnv, RESEND_AUDIENCE_ID: '' }, { email: 'a@b.com' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('does not throw when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    await expect(addContactToAudience(baseEnv, { email: 'a@b.com' })).resolves.toBeUndefined()
  })
})
