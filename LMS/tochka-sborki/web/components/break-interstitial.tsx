'use client'

import type { ResolvedBreak } from '@/lib/breaks/types'

interface Props {
  activity: ResolvedBreak | null
  onContinue: () => void
}

// Thin presentational overlay. Renders null when there is no activity (belt-and-suspenders
// with the shouldBreak decider). Always dismissible: clicking the backdrop or the button
// calls onContinue. No business logic, no data imports beyond the resolved view type.
export function BreakInterstitial({ activity, onContinue }: Props) {
  if (!activity) return null
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activity.title}
      onClick={onContinue}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)', padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: 420, width: '100%',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 12, padding: '1.75rem', textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.7rem', letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'var(--text-accent)', marginBottom: '0.6rem',
        }}>
          {/* eyebrow is intentionally tiny and content-free until real breaks land */}
          ⏸
        </div>
        <h2 style={{ fontSize: '1.25rem', margin: '0 0 0.75rem', color: 'var(--text-primary)' }}>
          {activity.title}
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.5rem' }}>
          {activity.prompt}
        </p>
        <button
          type="button"
          onClick={onContinue}
          style={{
            background: 'var(--text-accent)', color: 'var(--bg-primary)',
            border: 'none', borderRadius: 8, padding: '0.6rem 1.4rem',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          {activity.cta}
        </button>
      </div>
    </div>
  )
}
