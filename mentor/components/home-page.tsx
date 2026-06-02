import { CONTACT_EMAIL, getDictionary, type Locale } from '../lib/dictionaries'
import { LangSwitcher } from './lang-switcher'

interface Props { locale: Locale }

export function HomePage({ locale }: Props) {
  const t = getDictionary(locale)
  const year = new Date().getFullYear()

  return (
    <main data-onlook-id="mentor-main">
      <LangSwitcher locale={locale} />
      <style>{`
        @media (max-width: 720px) {
          .mentor-hero { padding: 4rem 1.25rem 3rem !important; }
          .mentor-hero h1 {
            font-size: clamp(2.2rem, 10vw, 4.5rem) !important;
            letter-spacing: -0.03em !important;
            word-break: break-word;
            line-height: 0.9 !important;
          }
          .mentor-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
          .mentor-section h2 {
            font-size: clamp(1.75rem, 7vw, 2.75rem) !important;
            letter-spacing: -0.02em !important;
          }
        }
      `}</style>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="mentor-hero" data-onlook-id="hero-section" style={{
        padding: '8rem 2rem 6rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--section-label-size)',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          {t.hero.tagline}
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(3.5rem, 12vw, 8rem)',
          fontWeight: 900,
          lineHeight: 0.85,
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
          letterSpacing: '-0.05em',
          marginBottom: '2.5rem',
        }}>
          {t.hero.titleLines.map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </h1>
        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: 'var(--max-width-prose)',
          lineHeight: 'var(--line-height-prose)',
          marginBottom: '3rem',
          letterSpacing: '-0.01em'
        }}>
          {t.hero.subtitleLead}
          <strong style={{ color: 'var(--text-accent)', fontWeight: 900 }}>{t.hero.subtitleBoldFragment}</strong>
          {t.hero.subtitleTail}
        </p>
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '1rem 2.5rem',
              background: 'var(--text-accent)',
              color: 'var(--text-on-accent)',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: 'var(--radius)',
              boxShadow: '0 0 20px rgba(var(--text-accent-rgb), 0.3)',
              textDecoration: 'none'
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
              padding: '1rem 2.5rem',
              background: 'rgba(var(--text-accent-rgb), 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-accent)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.9rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              backdropFilter: 'blur(4px)'
            }}
          >
            {t.hero.ctaSecondary}
          </a>
        </div>
      </section>

      {/* ── RATIONALE ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{ 
          padding: '2rem', 
          borderLeft: '4px solid var(--text-accent)', 
          background: 'var(--bg-secondary)',
          fontSize: '0.95rem',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.5,
          marginBottom: 'var(--section-gap)',
          maxWidth: 'var(--max-width-prose)'
        }}>
          <b>Rationale:</b> Консалтинг в эпоху агентов — это не передача знаний, а инсталляция работающей инфраструктуры. Я помогаю перепрыгнуть стадию «игры с промптами» сразу в промышленную эксплуатацию ИИ.
        </div>
      </div>

      {/* ── SERVICES ───────────────────────────────────────────── */}
      <section className="mentor-section" data-onlook-id="services-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1.25rem',
          }}>
            {t.servicesLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            marginBottom: '4rem',
            lineHeight: 0.9,
          }}>
            {t.servicesHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}>
            {t.services.map(s => (
              <div key={s.label} style={{
                padding: '2.5rem',
                background: 'var(--glass-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                transition: 'border-color 0.3s ease',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  marginBottom: '2rem',
                  padding: '0.2rem 0.6rem',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '100px',
                  width: 'fit-content'
                }}>
                  SVC-SKILL-{s.label}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  marginBottom: '1.25rem',
                  letterSpacing: '-0.02em',
                  textTransform: 'uppercase'
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-prose)',
                  marginBottom: '2.5rem',
                  flexGrow: 1,
                }}>
                  {s.body}
                </p>
                <div style={{
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}>
                  <div>
                    <div style={{ color: 'var(--text-accent)', marginBottom: '0.25rem' }}>Deliverable</div>
                    {s.deliverable}
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-accent)', marginBottom: '0.25rem' }}>Duration</div>
                    {s.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASES (Data-Dense Visualization Inspired) ──────────── */}
      <section className="mentor-section" data-onlook-id="cases-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1.25rem',
          }}>
            {t.casesLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            marginBottom: '4rem',
            lineHeight: 0.9,
          }}>
            {t.casesHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem',
          }}>
            {t.cases.map(c => (
              <div key={c.name} style={{
                padding: '2.5rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  padding: '0.5rem 1rem',
                  background: 'var(--border-accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--text-accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  Verified Case
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontFamily: 'var(--font-display), system-ui, sans-serif',
                    fontSize: '2rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '0.25rem'
                  }}>
                    {c.name}
                  </h3>
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--text-accent)',
                    letterSpacing: '0.05em',
                  }}>
                    {c.tag}
                  </div>
                </div>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-prose)',
                  marginBottom: '2rem',
                  maxWidth: '540px'
                }}>
                  {c.body}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ opacity: 0.5 }}>stack:</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{c.stack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS (Cognitive Pipeline Visualization) ─────────── */}
      <section className="mentor-section" data-onlook-id="process-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            marginBottom: '1.25rem',
          }}>
            {t.processLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2rem, 6vw, 4.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em',
            marginBottom: '4rem',
            lineHeight: 0.9,
          }}>
            {t.processHeading}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            background: 'var(--border-color)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden'
          }}>
            {t.process.map(([num, text]) => (
              <div key={num} style={{
                padding: '2rem',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                position: 'relative'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  color: 'rgba(var(--text-accent-rgb), 0.15)',
                  lineHeight: 1,
                }}>
                  {num}
                </div>
                <span style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  fontWeight: 500,
                  letterSpacing: '-0.01em'
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ────────────────────────────────────────────── */}
      <section className="mentor-section" data-onlook-id="contact-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.05em',
            marginBottom: '2rem',
            lineHeight: 0.85,
          }}>
            {t.contactHeading}
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '540px',
            margin: '0 auto 3rem',
            lineHeight: 'var(--line-height-prose)',
          }}>
            {t.contactBody}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '1.25rem 3.5rem',
              background: 'var(--text-accent)',
              color: 'var(--text-on-accent)',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              borderRadius: 'var(--radius)',
              textDecoration: 'none',
              boxShadow: '0 0 30px rgba(var(--text-accent-rgb), 0.4)',
            }}
          >
            → {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '3rem 2rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '2rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em',
      }}>
        <span>{t.footerLeft.replace('{YEAR}', String(year))}</span>
        <span style={{ display: 'flex', gap: '2rem' }}>
          {t.footerLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              {link.label}
            </a>
          ))}
        </span>
      </footer>
    </main>
  )
}
