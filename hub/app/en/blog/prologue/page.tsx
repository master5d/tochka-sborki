import type { Metadata } from 'next'
import { Prologue } from '@/components/prologue/Prologue'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Tochka Sborki. Prologue'
const description =
  "This isn't a programming course. It's a course in reassembling yourself in an age of fragmentation — through the very tool that once felt like the enemy."
const ogDescription =
  'The great transition, decentralized AI, liberation — and why they\'re all about one thing.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/prologue/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/prologue/',
      'en-US': 'https://mamaev.coach/en/blog/prologue/',
      'x-default': 'https://mamaev.coach/blog/prologue/',
    },
  },
  openGraph: { title, description: ogDescription, url: 'https://mamaev.coach/en/blog/prologue/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description: ogDescription },
}

export default function ProloguePageEn() {
  return (
    <PostLayout post={getPost('prologue')!} locale="en">
      <Prologue locale="en" />
    </PostLayout>
  )
}
