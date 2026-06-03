import type { Metadata } from 'next'
import { Charter } from '@/components/blog/posts/charter'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Your AI meets you from scratch every morning'
const description =
  'Re-explaining who you are to an AI every time is exhausting. One seven-block sheet turns a throwaway tool into a partner that remembers your method, your voice, and your red lines.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/charter/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/charter/',
      'en-US': 'https://mamaev.coach/en/blog/charter/',
      'x-default': 'https://mamaev.coach/blog/charter/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/charter/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function CharterPageEn() {
  return (
    <PostLayout post={getPost('charter')!} locale="en">
      <Charter locale="en" />
    </PostLayout>
  )
}
