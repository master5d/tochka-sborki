import type { Metadata } from 'next'
import { BlogIndex } from '@/components/blog/blog-index'

const title = 'Blog — Alexander Mamaev'
const description = 'Essays and longreads on AI, practice, and agent engineering.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/',
      'en-US': 'https://mamaev.coach/en/blog/',
      'x-default': 'https://mamaev.coach/blog/',
    },
  },
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/en/blog/',
    type: 'website',
    locale: 'en_US',
  },
}

export default function Page() {
  return <BlogIndex locale="en" />
}
