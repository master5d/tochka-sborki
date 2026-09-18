import { describe, expect, it } from 'vitest'
import { normalizePublishedMarkdown } from './published-markdown-post'

describe('normalizePublishedMarkdown', () => {
  it('removes a matching leading ATX heading and following blank lines', () => {
    const content = '## Одна дверь в машинный зал: как я перестал раздавать AI‑ключи\n\nВступление'
    expect(normalizePublishedMarkdown(content, 'Одна дверь в машинный зал: как я перестал раздавать AI-ключи'))
      .toBe('Вступление')
  })

  it('preserves a leading heading when it is not the registry title', () => {
    const content = '## Внутренний подзаголовок\n\nТекст'
    expect(normalizePublishedMarkdown(content, 'Название поста')).toBe(content)
  })

  it('does not treat a fenced code heading as the document heading', () => {
    const content = '```md\n## Название\n```\n\nТекст'
    expect(normalizePublishedMarkdown(content, 'Название')).toBe(content)
  })

  it('accepts leading blank lines and closing ATX markers', () => {
    const content = '\n\n# Название ##\n\nТекст'
    expect(normalizePublishedMarkdown(content, 'Название')).toBe('Текст')
  })
})
