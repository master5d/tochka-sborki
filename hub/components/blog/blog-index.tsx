import Link from 'next/link'
import { getAllPosts, formatDate } from '@/lib/posts'
import { BlogLd } from './json-ld'

export function BlogIndex() {
  const posts = getAllPosts()
  return (
    <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '4rem 1.5rem 5rem' }}>
      <BlogLd posts={posts} />

      <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-accent)', textDecoration: 'none' }}>
        ← mamaev.coach
      </Link>

      <h1 style={{
        fontFamily: 'var(--font-display), system-ui, sans-serif',
        fontSize: 'clamp(2.5rem, 8vw, 5rem)',
        fontWeight: 900,
        textTransform: 'uppercase',
        letterSpacing: '-0.04em',
        color: 'var(--text-primary)',
        margin: '1.5rem 0 3rem',
      }}>
        Блог
      </h1>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {posts.map(post => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}/`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                marginBottom: '0.5rem',
              }}>
                {formatDate(post.date)} · {post.readingTime}
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display), system-ui, sans-serif',
                fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: '0 0 0.75rem',
              }}>
                {post.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                {post.description}
              </p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 700 }}>
                Читать →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
