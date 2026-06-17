import type { Metadata } from 'next'
import { Imagination } from '@/components/blog/posts/imagination'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Барьер не в воображении: почему сто идей не доходят до дела'
const description =
  'Тебя останавливает не «нет воображения» — образ результата есть у всех. Останавливает непереведённое в задачу воображение. Три ступени: воображение → задача → автоматизация, и порядок важен.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/imagination/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/imagination/',
      'en-US': 'https://mamaev.coach/en/blog/imagination/',
      'x-default': 'https://mamaev.coach/blog/imagination/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/imagination/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function ImaginationPage() {
  return (
    <PostLayout post={getPost('imagination')!} locale="ru">
      <Imagination locale="ru" />
    </PostLayout>
  )
}
