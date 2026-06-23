import { describe, it, expect } from 'vitest'
import { getShowcase, videoEmbedUrl, resolveVideoSource, withAutoplay } from './showcase'

describe('getShowcase', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`label/cta + >=4 dream cases with content (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.cta.length).toBeGreaterThan(0)
      expect(s.dream.heading.length).toBeGreaterThan(0)
      expect(s.dream.cases.length).toBeGreaterThanOrEqual(4)
      for (const c of s.dream.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
      }
    })
    it(`>=1 real case with proof fields (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.real.heading.length).toBeGreaterThan(0)
      expect(s.real.cases.length).toBeGreaterThanOrEqual(1)
      for (const c of s.real.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
        expect(c.result.length).toBeGreaterThan(0)
        expect(c.author.length).toBeGreaterThan(0)
      }
    })
  }
  it('ru and en differ', () => {
    expect(getShowcase('ru').dream.heading).not.toBe(getShowcase('en').dream.heading)
    expect(getShowcase('ru').real.heading).not.toBe(getShowcase('en').real.heading)
  })
  it('video source is null until a URL is configured', () => {
    expect(getShowcase('ru').video.source).toBeNull()
  })
})

describe('videoEmbedUrl', () => {
  it('null passthrough', () => expect(videoEmbedUrl(null)).toBeNull())
  it('youtu.be → nocookie embed', () => expect(videoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123'))
  it('youtube watch → embed', () => expect(videoEmbedUrl('https://www.youtube.com/watch?v=XYZ_1')).toBe('https://www.youtube-nocookie.com/embed/XYZ_1'))
  it('vimeo → player', () => expect(videoEmbedUrl('https://vimeo.com/12345')).toBe('https://player.vimeo.com/video/12345'))
  it('unknown URL passthrough', () => expect(videoEmbedUrl('https://example.com/v.mp4')).toBe('https://example.com/v.mp4'))
})

describe('resolveVideoSource', () => {
  it('null → null', () => expect(resolveVideoSource(null)).toBeNull())
  it('.mp4 → file', () => expect(resolveVideoSource('https://x.com/v.mp4')).toEqual({ kind: 'file', src: 'https://x.com/v.mp4' }))
  it('.webm → file', () => expect(resolveVideoSource('https://x.com/v.webm')).toEqual({ kind: 'file', src: 'https://x.com/v.webm' }))
  it('.mp4 with query → file', () => expect(resolveVideoSource('https://x.com/v.mp4?t=1')).toEqual({ kind: 'file', src: 'https://x.com/v.mp4?t=1' }))
  it('youtu.be → embed (nocookie)', () => expect(resolveVideoSource('https://youtu.be/abc123')).toEqual({ kind: 'embed', src: 'https://www.youtube-nocookie.com/embed/abc123' }))
  it('vimeo → embed (player)', () => expect(resolveVideoSource('https://vimeo.com/12345')).toEqual({ kind: 'embed', src: 'https://player.vimeo.com/video/12345' }))
})

describe('withAutoplay', () => {
  it('no query → appends ?autoplay=1', () => expect(withAutoplay('https://www.youtube-nocookie.com/embed/ID')).toBe('https://www.youtube-nocookie.com/embed/ID?autoplay=1'))
  it('existing query → appends &autoplay=1', () => expect(withAutoplay('https://player.vimeo.com/video/1?h=x')).toBe('https://player.vimeo.com/video/1?h=x&autoplay=1'))
})
