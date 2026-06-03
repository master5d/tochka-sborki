import { describe, it, expect } from 'vitest'
import { fullArticlePrompt, fragmentPrompt, agentUrl, MAX_SELECTION } from './ai-prompt'

describe('ai-prompt', () => {
  it('full-article prompt carries url + title', () => {
    const p = fullArticlePrompt('https://mamaev.coach/blog/x/', 'Заголовок')
    expect(p).toContain('https://mamaev.coach/blog/x/')
    expect(p).toContain('«Заголовок»')
  })

  it('fragment prompt collapses whitespace and attaches the context link', () => {
    const p = fragmentPrompt('https://mamaev.coach/blog/x/', '  две   строки\n\nтекста  ')
    expect(p).toContain('«две строки текста»')
    expect(p).toContain('https://mamaev.coach/blog/x/')
    expect(p).not.toContain('(фрагмент)')
  })

  it('fragment prompt caps long selections and marks them', () => {
    const long = 'а'.repeat(MAX_SELECTION + 200)
    const p = fragmentPrompt('https://mamaev.coach/blog/x/', long)
    expect(p).toContain('(фрагмент)')
    expect(p).toContain('…')
    // capped body never exceeds the limit (+ ellipsis)
    const body = p.split('«')[1].split('»')[0]
    expect(body.length).toBeLessThanOrEqual(MAX_SELECTION + 1)
  })

  it('agentUrl encodes the prompt per agent', () => {
    expect(agentUrl('chatgpt', 'a b')).toBe('https://chatgpt.com/?q=a%20b')
    expect(agentUrl('claude', 'a b')).toBe('https://claude.ai/new?q=a%20b')
  })
})
