import { CONTACT_EMAIL, getDictionary, type Locale } from '../lib/dictionaries'
import { LangSwitcher } from './lang-switcher'

interface Props { locale: Locale }

export function HomePage({ locale }: Props) {
  const t = getDictionary(locale)
  const year = new Date().getFullYear()

  return (
    <main>
      <LangSwitcher locale={locale} />
      <style>{`
        @media (max-width: 720px) {
          .mentor-hero { padding: 3rem 1.25rem 2.5rem !important; }
          .mentor-hero h1 {
            font-size: clamp(1.85rem, 8vw, 4rem) !important;
            letter-spacing: -0.02em !important;
            word-break: break-word;
            overflow-wrap: anywhere;
            line-height: 0.95 !important;
          }
          .mentor-hero .mentor-hero-tagline { font-size: 0.7rem !important; word-break: break-word; }
          .mentor-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .mentor-section h2 {
            font-size: clamp(1.5rem, 6vw, 2.5rem) !important;
            word-break: break-word;
            letter-spacing: -0.02em !important;
          }
          .mentor-process-row { grid-template-columns: 2.5rem 1fr !important; gap: 0.75rem !important; }
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="mentor-hero" style={{
        padding: '6rem 2rem 4rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div className="mentor-hero-tagline" style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          marginBottom: '1.5rem',
        }}>
          {t.hero.tagline}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2.8rem, 9vw, 7rem)',
          fontWeight: 900,
          lineHeight: 0.88,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.04em',
          marginBottom: '2rem',
        }}>
          {t.hero.titleLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < t.hero.titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: 'var(--text-secondary)',
          maxWidth: '620px',
          lineHeight: 1.7,
          marginBottom: '2.5rem',
        }}>
          {t.hero.subtitleLead}
          <strong style={{ color: 'var(--text-primary)' }}>{t.hero.subtitleBoldFragment}</strong>
          {t.hero.subtitleTail}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'var(--text-accent)',
              color: '#000',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius)',
            }}
          >
            {t.hero.ctaPrimary}
          </a>
          <a
            href={locale === 'en' ? 'https://ai.mamaev.coach/en/' : 'https://ai.mamaev.coach'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.875rem 2rem',
              background: 'transparent',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              borderRadius: 'var(--radius)',
            }}
          >
            {t.hero.ctaSecondary}
          </a>
        </div>
      </section>

      {/* ── SERVICES ───────────────────────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            {t.servicesLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            {t.servicesHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
          }}>
            {t.services.map(s => (
              <div key={s.label} style={{
                padding: '2rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  lineHeight: 1,
                  marginBottom: '1rem',
                }}>
                  {s.label}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  letterSpacing: '-0.01em',
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '2rem',
                  flexGrow: 1,
                }}>
                  {s.body}
                </p>
                <div style={{
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.05em',
                }}>
                  <span>{s.deliverable}</span>
                  <span>{s.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASES ──────────────────────────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            {t.casesLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            {t.casesHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '2rem',
          }}>
            {t.cases.map(c => (
              <div key={c.name} style={{
                padding: '2rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '1rem',
                }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display), system-ui, sans-serif',
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.03em',
                    textTransform: 'uppercase',
                  }}>
                    {c.name}
                  </h3>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-accent)',
                    letterSpacing: '0.05em',
                  }}>
                    {c.tag}
                  </span>
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '1.25rem',
                }}>
                  {c.body}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color)',
                  letterSpacing: '0.05em',
                }}>
                  stack: <span style={{ color: 'var(--text-primary)' }}>{c.stack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS ────────────────────────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            {t.processLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(1.75rem, 4vw, 3rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.03em',
            marginBottom: '3rem',
            lineHeight: 0.95,
          }}>
            {t.processHeading}
          </h2>
          <div style={{ maxWidth: '720px' }}>
            {t.process.map(([num, text]) => (
              <div key={num} className="mentor-process-row" style={{
                display: 'grid',
                gridTemplateColumns: '4rem 1fr',
                gap: '1.5rem',
                alignItems: 'baseline',
                padding: '1.25rem 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  letterSpacing: '0.05em',
                }}>
                  {num}
                </span>
                <span style={{
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            marginBottom: '1.5rem',
            lineHeight: 0.95,
          }}>
            {t.contactHeading}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-secondary)',
            maxWidth: '500px',
            margin: '0 auto 2rem',
            lineHeight: 1.6,
          }}>
            {t.contactBody}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'var(--text-accent)',
              color: '#000',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: 'var(--radius)',
            }}
          >
            → {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '2rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
      }}>
        <span>{t.footerLeft.replace('{YEAR}', String(year))}</span>
        <span style={{ display: 'flex', gap: '1.5rem' }}>
          {t.footerLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ color: 'var(--text-secondary)' }}
            >
              {link.label}
            </a>
          ))}
        </span>
      </footer>
    </main>
  )
}
