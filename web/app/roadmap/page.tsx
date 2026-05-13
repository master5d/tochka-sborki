import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getPageContent } from '@/lib/content'
import { Nav } from '@/components/nav'
import { mdxComponents } from '@/components/mdx-components'

export const metadata: Metadata = {
  title: 'Roadmap — Точка Сборки',
  description: 'Карта пути от нонкодера до AI-generalist\'а — 7 уровней',
}

export default async function RoadmapPage() {
  const { content } = getPageContent('roadmap')
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 3rem' }}>
        <MDXRemote source={content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
      </main>
    </>
  )
}
