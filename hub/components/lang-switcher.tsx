'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Locale } from '../lib/dictionaries'

function otherLocalePath(pathname: string, locale: Locale): string {
  if (locale === 'ru') {
    if (pathname === '/') return '/en/'
    return '/en' + pathname
  }
  if (pathname === '/en' || pathname === '/en/') return '/'
  return pathname.replace(/^\/en(\/|$)/, '/') || '/'
}

interface Props { locale: Locale }

export function LangSwitcher({ locale }: Props) {
  const pathname = usePathname() || '/'
  const otherLabel = locale === 'ru' ? 'EN' : 'RU'
  const href = otherLocalePath(pathname, locale)

  return (
    <Link
      href={href}
      className="lang-switcher-pill"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 50,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '3px',
        padding: '0.35rem 0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textDecoration: 'none',
      }}
    >
      <style>{`
        @media (max-width: 720px) {
          .lang-switcher-pill { top: auto !important; bottom: 1rem !important; right: 1rem !important; }
        }
      `}</style>
      {otherLabel}
    </Link>
  )
}
