import type { Metadata } from 'next'
import { TheSiteItself } from '@/components/blog/posts/the-site-itself'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'This site is my main proof'
const description =
  "A learning product usually needs a team: developers, designers, content. The platform you're on right now I built solo — with the very vibe-coding it teaches."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/the-site-itself/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/the-site-itself/',
      'en-US': 'https://mamaev.coach/en/blog/the-site-itself/',
      'x-default': 'https://mamaev.coach/blog/the-site-itself/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/the-site-itself/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function TheSiteItselfPageEn() {
  return (
    <PostLayout post={getPost('the-site-itself')!} locale="en">
      <TheSiteItself locale="en" />
    </PostLayout>
  )
}
