import { describe, expect, it } from 'vitest'
import {
  evaluateScrollMood,
  initScrollMoodState,
  SCROLL_MOOD_FIRE_SPEED,
  SCROLL_MOOD_REARM_SPEED,
  SCROLL_MOOD_SUSTAIN_MS,
  type ScrollMoodState,
} from './use-scroll-mood'

const FAST = SCROLL_MOOD_FIRE_SPEED + 500
const SLOW = SCROLL_MOOD_REARM_SPEED - 100

/** Feeds a sequence of {speed, dt} samples, dt accumulating into `now`, in one
 *  chapter unless a step overrides it. Returns every step's `fire` result. */
function run(
  state: ScrollMoodState,
  chapterId: string,
  steps: Array<{ speed: number; dt: number; chapterId?: string }>,
  startNow = 0,
) {
  let now = startNow
  let s = state
  const fires: boolean[] = []
  for (const step of steps) {
    now += step.dt
    const { state: next, fire } = evaluateScrollMood(s, { speed: step.speed, chapterId: step.chapterId ?? chapterId, now })
    s = next
    fires.push(fire)
  }
  return { state: s, fires, now }
}

/** Exactly enough elapsed time above SCROLL_MOOD_FIRE_SPEED to count as sustained. */
const SUSTAINED_BURST = [
  { speed: FAST, dt: 0 },
  { speed: FAST, dt: SCROLL_MOOD_SUSTAIN_MS + 50 },
]

describe('evaluateScrollMood', () => {
  it('a brief spike (shorter than the sustain window) never fires', () => {
    const { fires } = run(initScrollMoodState(), 'intro', [
      { speed: FAST, dt: 0 },
      { speed: FAST, dt: SCROLL_MOOD_SUSTAIN_MS / 2 }, // still under the sustain window
      { speed: 0, dt: 10 }, // drops before the window elapses: hotSince resets
      { speed: FAST, dt: 10 },
      { speed: FAST, dt: SCROLL_MOOD_SUSTAIN_MS / 2 }, // under the window again, from the new hotSince
    ])
    expect(fires.some(Boolean)).toBe(false)
  })

  it('sustained fast scrolling fires exactly once', () => {
    const { fires } = run(initScrollMoodState(), 'intro', SUSTAINED_BURST)
    expect(fires).toEqual([false, true])
  })

  it('does not retrigger on continued fast scrolling in the same chapter', () => {
    const first = run(initScrollMoodState(), 'intro', SUSTAINED_BURST)
    expect(first.fires.filter(Boolean).length).toBe(1)
    const more = run(first.state, 'intro', [
      { speed: FAST, dt: 16 },
      { speed: FAST, dt: 16 },
      { speed: FAST, dt: 16 },
    ], first.now)
    expect(more.fires.some(Boolean)).toBe(false)
  })

  it('re-arms only after the speed has dropped AND a new chapter has been entered', () => {
    const fired = run(initScrollMoodState(), 'boulder', SUSTAINED_BURST)
    expect(fired.fires.filter(Boolean).length).toBe(1)

    // Same chapter, speed drops: not enough to re-arm on its own.
    const droppedSameChapter = run(fired.state, 'boulder', [{ speed: SLOW, dt: 16 }], fired.now)
    const stillNoFire = run(droppedSameChapter.state, 'boulder', SUSTAINED_BURST, droppedSameChapter.now)
    expect(stillNoFire.fires.some(Boolean)).toBe(false)

    // New chapter entered while slow: now armed. Fast + sustained fires again.
    const enteredNewChapterSlow = run(stillNoFire.state, 'temple', [{ speed: SLOW, dt: 16 }], stillNoFire.now)
    const firesAgain = run(enteredNewChapterSlow.state, 'temple', SUSTAINED_BURST, enteredNewChapterSlow.now)
    expect(firesAgain.fires.filter(Boolean).length).toBe(1)
  })

  it('entering a new chapter fast (without dropping speed first) does NOT re-arm', () => {
    const fired = run(initScrollMoodState(), 'boulder', SUSTAINED_BURST)
    expect(fired.fires.filter(Boolean).length).toBe(1)
    // Chapter changes but speed never dropped below the re-arm threshold.
    const stillFastNewChapter = run(fired.state, 'temple', SUSTAINED_BURST, fired.now)
    expect(stillFastNewChapter.fires.some(Boolean)).toBe(false)
  })
})
