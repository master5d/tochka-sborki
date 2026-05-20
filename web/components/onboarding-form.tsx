'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'
import { getDictionary, type Locale } from '@/lib/dictionaries'

const cardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '1.5rem',
  border: selected ? '2px solid var(--text-accent)' : '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  textAlign: 'center',
  background: selected ? 'color-mix(in srgb, var(--text-accent) 10%, var(--bg-surface))' : 'var(--bg-surface)',
  outline: selected ? '2px solid var(--text-accent)' : 'none',
  outlineOffset: '-2px',
  transition: 'border-color 0.15s, outline 0.15s',
  width: '100%',
  fontFamily: 'inherit',
})

interface Props { locale: Locale }

export function OnboardingForm({ locale }: Props) {
  const t = getDictionary(locale).onboarding
  const router = useRouter()
  const [os, setOs] = useState<'mac' | 'windows' | null>(null)
  const [checking, setChecking] = useState(true)
  const lessonsHome = locale === 'en' ? '/en/lessons/00-kickstart/' : '/lessons/00-kickstart/'

  useEffect(() => {
    try {
      if (localStorage.getItem('os')) {
        router.replace(lessonsHome)
        return
      }
    } catch {
      // localStorage unavailable — stay on page, let user proceed normally
    }
    setChecking(false)
  }, [router, lessonsHome])

  function handleStart() {
    if (!os) return
    try {
      localStorage.setItem('os', os)
    } catch {
      // localStorage unavailable — proceed anyway, OsBlock will show both variants
    }
    router.replace(lessonsHome)
  }

  if (checking) return null

  return (
    <>
      <Nav locale={locale} />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          {t.step}
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
          whiteSpace: 'pre-line',
        }}>
          {t.heading}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          {t.subtitle}
        </p>

        <div role="radiogroup" aria-label={t.radioLabel} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <button
            type="button"
            role="radio"
            aria-checked={os === 'mac'}
            onClick={() => setOs('mac')}
            style={cardStyle(os === 'mac')}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍎</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>macOS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Mac / MacBook</div>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={os === 'windows'}
            onClick={() => setOs('windows')}
            style={cardStyle(os === 'windows')}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪟</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Windows</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>WSL / PowerShell</div>
          </button>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!os}
          style={{
            width: '100%',
            padding: '0.875rem 2rem',
            background: os ? 'var(--text-accent)' : 'var(--bg-surface)',
            color: os ? '#000' : 'var(--text-secondary)',
            fontWeight: 900,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border-color)',
            cursor: os ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          {t.start}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          {t.changeLater}
        </p>
      </main>
    </>
  )
}
