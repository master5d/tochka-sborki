import { describe, it, expect } from 'vitest'
import { postUrl, manifestPostsFrom, type ManifestPost } from './site'

const fixture: ManifestPost[] = [
  { slug: 'a', date: '2026-01-01', updated: null, title: 'A', description: 'da', en: { title: 'A-en', description: 'da-en' } },
  { slug: 'b', date: '2026-02-01', updated: '2026-03-01', title: 'B', description: 'db', en: null },
]

describe('postUrl', () => {
  it('builds ru + en URLs with trailing slash', () => {
    expect(postUrl('a', 'ru')).toBe('https://mamaev.coach/blog/a/')
    expect(postUrl('a', 'en')).toBe('https://mamaev.coach/en/blog/a/')
    expect(postUrl('a')).toBe('https://mamaev.coach/blog/a/')
  })
})

describe('manifestPostsFrom', () => {
  it('ru: all posts, newest-first', () => {
    expect(manifestPostsFrom(fixture, 'ru').map(p => p.slug)).toEqual(['b', 'a'])
  })
  it('en: only posts with an en block', () => {
    expect(manifestPostsFrom(fixture, 'en').map(p => p.slug)).toEqual(['a'])
  })
})
