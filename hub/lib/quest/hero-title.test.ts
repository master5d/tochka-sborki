import { describe, expect, it } from 'vitest'
import { splitTitle, TITLE_BASE_MS, TITLE_MAX_DELAY_MS, TITLE_STEP_MS } from './hero-title'
import { quest } from './content'

describe('splitTitle', () => {
  it('keeps every word in reading order', () => {
    expect(splitTitle('  Side quest   or fast track? ').map((w) => w.word)).toEqual(['Side', 'quest', 'or', 'fast', 'track?'])
  })

  it('returns nothing for an empty line', () => {
    expect(splitTitle('   ')).toEqual([])
  })

  it('starts at the base delay and steps evenly', () => {
    const w = splitTitle('a b c')
    expect(w.map((x) => x.delayMs)).toEqual([TITLE_BASE_MS, TITLE_BASE_MS + TITLE_STEP_MS, TITLE_BASE_MS + 2 * TITLE_STEP_MS])
  })

  it('compresses the step so a long line still lands by the cap', () => {
    const w = splitTitle(Array.from({ length: 30 }, (_, i) => `w${i}`).join(' '))
    expect(w[w.length - 1].delayMs).toBeLessThanOrEqual(TITLE_MAX_DELAY_MS)
    for (let i = 1; i < w.length; i++) expect(w[i].delayMs).toBeGreaterThanOrEqual(w[i - 1].delayMs)
  })

  it('rebuilds the real hero line of both locales word for word', () => {
    for (const locale of ['ru', 'en'] as const) {
      const line = quest[locale].hero.lines[0]
      expect(splitTitle(line).map((w) => w.word).join(' ')).toBe(line.trim().split(/\s+/).join(' '))
    }
  })
})
