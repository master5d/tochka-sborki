import { LessonPage } from '../../../../components/lesson-page'
import { LESSONS, getLesson } from '../../../../lib/course/living-practice'

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = getLesson(slug, 'en')
  return t ? { title: t.metaTitle, description: t.metaDescription } : {}
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LessonPage locale="en" slug={slug} />
}
