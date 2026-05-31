'use client'
import { useEffect, useState } from 'react'
import { fullArticlePrompt, agentUrl } from '@/lib/ai-prompt'

const DISMISS_KEY = 'rwai_dock_dismissed'

/** Floating, dismissible «Прочитать с ИИ» pill — appears past 40% scroll. */
export function ReadWithAIDock({ url, title }: { url: string; title: string }) {
  const [dismissed, setDismissed] = useState(true) // hidden until we read storage
  const [shown, setShown] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === '1') return
    } catch {
      /* ignore */
    }
    setDismissed(false)
    const onScroll = () => {
      const h = document.documentElement
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1)
      setShown(pct > 0.4)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (dismissed || !shown) return null

  const prompt = fullArticlePrompt(url, title)
  const track = (agent: string) => {
    // @ts-expect-error analytics global is optional
    if (typeof window !== 'undefined') window.plausible?.('read_with_ai_clicked', { props: { agent, mode: 'dock' } })
  }
  const close = () => {
    setDismissed(true)
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* ignore */ }
  }

  const link: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700,
    padding: '0.4rem 0.7rem', borderRadius: 'var(--radius)', textDecoration: 'none',
    background: 'var(--text-accent)', color: 'var(--text-on-accent)',
  }

  return (
    <div style={{ position: 'fixed', right: '1.25rem', bottom: '1.25rem', zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
      {open && (
        <div style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem',
          background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
          <a href={agentUrl('chatgpt', prompt)} target="_blank" rel="noopener" onClick={() => track('chatgpt')} style={link}>ChatGPT</a>
          <a href={agentUrl('claude', prompt)} target="_blank" rel="noopener" onClick={() => track('claude')} style={link}>Claude</a>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: '1px',
        background: 'var(--border-color)', borderRadius: '22px', overflow: 'hidden',
        border: '1px solid var(--border-color)' }}>
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          style={{ border: 'none', cursor: 'pointer', padding: '0.55rem 0.95rem',
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 700 }}>
          ✨ Прочитать с ИИ
        </button>
        <button type="button" onClick={close} aria-label="Скрыть"
          style={{ border: 'none', cursor: 'pointer', padding: '0.55rem 0.7rem',
            background: 'var(--bg-surface)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          ×
        </button>
      </div>
    </div>
  )
}
