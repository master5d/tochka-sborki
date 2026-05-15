import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import {
  getNavigationItems,
  getLessonBySlug,
  getModuleMeta,
  isModule,
} from '@/lib/content'
import { LessonLayout } from '@/components/lesson-layout'
import { ModuleRedirect } from '@/components/module-redirect'
import { Nav } from '@/components/nav'
import { Sidebar } from '@/components/sidebar'
import { AuthGuard } from '@/components/auth-guard'
import { mdxComponents } from '@/components/mdx-components'
import type { Locale } from '@/lib/dictionaries'

interface Props { slug: string; locale: Locale }

export function ModulePage({ slug, locale }: Props) {
  const navItems = getNavigationItems(locale)

  if (isModule(slug, locale)) {
    const moduleMeta = getModuleMeta(slug, locale)
    return (
      <AuthGuard>
        <Nav locale={locale} />
        <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
          <Sidebar navItems={navItems} currentSlug={slug} locale={locale} />
          <main style={{ flex: 1, padding: '2rem 3rem' }}>
            <ModuleRedirect moduleSlug={slug} units={moduleMeta.units} locale={locale} />
          </main>
        </div>
      </AuthGuard>
    )
  }

  const { meta, content } = getLessonBySlug(slug, locale)

  return (
    <LessonLayout meta={meta} navItems={navItems} locale={locale}>
      <MDXRemote
        source={content}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </LessonLayout>
  )
}
