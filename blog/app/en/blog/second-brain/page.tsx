import type { Metadata } from 'next'
import { SecondBrain } from '@/components/blog/posts/second-brain'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'A second brain: I query my own archive like a person'
const description =
  "Notes pile up but you never reread them — ideas drown in the archive. I built a knowledge graph that answers questions from my own notes and finds the connections between them."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/second-brain/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/second-brain/',
      'en-US': 'https://mamaev.coach/en/blog/second-brain/',
      'x-default': 'https://mamaev.coach/blog/second-brain/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/second-brain/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function SecondBrainPageEn() {
  return (
    <PostLayout post={getPost('second-brain')!} locale="en">
      <SecondBrain locale="en" />
    </PostLayout>
  )
}
