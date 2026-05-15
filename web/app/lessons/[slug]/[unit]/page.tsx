import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllMeetings,
  getMeetingMeta,
  getUnitContent,
  getNavigationItems,
} from '@/lib/content'
import { Nav } from '@/components/nav'
import { Sidebar } from '@/components/sidebar'
import { UnitWizard } from '@/components/unit-wizard'
import { AuthGuard } from '@/components/auth-guard'
import { mdxComponents } from '@/components/mdx-components'

interface Props {
  params: Promise<{ slug: string; unit: string }>
}

export async function generateStaticParams() {
  const meetings = getAllMeetings()
  return meetings.flatMap(m =>
    m.units.map(u => ({ slug: m.slug, unit: u.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, unit } = await params
  const { unitMeta } = getUnitContent(slug, unit)
  const meetingMeta = getMeetingMeta(slug)
  return {
    title: `${unitMeta.title} — ${meetingMeta.title} — Точка Сборки`,
    description: meetingMeta.description,
  }
}

export default async function UnitPage({ params }: Props) {
  const { slug: meetingSlug, unit: unitSlug } = await params
  const meetingMeta = getMeetingMeta(meetingSlug)
  const { content } = getUnitContent(meetingSlug, unitSlug)
  const navItems = getNavigationItems()

  const unitIndex = meetingMeta.units.findIndex(u => u.slug === unitSlug)
  const nextUnit = meetingMeta.units[unitIndex + 1] ?? null

  return (
    <AuthGuard>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar navItems={navItems} currentSlug={meetingSlug} currentUnit={unitSlug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <UnitWizard
            meetingSlug={meetingSlug}
            unitSlug={unitSlug}
            nextUnitSlug={nextUnit?.slug ?? null}
            meetingTitle={meetingMeta.title}
            unitIndex={unitIndex}
            totalUnits={meetingMeta.units.length}
          >
            <MDXRemote
              source={content}
              components={mdxComponents}
              options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
            />
          </UnitWizard>
        </main>
      </div>
    </AuthGuard>
  )
}
