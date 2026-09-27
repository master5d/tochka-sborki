import { describe, it, expect } from 'vitest'
import { planRecords } from './foundry-record.mjs'
import { posts, postUrl } from '../lib/posts'

describe('planRecords', () => {
  const fixture = [
    { slug: 'from-foundry', foundryPiece: 297 },
    { slug: 'not-from-foundry' },
  ]
  const url = (s) => `https://mamaev.coach/blog/${s}/`

  it('piece id and url come from the post record, not from the slug', () => {
    expect(planRecords(['from-foundry'], fixture, url)).toEqual([
      { slug: 'from-foundry', action: 'record', pieceId: 297, url: 'https://mamaev.coach/blog/from-foundry/' },
    ])
  })

  it('post without foundryPiece or unknown slug is skipped with a reason, not a failure', () => {
    const plan = planRecords(['not-from-foundry', 'ghost'], fixture, url)
    expect(plan.map((p) => p.action)).toEqual(['skip', 'skip'])
    expect(plan.every((p) => p.reason)).toBe(true)
  })

  it('real registry: the Jev chronicle maps to piece #297 at its blog url', () => {
    const slug = 'komitet-dlya-odnoy-modeli-kak-solo-laboratoriya-za-odin-den-reshala-puskat-li-v'
    expect(planRecords([slug], posts, postUrl)).toEqual([
      { slug, action: 'record', pieceId: 297, url: `https://mamaev.coach/blog/${slug}/` },
    ])
  })
})
