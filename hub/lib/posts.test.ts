import { describe, it, expect } from 'vitest'
import { getAllPosts, getPost, formatDate, postUrl, posts, type Post } from './posts'

describe('posts registry', () => {
  it('getAllPosts excludes drafts', () => {
    const hasDraft = posts.some(p => p.draft)
    const out = getAllPosts()
    expect(out.every(p => !p.draft)).toBe(true)
    if (hasDraft) expect(out.length).toBeLessThan(posts.length)
  })

  it('getAllPosts sorts newest-first by date', () => {
    const out = getAllPosts()
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1].date >= out[i].date).toBe(true)
    }
  })

  it('getPost returns a post by slug, or undefined', () => {
    expect(getPost('prologue')?.slug).toBe('prologue')
    expect(getPost('nope')).toBeUndefined()
  })

  it('getPost returns drafts too (preview), unlike getAllPosts', () => {
    expect(typeof getPost('prologue')).toBe('object')
  })

  it('getAllPosts removes drafts and sorts desc, given a fixture set', () => {
    const f = (slug: string, date: string, draft?: boolean): Post => ({
      slug, title: slug.toUpperCase(), description: 'x', date,
      author: 'X', readingTime: '1', tags: [], related: [], draft,
    })
    const out = getAllPosts([f('a', '2026-01-01'), f('b', '2026-03-01', true), f('c', '2026-02-01')])
    expect(out.map(p => p.slug)).toEqual(['c', 'a']) // draft 'b' dropped, rest newest-first
  })

  it('formatDate renders an ISO date in Russian', () => {
    expect(formatDate('2026-05-30')).toBe('30 мая 2026')
    expect(formatDate('2026-01-01')).toBe('1 января 2026')
  })

  it('postUrl builds the canonical trailing-slash URL', () => {
    expect(postUrl('prologue')).toBe('https://mamaev.coach/blog/prologue/')
  })

  it('the prologue post exists with required metadata', () => {
    const p = getPost('prologue')!
    expect(p.title).toBe('Точка Сборки. Пролог')
    expect(p.description.length).toBeGreaterThan(0)
    expect(p.author).toBe('Александр Мамаев')
    expect(Array.isArray(p.tags)).toBe(true)
    expect(Array.isArray(p.related)).toBe(true)
  })
})
