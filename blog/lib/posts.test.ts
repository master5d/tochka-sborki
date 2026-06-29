import { describe, it, expect } from 'vitest'
import { getAllPosts, getGraphEntries, getPost, formatDate, postUrl, localizedPost, stripOrigin, langTag, posts, type Post, type Locale } from './posts'

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
    const out = getAllPosts('ru', [f('a', '2026-01-01'), f('b', '2026-03-01', true), f('c', '2026-02-01')])
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

  it('getAllPosts("en") returns only posts with an en block', () => {
    const f = (slug: string, date: string, en?: { title: string; description: string; readingTime: string }): Post => ({
      slug, title: slug.toUpperCase(), description: 'x', date,
      author: 'X', readingTime: '1', tags: [], related: [], en,
    })
    const set = [
      f('a', '2026-01-01', { title: 'A', description: 'da', readingTime: '~1 min' }),
      f('b', '2026-02-01'), // no en → hidden from EN
    ]
    expect(getAllPosts('en', set).map(p => p.slug)).toEqual(['a'])
    expect(getAllPosts('ru', set).map(p => p.slug)).toEqual(['b', 'a']) // ru shows all, newest-first
  })

  it('postUrl is locale-aware', () => {
    expect(postUrl('prologue')).toBe('https://mamaev.coach/blog/prologue/')
    expect(postUrl('prologue', 'ru')).toBe('https://mamaev.coach/blog/prologue/')
    expect(postUrl('prologue', 'en')).toBe('https://mamaev.coach/en/blog/prologue/')
  })

  it('formatDate renders English dates with locale "en"', () => {
    expect(formatDate('2026-06-02', 'en')).toBe('2 June 2026')
    expect(formatDate('2026-01-01', 'en')).toBe('1 January 2026')
    expect(formatDate('2026-05-30')).toBe('30 мая 2026') // ru default unchanged
  })

  it('localizedPost resolves ru canon and en mirror', () => {
    const p: Post = {
      slug: 's', title: 'РУ', description: 'ру-описание', date: '2026-06-02',
      author: 'X', readingTime: '~5 мин', tags: [], related: [],
      en: { title: 'EN', description: 'en-desc', readingTime: '~5 min' },
    }
    const ru = localizedPost(p, 'ru')
    expect([ru.title, ru.url, ru.langTag]).toEqual(['РУ', 'https://mamaev.coach/blog/s/', 'ru-RU'])
    const en = localizedPost(p, 'en')
    expect([en.title, en.description, en.readingTime, en.url, en.langTag])
      .toEqual(['EN', 'en-desc', '~5 min', 'https://mamaev.coach/en/blog/s/', 'en-US'])
  })

  it('localizedPost falls back to ru canon when en is absent', () => {
    const p: Post = {
      slug: 's', title: 'РУ', description: 'd', date: '2026-06-02',
      author: 'X', readingTime: '~5 мин', tags: [], related: [],
    }
    expect(localizedPost(p, 'en').title).toBe('РУ') // graceful: never throws on missing en
  })

  it('stripOrigin makes an absolute site URL root-relative', () => {
    expect(stripOrigin('https://mamaev.coach/en/blog/x/')).toBe('/en/blog/x/')
    expect(stripOrigin('https://mamaev.coach/blog/x/')).toBe('/blog/x/')
    expect(stripOrigin('/already/relative/')).toBe('/already/relative/') // leaves non-origin paths alone
  })

  it('langTag maps locale to a BCP-47 tag', () => {
    expect(langTag('en')).toBe('en-US')
    expect(langTag('ru')).toBe('ru-RU')
  })

  it('the nervous-strength post exists with required metadata', () => {
    const p = getPost('nervous-strength')!
    expect(p.title.length).toBeGreaterThan(0)
    expect(p.description.length).toBeGreaterThan(0)
    expect(p.author).toBe('Александр Мамаев')
    expect(Array.isArray(p.tags)).toBe(true)
    expect(Array.isArray(p.related)).toBe(true)
    expect(p.en).toBeTruthy()
    expect(p.en!.title.length).toBeGreaterThan(0)
  })

  it('getAllPosts excludes notes (essays only)', () => {
    const f = (slug: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay'), f('atom', 'note')]
    expect(getAllPosts('ru', set).map(p => p.slug)).toEqual(['essay'])
  })

  it('getGraphEntries includes both posts and notes (newest-first)', () => {
    const f = (slug: string, date: string, kind?: 'note' | 'post'): Post => ({
      slug, title: slug, description: 'x', date, author: 'X', readingTime: '1', tags: [], related: [], kind,
    })
    const set = [f('essay', '2026-01-01'), f('atom', '2026-02-01', 'note')]
    expect(getGraphEntries('ru', set).map(p => p.slug)).toEqual(['atom', 'essay'])
  })

  it('getGraphEntries drops drafts and respects the en locale', () => {
    const f = (slug: string, en?: { title: string; description: string; readingTime: string }, draft?: boolean): Post => ({
      slug, title: slug, description: 'x', date: '2026-01-01', author: 'X', readingTime: '1', tags: [], related: [], kind: 'note', en, draft,
    })
    const set = [f('a', { title: 'A', description: 'd', readingTime: '1' }), f('b'), f('c', undefined, true)]
    expect(getGraphEntries('en', set).map(p => p.slug)).toEqual(['a'])
  })
})

describe('showcase deep-dive contract', () => {
  const CONTRACT_SLUGS = ['echo', 'diagram-canvas']
  for (const slug of CONTRACT_SLUGS) {
    it(`${slug}: published bilingual post exists`, () => {
      const p = getPost(slug)
      expect(p, slug).toBeTruthy()
      expect(p!.draft, `${slug} must not be draft`).toBeFalsy()
      expect(p!.author).toBe('Александр Мамаев')
      expect(p!.en, `${slug} needs an en block`).toBeTruthy()
      expect(getAllPosts('ru').some(x => x.slug === slug), `${slug} in ru index`).toBe(true)
      expect(getAllPosts('en').some(x => x.slug === slug), `${slug} in en index`).toBe(true)
    })
  }
})
