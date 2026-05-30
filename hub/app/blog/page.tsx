import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog/blog-index'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Блог · Александр Мамаев',
  description: 'Эссе и лонгриды об AI, практике и агентском инжиниринге.',
  openGraph: {
    title: 'Блог · Александр Мамаев',
    description: 'Эссе и лонгриды об AI, практике и агентском инжиниринге.',
    url: 'https://mamaev.coach/blog/',
    type: 'website',
    locale: 'ru_RU',
  },
}

export default function BlogPage() {
  return <BlogIndex />
}
