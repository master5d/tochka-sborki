'use client'
import { useState } from 'react'
import { fullArticlePrompt, agentUrl } from '@/lib/ai-prompt'

/** Human-facing twin of llms.txt: hand the post to the reader's own agent in one click. */
export function ReadWithAI({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)

  const prompt = fullArticlePrompt(url, title)

  const track = (agent: 'copy' | 'chatgpt' | 'claude') => {
    if (typeof window === 'undefined') return
    // @ts-expect-error analytics global is optional
    window.plausible?.('read_with_ai_clicked', { props: { agent, mode: 'full' } })
  }

  const copy = async () => {
    track('copy')
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the agent buttons still work */
    }
  }

  const label: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 'var(--section-label-size)',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    marginBottom: '0.4rem',
  }
  const btn: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.85rem',
    padding: '0.6rem 1rem',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    border: '1px solid var(--text-accent)',
    background: 'var(--text-accent)',
    color: 'var(--text-on-accent)',
    fontWeight: 700,
  }
  const ghost: React.CSSProperties = {
    ...btn,
    background: 'transparent',
    color: 'var(--text-accent)',
  }

  return (
    <section
      style={{
        marginTop: '3rem',
        padding: '1.5rem',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg-secondary)',
      }}
    >
      <div style={label}>Прочитать с ИИ</div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.55, margin: '0 0 1.1rem' }}>
        Один клик — и агент разбирает статью, вытаскивает принципы и помогает применить их к твоей задаче.
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={copy} style={ghost}>
          {copied ? 'Скопировано ✓' : 'Скопировать промпт'}
        </button>
        <a href={agentUrl('chatgpt', prompt)} target="_blank" rel="noopener" onClick={() => track('chatgpt')} style={btn}>
          ChatGPT →
        </a>
        <a href={agentUrl('claude', prompt)} target="_blank" rel="noopener" onClick={() => track('claude')} style={btn}>
          Claude →
        </a>
      </div>
    </section>
  )
}
