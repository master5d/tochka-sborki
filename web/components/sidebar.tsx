'use client'

import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'
import { useProgress, type ProgressState } from './progress-provider'

interface SidebarProps {
  lessons: LessonMeta[]
  currentSlug?: string
}

function ProgressIcon({ state }: { state: ProgressState }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)' }}>●</span>
  if (state === 'viewed') return <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>◐</span>
  return <span style={{ color: 'var(--border-color)' }}>○</span>
}

export function Sidebar({ lessons, currentSlug }: SidebarProps) {
  const { getState } = useProgress()

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      borderRight: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
        <span style={{
          fontSize: '0.7rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Уроки курса
        </span>
      </div>
      {lessons.map(lesson => {
        const active = lesson.slug === currentSlug
        const state = getState(lesson.slug)
        return (
          <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
            background: active ? 'var(--border-accent)' : 'transparent',
            borderLeft: active ? '2px solid var(--text-accent)' : '2px solid transparent',
          }}>
            <ProgressIcon state={state} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              L{lesson.level}
            </span>
            <span style={{ flex: 1 }}>{lesson.title}</span>
          </Link>
        )
      })}
    </aside>
  )
}
