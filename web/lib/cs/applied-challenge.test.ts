import { describe, it, expect } from 'vitest'
import { getAppliedChallenge } from './applied-challenge'

const M = '04-prompt-engineering'

describe('getAppliedChallenge', () => {
  it('slot-fills {niche} for the task tier', () => {
    const out = getAppliedChallenge({ niche: 'юриспруденции', outcome: null }, M, 'task', 'ru')
    expect(out).toContain('юриспруденции')
    expect(out).not.toContain('{niche}')
  })

  it('slot-fills {outcome} for the outcome tier when F3 is present', () => {
    const out = getAppliedChallenge(
      { niche: 'legal', outcome: 'cut review time in half' }, M, 'outcome', 'en',
    )
    expect(out).toContain('cut review time in half')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the niche-generic line when F3 outcome is empty', () => {
    const out = getAppliedChallenge({ niche: 'legal', outcome: '   ' }, M, 'outcome', 'en')
    expect(out).toContain('legal')
    expect(out).not.toContain('{outcome}')
  })

  it('falls back to the task framing when both niche and outcome are absent (outcome tier)', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'outcome', 'ru')
    const taskNoSlot = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'ru')
    expect(out).toBe(taskNoSlot)
  })

  it('uses a neutral niche word when niche is absent', () => {
    const out = getAppliedChallenge({ niche: null, outcome: null }, M, 'task', 'en')
    expect(out).not.toContain('{niche}')
  })

  it('returns null for an unknown module', () => {
    expect(getAppliedChallenge({ niche: 'x', outcome: 'y' }, 'no-such-module', 'task', 'ru')).toBeNull()
  })
})
