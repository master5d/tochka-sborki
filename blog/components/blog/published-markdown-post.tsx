import { MarkdownPost } from './markdown-post'

type Props = { content: string; title: string; lang?: 'ru' | 'en' }

/**
 * Blog boundary for Markdown exported by Logos Foundry.
 *
 * Foundry keeps a self-contained Markdown artifact, including its first ATX
 * heading. PostLayout owns the page-level h1, so remove only that redundant
 * heading when it matches the registry title. All other Markdown is preserved.
 */
export function normalizePublishedMarkdown(content: string, title: string): string {
  const lines = content.replace(/\r\n?/g, '\n').split('\n')
  let index = 0

  while (index < lines.length && lines[index].trim() === '') index += 1
  if (index >= lines.length || lines[index].trim() === '```') return content

  const match = lines[index].match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*$/)
  if (!match) return content

  const heading = match[2].replace(/[ \t]+#+[ \t]*$/, '').trim()
  if (normalizeHeadingText(heading) !== normalizeHeadingText(title)) return content

  let end = index + 1
  while (end < lines.length && lines[end].trim() === '') end += 1
  lines.splice(0, end)
  return lines.join('\n')
}

function normalizeHeadingText(value: string): string {
  return value
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase()
}

export function PublishedMarkdownPost({ content, title, lang }: Props) {
  return <MarkdownPost content={normalizePublishedMarkdown(content, title)} lang={lang} />
}
