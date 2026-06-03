'use client'

import Link from 'next/link'
import { type Post, getPost, localizedPost, stripOrigin, type Locale } from '@/lib/posts'
import { getDictionary } from '@/lib/dictionaries'
import { BlogPostingLd } from './json-ld'
import { BlogFooter } from './blog-footer'
import { ReadWithAI } from './read-with-ai'
import { ReadWithAIDock } from './read-with-ai-dock'
import { SelectionAsk } from './selection-ask'

const backLinkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.8rem',
  color: 'var(--text-accent)',
  textDecoration: 'none',
  letterSpacing: '0.04em',
}

export function PostLayout({ post, locale, children }: { post: Post; locale: Locale; children: React.ReactNode }) {
  const d = getDictionary(locale)
  const r = localizedPost(post, locale)
  const related = post.related.map(getPost).filter((p): p is Post => Boolean(p))

  return (
    <main style={{ maxWidth: '680px' /* optimized reading column for Type Color */, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      <BlogPostingLd post={post} locale={locale} />

      <Link href={locale === 'en' ? '/en/blog/' : '/blog/'} style={backLinkStyle}>{d.blog.backToBlog}</Link>

      <header style={{ margin: '1.5rem 0 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display), system-ui, sans-serif',
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
              margin: '0 0 0.75rem',
            }}>
              {r.title}
            </h1>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.04em',
              opacity: 0.8,
            }}>
              {r.formattedDate} · {post.author} · {r.readingTime}
            </div>
          </div>
          <button
            title="Generate PPTX deck via Presenton"
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s ease'
            }}
            onClick={() => alert('Orchestrating Presentation via Presenton... (BYOK Required)')}
          >
            <span style={{ color: 'var(--text-accent)' }}>⬡</span>
            DECK.pptx
          </button>
        </div>
      </header>

      {children}

      <ReadWithAI url={r.url} title={r.title} />

      {related.length > 0 && (
        <section style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--section-label-size)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: '0.75rem',
          }}>
            {d.blog.relatedLabel}
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {related.map(rp => {
              const rr = localizedPost(rp, locale)
              return (
                <li key={rp.slug}>
                  <Link href={stripOrigin(rr.url)} style={{ color: 'var(--text-accent)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    {rr.title}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div style={{ marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
        <Link href={locale === 'en' ? '/en/blog/' : '/blog/'} style={backLinkStyle}>{d.blog.backToBlog}</Link>
      </div>

      <BlogFooter locale={locale} />
      <div style={{ height: '2rem' }} /> {/* extra breathing room at the very bottom */}

      <ReadWithAIDock url={r.url} title={r.title} />
      <SelectionAsk url={r.url} />
    </main>
  )
}
