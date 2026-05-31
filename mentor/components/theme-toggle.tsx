'use client'
import { useEffect, useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import type { ThemePref } from '@/lib/theme-pref'

const SEGMENTS: { key: ThemePref; glyph: string; label: string }[] = [
  { key: 'light', glyph: '☀️', label: 'Светлая тема' },
  { key: 'dark', glyph: '🌙', label: 'Тёмная тема' },
  { key: 'system', glyph: '🖥️', label: 'Системная тема' },
]

export function ThemeToggle() {
  const { pref, setPref } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Render only after mount: pref is corrected from storage in an effect, so the
  // active segment would otherwise mismatch the server-rendered default.
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div
      role="radiogroup"
      aria-label="Тема оформления"
      style={{
        display: 'flex',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
      }}
    >
      {SEGMENTS.map(seg => {
        const active = pref === seg.key
        return (
          <button
            key={seg.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={seg.label}
            title={seg.label}
            onClick={() => setPref(seg.key)}
            style={{
              padding: '3px 8px',
              cursor: 'pointer',
              border: 'none',
              background: active ? 'var(--text-accent)' : 'transparent',
              color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              fontWeight: active ? 700 : 400,
            }}
          >
            <span aria-hidden="true">{seg.glyph}</span>
          </button>
        )
      })}
    </div>
  )
}
