import Link from 'next/link'
import { getAllPosts, localizedPost, stripOrigin, type Locale } from '@/lib/posts'
import { getDictionary } from '@/lib/dictionaries'
import { BlogLd } from './json-ld'
import { BlogFooter } from './blog-footer'

export function BlogIndex({ locale }: { locale: Locale }) {
  const d = getDictionary(locale)
  const posts = getAllPosts(locale)
  return (
    <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
      <BlogLd posts={posts} locale={locale} />

      <Link href={locale === 'en' ? '/en/' : '/'} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-accent)', textDecoration: 'none', opacity: 0.8 }}>
        {d.blog.backToSite}
      </Link>

      <h1 style={{
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        fontSize: 'clamp(2rem, 6vw, 4rem)',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        margin: '1rem 0 2.5rem',
      }}>
        {d.blog.indexHeading}
      </h1>

      {posts.length === 0 && (
        <p style={{ color: 'var(--text-secondary)' }}>{d.blog.empty}</p>
      )}

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {posts.map(post => {
          const r = localizedPost(post, locale)
          return (
            <li key={post.slug} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              <Link href={stripOrigin(r.url)} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.04em',
                  marginBottom: '0.25rem',
                  opacity: 0.7,
                }}>
                  {r.formattedDate} · {r.readingTime}
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display), system-ui, sans-serif',
                  fontSize: 'clamp(1.25rem, 3vw, 1.8rem)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                  margin: '0 0 0.5rem',
                }}>
                  {r.title}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 0 0.75rem', maxWidth: '60ch' }}>
                  {r.description}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)', fontWeight: 700 }}>
                    {d.blog.readCta}
                  </span>
                  <span style={{ color: 'var(--text-accent)', opacity: 0.5 }}>→</span>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <BlogFooter locale={locale} />
    </main>
  )
}
