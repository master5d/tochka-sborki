'use client'

import { useState } from 'react'
import { Nav } from '@/components/nav'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/auth/send-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Вход
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1.5rem',
        }}>
          Войти<br />в курс
        </h1>

        {status === 'sent' ? (
          <div style={{
            padding: '1.5rem',
            border: '1px solid var(--text-accent)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-accent)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}>
            ✓ Ссылка отправлена на {email}. Проверь почту.
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="твой@email.com"
              required
              style={{
                padding: '0.875rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'var(--font-mono)',
              }}
            />
            {status === 'error' && (
              <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>Что-то пошло не так. Попробуй снова.</p>
            )}
            <button
              type="submit"
              disabled={status === 'loading'}
              style={{
                padding: '0.875rem 2rem',
                background: 'var(--text-accent)',
                color: '#000',
                fontWeight: 900,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                borderRadius: 'var(--radius)',
                border: 'none',
                cursor: status === 'loading' ? 'wait' : 'pointer',
              }}
            >
              {status === 'loading' ? 'Отправляем...' : 'Получить ссылку →'}
            </button>
          </form>
        )}

        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Без паролей. Получишь ссылку на почту — один клик и ты внутри.
        </p>
      </main>
    </>
  )
}
