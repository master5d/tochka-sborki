import type { Metadata } from 'next'
import { SecondBrain } from '@/components/blog/posts/second-brain'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Второй мозг: я спрашиваю свой архив как собеседника'
const description =
  'Заметки копятся, но ты их больше не перечитываешь — идеи тонут в архиве. Я собрал граф знаний, который отвечает на вопросы по моим же записям и находит связи между ними.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/second-brain/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/second-brain/',
      'en-US': 'https://mamaev.coach/en/blog/second-brain/',
      'x-default': 'https://mamaev.coach/blog/second-brain/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/second-brain/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SecondBrainPage() {
  return (
    <PostLayout post={getPost('second-brain')!} locale="ru">
      <SecondBrain locale="ru" />
    </PostLayout>
  )
}
