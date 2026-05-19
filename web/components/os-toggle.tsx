'use client'
import { useState, useEffect } from 'react'

type Os = 'mac' | 'windows'

const LABELS: Record<Os, { glyph: string; name: string }> = {
  mac: { glyph: '🍎', name: 'macOS' },
  windows: { glyph: '🪟', name: 'Windows' },
}

export function OsToggle({ label = 'Команды для:' }: { label?: string }) {
  const [os, setOs] = useState<Os | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stored: string | null = null
    try { stored = localStorage.getItem('os') } catch { /* ignore */ }
    if (stored === 'mac' || stored === 'windows') setOs(stored)
    setReady(true)
  }, [])

  function pick(next: Os) {
    try { localStorage.setItem('os', next) } catch { /* ignore */ }
    setOs(next)
    window.location.reload()
  }

  if (!ready) return null

  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        margin: '1rem 0 2rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        flexWrap: 'wrap',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        {label}
      </span>
      {(Object.keys(LABELS) as Os[]).map(key => {
        const active = os === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => pick(key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.35rem 0.85rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              background: active ? 'var(--text-accent)' : 'transparent',
              color: active ? '#000' : 'var(--text-secondary)',
              border: '1px solid ' + (active ? 'var(--text-accent)' : 'var(--border-color)'),
              borderRadius: '3px',
              fontWeight: active ? 700 : 500,
            }}
          >
            <span aria-hidden="true">{LABELS[key].glyph}</span>
            {LABELS[key].name}
          </button>
        )
      })}
      {os === null && (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.7rem',
          color: 'var(--text-secondary)',
          opacity: 0.7,
        }}>
          (показаны оба варианта)
        </span>
      )}
    </div>
  )
}
