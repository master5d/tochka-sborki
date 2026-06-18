import type { Metadata } from 'next'
import { PostGraph } from '@/components/blog/post-graph'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title: 'Knowledge graph · Blog · Alexander Mamaev',
  description: 'How the blog essays connect — a map of related threads.',
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/graph/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/graph/',
      'en-US': 'https://mamaev.coach/en/blog/graph/',
      'x-default': 'https://mamaev.coach/blog/graph/',
    },
  },
  openGraph: { title: 'Knowledge graph · Blog', description: 'How the blog essays connect.', url: 'https://mamaev.coach/en/blog/graph/', type: 'website', locale: 'en_US' },
}

export default function GraphPageEn() {
  return <PostGraph locale="en" />
}
