import type { Metadata } from 'next'
import { DesOpsHub } from '@/components/blog/posts/desops-hub'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Design without drawing: how to install "taste" into AI agents'
const description =
  'Design has always been the bottleneck for engineers. My report on turning design from "creative agony" into an executable engineering spec through the DesOps Hub.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  alternates: {
    canonical: 'https://mamaev.coach/en/blog/desops-hub/',
    languages: {
      'ru-RU': 'https://mamaev.coach/blog/desops-hub/',
      'en-US': 'https://mamaev.coach/en/blog/desops-hub/',
      'x-default': 'https://mamaev.coach/blog/desops-hub/',
    },
  },
  openGraph: { title, description, url: 'https://mamaev.coach/en/blog/desops-hub/', type: 'article', locale: 'en_US' },
  twitter: { card: 'summary_large_image', title, description },
}

export default function DesOpsHubPageEn() {
  return (
    <PostLayout post={getPost('desops-hub')!} locale="en">
      <DesOpsHub locale="en" />
    </PostLayout>
  )
}
