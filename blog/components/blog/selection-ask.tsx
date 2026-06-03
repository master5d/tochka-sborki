'use client'
import { useEffect, useState } from 'react'
import { fragmentPrompt, agentUrl } from '@/lib/ai-prompt'

type Sel = { text: string; x: number; y: number }

/** On a meaningful text selection, float a «Разобрать с ИИ» affordance for that fragment. */
export function SelectionAsk({ url }: { url: string }) {
  const [sel, setSel] = useState<Sel | null>(null)

  useEffect(() => {
    const capture = () => {
      const s = window.getSelection()
      const text = s?.toString() ?? ''
      if (!s || s.isCollapsed || text.trim().length < 15) return
      const rect = s.getRangeAt(0).getBoundingClientRect()
      if (!rect.width && !rect.height) return
      setSel({ text, x: Math.min(rect.left + rect.width / 2, window.innerWidth - 140), y: Math.max(rect.top - 8, 48) })
    }
    const clearIfCollapsed = () => {
      const s = window.getSelection()
      if (!s || s.isCollapsed || (s.toString().trim().length < 15)) setSel(null)
    }
    document.addEventListener('mouseup', capture)
    document.addEventListener('selectionchange', clearIfCollapsed)
    return () => {
      document.removeEventListener('mouseup', capture)
      document.removeEventListener('selectionchange', clearIfCollapsed)
    }
  }, [])

  if (!sel) return null

  const prompt = fragmentPrompt(url, sel.text)
  const track = (agent: string) => {
    // @ts-expect-error analytics global is optional
    if (typeof window !== 'undefined') window.plausible?.('read_with_ai_clicked', { props: { agent, mode: 'fragment' } })
  }
  const item: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: 700,
    padding: '0.35rem 0.6rem', textDecoration: 'none', color: 'var(--text-on-accent)',
    background: 'var(--text-accent)',
  }

  return (
    <div
      role="toolbar"
      aria-label="Разобрать выделенное с ИИ"
      onMouseDown={e => e.preventDefault() /* keep the selection alive on click */}
      style={{
        position: 'fixed', left: sel.x, top: sel.y, transform: 'translate(-50%, -100%)',
        zIndex: 60, display: 'flex', gap: '1px', background: 'var(--border-color)',
        border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    >
      <a href={agentUrl('chatgpt', prompt)} target="_blank" rel="noopener" onClick={() => track('chatgpt')} style={item}>Разобрать · ChatGPT</a>
      <a href={agentUrl('claude', prompt)} target="_blank" rel="noopener" onClick={() => track('claude')} style={item}>Claude</a>
    </div>
  )
}
