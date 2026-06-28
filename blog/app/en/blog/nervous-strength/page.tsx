import type { Metadata } from 'next'
import { NervousStrength } from '@/components/blog/posts/nervous-strength'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = "A 1996 prophecy: knowledge at the press of a button — and the strength to hold yourself"
const description =
  "Thirty years ago someone predicted a world where knowledge sits one button away — and warned that without inner footing it doesn't free you, it buries you. The answer isn't more knowledge; it's nervous strength and practice."

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/nervous-strength/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/nervous-strength/',
      'en-US': 'https://mamaev.coach/en/blog/nervous-strength/',
      'x-default': 'https://mamaev.coach/blog/nervous-strength/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/nervous-strength/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function NervousStrengthPageEn() {
  return (
    <PostLayout post={getPost('nervous-strength')!} locale="en">
      <NervousStrength locale="en" />
    </PostLayout>
  )
}
