import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { getAllLessons, getLessonBySlug } from '@/lib/content'
import { LessonLayout } from '@/components/lesson-layout'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllLessons().map(l => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { meta } = getLessonBySlug(slug)
  return { title: `${meta.title} — Точка Сборки`, description: meta.description }
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params
  const { meta, content } = getLessonBySlug(slug)
  const lessons = getAllLessons()

  return (
    <LessonLayout meta={meta} lessons={lessons}>
      <MDXRemote source={content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
    </LessonLayout>
  )
}
