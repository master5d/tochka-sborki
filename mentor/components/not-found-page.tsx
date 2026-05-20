'use client'

import { usePathname } from 'next/navigation'
import { getDictionary, type Locale } from '../lib/dictionaries'
import { LangSwitcher } from './lang-switcher'

export function NotFoundPage() {
  const pathname = usePathname() || '/'
  const locale: Locale = pathname.startsWith('/en') ? 'en' : 'ru'
  const t = getDictionary(locale).notFound
  const home = locale === 'en' ? '/en/' : '/'

  return (
    <main>
      <LangSwitcher locale={locale} />
      <style>{`
        @media (max-width: 720px) { .nf-section { padding: 4rem 1.25rem !important; } }
      `}</style>
      <section className="nf-section" style={{
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        padding: '7rem 2rem',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          {t.label}
        </div>
        <div style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(5rem, 20vw, 14rem)',
          fontWeight: 900,
          lineHeight: 0.8,
          color: 'var(--text-accent)',
          letterSpacing: '-0.05em',
          marginBottom: '1.5rem',
        }}>
          {t.code}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2.25rem, 7vw, 5rem)',
          fontWeight: 900,
          lineHeight: 0.9,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.03em',
          whiteSpace: 'pre-line',
          marginBottom: '2rem',
        }}>
          {t.heading}
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          maxWidth: '540px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          {t.body}
        </p>
        <a href={home} style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          padding: '0.875rem 2.5rem',
          background: 'var(--text-accent)',
          color: '#000',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius)',
          textDecoration: 'none',
        }}>
          {t.ctaHome}
        </a>
      </section>
    </main>
  )
}
