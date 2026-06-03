import type { MetadataRoute } from 'next'
import { SITE } from '@/lib/site'

export const dynamic = 'force-static'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: ['GPTBot', 'ClaudeBot', 'Google-Extended', 'PerplexityBot', 'CCBot'], allow: '/' },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
