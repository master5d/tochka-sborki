import type { Metadata } from 'next'
import { AssemblyPoint } from '@/components/blog/posts/assembly-point'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'The Assembly Point: from borrowed tools to a sovereign practice'
const description =
  'Three postures of working with AI — borrowed tools, personal practice, sovereign practice. The Practice OS, the rough-draft-first rule, and why a teacher grows teachers, not followers.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/assembly-point/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/assembly-point/',
      'en-US': 'https://mamaev.coach/en/blog/assembly-point/',
      'x-default': 'https://mamaev.coach/blog/assembly-point/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/assembly-point/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function AssemblyPointPageEn() {
  return (
    <PostLayout post={getPost('assembly-point')!} locale="en">
      <AssemblyPoint locale="en" />
    </PostLayout>
  )
}
