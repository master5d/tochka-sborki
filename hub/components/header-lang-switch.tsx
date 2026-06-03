'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Inline EN/RU switch for the top bar. Infers the current locale from the path
 * (so the shared header needs no locale prop), and links to the mirrored route.
 * trailingSlash-safe: '/' ↔ '/en/', '/blog/x/' ↔ '/en/blog/x/'.
 */
export function HeaderLangSwitch() {
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const href = isEn
    ? pathname.replace(/^\/en(\/|$)/, '/') || '/'
    : pathname === '/'
      ? '/en/'
      : '/en' + pathname
  const label = isEn ? 'RU' : 'EN'

  return (
    <Link
      href={href}
      aria-label={isEn ? 'Switch to Russian' : 'Переключить на английский'}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '3px',
        padding: '0.3rem 0.55rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      {label}
    </Link>
  )
}
