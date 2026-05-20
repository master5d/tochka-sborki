import { describe, it, expect, vi } from 'vitest'
import { handleProgress, handleMe, handleSubmit } from './intake'

function fakeDb(row: any = null) {
  const store = { row }
  return {
    prepare: () => ({
      bind: (..._a: any[]) => ({
        first: async () => store.row,
        run: async () => { store.row = { ...(store.row ?? {}) }; return { success: true } },
      }),
    }),
    _store: store,
  } as any
}

describe('handleMe', () => {
  it('returns 404 when no profile', async () => {
    const res = await handleMe(fakeDb(null), 'user1')
    expect(res.status).toBe(404)
  })
  it('returns profile when present', async () => {
    const res = await handleMe(fakeDb({ user_id: 'user1', status: 'completed' }), 'user1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('completed')
  })
})

describe('handleSubmit', () => {
  it('rejects missing required answers', async () => {
    const res = await handleSubmit(fakeDb(), 'user1', { answers: {} }, 'key', vi.fn() as any)
    expect(res.status).toBe(400)
  })
})
