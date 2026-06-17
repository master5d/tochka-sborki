import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const BASE = 'https://ai.mamaev.coach'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Auth-gated / private routes — keep out of the index.
      disallow: ['/dashboard/', '/character/', '/login/', '/quest-intake/', '/admin/', '/dungeon/', '/exercises/', '/offline/'],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
