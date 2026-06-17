import { describe, it, expect } from 'vitest'
import { getShowcase, videoEmbedUrl } from './showcase'

describe('getShowcase', () => {
  for (const loc of ['ru', 'en'] as const) {
    it(`label/heading/cta + >=4 cases with content (${loc})`, () => {
      const s = getShowcase(loc)
      expect(s.label.length).toBeGreaterThan(0)
      expect(s.heading.length).toBeGreaterThan(0)
      expect(s.cta.length).toBeGreaterThan(0)
      expect(s.cases.length).toBeGreaterThanOrEqual(4)
      for (const c of s.cases) {
        expect(c.title.length).toBeGreaterThan(0)
        expect(c.blurb.length).toBeGreaterThan(0)
        expect(c.tag.length).toBeGreaterThan(0)
        expect(c.icon.length).toBeGreaterThan(0)
      }
    })
  }
  it('ru and en differ', () => {
    expect(getShowcase('ru').heading).not.toBe(getShowcase('en').heading)
  })
})

describe('videoEmbedUrl', () => {
  it('null passthrough', () => expect(videoEmbedUrl(null)).toBeNull())
  it('youtu.be → nocookie embed', () => expect(videoEmbedUrl('https://youtu.be/abc123')).toBe('https://www.youtube-nocookie.com/embed/abc123'))
  it('youtube watch → embed', () => expect(videoEmbedUrl('https://www.youtube.com/watch?v=XYZ_1')).toBe('https://www.youtube-nocookie.com/embed/XYZ_1'))
  it('vimeo → player', () => expect(videoEmbedUrl('https://vimeo.com/12345')).toBe('https://player.vimeo.com/video/12345'))
  it('unknown URL passthrough', () => expect(videoEmbedUrl('https://example.com/v.mp4')).toBe('https://example.com/v.mp4'))
})
