import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'
import { Nav } from './nav'
import { Sidebar } from './sidebar'
import { AssignmentBlock } from './assignment-block'

interface LessonLayoutProps {
  meta: LessonMeta
  lessons: LessonMeta[]
  children: React.ReactNode
}

export function LessonLayout({ meta, lessons, children }: LessonLayoutProps) {
  const idx = lessons.findIndex(l => l.slug === meta.slug)
  const prev = lessons[idx - 1]
  const next = lessons[idx + 1]

  return (
    <>
      <Nav />
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 3rem)' }}>
        <Sidebar lessons={lessons} currentSlug={meta.slug} />
        <main style={{ flex: 1, padding: '2rem 3rem', maxWidth: '860px' }}>
          <div style={{
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            color: 'var(--text-accent)',
          }}>
            Level {meta.level} · {meta.duration}
          </div>
          {children}
          {meta.assignment && <AssignmentBlock text={meta.assignment} />}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '3rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-color)',
          }}>
            {prev
              ? <Link href={`/lessons/${prev.slug}/`} style={{ fontSize: '0.875rem' }}>← {prev.title}</Link>
              : <span />}
            {next
              ? <Link href={`/lessons/${next.slug}/`} style={{ fontSize: '0.875rem' }}>{next.title} →</Link>
              : <span />}
          </div>
        </main>
      </div>
    </>
  )
}
