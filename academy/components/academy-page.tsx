import { getDictionary, type Locale } from '../lib/dictionaries'
import { getCourses } from '../lib/registry'

interface Props { locale: Locale }

const GOLD = '#d9a95c'

export function AcademyPage({ locale }: Props) {
  const t = getDictionary(locale).academy
  const courses = getCourses(locale)

  return (
    <main style={{ background: '#070810', color: 'rgba(255,255,255,0.92)', minHeight: '100vh' }}>
      <style>{`
        .academy-hero {
          background-image:
            radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 0, transparent 100%),
            radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.6) 0, transparent 100%),
            radial-gradient(1.5px 1.5px at 60% 20%, rgba(255,255,255,0.9) 0, transparent 100%),
            radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.5) 0, transparent 100%),
            radial-gradient(1px 1px at 10% 80%, rgba(255,255,255,0.7) 0, transparent 100%),
            radial-gradient(1.5px 1.5px at 90% 85%, rgba(217,169,92,0.8) 0, transparent 100%),
            radial-gradient(1px 1px at 50% 45%, rgba(217,169,92,0.6) 0, transparent 100%);
        }
        @media (max-width: 720px) {
          .academy-hero { padding: 4rem 1.25rem 3rem !important; }
          .academy-hero h1 { font-size: clamp(2.2rem, 11vw, 4.5rem) !important; }
        }
      `}</style>

      <section className="academy-hero" style={{ padding: '7rem 2rem 5rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', color: GOLD, textTransform: 'lowercase', letterSpacing: '0.25em', fontSize: '0.75rem', margin: 0 }}>
          {t.eyebrow}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 7vw, 5rem)', letterSpacing: '0.05em', margin: '1rem 0 0.5rem', color: '#fff' }}>
          {t.wordmark}
        </h1>
        <p style={{ color: GOLD, fontSize: '0.9rem', letterSpacing: '0.08em', margin: '0 0 2.5rem' }}>
          {t.fullName}
        </p>
        <div style={{ maxWidth: '38rem', margin: '0 auto', textAlign: 'left' }}>
          {t.positioning.map((p, i) => (
            <p key={i} style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, fontSize: '1rem' }}>{p}</p>
          ))}
          <div style={{ border: `1px solid ${GOLD}`, borderRadius: '10px', marginTop: '1.6rem', padding: '1rem', background: 'rgba(217,169,92,0.08)' }}>
            <p style={{ color: 'rgba(255,255,255,0.82)', lineHeight: 1.6, margin: '0 0 0.85rem' }}>{t.gate}</p>
            <a href="https://ai.synergify.com" style={{ color: GOLD, fontFamily: 'var(--font-mono)', fontSize: '0.82rem', letterSpacing: '0.08em', textTransform: 'lowercase' }}>
              {t.gateCta}
            </a>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: '52rem', margin: '0 auto', padding: '0 2rem 2.5rem', textAlign: 'center' }}>
        <a
          href={locale === 'en' ? '/en/pravila/' : '/pravila/'}
          style={{ color: GOLD, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', letterSpacing: '0.06em', textDecoration: 'none', borderBottom: `1px solid rgba(217,169,92,0.4)`, paddingBottom: '0.2rem' }}
        >
          {t.charterLabel}
        </a>
      </section>

      <section style={{ maxWidth: '52rem', margin: '0 auto', padding: '0 2rem 6rem' }}>
        <h2 style={{ fontFamily: 'var(--font-mono)', color: GOLD, textTransform: 'lowercase', letterSpacing: '0.12em', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
          {t.coursesLabel}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {courses.map((c) =>
            c.status === 'live' ? (
              <a
                key={c.slug}
                href={c.url}
                aria-label={c.name}
                target="_blank"
                rel="noopener noreferrer"
                style={{ border: '1px solid rgba(217,169,92,0.35)', borderRadius: '10px', padding: '1.5rem', textDecoration: 'none', background: 'rgba(255,255,255,0.03)', display: 'block' }}
              >
                <div style={{ color: '#fff', fontWeight: 600, marginBottom: '0.4rem' }}>{c.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.5 }}>{c.tagline}</div>
              </a>
            ) : (
              <div
                key={c.slug}
                style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}
              >
                <div style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: '0.4rem' }}>{c.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '0.6rem' }}>{c.tagline}</div>
                <span style={{ fontFamily: 'var(--font-mono)', color: GOLD, fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'lowercase' }}>{t.comingSoon}</span>
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  )
}
