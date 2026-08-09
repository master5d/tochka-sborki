import type { Metadata } from 'next'
import { AssemblyPoint } from '@/components/blog/posts/assembly-point'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'TODO: title'
const description = 'TODO: description'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/blog/assembly-point/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/assembly-point/',
      'en-US': 'https://mamaev.coach/en/blog/assembly-point/',
      'x-default': 'https://mamaev.coach/blog/assembly-point/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/blog/assembly-point/', type: 'article', locale: 'ru_RU' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function AssemblyPointPage() {
  return (
    <PostLayout post={getPost('assembly-point')!} locale="ru">
      <AssemblyPoint locale="ru" />
    </PostLayout>
  )
}
