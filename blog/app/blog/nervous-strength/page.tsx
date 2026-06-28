import type { Metadata } from 'next'
import { NervousStrength } from '@/components/blog/posts/nervous-strength'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Пророчество 1996 года: знание по кнопке — и сила, чтобы себя удержать'
const description =
  'Тридцать лет назад предсказали мир, где знание — по нажатию кнопки, и предупредили: без внутренней опоры оно не освобождает, а накрывает. Ответ — не больше знания, а нервная сила и практика.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/nervous-strength/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/nervous-strength/',
      'en-US': 'https://mamaev.coach/en/blog/nervous-strength/',
      'x-default': 'https://mamaev.coach/blog/nervous-strength/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/nervous-strength/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function NervousStrengthPage() {
  return (
    <PostLayout post={getPost('nervous-strength')!} locale="ru">
      <NervousStrength locale="ru" />
    </PostLayout>
  )
}
