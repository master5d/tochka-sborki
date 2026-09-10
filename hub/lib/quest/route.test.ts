import { describe, expect, it } from 'vitest'
import { quest } from './content'
import { buildRoute, routeText, type PathMarks } from './route'

describe('buildRoute', () => {
  const c = quest.en

  it('three marks give a route with one step per fork, in fork order', () => {
    const marks: PathMarks = { boulder: 'detour', temple: 'habit', gates: 'detour' }
    const route = buildRoute(marks, c)
    expect(route).not.toBeNull()
    expect(route!.map((s) => s.forkId)).toEqual(['boulder', 'temple', 'gates'])
    expect(route!.map((s) => s.mark)).toEqual(['detour', 'habit', 'detour'])
    expect(route![0].guide).toBe('builder')
    expect(route![0].title).toBe(c.forks[0].detour.title)
    expect(route![1].guide).toBe('scroller')
    expect(route![1].title).toBe(c.forks[1].habit.title)
  })

  it('zero marks give null', () => {
    expect(buildRoute({}, c)).toBeNull()
  })

  it.each([
    ['one mark', { boulder: 'habit' } satisfies PathMarks],
    ['two marks', { boulder: 'habit', temple: 'detour' } satisfies PathMarks],
  ])('a partial set (%s) gives null, never a half-built route', (_name, marks) => {
    expect(buildRoute(marks, c)).toBeNull()
  })
})

describe('routeText', () => {
  it('joins canon titles and guide names with the footer\'s own separator, nothing composed', () => {
    const c = quest.en
    const marks: PathMarks = { boulder: 'detour', temple: 'habit', gates: 'detour' }
    const route = buildRoute(marks, c)!
    const text = routeText(route, c.labels)
    expect(text).toBe(
      `${c.forks[0].detour.title} (${c.labels.builder}) · ${c.forks[1].habit.title} (${c.labels.scroller}) · ${c.forks[2].detour.title} (${c.labels.builder})`,
    )
  })
})
