import { describe, it, expect } from 'vitest'
import { parseUpdate } from './telegram-update'

describe('parseUpdate', () => {
  it('parses /start', () => {
    const r = parseUpdate({ message: { text: '/start', from: { id: 42, language_code: 'ru' }, chat: { id: 42 } } })
    expect(r).toEqual({ kind: 'start', fromId: '42', chatId: 42, languageCode: 'ru' })
  })

  it('parses /start@botname', () => {
    const r = parseUpdate({ message: { text: '/start@tochka_sborki_lms_bot', from: { id: 7 }, chat: { id: 7 } } })
    expect(r.kind).toBe('start')
  })

  it('parses /continue', () => {
    const r = parseUpdate({ message: { text: '/continue', from: { id: 5, language_code: 'en' }, chat: { id: 5 } } })
    expect(r).toEqual({ kind: 'continue', fromId: '5', chatId: 5, languageCode: 'en' })
  })

  it('parses a continue callback_query', () => {
    const r = parseUpdate({ callback_query: { data: 'continue', from: { id: 9, language_code: 'ru' }, message: { chat: { id: 9 } } } })
    expect(r).toEqual({ kind: 'continue', fromId: '9', chatId: 9, languageCode: 'ru' })
  })

  it('treats plain text as other', () => {
    const r = parseUpdate({ message: { text: 'hello', from: { id: 1 }, chat: { id: 1 } } })
    expect(r.kind).toBe('other')
  })

  it('does not match /startfoo as start', () => {
    const r = parseUpdate({ message: { text: '/startfoo', from: { id: 1 }, chat: { id: 1 } } })
    expect(r.kind).toBe('other')
  })

  it('returns nulls for an empty update', () => {
    expect(parseUpdate({})).toEqual({ kind: 'other', fromId: null, chatId: null, languageCode: null })
  })
})
