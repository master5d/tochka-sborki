'use client'

import { getDictionary, type Locale } from '@/lib/dictionaries'

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
export function BlogFooter({ locale }: { locale: Locale }) {
  const d = getDictionary(locale)
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
        {d.blog.footerThinkAloud}{' '}
        <a href="https://t.me/ku_shaman" target="_blank" rel="noopener" style={linkStyle} onClick={() => track('telegram')}>
          @ku_shaman
        </a>
        {d.blog.footerPractice}{' '}
        <a href={d.blog.courseUrl} style={linkStyle} onClick={() => track('course')}>
          ai.mamaev.coach
        </a>
        .
      </p>
    </footer>
  )
}
