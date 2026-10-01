'use client'

import { useEffect, useState } from 'react'
import {
  CARE_FALLBACK, careCopy, loadCareConfig, submitCare, validateCareFields,
  type CareConfig, type CareFields, type Locale,
} from '@/lib/care'

// Стиль полей — как у соседней формы hub (components/capture-form.tsx).
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.875rem',
  boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }
const hintStyle: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '0.4rem' }
const errStyle: React.CSSProperties = { color: 'var(--crit)', marginBottom: '1rem', fontSize: '0.875rem' }

/** Промисы страницы + форма: срок ответа и темы приходят из GET /api/care (канон lms-engine). */
export function CareDesk({ locale = 'ru' }: { locale?: Locale }) {
  const t = careCopy(locale)
  const [cfg, setCfg] = useState<CareConfig>(CARE_FALLBACK)
  const [f, setF] = useState<CareFields>({ topic: '', message: '', email: '', pageUrl: '', company: '' })
  const [invalid, setInvalid] = useState<(keyof CareFields)[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'rate-limited' | 'error'>('idle')

  useEffect(() => {
    loadCareConfig(fetch).then((c) => { if (c) setCfg(c) })
    // Вошедший (сессия воркера на этом домене) — email подставляется; гость — пусто.
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((d: { email?: string }) => {
        const email = typeof d.email === 'string' ? d.email : ''
        if (email) setF((p) => (p.email ? p : { ...p, email }))
      })
      .catch(() => {})
    try {
      const ref = document.referrer
      if (ref && new URL(ref).origin === window.location.origin) setF((p) => (p.pageUrl ? p : { ...p, pageUrl: ref }))
    } catch { /* нет referrer */ }
  }, [])

  const when = cfg.responseTime[locale]
  const set = (k: keyof CareFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((p) => ({ ...p, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const bad = validateCareFields(f, cfg)
    setInvalid(bad)
    if (bad.length) return
    setStatus('loading')
    setStatus(await submitCare(fetch, f, locale))
  }

  return (
    <>
      <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.7, paddingLeft: '1.25rem', margin: '0 0 2.5rem' }}>
        {t.promises(when).map((p) => <li key={p}>{p}</li>)}
      </ul>

      {status === 'ok' ? (
        <div role="status" style={{
          padding: '2rem', border: '1px solid var(--text-accent)', borderRadius: 'var(--radius)',
          color: 'var(--text-accent)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', lineHeight: 1.6,
        }}>
          {t.success(when)}
        </div>
      ) : (
        <section style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius)', background: 'var(--bg-secondary)', padding: '1.5rem' }}>
          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="care-topic" style={labelStyle}>{t.topicLabel}</label>
              <select id="care-topic" name="topic" value={f.topic} onChange={set('topic')} required
                aria-invalid={invalid.includes('topic')} style={inputStyle}>
                <option value="">{t.topicPlaceholder}</option>
                {cfg.topics.map((o) => <option key={o.key} value={o.key}>{o[locale]}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="care-message" style={labelStyle}>{t.messageLabel}</label>
              <textarea id="care-message" name="message" rows={6} value={f.message} onChange={set('message')} required
                maxLength={cfg.limits.messageMax} aria-invalid={invalid.includes('message')} aria-describedby="care-message-hint"
                style={{ ...inputStyle, resize: 'vertical' }} />
              <p id="care-message-hint" style={hintStyle}>{t.messageHint}</p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="care-email" style={labelStyle}>{t.emailLabel}</label>
              <input id="care-email" name="email" type="email" autoComplete="email" value={f.email} onChange={set('email')} required
                aria-invalid={invalid.includes('email')} aria-describedby="care-email-hint" style={inputStyle} />
              <p id="care-email-hint" style={hintStyle}>{t.emailHint}</p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="care-page" style={labelStyle}>{t.pageUrlLabel}</label>
              <input id="care-page" name="pageUrl" type="url" inputMode="url" value={f.pageUrl} onChange={set('pageUrl')}
                maxLength={cfg.limits.pageUrlMax} aria-describedby="care-page-hint" style={inputStyle} />
              <p id="care-page-hint" style={hintStyle}>{t.pageUrlHint}</p>
            </div>

            {/* Honeypot — скрыт от людей; сервер молча отбрасывает заполненное. */}
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true"
              value={f.company} onChange={set('company')}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }} />

            {invalid.length > 0 && <p role="alert" style={errStyle}>{t.requiredError}</p>}
            {status === 'error' && <p role="alert" style={errStyle}>{t.error}</p>}
            {status === 'rate-limited' && <p role="alert" style={errStyle}>{t.rateLimited}</p>}

            <button type="submit" disabled={status === 'loading'} style={{
              padding: '0.875rem 2rem', background: 'var(--text-accent)', color: 'var(--text-on-accent)', fontWeight: 900,
              fontFamily: 'var(--font-mono)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.08em',
              borderRadius: 'var(--radius)', border: 'none', cursor: status === 'loading' ? 'wait' : 'pointer', alignSelf: 'flex-start',
            }}>
              {status === 'loading' ? t.submitting : t.submit}
            </button>
          </form>
        </section>
      )}
    </>
  )
}
