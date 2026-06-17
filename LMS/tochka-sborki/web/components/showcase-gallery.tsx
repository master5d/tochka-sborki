import { getShowcase, videoEmbedUrl } from '@/lib/showcase'
import type { Locale } from '@/lib/intake/types'

export function ShowcaseGallery({ locale }: { locale: Locale }) {
  const t = getShowcase(locale)
  const embed = videoEmbedUrl(t.videoUrl)
  const intakeHref = locale === 'en' ? '/en/quest-intake/' : '/quest-intake/'

  const card: React.CSSProperties = {
    display: 'block', padding: '1.2rem', borderRadius: 12,
    border: '1px solid var(--border-color)', background: 'var(--bg-surface)',
    color: 'inherit', textDecoration: 'none',
  }

  return (
    <section className="home-section" style={{ padding: 'var(--section-gap) 2rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div style={{ maxWidth: 'var(--content-max)', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--section-label-size)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.6rem' }}>{t.label}</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 800, marginBottom: '1.6rem' }}>{t.heading}</h2>

        <div style={{ position: 'relative', aspectRatio: '16 / 9', width: '100%', borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', marginBottom: '2rem' }}>
          {embed ? (
            <iframe src={embed} title={t.heading} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', color: 'var(--text-secondary)' }}>
              <span aria-hidden="true" style={{ fontSize: '2.4rem' }}>▶</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{t.videoCaption}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {t.cases.map(c => {
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
