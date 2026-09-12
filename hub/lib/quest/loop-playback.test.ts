import { describe, expect, it } from 'vitest'
import { shouldPlayLoop } from './loop-playback'

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
