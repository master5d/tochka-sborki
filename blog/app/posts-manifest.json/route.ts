// blog/app/posts-manifest.json/route.ts
// Build-time data bridge: hub reads ../blog/out/posts-manifest.json to populate
// the whole-site sitemap/llms without importing blog TS source. Single source of
// truth stays lib/posts.ts; this is a derived projection. Not merged into hub/out,
// so it is never served publicly.
import { getAllPosts } from '@/lib/posts'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts('ru').map(p => ({
    slug: p.slug,
    date: p.date,
    updated: p.updated ?? null,
    title: p.title,
    description: p.description,
    en: p.en ? { title: p.en.title, description: p.en.description } : null,
  }))
  return Response.json(posts)
}
