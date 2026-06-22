import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// Best-effort owner notification for a learner question. Never throws (mirrors crm.ts).
export async function notifyOwnerQuestion(
  env: Env,
  q: { question: string; asker: string | null; locale: string },
): Promise<void> {
  const apiKey = strip(env.RESEND_API_KEY)
  const owner = strip(env.OWNER_EMAIL)
  if (!apiKey || !owner) return
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Точка Сборки <noreply@mamaev.coach>',
        to: [owner],
        subject: 'Новый вопрос из Telegram-бота',
        text: `Вопрос от Telegram-пользователя ${q.asker ?? 'unknown'} (locale: ${q.locale}):\n\n${q.question}`,
      }),
    })
    if (!res.ok) console.error('owner-notify non-OK', res.status, await res.text())
  } catch (e) {
    console.error('owner-notify failed', e)
  }
}
