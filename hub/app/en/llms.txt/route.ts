import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts('en')
  const body = `# ${SITE.name}

Personal site: AI builder, vibe coder, coach. Landing, blog, and links to the course "Tochka Sborki" (ai.mamaev.coach).

## Sections
- Home: ${SITE.url}/en/
- Blog: ${SITE.url}/en/blog/
- Course "Tochka Sborki" (external): https://ai.mamaev.coach/en/

## Posts
${posts.map(p => `- [${p.en!.title}](${postUrl(p.slug, 'en')}) — ${p.en!.description}`).join('\n')}

## Machine-readable layers
- ${SITE.url}/sitemap.xml
- ${SITE.url}/en/blog/rss.xml
- ${SITE.url}/.well-known/agent-description.md
`
  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } })
}
