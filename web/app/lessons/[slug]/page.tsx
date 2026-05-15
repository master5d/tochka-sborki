import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllLessons,
  getAllMeetings,
  getNavigationItems,
  getLessonBySlug,
  getMeetingMeta,
  isMeeting,
} from '@/lib/content'
import { LessonLayout } from '@/components/lesson-layout'
import { MeetingRedirect } from '@/components/meeting-redirect'
import { Nav } from '@/components/nav'
import { Sidebar } from '@/components/sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const lessons = getAllLessons()
  const meetings = getAllMeetings()
  return [
    ...lessons.map(l => ({ slug: l.slug })),
    ...meetings.map(m => ({ slug: m.slug })),
  ]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (isMeeting(slug)) {
    const meta = getMeetingMeta(slug)
    return { title: `${meta.title} — Точка Сборки`, description: meta.description }
  }
  const { meta } = getLessonBySlug(slug)
  return { title: `${meta.title} — Точка Сборки`, description: meta.description }
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params
  const navItems = getNavigationItems()

  if (isMeeting(slug)) {
    const meetingMeta = getMeetingMeta(slug)
    return (
      <AuthGuard>
        <Nav />
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
          <Sidebar navItems={navItems} currentSlug={slug} />
          <main style={{ flex: 1, padding: '2rem 3rem' }}>
            <MeetingRedirect meetingSlug={slug} units={meetingMeta.units} />
          </main>
        </div>
      </AuthGuard>
    )
  }

  const { meta, content } = getLessonBySlug(slug)

  return (
    <LessonLayout meta={meta} navItems={navItems}>
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </LessonLayout>
  )
}
