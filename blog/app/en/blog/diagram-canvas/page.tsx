import type { Metadata } from 'next'
import { DiagramCanvas } from '@/components/blog/posts/diagram-canvas'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'A canvas that draws the diagrams for me'
const description =
  "Diagrams used to eat an hour each: dragging rectangles, fighting alignment — and the idea went cold. I built a canvas where you move meaning and generators draw the diagram in the background."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/diagram-canvas/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/diagram-canvas/',
      'en-US': 'https://mamaev.coach/en/blog/diagram-canvas/',
      'x-default': 'https://mamaev.coach/blog/diagram-canvas/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/diagram-canvas/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function DiagramCanvasPageEn() {
  return (
    <PostLayout post={getPost('diagram-canvas')!} locale="en">
      <DiagramCanvas locale="en" />
    </PostLayout>
  )
}
