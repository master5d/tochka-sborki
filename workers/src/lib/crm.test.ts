import { describe, it, expect, vi, afterEach } from 'vitest'
import { addResendContact } from './crm'

const baseEnv = { RESEND_API_KEY: 'rk_test' } as any

afterEach(() => vi.restoreAllMocks())

describe('addResendContact', () => {
  it('POSTs to the global /contacts endpoint with bearer + email body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    await addResendContact(baseEnv, { email: 'a@b.com', language: 'ru', source: 'site' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/contacts')
    expect((init as any).method).toBe('POST')
    expect((init as any).headers.Authorization).toBe('Bearer rk_test')
    expect(JSON.parse((init as any).body)).toMatchObject({ email: 'a@b.com', unsubscribed: false })
  })
  it('no-ops when RESEND_API_KEY is empty', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'))
    await addResendContact({ RESEND_API_KEY: '' } as any, { email: 'a@b.com' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('does not throw when fetch rejects', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'))
    await expect(addResendContact(baseEnv, { email: 'a@b.com' })).resolves.toBeUndefined()
  })
})
