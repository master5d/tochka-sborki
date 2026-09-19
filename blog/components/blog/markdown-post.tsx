import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from './blog-prose.module.css'

type Props = { content: string; lang?: 'ru' | 'en' }

// Generic markdown-рендер поста: markdown piece'а из Logos Foundry рендерится
// в блоговую типографику (.prose стилит голые h2/p/a/ul/blockquote).
export function MarkdownPost({ content, lang }: Props) {
  return (
    <div className={styles.prose} lang={lang}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const external = Boolean(href?.startsWith('http://') || href?.startsWith('https://'))
            return (
              <a
                {...props}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
