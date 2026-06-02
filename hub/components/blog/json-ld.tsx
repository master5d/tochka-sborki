import { SITE, localizedPost, langTag, type Post, type Locale } from '@/lib/posts'

function Ld({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}

export function BlogPostingLd({ post, locale }: { post: Post; locale: Locale }) {
  const r = localizedPost(post, locale)
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: r.title,
    description: r.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Person', name: SITE.author },
    inLanguage: r.langTag,
    keywords: post.tags.join(', '),
    url: r.url,
    ...(post.ogImage ? { image: post.ogImage } : {}),
  }
  return <Ld data={data} />
}

export function BlogLd({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const name = locale === 'en' ? `${SITE.name} — Blog` : `${SITE.name} — Блог`
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name,
    url: locale === 'en' ? `${SITE.url}/en/blog/` : `${SITE.url}/blog/`,
    inLanguage: langTag(locale),
    blogPost: posts.map(p => {
      const r = localizedPost(p, locale)
      return { '@type': 'BlogPosting', headline: r.title, url: r.url, datePublished: p.date }
    }),
  }
  return <Ld data={data} />
}
