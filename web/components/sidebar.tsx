'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { NavigationItem } from '@/lib/content'
import { useProgress } from './progress-provider'
import { useUnitProgress } from '@/lib/unit-progress'

interface SidebarProps {
  navItems: NavigationItem[]
  currentSlug?: string
  currentUnit?: string
}

function LessonIcon({ state }: { state: 'completed' | 'viewed' | 'none' }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)' }}>●</span>
  if (state === 'viewed') return <span style={{ color: 'var(--text-secondary)', opacity: 0.6 }}>◐</span>
  return <span style={{ color: 'var(--border-color)' }}>○</span>
}

function UnitIcon({ state }: { state: 'completed' | 'current' | 'none' }) {
  if (state === 'completed') return <span style={{ color: 'var(--text-accent)', fontSize: '0.7rem' }}>✓</span>
  if (state === 'current') return <span style={{ color: 'var(--text-primary)', fontSize: '0.7rem' }}>→</span>
  return <span style={{ color: 'var(--border-color)', fontSize: '0.7rem' }}>○</span>
}

export function Sidebar({ navItems, currentSlug, currentUnit }: SidebarProps) {
  const { getState } = useProgress()
  const { isCompleted: isUnitCompleted, ready } = useUnitProgress()
  const [, forceRender] = useState(0)

  useEffect(() => {
    if (ready) forceRender(n => n + 1)
  }, [ready])

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

      {navItems.map(item => {
        const isActiveMeeting = item.slug === currentSlug
        const isActiveLesson = item.type === 'lesson' && item.slug === currentSlug

        if (item.type === 'lesson') {
          const state = getState(item.slug)
          return (
            <Link key={item.slug} href={`/lessons/${item.slug}/`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: isActiveLesson ? 'var(--text-accent)' : 'var(--text-secondary)',
              background: isActiveLesson ? 'var(--border-accent)' : 'transparent',
              borderLeft: isActiveLesson ? '2px solid var(--text-accent)' : '2px solid transparent',
            }}>
              <LessonIcon state={state} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                L{item.level}
              </span>
              <span style={{ flex: 1 }}>{item.title}</span>
            </Link>
          )
        }

        // type === 'meeting'
        return (
          <div key={item.slug}>
            <Link href={`/lessons/${item.slug}/`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: isActiveMeeting ? 'var(--text-accent)' : 'var(--text-secondary)',
              background: isActiveMeeting ? 'var(--border-accent)' : 'transparent',
              borderLeft: isActiveMeeting ? '2px solid var(--text-accent)' : '2px solid transparent',
            }}>
              <span style={{ color: 'var(--border-color)', fontSize: '0.8rem' }}>⬡</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                M{item.level}
              </span>
              <span style={{ flex: 1 }}>{item.title}</span>
            </Link>

            {/* Unit sub-items — visible when this meeting is active */}
            {isActiveMeeting && item.units && (
              <div style={{ paddingLeft: '1rem', borderLeft: '1px solid var(--border-color)', marginLeft: '1rem' }}>
                {item.units.map(unit => {
                  const isCurrent = unit.slug === currentUnit
                  const completed = ready && isUnitCompleted(item.slug, unit.slug)
                  const unitState = completed ? 'completed' : isCurrent ? 'current' : 'none'

                  return (
                    <Link key={unit.slug} href={`/lessons/${item.slug}/${unit.slug}/`} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.8rem',
                      color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                      background: isCurrent ? 'var(--bg-surface)' : 'transparent',
                      borderRadius: '4px',
                      margin: '1px 4px',
                    }}>
                      <UnitIcon state={unitState} />
                      <span style={{ flex: 1, fontSize: '0.75rem' }}>{unit.title}</span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </aside>
  )
}
