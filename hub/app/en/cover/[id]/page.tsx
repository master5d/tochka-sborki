import type { Metadata } from 'next'
import { CoverHome } from '../../../../components/cover-home'
import { quest } from '../../../../lib/quest/content'
import { trendCovers } from '../../../../lib/covers'

// Hidden home of a trend cover (EN): never linked, noindex. See app/cover/[id]/page.tsx.
export const dynamicParams = false

export function generateStaticParams() {
  return trendCovers().map((c) => ({ id: c.id }))
}

export const metadata: Metadata = {
  title: quest.en.seo.title,
  description: quest.en.seo.description,
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CoverHome id={id} locale="en" />
}
