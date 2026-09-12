'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { langSwitchTarget } from '@/lib/lang-switch'

/**
 * Inline EN/RU switch for the top bar. Target rules live in lib/lang-switch.ts:
 * a switch that lands on a home page is a full document load, so the backend
 * cover function picks the home (and no prefetch is spent on it).
 */
export function HeaderLangSwitch() {
  const { href, label, isEn, document } = langSwitchTarget(usePathname() || '/')
  const Tag = document ? 'a' : Link

  return (
    <Tag
      href={href}
      aria-label={isEn ? 'Switch to Russian' : 'Переключить на английский'}
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
        color: 'var(--text-secondary)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        padding: '0.3rem 0.55rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textDecoration: 'none',
        lineHeight: 1,
      }}
    >
      {label}
    </Tag>
  )
}
