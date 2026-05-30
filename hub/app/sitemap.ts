import type { MetadataRoute } from 'next'
import { SITE, getAllPosts } from '@/lib/posts'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts().map(p => ({
    url: `${SITE.url}/blog/${p.slug}/`,
    lastModified: p.updated ?? p.date,
  }))
  return [
    { url: `${SITE.url}/`, lastModified: new Date().toISOString().slice(0, 10) },
    { url: `${SITE.url}/blog/`, lastModified: posts[0]?.lastModified ?? new Date().toISOString().slice(0, 10) },
    ...posts,
  ]
}
