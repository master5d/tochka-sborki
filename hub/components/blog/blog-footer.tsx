'use client'

const track = (door: 'telegram' | 'course') => {
  if (typeof window === 'undefined') return
  // @ts-expect-error analytics global is optional
  window.plausible?.('blog_cta_clicked', { props: { door } })
}

const linkStyle: React.CSSProperties = {
  color: 'var(--text-accent)',
  textDecoration: 'none',
  fontWeight: 700,
}

/** Quiet site-wide footnote for the blog: think-aloud channel + the course. */
export function BlogFooter() {
  return (
    <footer
      style={{
        marginTop: '4rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.8rem',
        lineHeight: 1.7,
        color: 'var(--text-secondary)',
      }}
    >
      <p style={{ margin: 0 }}>
        Думаю вслух в Telegram —{' '}
        <a
          href="https://t.me/ku_shaman"
          target="_blank"
          rel="noopener"
          style={linkStyle}
          onClick={() => track('telegram')}
        >
          @ku_shaman
        </a>
        . Практика — в открытом бесплатном курсе{' '}
        <a href="https://ai.mamaev.coach" style={linkStyle} onClick={() => track('course')}>
          ai.mamaev.coach
        </a>
        .
      </p>
    </footer>
  )
}
