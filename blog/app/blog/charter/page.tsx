import type { Metadata } from 'next'
import { Charter } from '@/components/blog/posts/charter'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Твой AI знакомится с тобой заново каждое утро'
const description =
  'Каждый раз объяснять AI, кто ты, — выматывает. Один лист на семь блоков превращает разовый инструмент в напарника, который помнит твой метод, голос и красные линии.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/charter/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/charter/',
      'en-US': 'https://mamaev.coach/en/blog/charter/',
      'x-default': 'https://mamaev.coach/blog/charter/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/charter/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function CharterPage() {
  return (
    <PostLayout post={getPost('charter')!} locale="ru">
      <Charter locale="ru" />
    </PostLayout>
  )
}
