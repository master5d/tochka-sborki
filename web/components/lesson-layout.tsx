'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { LessonMeta } from '@/lib/content'
import { Nav } from './nav'
import { Sidebar } from './sidebar'
import { AssignmentBlock } from './assignment-block'
import { useProgress } from './progress-provider'
import { AuthGuard } from './auth-guard'

interface LessonLayoutProps {
  meta: LessonMeta
  lessons: LessonMeta[]
  children: React.ReactNode
}

export function LessonLayout({ meta, lessons, children }: LessonLayoutProps) {
  const idx = lessons.findIndex(l => l.slug === meta.slug)
  const prev = lessons[idx - 1]
  const next = lessons[idx + 1]
  const { getState, markViewed, markCompleted } = useProgress()
  const state = getState(meta.slug)
  const [completing, setCompleting] = useState(false)

  useEffect(() => {
    markViewed(meta.slug)
  }, [meta.slug, markViewed])

  async function handleComplete() {
    setCompleting(true)
    await markCompleted(meta.slug)
    setCompleting(false)
  }

  return (
    <AuthGuard>
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

          {/* Complete button */}
          <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            {state === 'completed' ? (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--text-accent)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
              }}>
                ● Урок завершён
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={completing}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  cursor: completing ? 'wait' : 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                {completing ? '...' : '○ Отметить как пройденный'}
              </button>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '1.5rem',
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
    </AuthGuard>
  )
}
