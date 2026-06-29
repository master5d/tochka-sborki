import type { Metadata } from 'next'
import { TheSiteItself } from '@/components/blog/posts/the-site-itself'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Этот сайт — мой главный пруф'
const description =
  'Обучающий продукт обычно требует команды: разработчики, дизайнеры, контент. Платформу, на которой ты сейчас, я собрал в одиночку — тем самым vibe-кодингом, которому она и учит.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/the-site-itself/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/the-site-itself/',
      'en-US': 'https://mamaev.coach/en/blog/the-site-itself/',
      'x-default': 'https://mamaev.coach/blog/the-site-itself/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/the-site-itself/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function TheSiteItselfPage() {
  return (
    <PostLayout post={getPost('the-site-itself')!} locale="ru">
      <TheSiteItself locale="ru" />
    </PostLayout>
  )
}
