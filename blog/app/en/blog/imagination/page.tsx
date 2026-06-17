import type { Metadata } from 'next'
import { Imagination } from '@/components/blog/posts/imagination'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = "The barrier isn't imagination: why a hundred ideas never get done"
const description =
  "You're not stopped by \"no imagination\" — the image of the result is there. You're stopped by imagination that was never translated into a task. Three stages: imagination → task → automation, and the order matters."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/imagination/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/imagination/',
      'en-US': 'https://mamaev.coach/en/blog/imagination/',
      'x-default': 'https://mamaev.coach/blog/imagination/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/imagination/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function ImaginationPageEn() {
  return (
    <PostLayout post={getPost('imagination')!} locale="en">
      <Imagination locale="en" />
    </PostLayout>
  )
}
