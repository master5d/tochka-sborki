// blog/scripts/templates.mjs — pure source-string builders for `new-post.mjs`. No fs, fully testable.

/** kebab-case slug → PascalCase component name. 'nervous-strength' → 'NervousStrength'. */
export function componentName(slug) {
  return slug.split('-').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')
}

/** ru+en post/note component skeleton (TODO placeholders; owner writes the prose). */
export function componentSource(slug, kind = 'post') {
  const name = componentName(slug)
  const ru = kind === 'note'
    ? `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: одно ядро заметки — короткая плотная мысль.'}</p>
        <p>{'TODO: 2–4 предложения. Свяжи плотно через related[] в posts.ts — это утолщает граф.'}</p>
      </div>`
    : `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — крючок эссе.'}</p>
        <h2>TODO: раздел 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: раздел 3</h2>
        <p>{'TODO'}</p>
      </div>`
  const en = kind === 'note'
    ? `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: one core idea — a short, dense thought.'}</p>
        <p>{'TODO: 2–4 sentences. Link densely via related[] in posts.ts — it thickens the graph.'}</p>
      </div>`
    : `      <div className={styles.prose}>
        <p className={styles.lead}>{'TODO: cold-open — the essay hook.'}</p>
        <h2>TODO: section 1</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 2</h2>
        <p>{'TODO'}</p>
        <h2>TODO: section 3</h2>
        <p>{'TODO'}</p>
      </div>`
  return `import styles from '../blog-prose.module.css'

type Props = { locale: 'ru' | 'en' }

export function ${name}({ locale }: Props) {
  if (locale === 'en') {
    return (
${en}
    )
  }

  return (
${ru}
  )
}
`
}

/** A blog route page (mirrors the existing post routes). locale = 'ru' | 'en'. */
export function routeSource(slug, locale) {
  const name = componentName(slug)
  const isEn = locale === 'en'
  const url = isEn ? `https://mamaev.coach/en/blog/${slug}/` : `https://mamaev.coach/blog/${slug}/`
  return `import type { Metadata } from 'next'
import { ${name} } from '@/components/blog/posts/${slug}'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'TODO: title'
const description = 'TODO: description'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: '${url}',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/${slug}/',
      'en-US': 'https://mamaev.coach/en/blog/${slug}/',
      'x-default': 'https://mamaev.coach/blog/${slug}/',
    },
  },
  openGraph: { title, description, url: '${url}', type: 'article', locale: '${isEn ? 'en_US' : 'ru_RU'}' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function ${name}Page${isEn ? 'En' : ''}() {
  return (
    <PostLayout post={getPost('${slug}')!} locale="${locale}">
      <${name} locale="${locale}" />
    </PostLayout>
  )
}
`
}

/** Paste-ready Post registry literal (TODO placeholders; date = today; kind line only for notes). */
export function registryStub(slug, kind = 'post') {
  const today = new Date().toISOString().slice(0, 10)
  const kindLine = kind === 'note' ? `\n    kind: 'note',` : ''
  return `  {
    slug: '${slug}',
    title: 'TODO',
    description: 'TODO',
    date: '${today}',
    author: 'Александр Мамаев',
    readingTime: '~5 мин',
    tags: ['TODO'],
    related: [],${kindLine}
    en: { title: 'TODO', description: 'TODO', readingTime: '~5 min' },
  },`
}
