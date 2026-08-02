import type { Locale } from '../lib/registry'
import { getCharter } from '../lib/charter'

interface Props { locale: Locale }

const GOLD = '#d9a95c'

export function CharterPage({ locale }: Props) {
  const t = getCharter(locale)
  const home = locale === 'en' ? '/en/' : '/'

  return (
    <main style={{ background: '#070810', color: 'rgba(255,255,255,0.92)', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 720px) {
          .charter-wrap { padding: 3.5rem 1.25rem 4rem !important; }
          .charter-wrap h1 { font-size: clamp(2rem, 9vw, 3rem) !important; }
          .charter-rule { grid-template-columns: 1fr !important; gap: 0.35rem !important; }
        }
      `}</style>

      <section className="charter-wrap" style={{ maxWidth: '46rem', margin: '0 auto', padding: '6rem 2rem 5rem' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: GOLD, textTransform: 'lowercase', letterSpacing: '0.25em', fontSize: '0.75rem', margin: 0 }}>
          {t.eyebrow}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', letterSpacing: '0.03em', margin: '1rem 0 1.75rem', color: '#fff' }}>
          {t.heading}
        </h1>

        {t.intro.map((p, i) => (
          <p key={i} style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '1rem', marginBottom: '1rem' }}>{p}</p>
        ))}

        <ol style={{ listStyle: 'none', padding: 0, margin: '3rem 0 0' }}>
          {t.rules.map((rule, i) => (
            <li
              key={rule.title}
              className="charter-rule"
              style={{
                display: 'grid',
                gridTemplateColumns: '2.5rem 1fr',
                gap: '1rem',
                padding: '1.25rem 0',
                borderTop: i === 0 ? '1px solid rgba(217,169,92,0.25)' : '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', color: GOLD, fontSize: '0.9rem', paddingTop: '0.15rem' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 0.4rem', lineHeight: 1.35 }}>
                  {rule.title}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.68)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
                  {rule.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section style={{ marginTop: '3.5rem', border: `1px solid ${GOLD}`, borderRadius: '10px', padding: '1.5rem', background: 'rgba(217,169,92,0.06)' }}>
          <h2 style={{ fontFamily: 'var(--font-mono)', color: GOLD, textTransform: 'lowercase', letterSpacing: '0.12em', fontSize: '0.8rem', margin: '0 0 1rem' }}>
            {t.autonomyHeading}
          </h2>
          {t.autonomyBody.map((p, i) => (
            <p key={i} style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '0.98rem', margin: i === 0 ? '0 0 0.9rem' : 0 }}>
              {p}
            </p>
          ))}
        </section>

        <p style={{ marginTop: '3rem' }}>
          <a href={home} style={{ color: GOLD, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', letterSpacing: '0.08em', textDecoration: 'none' }}>
            {t.backLabel}
          </a>
        </p>
      </section>
    </main>
  )
}
