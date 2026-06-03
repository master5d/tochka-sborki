import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function GET() {
  const items = getAllPosts()
    .map(p => `    <item>
      <title>${esc(p.title)}</title>
      <link>${postUrl(p.slug)}</link>
      <guid isPermaLink="true">${postUrl(p.slug)}</guid>
      <description>${esc(p.description)}</description>
      <pubDate>${new Date(p.date + 'T00:00:00Z').toUTCString()}</pubDate>
    </item>`)
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(SITE.name)} — Блог</title>
    <link>${SITE.url}/blog/</link>
    <description>Эссе и лонгриды об AI, практике и агентском инжиниринге.</description>
    <language>ru</language>
${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
