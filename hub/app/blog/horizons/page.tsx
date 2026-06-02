import type { Metadata } from 'next'
import { Horizons } from '@/components/blog/posts/horizons'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Горизонты: что вообще можно делать с AI, если ты не технарь'
const description =
  'Ты пользуешься AI каждый день и не знаешь, что им вообще можно. Четыре двери в комнату, в которую ты не заглядывал — без единой строчки кода.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/horizons/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/horizons/',
      'en-US': 'https://mamaev.coach/en/blog/horizons/',
      'x-default': 'https://mamaev.coach/blog/horizons/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/horizons/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function HorizonsPage() {
  return (
    <PostLayout post={getPost('horizons')!} locale="ru">
      <Horizons locale="ru" />
    </PostLayout>
  )
}
