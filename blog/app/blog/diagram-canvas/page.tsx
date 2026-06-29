import type { Metadata } from 'next'
import { DiagramCanvas } from '@/components/blog/posts/diagram-canvas'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Канвас, который рисует схемы за меня'
const description =
  'Диаграммы съедали по часу: перетаскивать прямоугольники, воевать с выравниванием — и идея остывала. Я собрал холст, где двигаешь смысл, а схему рисуют генераторы в фоне.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/diagram-canvas/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/diagram-canvas/',
      'en-US': 'https://mamaev.coach/en/blog/diagram-canvas/',
      'x-default': 'https://mamaev.coach/blog/diagram-canvas/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/diagram-canvas/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function DiagramCanvasPage() {
  return (
    <PostLayout post={getPost('diagram-canvas')!} locale="ru">
      <DiagramCanvas locale="ru" />
    </PostLayout>
  )
}
