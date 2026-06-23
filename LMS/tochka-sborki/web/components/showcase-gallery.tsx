import { getShowcase } from '@/lib/course/showcase'
import { ShowcaseVideo } from '@/components/showcase-video'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseGallery({ locale }: { locale: Locale }) {
  const t = getShowcase(locale)
  const intakeHref = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'
  const deepDive = locale === 'en' ? '→ deep-dive' : '→ разбор'

  const card: React.CSSProperties = {
    display: 'block', padding: '1.2rem', borderRadius: 12,
    border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
    color: 'inherit', textDecoration: 'none',
  }
  const grid: React.CSSProperties = {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem',
  }
  const subHeading: React.CSSProperties = { fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '1.6rem' }

  return (
    <section className="home-section" style={{ padding: 'var(--section-gap) 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '1.6rem' }}>{t.label}</div>

        <ShowcaseVideo source={t.video.source} poster={t.video.poster} caption={t.video.caption} title={t.real.heading} />

        {t.real.cases.length > 0 && (
          <>
            <h2 style={subHeading}>{t.real.heading}</h2>
            <div style={{ ...grid, marginBottom: '2.5rem' }}>
              {t.real.cases.map(c => {
                const inner = (
                  <>
                    <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.result}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>— {c.author}</span>
                    </div>
                    {c.href && <div style={{ marginTop: '0.7rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)' }}>{deepDive}</div>}
                  </>
                )
                return c.href
                  ? <a key={c.id} href={c.href} style={card}>{inner}</a>
                  : <div key={c.id} style={card}>{inner}</div>
              })}
            </div>
          </>
        )}

        <h2 style={subHeading}>{t.dream.heading}</h2>
        <div style={grid}>
          {t.dream.cases.map(c => {
            const inner = (
              <>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }} aria-hidden="true">{c.icon}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.4rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.7rem' }}>{c.blurb}</p>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-accent)', border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 10px' }}>{c.tag}</span>
              </>
            )
            return c.href
              ? <a key={c.id} href={c.href} style={card}>{inner}</a>
              : <div key={c.id} style={card}>{inner}</div>
          })}
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <a href={intakeHref} style={{ display: 'inline-block', background: 'var(--text-accent)', color: 'var(--text-on-accent)', fontWeight: 700, padding: '12px 24px', borderRadius: 10, textDecoration: 'none' }}>{t.cta}</a>
        </div>
      </div>
    </section>
  )
}
