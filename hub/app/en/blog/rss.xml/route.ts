import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export function GET() {
  const items = getAllPosts('en')
    .map(p => `    <item>
      <title>${esc(p.en!.title)}</title>
      <link>${postUrl(p.slug, 'en')}</link>
      <guid isPermaLink="true">${postUrl(p.slug, 'en')}</guid>
      <description>${esc(p.en!.description)}</description>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)} — Blog</title>
    <link>${SITE.url}/en/blog/</link>
    <description>Essays and longreads on AI, practice, and agent engineering.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
