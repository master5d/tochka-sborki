'use client'

import { useState } from 'react'
import type { Locale } from '@/lib/dictionaries'

/** Транспорт — АМЕНДМЕНТ Гейта №0: только фасад synergify.com, напрямую в listmonk не ходим (CORS). */
export const SUBSCRIBE_URL = 'https://synergify.com/api/subscribe'
export const SUBSCRIBE_TIMEOUT_MS = 8000

type Outcome = 'done' | 'already' | 'error'
type Phase = 'idle' | 'busy' | Outcome

const DICT: Record<Locale, {
  lead: string
  placeholder: string
  button: string
  busy: string
  done: string
  already: string
  error: string
}> = {
  ru: {
    lead: 'Новые тексты — письмом. Редко и по делу.',
    placeholder: 'почта',
    button: 'Подписаться',
    busy: '…',
    done: 'Проверь почту — письмо-подтверждение уже летит',
    already: 'Ты уже в списке',
    error: 'Не получилось — попробуй ещё раз',
  },
  en: {
    lead: 'New posts by email. Rare and to the point.',
    placeholder: 'email',
    button: 'Subscribe',
    busy: '…',
    done: 'Check your inbox — a confirmation email is on its way',
    already: "You're already on the list",
    error: 'Something went wrong — try again',
  },
}

/**
 * Pure submit path (тестируется напрямую — в blog/ нет DOM-окружения для vitest).
 * Honeypot заполнен → тихий «успех» без запроса, боту не сигналим.
 */
export async function submitSubscribe(
  email: string,
  website: string,
  fetchFn: typeof fetch = fetch,
  timeoutMs: number = SUBSCRIBE_TIMEOUT_MS,
): Promise<Outcome> {
  if (website !== '') return 'done'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchFn(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, website }),
      signal: controller.signal,
    })
    if (!res.ok) return 'error'
    const data = (await res.json().catch(() => null)) as { ok?: boolean; already?: boolean } | null
    if (data?.ok) return data.already ? 'already' : 'done'
    return 'error'
  } catch {
    return 'error'
  } finally {
    clearTimeout(timer)
  }
}

const monoLabel: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
}

/** Тихий блок подписки на рассылку Synergify — под статьёй и внизу индекса. */
export function SubscribeBlock({ locale }: { locale: Locale }) {
  const d = DICT[locale]
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // honeypot
  const [phase, setPhase] = useState<Phase>('idle')

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (phase === 'busy') return
    setPhase('busy')
    setPhase(await submitSubscribe(email.trim(), website))
  }

  const settled = phase === 'done' || phase === 'already'

  return (
    <section
      style={{
        marginTop: '2.5rem',
        paddingTop: '1.25rem',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <p style={{ ...monoLabel, margin: '0 0 0.75rem', lineHeight: 1.7 }}>{d.lead}</p>

      {settled ? (
        <p role="status" style={{ ...monoLabel, color: 'var(--text-accent)', fontWeight: 700, margin: 0 }}>
          {phase === 'already' ? d.already : d.done}
        </p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          {/* Honeypot: off-screen, не в tab-порядке; люди его не видят, боты заполняют */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
          />
          <input
            type="email"
            name="email"
            required
            placeholder={d.placeholder}
            aria-label={d.placeholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={phase === 'busy'}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 0.75rem',
              minWidth: '14rem',
              flex: '1 1 14rem',
              maxWidth: '22rem',
            }}
          />
          <button
            type="submit"
            disabled={phase === 'busy'}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-accent)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius)',
              padding: '0.5rem 1rem',
              cursor: phase === 'busy' ? 'default' : 'pointer',
              transition: 'opacity 0.2s ease',
              opacity: phase === 'busy' ? 0.6 : 1,
            }}
          >
            {phase === 'busy' ? d.busy : d.button}
          </button>
          {phase === 'error' && (
            <span role="alert" style={{ ...monoLabel, flexBasis: '100%' }}>
              {d.error}
            </span>
          )}
        </form>
      )}
    </section>
  )
}
