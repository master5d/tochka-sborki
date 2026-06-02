import { CONTACT_EMAIL, getDictionary, type Locale } from '../lib/dictionaries'
import { LangSwitcher } from './lang-switcher'
import { HeroObservability } from './visuals'

interface Props { locale: Locale }

export function HomePage({ locale }: Props) {
  const t = getDictionary(locale)
  const year = new Date().getFullYear()

  return (
    <main data-onlook-id="mentor-main" style={{ background: 'var(--bg-primary)', position: 'relative' }}>
      {/* ── Background Noise Layer ──────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, opacity: 0.03, pointerEvents: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

      <LangSwitcher locale={locale} />
      
      <style>{`
        @media (max-width: 1024px) {
          .mentor-hero-grid { grid-template-columns: 1fr !important; gap: 3rem !important; }
        }
        @media (max-width: 720px) {
          .mentor-hero { padding: 4rem 1.25rem 3rem !important; }
          .mentor-hero h1 {
            font-size: clamp(2.5rem, 10vw, 5rem) !important;
            letter-spacing: -0.04em !important;
            line-height: 0.85 !important;
          }
          .mentor-section { padding-left: 1.25rem !important; padding-right: 1.25rem !important; }
        }
        .footer-link:hover { color: var(--text-accent) !important; }
      `}</style>

      {/* ── HERO (Asymmetrical Command Center) ──────────────────── */}
      <section className="mentor-hero" data-onlook-id="hero-section" style={{
        padding: '10rem 2rem 6rem',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
      }}>
        <div className="mentor-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '5rem', alignItems: 'center' }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-accent)',
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <span style={{ width: '6px', height: '6px', background: 'var(--text-accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--text-accent)' }} />
              {t.hero.tagline}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(4rem, 10vw, 9rem)',
              fontWeight: 900,
              lineHeight: 0.8,
              color: 'var(--text-primary)',
              textTransform: 'uppercase',
              letterSpacing: '-0.06em',
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
              maxWidth: '540px',
              lineHeight: 'var(--line-height-prose)',
              marginBottom: '3.5rem',
              letterSpacing: '-0.01em'
            }}>
              {t.hero.subtitleLead}
              <strong style={{ color: 'var(--text-accent)', fontWeight: 900 }}>{t.hero.subtitleBoldFragment}</strong>
              {t.hero.subtitleTail}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
                style={{
                  display: 'inline-block',
                  padding: '1.125rem 3rem',
                  background: 'var(--text-accent)',
                  color: 'var(--text-on-accent)',
                  fontWeight: 950,
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  borderRadius: '2px',
                  boxShadow: '0 0 40px rgba(var(--text-accent-rgb), 0.2)',
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
                  padding: '1.125rem 3rem',
                  background: 'rgba(255,255,255,0.02)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  borderRadius: '2px',
                  textDecoration: 'none',
                  backdropFilter: 'blur(10px)'
                }}
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
          </div>
          <div style={{ opacity: 0.8 }}>
            <HeroObservability />
          </div>
        </div>
      </section>

      {/* ── MODULES (Services Redefined) ───────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.3em',
                marginBottom: '1.5rem',
              }}>
                {t.servicesLabel}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
                fontWeight: 900,
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                letterSpacing: '-0.05em',
                lineHeight: 0.85,
              }}>
                {t.servicesHeading}
              </h2>
            </div>
            <div style={{ 
              padding: '1.5rem', 
              borderLeft: '1px solid var(--text-accent)', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.75rem', 
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              maxWidth: '320px',
              opacity: 0.6
            }}>
              <b>RATIONALE:</b> Мы не строим промпты. Мы инсталлируем автономную инженерную инфраструктуру.
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '1.5rem',
          }}>
            {t.services.map(s => (
              <div key={s.label} style={{
                padding: '3rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '2px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  marginBottom: '3rem',
                  padding: '0.25rem 0.75rem',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '100px',
                  width: 'fit-content',
                  background: 'rgba(var(--text-accent-rgb), 0.05)'
                }}>
                  SVC-SKILL-MOD-{s.label}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: '2rem',
                  fontWeight: 900,
                  color: 'var(--text-primary)',
                  marginBottom: '1.5rem',
                  letterSpacing: '-0.04em',
                  textTransform: 'uppercase',
                  lineHeight: 1
                }}>
                  {s.title}
                </h3>
                <p style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-prose)',
                  marginBottom: '3rem',
                  flexGrow: 1,
                }}>
                  {s.body}
                </p>
                <div style={{
                  paddingTop: '2rem',
                  borderTop: '1px solid var(--border-color)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  <div>
                    <div style={{ color: 'var(--text-accent)', marginBottom: '0.4rem', opacity: 0.5 }}>Output</div>
                    <span style={{ color: 'var(--text-primary)' }}>{s.deliverable}</span>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-accent)', marginBottom: '0.4rem', opacity: 0.5 }}>Term</div>
                    <span style={{ color: 'var(--text-primary)' }}>{s.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CASES (Mission Log) ────────────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-primary)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: '1.5rem',
          }}>
            {t.casesLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.05em',
            marginBottom: '5rem',
            lineHeight: 0.85,
          }}>
            {t.casesHeading}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2px',
            background: 'var(--border-color)',
            border: '1px solid var(--border-color)'
          }}>
            {t.cases.map(c => (
              <div key={c.name} style={{
                padding: '3.5rem',
                background: 'var(--bg-primary)',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '2rem',
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-display), system-ui, sans-serif',
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.05em',
                      textTransform: 'uppercase',
                      lineHeight: 1
                    }}>
                      {c.name}
                    </h3>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--text-accent)',
                      letterSpacing: '0.2em',
                      marginTop: '0.75rem',
                      textTransform: 'uppercase'
                    }}>
                      {c.tag}
                    </div>
                  </div>
                </div>
                <p style={{
                  fontSize: '1.05rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 'var(--line-height-prose)',
                  marginBottom: '2.5rem',
                  maxWidth: '520px'
                }}>
                  {c.body}
                </p>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  <span style={{ opacity: 0.4 }}>stack: </span>
                  <span style={{ color: 'var(--text-primary)' }}>{c.stack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS (Compilation Chain) ─────────────────────────── */}
      <section className="mentor-section" style={{
        padding: 'var(--section-gap) 2rem',
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            marginBottom: '1.5rem',
          }}>
            {t.processLabel}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.05em',
            marginBottom: '5rem',
            lineHeight: 0.85,
          }}>
            {t.processHeading}
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1px',
            background: 'var(--border-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            {t.process.map(([num, text]) => (
              <div key={num} style={{
                padding: '2.5rem',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                position: 'relative'
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  fontWeight: 900,
                  color: 'var(--text-accent)',
                  opacity: 0.4
                }}>
                  STEP_{num}
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                  fontWeight: 600,
                  letterSpacing: '-0.02em'
                }}>
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT (Final Directive) ──────────────────────────── */}
      <section className="mentor-section" style={{
        padding: '10rem 2rem',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
      }}>
        <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display), system-ui, sans-serif',
            fontSize: 'clamp(3rem, 10vw, 8rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            letterSpacing: '-0.07em',
            marginBottom: '2.5rem',
            lineHeight: 0.8,
          }}>
            {t.contactHeading}
          </h2>
          <p style={{
            fontSize: '1.4rem',
            color: 'var(--text-secondary)',
            maxWidth: '580px',
            margin: '0 auto 4rem',
            lineHeight: 'var(--line-height-prose)',
            letterSpacing: '-0.02em'
          }}>
            {t.contactBody}
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=Agent%20engineering%20inquiry`}
            style={{
              display: 'inline-block',
              padding: '1.5rem 5rem',
              background: 'var(--text-accent)',
              color: 'var(--text-on-accent)',
              fontWeight: 950,
              fontFamily: 'var(--font-mono)',
              fontSize: '1.1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              borderRadius: '2px',
              textDecoration: 'none',
              boxShadow: '0 0 50px rgba(var(--text-accent-rgb), 0.4)',
            }}
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        padding: '4rem 2rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '3rem',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase'
      }}>
        <span>{t.footerLeft.replace('{YEAR}', String(year))}</span>
        <span style={{ display: 'flex', gap: '3rem' }}>
          {t.footerLinks.map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              style={{ color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }}
              className="footer-link"
            >
              {link.label}
            </a>
          ))}
        </span>
      </footer>
    </main>
  )
}
