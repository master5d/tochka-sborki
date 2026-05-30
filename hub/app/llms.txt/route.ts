import { SITE, getAllPosts, postUrl } from '@/lib/posts'

export const dynamic = 'force-static'

export function GET() {
  const posts = getAllPosts()
  const body = `# ${SITE.name}

Личный сайт: AI builder, vibe coder, coach. Лендинг, блог и ссылки на курс «Точка Сборки» (ai.mamaev.coach).

## Разделы
- Главная: ${SITE.url}/
- Блог: ${SITE.url}/blog/
- Курс «Точка Сборки» (внешний): https://ai.mamaev.coach/

## Посты
${posts.map(p => `- [${p.title}](${postUrl(p.slug)}) — ${p.description}`).join('\n')}

## Машиночитаемые слои
- ${SITE.url}/sitemap.xml
- ${SITE.url}/blog/rss.xml
- ${SITE.url}/.well-known/agent-description.md
`
  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
