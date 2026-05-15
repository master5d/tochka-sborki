import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getAllModules,
  getModuleMeta,
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
  const modules = getAllModules()
  return modules.flatMap(m =>
    m.units.map(u => ({ slug: m.slug, unit: u.slug }))
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, unit } = await params
  const { unitMeta } = getUnitContent(slug, unit)
  const moduleMeta = getModuleMeta(slug)
  return {
    title: `${unitMeta.title} — ${moduleMeta.title} — Точка Сборки`,
    description: moduleMeta.description,
  }
}

export default async function UnitPage({ params }: Props) {
  const { slug: moduleSlug, unit: unitSlug } = await params
  const moduleMeta = getModuleMeta(moduleSlug)
  const { content } = getUnitContent(moduleSlug, unitSlug)
  const navItems = getNavigationItems()

  const unitIndex = moduleMeta.units.findIndex(u => u.slug === unitSlug)
  const nextUnit = moduleMeta.units[unitIndex + 1] ?? null

  return (
    <AuthGuard>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar navItems={navItems} currentSlug={moduleSlug} currentUnit={unitSlug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <UnitWizard
            moduleSlug={moduleSlug}
            unitSlug={unitSlug}
            nextUnitSlug={nextUnit?.slug ?? null}
            moduleTitle={moduleMeta.title}
            unitIndex={unitIndex}
            totalUnits={moduleMeta.units.length}
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
