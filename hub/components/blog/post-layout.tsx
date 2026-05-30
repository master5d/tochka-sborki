import Link from 'next/link'
import { type Post, getPost, formatDate } from '@/lib/posts'
import { BlogPostingLd } from './json-ld'

const backLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-accent)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
}

export function PostLayout({ post, children }: { post: Post; children: React.ReactNode }) {
  const related = post.related.map(getPost).filter((p): p is Post => Boolean(p))

  return (
    <main style={{ maxWidth: '720px', margin: '0 auto', padding: '2.5rem 1.5rem 4rem' }}>
      <BlogPostingLd post={post} />

      <Link href="/blog/" style={backLinkStyle}>← Блог</Link>

      <header style={{ margin: '2rem 0 2.5rem' }}>
        <h1 style={{
          fontFamily: 'var(--font-display), system-ui, sans-serif',
          fontSize: 'clamp(2rem, 5vw, 3.25rem)',
          fontWeight: 900,
          lineHeight: 1.02,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          margin: '0 0 1rem',
        }}>
          {post.title}
        </h1>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
        }}>
          {formatDate(post.date)} · {post.author} · {post.readingTime}
        </div>
      </header>

      {children}

      {related.length > 0 && (
        <section style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '1rem',
          }}>
            По теме
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {related.map(r => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}/`} style={{ color: 'var(--text-accent)', textDecoration: 'none' }}>
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
        <Link href="/blog/" style={backLinkStyle}>← Блог</Link>
      </div>
    </main>
  )
}
