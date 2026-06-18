import { describe, it, expect } from 'vitest'
import { buildGraph } from './graph'
import type { Post } from './posts'

const p = (slug: string, related: string[], tags: string[] = ['AI']): Post => ({
  slug, title: slug, description: '', date: '2026-01-01', author: 'x', readingTime: '1', tags, related,
})

describe('buildGraph', () => {
  it('makes one node per post with a primary tag', () => {
    const g = buildGraph([p('a', [], ['X']), p('b', [], ['Y'])])
    expect(g.nodes.map(n => n.slug).sort()).toEqual(['a', 'b'])
    expect(g.nodes.find(n => n.slug === 'a')?.tag).toBe('X')
  })

  it('dedupes a bidirectional related link into a single undirected edge', () => {
    const g = buildGraph([p('a', ['b']), p('b', ['a'])])
    expect(g.edges).toHaveLength(1)
    const e = g.edges[0]
    expect([e.a, e.b].sort()).toEqual(['a', 'b'])
  })

  it('drops self-links and edges to non-existent posts', () => {
    const g = buildGraph([p('a', ['a', 'ghost', 'b']), p('b', [])])
    expect(g.edges).toHaveLength(1)
    expect([g.edges[0].a, g.edges[0].b].sort()).toEqual(['a', 'b'])
  })

  it('returns empty edges when there are no related links', () => {
    expect(buildGraph([p('a', []), p('b', [])]).edges).toEqual([])
  })
})
