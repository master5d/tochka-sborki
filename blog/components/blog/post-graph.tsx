import Link from 'next/link'
import { getGraphEntries, localizedPost, stripOrigin, postUrl, type Locale } from '@/lib/posts'
import { buildGraph } from '@/lib/graph'
import { BlogFooter } from './blog-footer'

// Deterministic build-time radial layout (no runtime physics — static-export friendly).
const SIZE = 640
const C = SIZE / 2
const R = 210

// Stable tag → colour: hash the tag into a small brand-ish palette.
const PALETTE = ['#00d1ff', '#7bd88f', '#ff7ace', '#e0b020', '#b388ff', '#ff5577', '#4d8cff']
function tagColor(tag: string): string {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function PostGraph({ locale }: { locale: Locale }) {
  const posts = getGraphEntries(locale)
  const { nodes, edges } = buildGraph(posts)

  // Position every node on a circle, indexed by registry order — deterministic across builds.
  const pos = new Map(nodes.map((n, i) => {
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2
    return [n.slug, { x: C + R * Math.cos(angle), y: C + R * Math.sin(angle), angle }]
  }))
  const titleOf = (slug: string) => {
    const p = posts.find(x => x.slug === slug)
    return p ? localizedPost(p, locale).title : slug
  }

  const t = locale === 'en'
    ? { back: '← Blog', heading: 'Knowledge graph', sub: 'How the essays connect. Each node is a post; lines are related threads. Tap a node to read.' }
    : { back: '← Блог', heading: 'Граф знаний', sub: 'Как связаны эссе. Узел — пост, линии — родственные нити. Нажми на узел, чтобы читать.' }

  return (
    <main style={{ maxWidth: 'var(--content-max)', margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
      <Link href={locale === 'en' ? '/en/blog/' : '/blog/'} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-accent)', textDecoration: 'none', opacity: 0.8 }}>
        {t.back}
      </Link>
      <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 900, color: 'var(--text-primary)', margin: '1rem 0 0.4rem' }}>{t.heading}</h1>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '52ch', marginBottom: '1.5rem' }}>{t.sub}</p>

      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: 640, display: 'block', margin: '0 auto' }} role="img" aria-label={t.heading}>
        {edges.map(e => {
          const a = pos.get(e.a)!, b = pos.get(e.b)!
          return <line key={`${e.a}-${e.b}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--border-color)" strokeWidth={1.5} />
        })}
        {nodes.map(n => {
          const pt = pos.get(n.slug)!
          const right = Math.cos(pt.angle) >= 0
          return (
            <a key={n.slug} href={stripOrigin(postUrl(n.slug, locale))}>
              <circle cx={pt.x} cy={pt.y} r={n.kind === 'note' ? 6 : 9} fill={tagColor(n.tag)} stroke="var(--bg-primary)" strokeWidth={2} />
              <text
                x={pt.x + (right ? 14 : -14)} y={pt.y + 4}
                textAnchor={right ? 'start' : 'end'}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fill: 'var(--text-primary)' }}
              >
                {titleOf(n.slug).length > 28 ? titleOf(n.slug).slice(0, 27) + '…' : titleOf(n.slug)}
              </text>
            </a>
          )
        })}
      </svg>

      <BlogFooter locale={locale} />
    </main>
  )
}
