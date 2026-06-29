import type { Metadata } from 'next'
import { Echo } from '@/components/blog/posts/echo'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Echo: голос вместо клавиатуры — и как я собрал его сам'
const description =
  'Печать всегда отставала от мысли. Я собрал офлайн-диктовку, которая понимает русский и английский вперемешку и даже сидит со мной на встречах — без команды разработки.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/echo/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/echo/',
      'en-US': 'https://mamaev.coach/en/blog/echo/',
      'x-default': 'https://mamaev.coach/blog/echo/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/echo/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function EchoPage() {
  return (
    <PostLayout post={getPost('echo')!} locale="ru">
      <Echo locale="ru" />
    </PostLayout>
  )
}
