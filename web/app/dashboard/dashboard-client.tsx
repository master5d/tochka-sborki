'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { useProgress } from '@/components/progress-provider'
import type { LessonMeta } from '@/lib/content'

interface UserInfo {
  id: string
  email: string
}

interface DashboardClientProps {
  lessons: LessonMeta[]
}

export function DashboardClient({ lessons }: DashboardClientProps) {
  const router = useRouter()
  const { getState } = useProgress()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.ok ? r.json() as Promise<UserInfo> : null)
      .then(u => {
        if (!u) { router.push('/login'); return }
        setUser(u)
        setLoading(false)
      })
      .catch(() => { router.push('/login') })
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/')
  }

  const completed = lessons.filter(l => getState(l.slug) === 'completed').length
  const viewed = lessons.filter(l => getState(l.slug) !== 'none').length

  if (loading) return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>Загрузка...</p>
      </main>
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Дашборд
        </div>
        <h1 style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '0.5rem',
        }}>
          Привет
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontFamily: 'var(--font-mono)', fontSize: '0.875rem' }}>
          {user?.email}
        </p>

        <div style={{
          display: 'flex',
          gap: '2rem',
          marginBottom: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-accent)' }}>{completed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>завершено</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{viewed}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>просмотрено</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--border-color)' }}>{lessons.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>всего уроков</div>
          </div>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          {lessons.map(lesson => {
            const state = getState(lesson.slug)
            return (
              <Link key={lesson.slug} href={`/lessons/${lesson.slug}/`} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 0',
                borderBottom: '1px solid var(--border-color)',
                color: 'inherit',
              }}>
                <span style={{ color: state === 'completed' ? 'var(--text-accent)' : state === 'viewed' ? 'var(--text-secondary)' : 'var(--border-color)' }}>
                  {state === 'completed' ? '●' : state === 'viewed' ? '◐' : '○'}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>L{lesson.level}</span>
                <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{lesson.title}</span>
              </Link>
            )
          })}
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          Выйти
        </button>
      </main>
    </>
  )
}
