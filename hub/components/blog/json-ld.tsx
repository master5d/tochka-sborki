import { SITE, postUrl, type Post } from '@/lib/posts'

function Ld({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export function BlogPostingLd({ post }: { post: Post }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@type': 'Person', name: SITE.author },
    inLanguage: SITE.lang,
    keywords: post.tags.join(', '),
    url: postUrl(post.slug),
    ...(post.ogImage ? { image: post.ogImage } : {}),
  }
  return <Ld data={data} />
}

export function BlogLd({ posts }: { posts: Post[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} — Блог`,
    url: `${SITE.url}/blog/`,
    inLanguage: SITE.lang,
    blogPost: posts.map(p => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: postUrl(p.slug),
      datePublished: p.date,
    })),
  }
  return <Ld data={data} />
}
