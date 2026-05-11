import Link from 'next/link'
import type { LessonMeta } from '@/lib/content'

interface SidebarProps {
  lessons: LessonMeta[]
  currentSlug?: string
}

export function Sidebar({ lessons, currentSlug }: SidebarProps) {
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
        return (
          <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
            display: 'block',
            padding: '0.5rem 1rem',
            fontSize: '0.875rem',
            color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
            background: active ? 'var(--border-accent)' : 'transparent',
            borderLeft: active ? '2px solid var(--text-accent)' : '2px solid transparent',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', marginRight: '0.5rem', fontSize: '0.75rem' }}>
              L{lesson.level}
            </span>
            {lesson.title}
          </Link>
        )
      })}
    </aside>
  )
}
