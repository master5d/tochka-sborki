'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Nav } from '@/components/nav'

const cardStyle = (selected: boolean): React.CSSProperties => ({
  padding: '1.5rem',
  border: selected ? '2px solid var(--text-accent)' : '1px solid var(--border-color)',
  borderRadius: 'var(--radius)',
  cursor: 'pointer',
  textAlign: 'center',
  background: selected ? 'color-mix(in srgb, var(--text-accent) 8%, var(--bg-primary))' : 'var(--bg-surface)',
  transition: 'border-color 0.15s, background 0.15s',
})

export default function OnboardingPage() {
  const router = useRouter()
  const [os, setOs] = useState<'mac' | 'windows' | null>(null)

  useEffect(() => {
    if (localStorage.getItem('os')) {
      router.replace('/lessons/00-kickstart/')
    }
  }, [router])

  function handleSelect(value: 'mac' | 'windows') {
    setOs(value)
  }

  function handleStart() {
    if (!os) return
    localStorage.setItem('os', os)
    router.replace('/lessons/00-kickstart/')
  }

  return (
    <>
      <Nav />
      <main style={{ maxWidth: '480px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-accent)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: '1rem',
        }}>
          ⬡ Шаг 1 из 1
        </div>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          color: 'var(--text-primary)',
          lineHeight: 0.95,
          marginBottom: '1rem',
        }}>
          На чём<br />работаешь?
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.875rem', marginBottom: '2rem' }}>
          Покажем правильные команды и настройки для твоей системы
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div style={cardStyle(os === 'mac')} onClick={() => handleSelect('mac')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍎</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>macOS</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Mac / MacBook</div>
          </div>
          <div style={cardStyle(os === 'windows')} onClick={() => handleSelect('windows')}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪟</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>Windows</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>WSL / PowerShell</div>
          </div>
        </div>

        <button
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
          Начать курс →
        </button>

        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
          Можно изменить позже в настройках
        </p>
      </main>
    </>
  )
}
