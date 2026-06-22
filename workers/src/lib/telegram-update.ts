export interface BotIntent {
  kind: 'start' | 'continue' | 'other'
  fromId: string | null    // telegram numeric id as decimal string (< 2^53 assumed)
  chatId: number | null
  languageCode: string | null
}

function idToStr(v: unknown): string | null {
  if (typeof v === 'number' && Number.isFinite(v)) return String(v)
  if (typeof v === 'string' && /^\d+$/.test(v)) return v
  return null
}
function numOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}
function strOrNull(v: unknown): string | null {
  return typeof v === 'string' ? v : null
}

export function parseUpdate(update: unknown): BotIntent {
  const u = (update ?? {}) as Record<string, any>

  if (u.callback_query) {
    const cq = u.callback_query
    return {
      kind: cq.data === 'continue' ? 'continue' : 'other',
      fromId: idToStr(cq.from?.id),
      chatId: numOrNull(cq.message?.chat?.id),
      languageCode: strOrNull(cq.from?.language_code),
    }
  }

  if (u.message) {
    const m = u.message
    const text = typeof m.text === 'string' ? m.text.trim() : ''
    let kind: BotIntent['kind'] = 'other'
    if (/^\/start(\b|@|$)/.test(text)) kind = 'start'
    else if (/^\/continue(\b|@|$)/.test(text)) kind = 'continue'
    return {
      kind,
      fromId: idToStr(m.from?.id),
      chatId: numOrNull(m.chat?.id),
      languageCode: strOrNull(m.from?.language_code),
    }
  }

  return { kind: 'other', fromId: null, chatId: null, languageCode: null }
}
