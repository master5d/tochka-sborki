'use client'
import { useState } from 'react'
import type { Locale } from '@/lib/intake/types'

export function CharterReveal({ charter, locale, onContinue }: { charter: string; locale: Locale; onContinue: () => void }) {
  const [copied, setCopied] = useState(false)
  const t = locale === 'en'
    ? { title: 'Your companion charter', body: 'This is the charter your co-thinking partner runs on. Copy it into any agent — or just continue.', copy: 'Copy charter', copied: 'Copied ✓', go: 'Meet your character →' }
    : { title: 'Устав твоего напарника', body: 'Это устав, на котором работает твой со-мыслящий напарник. Скопируй его в любого агента — или просто продолжи.', copy: 'Скопировать устав', copied: 'Скопировано ✓', go: 'К твоему персонажу →' }
  return (
    <main style={{ maxWidth: 620, margin: '0 auto', padding: '2.5rem 1.25rem 4rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '.6rem' }}>{t.title}</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.2rem', lineHeight: 1.5 }}>{t.body}</p>
      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '1rem', overflowX: 'auto', fontSize: '.82rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{charter}</pre>
      <div style={{ display: 'flex', gap: 12, marginTop: '1.4rem', flexWrap: 'wrap' }}>
        <button className="intake-nav-btn" onClick={async () => { try { await navigator.clipboard.writeText(charter); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }}>{copied ? t.copied : t.copy}</button>
        <button className="intake-nav-btn primary" onClick={onContinue}>{t.go}</button>
      </div>
    </main>
  )
}
