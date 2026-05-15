'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export function Nav() {
  const [email, setEmail] = useState<string | null>(null)
  const [os, setOs] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.email) setEmail(d.email) })
      .catch(() => {})
    try { setOs(localStorage.getItem('os')) } catch { /* ignore */ }
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    setEmail(null)
    window.location.replace('/')
  }

  function toggleOs() {
    const next = os === 'mac' ? 'windows' : 'mac'
    try { localStorage.setItem('os', next) } catch { /* ignore */ }
    setOs(next)
    window.location.reload()
  }

  return (
    <nav style={{
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '0 1.5rem',
      height: '3rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <Link href="/" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ Точка Сборки
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', alignItems: 'center' }}>
        <Link href="/roadmap/" style={{ color: 'var(--text-secondary)' }}>Roadmap</Link>
        <Link href="/cheatsheet/" style={{ color: 'var(--text-secondary)' }}>Шпаргалка</Link>
        <Link href="/feedback/" style={{ color: 'var(--text-secondary)' }}>Фидбек</Link>
        {os && (
          <button
            onClick={toggleOs}
            title="Сменить OS"
            aria-label={`Текущая OS: ${os === 'mac' ? 'macOS' : 'Windows'}. Нажми для смены.`}
            style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              overflow: 'hidden',
              cursor: 'pointer',
              padding: 0,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
            }}
          >
            <span style={{
              padding: '3px 8px',
              background: os === 'mac' ? 'var(--text-accent)' : 'transparent',
              color: os === 'mac' ? '#000' : 'var(--text-secondary)',
              fontWeight: os === 'mac' ? 700 : 400,
            }}>🍎</span>
            <span style={{
              padding: '3px 8px',
              background: os === 'windows' ? 'var(--text-accent)' : 'transparent',
              color: os === 'windows' ? '#000' : 'var(--text-secondary)',
              fontWeight: os === 'windows' ? 700 : 400,
            }}>🪟</span>
          </button>
        )}
        {email ? (
          <>
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              {email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Выйти
            </button>
          </>
        ) : (
          <Link href="/login/" style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>→ Войти</Link>
        )}
      </div>
    </nav>
  )
}
