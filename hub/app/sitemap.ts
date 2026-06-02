import type { MetadataRoute } from 'next'
import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10)
  const ruPosts = getAllPosts('ru')
  const entries: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: today, alternates: { languages: { en: `${SITE.url}/en/` } } },
    { url: `${SITE.url}/blog/`, lastModified: ruPosts[0]?.date ?? today, alternates: { languages: { en: `${SITE.url}/en/blog/` } } },
  ]
  for (const p of ruPosts) {
    entries.push({
      url: postUrl(p.slug, 'ru'),
      lastModified: p.updated ?? p.date,
      ...(p.en ? { alternates: { languages: { en: postUrl(p.slug, 'en') } } } : {}),
    })
  }
  return entries
}
