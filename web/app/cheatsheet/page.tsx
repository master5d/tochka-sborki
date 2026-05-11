import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { getPageContent } from '@/lib/content'
import { Nav } from '@/components/nav'
import { mdxComponents } from '@/components/mdx-components'

export const metadata: Metadata = {
  title: 'Шпаргалка — Точка Сборки',
  description: 'Быстрая справка по командам и паттернам Claude Code',
}

export default async function CheatsheetPage() {
  const { content } = getPageContent('cheatsheet')
  return (
    <>
      <Nav />
      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 3rem' }}>
        <MDXRemote source={content} components={mdxComponents} />
      </main>
    </>
  )
}
