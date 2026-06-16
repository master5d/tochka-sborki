import type { Env } from './types'

const strip = (s: string | undefined) => (s ?? '').replace(/^﻿/, '').trim()

export async function addContactToAudience(
  env: Env,
  lead: { email: string; language?: string; source?: string },
): Promise<void> {
  const audienceId = strip(env.RESEND_AUDIENCE_ID)
  if (!audienceId) return
  try {
    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${strip(env.RESEND_API_KEY)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: lead.email, unsubscribed: false }),
    })
    if (!res.ok) console.error('Resend audience add non-OK', res.status, await res.text())
  } catch (e) {
    console.error('Resend audience add failed', e)
  }
}
