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
        @keyframes nf-skew { 0%,100%{transform:skewX(0)} 92%{transform:skewX(0)} 94%{transform:skewX(-7deg)} 96%{transform:skewX(5deg)} 98%{transform:skewX(0)} }
        @keyframes nf-r { 0%,100%{clip-path:inset(0 0 0 0);transform:translate(0)} 93%{clip-path:inset(20% 0 30% 0);transform:translate(4px,-2px)} 96%{clip-path:inset(60% 0 10% 0);transform:translate(-4px,2px)} }
        @keyframes nf-b { 0%,100%{clip-path:inset(0 0 0 0);transform:translate(0)} 93%{clip-path:inset(50% 0 20% 0);transform:translate(-4px,2px)} 96%{clip-path:inset(10% 0 60% 0);transform:translate(4px,-2px)} }
        .nf-404 { position: relative; display: inline-block; animation: nf-skew 5s infinite; }
        .nf-404::before, .nf-404::after { content: attr(data-text); position: absolute; inset: 0; }
        .nf-404::before { color: #ff0044; animation: nf-r 5s infinite; mix-blend-mode: screen; }
        .nf-404::after { color: var(--text-accent); animation: nf-b 5s infinite; mix-blend-mode: screen; }
        @media (prefers-reduced-motion: reduce) {
          .nf-404, .nf-404::before, .nf-404::after { animation: none; }
          .nf-404::before, .nf-404::after { display: none; }
        }
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
        <div
          className="nf-404"
          data-text={t.code}
          aria-hidden="true"
          style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(6rem, 24vw, 18rem)',
            fontWeight: 900,
            lineHeight: 0.8,
            color: 'var(--text-primary)',
            letterSpacing: '-0.05em',
            marginBottom: '1.5rem',
          }}
        >
          {t.code}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2.5rem, 8vw, 6rem)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          whiteSpace: 'pre-line',
          marginBottom: '2rem',
        }}>
          {t.heading}
        </h1>
        <p style={{
          fontSize: '1.15rem',
          color: 'var(--text-secondary)',
          maxWidth: '520px',
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
