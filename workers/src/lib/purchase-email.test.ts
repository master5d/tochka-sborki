import { describe, it, expect, vi, afterEach } from 'vitest'
import { sendPurchaseEmail } from './purchase-email'
import type { Product } from './products'
import type { Env } from './types'

afterEach(() => vi.restoreAllMocks())

const product: Product = {
  id: 'kit', priceCents: 1900, name: { ru: 'Набор', en: 'Kit' }, blurb: { ru: 'b', en: 'b' },
  delivery: { kind: 'url', href: 'https://x/y' },
}
const env = { RESEND_API_KEY: 're_x' } as Env

describe('sendPurchaseEmail', () => {
  it('sends via Resend with the asset link and returns true', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }))
    const ok = await sendPurchaseEmail(env, { email: 'b@e.com', product, assetUrl: 'https://dl/file', locale: 'ru' })
    expect(ok).toBe(true)
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.resend.com/emails')
    const body = JSON.parse(init.body as string)
    expect(body.to).toEqual(['b@e.com'])
    expect(body.text).toContain('https://dl/file')
  })
  it('is a no-op (returns false) when RESEND_API_KEY is unset', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const ok = await sendPurchaseEmail({} as Env, { email: 'b@e.com', product, assetUrl: 'https://dl/f', locale: 'en' })
    expect(ok).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })
  it('returns false (never throws) when Resend responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 422 }))
    const ok = await sendPurchaseEmail(env, { email: 'b@e.com', product, assetUrl: 'https://dl/f', locale: 'ru' })
    expect(ok).toBe(false)
  })
})
