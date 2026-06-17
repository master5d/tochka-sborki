import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

// Resend Audiences устарели (→ Segments); контакты теперь глобальные: POST /contacts.
// Источник правды лидов — D1 users; это вторичное зеркало для email-кампаний.
export async function addResendContact(
  env: Env,
  lead: { email: string; language?: string; source?: string },
): Promise<void> {
  const apiKey = strip(env.RESEND_API_KEY)
  if (!apiKey) return
  try {
    const res = await fetch('https://api.resend.com/contacts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lead.email, unsubscribed: false }),
    })
    if (!res.ok) console.error('Resend contact add non-OK', res.status, await res.text())
  } catch (e) {
    console.error('Resend contact add failed', e)
  }
}
