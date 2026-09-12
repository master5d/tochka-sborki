import { describe, expect, it } from 'vitest'
import { loopAction, PAUSE_AFTER_SCROLL_IDLE_MS, shouldPlayLoop, wideLoopSource } from './loop-playback'

describe('wideLoopSource', () => {
  it('desktop, motion allowed: the landscape camp loop of the current state (day is 2K, night still waits)', () => {
    expect(wideLoopSource({ desktop: true, reducedMotion: false, state: 'day' })).toEqual({
      x1: '/quest/loops/02-camp-wide-day@1x.mp4', x2: '/quest/loops/02-camp-wide-day@2x.mp4', w1: 1264, h1: 848,
    })
    expect(wideLoopSource({ desktop: true, reducedMotion: false, state: 'night' })).toEqual({ x1: '/quest/loops/02-camp-wide-night.mp4', w1: 1264, h1: 848 })
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

describe('loopAction — pause a loop that left the screen only once the scroll is idle', () => {
  const base = { onScreen: false, pageVisible: true, reducedMotion: false }
  it('plays a loop on screen', () => {
    expect(loopAction({ ...base, onScreen: true, scrollIdleMs: 0 })).toBe('play')
  })
  it('keeps an off-screen loop running while the reader is still scrolling (a pause mid-scroll stalls the GPU ~100 ms on 2K hardware-decoded video)', () => {
    expect(loopAction({ ...base, scrollIdleMs: 0 })).toBe('keep')
    expect(loopAction({ ...base, scrollIdleMs: PAUSE_AFTER_SCROLL_IDLE_MS - 1 })).toBe('keep')
  })
  it('pauses an off-screen loop once the scroll has been idle long enough', () => {
    expect(loopAction({ ...base, scrollIdleMs: PAUSE_AFTER_SCROLL_IDLE_MS })).toBe('pause')
  })
  it('pauses at once in a hidden tab or under reduced motion, scrolling or not', () => {
    expect(loopAction({ ...base, onScreen: true, pageVisible: false, scrollIdleMs: 0 })).toBe('pause')
    expect(loopAction({ ...base, onScreen: true, reducedMotion: true, scrollIdleMs: 0 })).toBe('pause')
  })
})
