import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleTelegramWebhook } from './telegram-webhook'
import type { Env } from '../lib/types'

const SECRET = 'wh-secret'

type Row = Record<string, unknown>
function makeEnv(opts: { user?: Row | null; progress?: Row[] } = {}): Env {
  const DB = {
    prepare: (sql: string) => ({
      bind: (..._b: unknown[]) => ({
        first: vi.fn().mockResolvedValue(/FROM users/.test(sql) ? (opts.user ?? null) : null),
        all: vi.fn().mockResolvedValue({ results: /FROM progress/.test(sql) ? (opts.progress ?? []) : [] }),
      }),
    }),
  } as unknown as D1Database
  return { DB, TELEGRAM_BOT_TOKEN: 'BOT', TELEGRAM_WEBHOOK_SECRET: SECRET } as Env
}

function req(update: unknown, secret: string | null = SECRET): Request {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (secret !== null) headers['X-Telegram-Bot-Api-Secret-Token'] = secret
  return new Request('https://ai.mamaev.coach/api/telegram/webhook', {
    method: 'POST', body: JSON.stringify(update), headers,
  })
}

afterEach(() => vi.restoreAllMocks())

const lastBody = (spy: ReturnType<typeof vi.spyOn>) =>
  JSON.parse((spy.mock.calls[0][1] as RequestInit).body as string)

describe('handleTelegramWebhook', () => {
  it('rejects a missing/wrong secret token with 403', async () => {
    const res = await handleTelegramWebhook(req({ message: { text: '/start' } }, 'wrong'), makeEnv())
    expect(res.status).toBe(403)
  })

  it('/start sends a greeting with an open-course button (unlinked ok)', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    const res = await handleTelegramWebhook(
      req({ message: { text: '/start', from: { id: 100, language_code: 'ru' }, chat: { id: 100 } } }),
      makeEnv({ user: null })
    )
    expect(res.status).toBe(200)
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/')
  })

  it('/continue from an unlinked user asks them to open the course first', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/continue', from: { id: 200 }, chat: { id: 200 } } }),
      makeEnv({ user: null })
    )
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url).toBe('https://ai.mamaev.coach/')
  })

  it('/continue from a linked user deep-links the next incomplete lesson', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"ok":true}', { status: 200 }))
    await handleTelegramWebhook(
      req({ message: { text: '/continue', from: { id: 300, language_code: 'ru' }, chat: { id: 300 } } }),
      makeEnv({ user: { id: 'u-300', language: 'ru' }, progress: [{ lesson_slug: '00-kickstart', completed_at: 123 }] })
    )
    expect(lastBody(spy).reply_markup.inline_keyboard[0][0].web_app.url)
      .toBe('https://ai.mamaev.coach/lessons/01-introduction/')
  })

  it('returns 200 even when the update is junk', async () => {
    const res = await handleTelegramWebhook(req({ nonsense: true }), makeEnv())
    expect(res.status).toBe(200)
  })
})
