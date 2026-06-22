import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleSupportCheckout } from './checkout'
import type { Env } from '../lib/types'

afterEach(() => vi.restoreAllMocks())

function req(body: unknown): Request {
  return new Request('https://ai.mamaev.coach/api/checkout/support', {
    method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' },
  })
}

describe('handleSupportCheckout', () => {
  it('creates a Stripe session and returns its url', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/xyz' }), { status: 200 }))
    const res = await handleSupportCheckout(req({ amount: 700, locale: 'ru' }), { STRIPE_SECRET_KEY: 'sk_test' } as Env)
    expect(res.status).toBe(200)
    expect((await res.json() as { url: string }).url).toBe('https://checkout.stripe.com/c/xyz')
    const [url, init] = spy.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk_test')
  })

  it('returns 503 when the key is not configured', async () => {
    const res = await handleSupportCheckout(req({ amount: 700 }), {} as Env)
    expect(res.status).toBe(503)
  })

  it('returns 400 for an out-of-bounds amount', async () => {
    const res = await handleSupportCheckout(req({ amount: 50 }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(400)
  })

  it('returns 502 when Stripe responds non-OK', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('bad', { status: 400 }))
    const res = await handleSupportCheckout(req({ amount: 700 }), { STRIPE_SECRET_KEY: 'sk' } as Env)
    expect(res.status).toBe(502)
  })
})
