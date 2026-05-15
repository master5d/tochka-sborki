'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getDictionary, type Locale } from '@/lib/dictionaries'

interface Props { locale?: Locale }

export function Nav({ locale: localeProp }: Props = {}) {
  const pathname = usePathname() || '/'
  const detected: Locale = pathname.startsWith('/en') ? 'en' : 'ru'
  const locale = localeProp ?? detected
  const t = getDictionary(locale)

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
    window.location.replace(locale === 'en' ? '/en/' : '/')
  }

  function toggleOs() {
    const next = os === 'mac' ? 'windows' : 'mac'
    try { localStorage.setItem('os', next) } catch { /* ignore */ }
    setOs(next)
    window.location.reload()
  }

  const homeHref = locale === 'en' ? '/en/' : '/'
  const otherLocale: Locale = locale === 'en' ? 'ru' : 'en'
  const otherHref = otherLocale === 'en'
    ? '/en' + (pathname === '/' ? '/' : pathname)
    : pathname.replace(/^\/en(\/|$)/, '/') || '/'

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
      <Link href={homeHref} style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-accent)', fontWeight: 700 }}>
        ⬡ {t.nav.brand}
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', alignItems: 'center' }}>
        <Link href={`${locale === 'en' ? '/en' : ''}/roadmap/`} style={{ color: 'var(--text-secondary)' }}>{t.nav.roadmap}</Link>
        <Link href={`${locale === 'en' ? '/en' : ''}/cheatsheet/`} style={{ color: 'var(--text-secondary)' }}>{t.nav.cheatsheet}</Link>
        <Link href={`${locale === 'en' ? '/en' : ''}/feedback/`} style={{ color: 'var(--text-secondary)' }}>{t.nav.feedback}</Link>
        <Link href={`${locale === 'en' ? '/en' : ''}/certificate/`} style={{ color: 'var(--text-accent)' }}>{t.nav.certificate} ◆</Link>

        {/* Language switcher */}
        <Link
          href={otherHref}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '3px',
            padding: '2px 6px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {otherLocale === 'en' ? 'EN' : 'RU'}
        </Link>

        {os && (
          <button
            onClick={toggleOs}
            title={t.nav.osTitle}
            aria-label={t.nav.osCurrent(os)}
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
              {t.nav.logout}
            </button>
          </>
        ) : (
          <Link href={`${locale === 'en' ? '/en' : ''}/login/`} style={{ color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>{t.nav.login}</Link>
        )}
      </div>
    </nav>
  )
}
