'use client'

import { useState } from 'react'
import { getDictionary, type Locale } from '@/lib/dictionaries'

const LIKERT = ['1', '2', '3', '4', '5']

interface FeedbackFormProps {
  locale?: Locale
  modules: string[]
}

function LikertScale({ name, label, value, onChange, disagree, agree }: {
  name: string; label: string; value: string; onChange: (v: string) => void
  disagree: string; agree: string
}) {
  return (
    <fieldset style={{ border: 'none', marginBottom: '2rem' }}>
      <legend style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.5 }}>
        {label}
      </legend>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '5rem' }}>{disagree}</span>
        {LIKERT.map(v => (
          <label key={v} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input
              type="radio" name={name} value={v} required
              checked={value === v}
              onChange={() => onChange(v)}
              style={{ accentColor: 'var(--text-accent)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{v}</span>
          </label>
        ))}
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '4rem' }}>{agree}</span>
      </div>
    </fieldset>
  )
}

export function FeedbackForm({ locale = 'ru', modules }: FeedbackFormProps) {
  const t = getDictionary(locale).feedback
  const [lesson, setLesson] = useState('')
  const [recommend, setRecommend] = useState('')
  const [impact, setImpact] = useState('')
  const [apply, setApply] = useState('')
  const [unclear, setUnclear] = useState('')
  const [other, setOther] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson, recommend, impact, apply, unclear, other, locale }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div style={{
        padding: '2rem',
        border: '1px solid var(--text-accent)',
        borderRadius: 'var(--radius)',
        color: 'var(--text-accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.875rem',
      }}>
        {t.successMessage}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {t.moduleLabel}
        </label>
        <select
          value={lesson}
          onChange={e => setLesson(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">{t.modulePlaceholder}</option>
          {modules.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <LikertScale
        name="recommend"
        label={t.recommendLabel}
        value={recommend}
        onChange={setRecommend}
        disagree={t.likertDisagree}
        agree={t.likertAgree}
      />
      <LikertScale
        name="impact"
        label={t.impactLabel}
        value={impact}
        onChange={setImpact}
        disagree={t.likertDisagree}
        agree={t.likertAgree}
      />
      <LikertScale
        name="apply"
        label={t.applyLabel}
        value={apply}
        onChange={setApply}
        disagree={t.likertDisagree}
        agree={t.likertAgree}
      />

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {t.unclearLabel}
        </label>
        <textarea
          value={unclear}
          onChange={e => setUnclear(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {t.otherLabel}
        </label>
        <textarea
          value={other}
          onChange={e => setOther(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.875rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.875rem' }}>
          {t.errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '0.875rem 2rem',
          background: 'var(--text-accent)',
          color: '#000',
          fontWeight: 900,
          fontFamily: 'var(--font-mono)',
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          borderRadius: 'var(--radius)',
          border: 'none',
          cursor: status === 'loading' ? 'wait' : 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        {status === 'loading' ? t.submitting : t.submit}
      </button>
    </form>
  )
}
