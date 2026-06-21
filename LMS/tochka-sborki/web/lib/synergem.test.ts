import { describe, it, expect } from 'vitest'
import { clusterAlumni, type AlumniEntry } from './synergem'

const e = (niche: string | null, blurb = 'x'): AlumniEntry => ({ niche, contact: 'c', blurb })

describe('clusterAlumni', () => {
  it('groups entries by niche into synergem clusters with counts', () => {
    const clusters = clusterAlumni([e('coach'), e('coach'), e('tech')])
    const coach = clusters.find(c => c.key === 'coach')!
    expect(coach.count).toBe(2)
    expect(coach.entries).toHaveLength(2)
    expect(clusters.find(c => c.key === 'tech')!.count).toBe(1)
  })

  it('maps a null niche to the "other" cluster', () => {
    const clusters = clusterAlumni([e(null)])
    expect(clusters).toHaveLength(1)
    expect(clusters[0].key).toBe('other')
  })

  it('sorts clusters by count desc, then key asc, with "other" always last', () => {
    const clusters = clusterAlumni([e(null), e('tech'), e('coach'), e('coach')])
    expect(clusters.map(c => c.key)).toEqual(['coach', 'tech', 'other'])
  })

  it('returns an empty array for no entries', () => {
    expect(clusterAlumni([])).toEqual([])
  })
})
