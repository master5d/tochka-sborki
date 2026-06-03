import type { Metadata } from 'next'
import { Horizons } from '@/components/blog/posts/horizons'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = "Horizons: what you can actually do with AI if you're not a techie"
const description =
  "You use AI every day and still don't know what it's capable of. Four doors into a room you've never looked into — without a single line of code."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/horizons/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/horizons/',
      'en-US': 'https://mamaev.coach/en/blog/horizons/',
      'x-default': 'https://mamaev.coach/blog/horizons/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/horizons/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function HorizonsPageEn() {
  return (
    <PostLayout post={getPost('horizons')!} locale="en">
      <Horizons locale="en" />
    </PostLayout>
  )
}
