import type { Metadata } from 'next'
import { PostGraph } from '@/components/blog/post-graph'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Граф знаний · Блог · Александр Мамаев',
  description: 'Как связаны эссе блога — карта родственных нитей.',
  alternates: {
    canonical: 'https://mamaev.coach/blog/graph/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/graph/',
      'en-US': 'https://mamaev.coach/en/blog/graph/',
      'x-default': 'https://mamaev.coach/blog/graph/',
    },
  },
  openGraph: { title: 'Граф знаний · Блог', description: 'Как связаны эссе блога.', url: 'https://mamaev.coach/blog/graph/', type: 'website', locale: 'ru_RU' },
}

export default function GraphPage() {
  return <PostGraph locale="ru" />
}
