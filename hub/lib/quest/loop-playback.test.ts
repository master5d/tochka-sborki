import { describe, expect, it } from 'vitest'
import { shouldPlayLoop, wideLoopSource } from './loop-playback'

describe('wideLoopSource', () => {
  it('desktop, motion allowed: the landscape camp loop of the current state', () => {
    expect(wideLoopSource({ desktop: true, reducedMotion: false, state: 'day' })).toBe('/quest/loops/02-camp-wide-day.mp4')
    expect(wideLoopSource({ desktop: true, reducedMotion: false, state: 'night' })).toBe('/quest/loops/02-camp-wide-night.mp4')
  })
  it('mobile never loads it: the landscape box is hidden there', () => {
    expect(wideLoopSource({ desktop: false, reducedMotion: false, state: 'day' })).toBeNull()
  })
  it('reduced motion never loads it: the still shows', () => {
    expect(wideLoopSource({ desktop: true, reducedMotion: true, state: 'night' })).toBeNull()
  })
})

describe('shouldPlayLoop', () => {
  it('plays only on screen, in a visible tab, without reduced motion', () => {
    expect(shouldPlayLoop({ onScreen: true, pageVisible: true, reducedMotion: false })).toBe(true)
  })
  it('pauses off screen', () => {
    expect(shouldPlayLoop({ onScreen: false, pageVisible: true, reducedMotion: false })).toBe(false)
  })
  it('pauses in a hidden tab', () => {
    expect(shouldPlayLoop({ onScreen: true, pageVisible: false, reducedMotion: false })).toBe(false)
  })
  it('never plays under reduced motion', () => {
    expect(shouldPlayLoop({ onScreen: true, pageVisible: true, reducedMotion: true })).toBe(false)
  })
})
