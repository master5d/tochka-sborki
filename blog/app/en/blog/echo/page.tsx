import type { Metadata } from 'next'
import { Echo } from '@/components/blog/posts/echo'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Echo: voice instead of keyboard — and how I built it myself'
const description =
  "Typing always lagged behind the thought. I built an offline dictation app that understands Russian and English mixed together — and even sits in on my meetings. Without a dev team."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/echo/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/echo/',
      'en-US': 'https://mamaev.coach/en/blog/echo/',
      'x-default': 'https://mamaev.coach/blog/echo/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/echo/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function EchoPageEn() {
  return (
    <PostLayout post={getPost('echo')!} locale="en">
      <Echo locale="en" />
    </PostLayout>
  )
}
