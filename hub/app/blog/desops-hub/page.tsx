import type { Metadata } from 'next'
import { DesOpsHub } from '@/components/blog/posts/desops-hub'
import { PostLayout } from '@/components/blog/post-layout'
import { getPost } from '@/lib/posts'

const title = 'Дизайн без рисования: Как инсталлировать «вкус» в AI-агентов'
const description =
  'Дизайн всегда был узким горлышком для инженеров. Мой отчет о том, как превратить дизайн из «творческой муки» в исполняемую инженерную спецификацию через DesOps Hub.'

export const metadata: Metadata = {
  metadataBase: new URL('https://mamaev.coach'),
  title,
  description,
  openGraph: {
    title,
    description,
    url: 'https://mamaev.coach/blog/desops-hub/',
    type: 'article',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
}

export default function DesOpsHubPage() {
  return (
    <PostLayout post={getPost('desops-hub')!}>
      <DesOpsHub locale="ru" />
    </PostLayout>
  )
}
