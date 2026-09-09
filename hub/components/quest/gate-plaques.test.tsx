import { describe, expect, it } from 'vitest'
import { plaqueStyle } from './gate-plaques'

describe('plaqueStyle', () => {
  it('maps a percent box to absolute CSS percentages', () => {
    expect(plaqueStyle({ left: 18.75, top: 17.69, width: 14.95, height: 8.25 })).toEqual({
      left: '18.75%', top: '17.69%', width: '14.95%', height: '8.25%',
    })
  })
})
